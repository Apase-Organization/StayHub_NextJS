import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { expireOldPendingBookings } from "@/services/booking.service";
import { listProperties } from "@/services/property.service";

export const searchSchema = z.object({
  location: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  type: z.enum(["APARTMENT", "HOUSE", "VILLA", "HOTEL_ROOM", "HOMESTAY", "RESORT"]).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  amenities: z.union([z.string(), z.array(z.string())]).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["price-asc", "price-desc", "rating-desc"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export async function searchProperties(query: z.infer<typeof searchSchema>) {
  if (query.checkIn && query.checkOut) {
    await expireOldPendingBookings();
  }
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const amenities = Array.isArray(query.amenities) ? query.amenities : query.amenities ? [query.amenities] : [];
  const where: Prisma.PropertyWhereInput = {
    ...(query.location ? { city: { contains: query.location, mode: "insensitive" } } : {}),
    ...(query.guests ? { maxGuests: { gte: query.guests } } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.bedrooms !== undefined ? { bedrooms: { gte: query.bedrooms } } : {}),
    ...(query.minRating !== undefined ? { ratingAvg: { gte: query.minRating } } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? { pricePerNight: { ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}), ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}) } }
      : {}),
    ...(amenities.length ? { amenities: { some: { amenityId: { in: amenities } } } } : {}),
    ...(query.checkIn && query.checkOut
      ? {
          bookings: {
            none: {
              OR: [
                { status: "CONFIRMED" },
                {
                  status: "PENDING_PAYMENT",
                  createdAt: { gte: fifteenMinutesAgo },
                },
              ],
              checkInDate: { lt: new Date(query.checkOut) },
              checkOutDate: { gt: new Date(query.checkIn) },
            },
          },
        }
      : {}),
  };

  return listProperties(where, query.page, query.limit);
}

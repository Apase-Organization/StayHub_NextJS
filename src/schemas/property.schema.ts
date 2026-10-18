import { z } from "zod";

export const propertySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  type: z.enum([
    "APARTMENT",
    "HOUSE",
    "VILLA",
    "HOTEL_ROOM",
    "HOMESTAY",
    "RESORT",
  ]),
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  pricePerNight: z.coerce.number().positive(),
  cleaningFee: z.coerce.number().min(0).default(0),
  maxGuests: z.coerce.number().int().positive(),
  bedrooms: z.coerce.number().int().min(0),
  beds: z.coerce.number().int().positive(),
  bathrooms: z.coerce.number().int().positive(),
  amenityIds: z.array(z.string()).default([]),
});

export const propertyUpdateSchema = propertySchema.partial().extend({
  // PATCH omissions must not inherit create defaults and erase saved values.
  cleaningFee: z.coerce.number().min(0).optional(),
  amenityIds: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
});

export const propertyQuerySchema = z.object({
  city: z.string().optional(),
  type: z
    .enum(["APARTMENT", "HOUSE", "VILLA", "HOTEL_ROOM", "HOMESTAY", "RESORT"])
    .optional(),
  guests: z.coerce.number().int().positive().optional(),
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

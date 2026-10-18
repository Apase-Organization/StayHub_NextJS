import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  propertySchema,
  propertyUpdateSchema,
} from "@/schemas/property.schema";
import type { z } from "zod";

const include = {
  images: { orderBy: { displayOrder: "asc" as const } },
  amenities: { include: { amenity: true } },
  host: { select: { id: true, fullName: true } },
};

export function mapProperty(
  property: Prisma.PropertyGetPayload<{ include: typeof include }>
) {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    type: property.type,
    city: property.city,
    address: property.address,
    pricePerNight: Number(property.pricePerNight),
    cleaningFee: Number(property.cleaningFee),
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    beds: property.beds,
    bathrooms: property.bathrooms,
    ratingAvg: Number(property.ratingAvg),
    status: property.status,
    host: property.host,
    images: property.images.map((image) => ({
      id: image.id,
      url: image.imageUrl,
      publicId: image.publicId,
      displayOrder: image.displayOrder,
      isCover: image.isCover,
    })),
    amenities: property.amenities.map(({ amenity }) => amenity),
  };
}

export async function listProperties(
  where: Prisma.PropertyWhereInput = {},
  page = 1,
  limit = 12
) {
  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where: { status: "ACTIVE", ...where },
      include,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.property.count({ where: { status: "ACTIVE", ...where } }),
  ]);

  return {
    properties: properties.map(mapProperty),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProperty(id: string) {
  const property = await prisma.property.findUnique({ where: { id }, include });
  return property ? mapProperty(property) : null;
}

export async function createProperty(
  hostId: string,
  data: z.infer<typeof propertySchema>
) {
  const { amenityIds, ...propertyData } = data;
  const property = await prisma.$transaction(async (tx) => {
    const created = await tx.property.create({
      data: {
        ...propertyData,
        status: "ACTIVE",
        hostId,
        amenities: {
          create: (amenityIds || []).map((amenityId) => ({ amenityId })),
        },
      },
      include,
    });
    // Publish and promote atomically; use the current DB role, not a stale JWT.
    await tx.user.updateMany({
      where: { id: hostId, role: "GUEST" },
      data: { role: "HOST" },
    });
    return created;
  });
  return mapProperty(property);
}

export async function updateProperty(
  id: string,
  data: z.infer<typeof propertyUpdateSchema>
) {
  const { amenityIds, ...propertyData } = data;
  const property = await prisma.property.update({
    where: { id },
    data: {
      ...propertyData,
      ...(amenityIds
        ? {
            amenities: {
              deleteMany: {},
              create: amenityIds.map((amenityId) => ({ amenityId })),
            },
          }
        : {}),
    },
    include,
  });
  return mapProperty(property);
}

export function archiveProperty(id: string) {
  return prisma.property.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
}

export function setPropertyStatus(id: string, status: "ACTIVE" | "INACTIVE") {
  return prisma.property.update({
    where: { id },
    data: { status },
  });
}

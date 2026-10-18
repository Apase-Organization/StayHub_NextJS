import { prisma } from "@/lib/prisma";

export async function createReview(data: {
  bookingId: string;
  guestId: string;
  rating: number;
  comment?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    include: { review: true },
  });
  if (!booking || booking.guestId !== data.guestId || booking.review)
    return null;

  const now = new Date();
  const isEligible =
    booking.status === "COMPLETED" ||
    (booking.status === "CONFIRMED" && booking.checkOutDate <= now);
  if (!isEligible) return null;

  return prisma.$transaction(async (tx) => {
    if (booking.status !== "COMPLETED") {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "COMPLETED" },
      });
    }

    const review = await tx.review.create({
      data: {
        bookingId: booking.id,
        propertyId: booking.propertyId,
        guestId: data.guestId,
        rating: data.rating,
        comment: data.comment,
      },
    });
    const avg = await tx.review.aggregate({
      where: { propertyId: booking.propertyId },
      _avg: { rating: true },
    });
    await tx.property.update({
      where: { id: booking.propertyId },
      data: { ratingAvg: avg._avg.rating ?? 0 },
    });
    return review;
  });
}

export function listPropertyReviews(propertyId: string) {
  return prisma.review.findMany({
    where: { propertyId },
    include: { guest: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

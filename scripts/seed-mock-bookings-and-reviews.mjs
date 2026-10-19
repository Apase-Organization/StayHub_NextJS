/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REVIEWS_DATA = [
  "Phòng sạch sẽ, rất ưng ý",
  "Chỗ ở tuyệt vời, view đẹp",
  "Không gian yên tĩnh, thoải mái",
  "Dịch vụ chu đáo, trải nghiệm tốt",
  "Cực kỳ hài lòng, sẽ quay lại",
  "Phòng đẹp, đầy đủ tiện nghi",
  "Chủ nhà nhiệt tình, thân thiện",
  "Kỳ nghỉ trọn vẹn, đáng tiền",
  "View đẹp mê ly, phòng sạch",
  "Vị trí thuận tiện, rất thích",
  "Trải nghiệm nghỉ dưỡng tuyệt vời",
  "Không gian thoáng mát, cảnh đẹp",
  "Tiện nghi hiện đại, rất tốt",
  "Phòng ấm cúng, view xịn xò",
  "Chỗ ở lý tưởng, hài lòng",
  "Hồ bơi đẹp, phòng tuyệt vời",
  "Rất ưng ý, phục vụ tốt",
  "Biệt thự sang trọng, đẳng cấp",
  "Không gian xanh, rất bình yên",
  "Phòng tinh tế, sạch sẽ lắm",
  "Quá tuyệt vời, rất hài lòng",
  "Trải nghiệm đáng nhớ, view đẹp",
  "Rất thích, chắc chắn quay lại",
  "Nhà đẹp, nội thất sang trọng",
];

async function main() {
  console.log("=== Seeding Past Bookings and 5-Star Reviews ===");

  // 1. Get user user@stayhub.com
  const user = await prisma.user.findUnique({
    where: { email: "user@stayhub.com" },
  });

  if (!user) {
    throw new Error("User user@stayhub.com not found in database!");
  }
  console.log(`Using Guest Account: ${user.fullName} (${user.email}, ID: ${user.id})`);

  // 2. Get all properties
  const properties = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${properties.length} active properties to create bookings & reviews.`);

  // 3. Current base date for generating past dates
  const now = new Date();

  let createdCount = 0;

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const comment = REVIEWS_DATA[i % REVIEWS_DATA.length];

    // Stagger dates in the past: 10 to 45 days ago
    const daysAgo = 10 + (i % 20);
    const nights = 2;

    const checkIn = new Date(now.getTime() - (daysAgo + nights) * 24 * 60 * 60 * 1000);
    const checkOut = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const bookingCreated = new Date(checkIn.getTime() - 2 * 24 * 60 * 60 * 1000);
    const reviewCreated = new Date(checkOut.getTime() + 1 * 24 * 60 * 60 * 1000);

    const nightlyPrice = Number(property.pricePerNight);
    const cleaningFee = Number(property.cleaningFee);
    const serviceFee = Math.round(nightlyPrice * nights * 0.1);
    const subtotalPrice = nightlyPrice * nights + cleaningFee + serviceFee;
    const totalPrice = subtotalPrice;

    // Check if property already has a completed booking with review from this user
    const existingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: property.id,
        guestId: user.id,
        review: { isNot: null },
      },
      include: { review: true },
    });

    if (existingBooking) {
      console.log(`- Property "${property.title}" already has review. Skipping.`);
      continue;
    }

    // Create booking, payment, and review in a transaction
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          propertyId: property.id,
          guestId: user.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guests: 2,
          nightlyPrice,
          cleaningFee,
          serviceFee,
          subtotalPrice,
          totalPrice,
          status: "COMPLETED",
          createdAt: bookingCreated,
          updatedAt: checkOut,
        },
      });

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalPrice,
          currency: "VND",
          paymentMethod: "VNPAY",
          status: "SUCCESS",
          providerTxnRef: `VNPAY_${booking.id}`,
          providerTransactionNo: `TRANS_${Date.now()}_${i}`,
          paidAt: bookingCreated,
          createdAt: bookingCreated,
        },
      });

      await tx.review.create({
        data: {
          bookingId: booking.id,
          propertyId: property.id,
          guestId: user.id,
          rating: 5,
          comment,
          createdAt: reviewCreated,
          updatedAt: reviewCreated,
        },
      });

      // Update property rating average
      await tx.property.update({
        where: { id: property.id },
        data: { ratingAvg: 5.0 },
      });
    });

    createdCount++;
    console.log(
      `✓ [${i + 1}/${properties.length}] "${property.title}" -> 5★ Review: "${comment}" (${comment.split(" ").length} từ)`
    );
  }

  const finalBookingCount = await prisma.booking.count({ where: { guestId: user.id } });
  const finalReviewCount = await prisma.review.count({ where: { guestId: user.id } });
  const totalReviewsInDb = await prisma.review.count();

  console.log("=== Completed Successfully ===");
  console.log(`Newly created: ${createdCount}`);
  console.log(`Bookings by user@stayhub.com: ${finalBookingCount}`);
  console.log(`Reviews by user@stayhub.com: ${finalReviewCount}`);
  console.log(`Total reviews in DB: ${totalReviewsInDb}`);
}

main()
  .catch((err) => {
    console.error("Error seeding bookings & reviews:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

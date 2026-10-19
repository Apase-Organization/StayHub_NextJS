/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SHORT_COMMENTS_5_STAR = [
  "Phòng sạch sẽ, rất ưng ý",
  "Chỗ ở tuyệt vời, view đẹp",
  "Không gian yên tĩnh, thoải mái",
  "Dịch vụ chu đáo, rất thích",
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

const SHORT_COMMENTS_4_STAR = [
  "Phòng sạch đẹp, vị trí tốt",
  "Chỗ ở tiện nghi, giá hợp lý",
  "Không gian yên tĩnh, nghỉ ngơi tốt",
  "Chủ nhà chu đáo, phòng ấm cúng",
  "Dịch vụ tốt, trải nghiệm ổn",
  "View ngắm cảnh đẹp, phòng rộng",
  "Vị trí gần trung tâm, tiện lợi",
  "Nội thất đầy đủ, ở thoải mái",
];

const ADDITIONAL_GUESTS = [
  { email: "minhanh.nguyen@stayhub.com", fullName: "Nguyễn Minh Anh", phone: "0901234567" },
  { email: "quocbao.tran@stayhub.com", fullName: "Trần Quốc Bảo", phone: "0902345678" },
  { email: "thuha.le@stayhub.com", fullName: "Lê Thu Hà", phone: "0903456789" },
];

async function main() {
  console.log("=== Seeding Real Bookings & Ratings Dataset ===");

  // 1. Ensure user@stayhub.com exists
  const primaryUser = await prisma.user.findUnique({
    where: { email: "user@stayhub.com" },
  });

  if (!primaryUser) {
    throw new Error("User user@stayhub.com not found!");
  }
  console.log(`Primary Guest: ${primaryUser.fullName} (${primaryUser.email})`);

  // 2. Ensure additional guests exist
  const dummyPasswordHash = await bcrypt.hash("Password123!", 10);
  const guestPool = [primaryUser];

  for (const g of ADDITIONAL_GUESTS) {
    const user = await prisma.user.upsert({
      where: { email: g.email },
      update: { fullName: g.fullName },
      create: {
        email: g.email,
        fullName: g.fullName,
        phone: g.phone,
        passwordHash: dummyPasswordHash,
        role: "GUEST",
        status: "ACTIVE",
      },
    });
    guestPool.push(user);
  }
  console.log(`Total guest pool for realistic reviews: ${guestPool.length} users`);

  // 3. Clear existing reviews, payments, and bookings cleanly
  console.log("Resetting existing bookings & reviews...");
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});

  // 4. Fetch all active properties
  const properties = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Processing ${properties.length} properties...`);

  const now = new Date();
  let totalBookings = 0;

  // Varied review pattern for each of the 24 properties:
  // Array of target review counts [1 to 4] so the site looks alive and natural!
  const reviewPattern = [
    3, 2, 4, 1, 3, 2, 4, 2,
    3, 1, 2, 4, 3, 2, 1, 4,
    2, 3, 1, 4, 2, 3, 2, 1,
  ];

  for (let propIdx = 0; propIdx < properties.length; propIdx++) {
    const property = properties[propIdx];
    const targetCount = reviewPattern[propIdx % reviewPattern.length];

    for (let r = 0; r < targetCount; r++) {
      // First review is always from primary user (user@stayhub.com) with 5 stars
      const isPrimary = r === 0;
      const guest = isPrimary ? primaryUser : guestPool[(propIdx + r) % guestPool.length];

      // Ratings: primary is always 5; subsequent can be 5 or 4
      const rating = isPrimary ? 5 : (r % 3 === 0 ? 4 : 5);
      const comment =
        rating === 5
          ? SHORT_COMMENTS_5_STAR[(propIdx * 3 + r) % SHORT_COMMENTS_5_STAR.length]
          : SHORT_COMMENTS_4_STAR[(propIdx + r) % SHORT_COMMENTS_4_STAR.length];

      // Past dates: staggered between 5 and 60 days ago
      const daysAgo = 5 + (propIdx * 2 + r * 7) % 50;
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

      await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            propertyId: property.id,
            guestId: guest.id,
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
            providerTransactionNo: `TRANS_${Date.now()}_${propIdx}_${r}`,
            paidAt: bookingCreated,
            createdAt: bookingCreated,
          },
        });

        await tx.review.create({
          data: {
            bookingId: booking.id,
            propertyId: property.id,
            guestId: guest.id,
            rating,
            comment,
            createdAt: reviewCreated,
            updatedAt: reviewCreated,
          },
        });
      });

      totalBookings++;
    }

    // Recalculate true mathematical average for the property
    const avg = await prisma.review.aggregate({
      where: { propertyId: property.id },
      _avg: { rating: true },
    });

    const realAvg = Number((avg._avg.rating ?? 5.0).toFixed(1));

    await prisma.property.update({
      where: { id: property.id },
      data: { ratingAvg: realAvg },
    });

    console.log(
      `✓ [${propIdx + 1}/${properties.length}] "${property.title}" -> ${targetCount} reviews | Real Avg: ${realAvg.toFixed(1)}★`
    );
  }

  const primaryBookings = await prisma.booking.count({ where: { guestId: primaryUser.id } });
  const primaryReviews = await prisma.review.count({ where: { guestId: primaryUser.id } });
  const allReviews = await prisma.review.count();

  console.log("=== Seed Completed ===");
  console.log(`Total Bookings: ${totalBookings}`);
  console.log(`Total Reviews: ${allReviews}`);
  console.log(`Bookings by user@stayhub.com: ${primaryBookings}`);
  console.log(`Reviews by user@stayhub.com: ${primaryReviews}`);
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import type { Session } from "next-auth";

import { sendBookingCancelled, sendBookingConfirmed } from "@/lib/email";
import { buildPaymentUrl } from "@/lib/vnpay";
import { prisma } from "@/lib/prisma";
import { validateDiscount } from "@/services/discount.service";

export type CreateBookingInput = {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  discountCode?: string;
};

export class BookingConflictError extends Error {}

/**
 * Tự động hủy các booking PENDING_PAYMENT đã quá 15 phút để giải phóng phòng
 */
export async function expireOldPendingBookings() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      createdAt: { lt: fifteenMinutesAgo },
    },
    select: { id: true },
  });

  if (expiredBookings.length > 0) {
    const ids = expiredBookings.map((b) => b.id);
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { id: { in: ids } },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      }),
      prisma.payment.updateMany({
        where: { bookingId: { in: ids }, status: "PENDING" },
        data: { status: "EXPIRED" },
      }),
    ]);
  }
}

/**
 * Tự động chuyển các booking CONFIRMED đã qua ngày check-out thành COMPLETED
 */
export async function syncCompletedBookings() {
  const now = new Date();
  await prisma.booking.updateMany({
    where: {
      status: "CONFIRMED",
      checkOutDate: { lt: now },
    },
    data: {
      status: "COMPLETED",
    },
  });
}

export async function checkOverlap(
  propertyId: string,
  checkIn: string | Date,
  checkOut: string | Date
) {
  // Giải phóng trước các booking pending quá hạn
  await expireOldPendingBookings();

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return prisma.booking.findFirst({
    where: {
      propertyId,
      OR: [
        { status: "CONFIRMED" },
        {
          status: "PENDING_PAYMENT",
          createdAt: { gte: fifteenMinutesAgo },
        },
      ],
      checkInDate: { lt: new Date(checkOut) },
      checkOutDate: { gt: new Date(checkIn) },
    },
  });
}

export function calculatePrice(
  property: { pricePerNight: unknown; cleaningFee: unknown },
  checkIn: string | Date,
  checkOut: string | Date
) {
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
    )
  );
  const nightlyPrice = Number(property.pricePerNight);
  const cleaningFee = Number(property.cleaningFee);
  const serviceFee = Math.round(nightlyPrice * nights * 0.1);
  const subtotalPrice = nightlyPrice * nights + cleaningFee + serviceFee;
  return {
    nightlyPrice,
    nights,
    cleaningFee,
    serviceFee,
    subtotalPrice,
    totalPrice: subtotalPrice,
  };
}

export async function createBooking(
  data: CreateBookingInput,
  session: Session
) {
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
  });
  if (!property || property.status !== "ACTIVE")
    throw new Error("Property not found");
  if (data.guests > property.maxGuests) throw new Error("Too many guests");
  if (await checkOverlap(data.propertyId, data.checkIn, data.checkOut))
    throw new BookingConflictError(
      "Chỗ ở không còn trống trong khoảng ngày này"
    );

  const price = calculatePrice(property, data.checkIn, data.checkOut);
  const discount = data.discountCode
    ? await validateDiscount(data.discountCode, price.subtotalPrice)
    : null;
  const discountAmount = discount?.discountAmount ?? 0;
  const totalPrice = Math.max(0, price.subtotalPrice - discountAmount);

  // Nếu totalPrice = 0 (Free hoặc mã giảm 100%), tự động xác nhận đặt phòng mà không cần qua cổng VNPay
  if (totalPrice === 0) {
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          propertyId: data.propertyId,
          guestId: session.user.id,
          checkInDate: new Date(data.checkIn),
          checkOutDate: new Date(data.checkOut),
          guests: data.guests,
          nightlyPrice: price.nightlyPrice,
          cleaningFee: price.cleaningFee,
          serviceFee: price.serviceFee,
          subtotalPrice: price.subtotalPrice,
          discountCodeId: discount?.discount.id,
          discountAmount,
          totalPrice: 0,
          status: "CONFIRMED",
        },
      });

      await tx.payment.create({
        data: {
          bookingId: created.id,
          amount: 0,
          paymentMethod: "MOCK",
          status: "SUCCESS",
          providerTxnRef: created.id,
          paidAt: new Date(),
        },
      });

      if (discount?.discount.id) {
        await tx.discountCode.update({
          where: { id: discount.discount.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return created;
    });

    if (session.user.email) {
      try {
        await sendBookingConfirmed(session.user.email, {
          bookingId: booking.id,
          propertyTitle: property.title,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalPrice: 0,
        });
      } catch {
        // ignore email delivery error
      }
    }

    return {
      bookingId: booking.id,
      vnpayUrl: `/bookings/${booking.id}?confirmed=1`,
    };
  }

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        propertyId: data.propertyId,
        guestId: session.user.id,
        checkInDate: new Date(data.checkIn),
        checkOutDate: new Date(data.checkOut),
        guests: data.guests,
        nightlyPrice: price.nightlyPrice,
        cleaningFee: price.cleaningFee,
        serviceFee: price.serviceFee,
        subtotalPrice: price.subtotalPrice,
        discountCodeId: discount?.discount.id,
        discountAmount,
        totalPrice,
      },
    });

    await tx.payment.create({
      data: {
        bookingId: created.id,
        amount: totalPrice,
        paymentMethod: "VNPAY",
        status: "PENDING",
        providerTxnRef: created.id,
      },
    });

    return created;
  });

  return {
    bookingId: booking.id,
    vnpayUrl: buildPaymentUrl({
      vnp_Amount: Math.round(totalPrice * 100),
      vnp_TxnRef: booking.id,
      vnp_OrderInfo: `Thanh toan booking ${booking.id}`,
      vnp_OrderType: "other",
      vnp_CreateDate: formatVnpayDate(new Date()),
      vnp_IpAddr: "127.0.0.1",
    }),
  };
}

export async function cancelBooking(
  bookingId: string,
  userId: string,
  isAdmin = false
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: { select: { hostId: true, title: true } },
      guest: { select: { email: true, fullName: true } },
      payment: true,
    },
  });
  if (!booking) throw new Error("Booking not found");

  const isGuest = booking.guestId === userId;
  const isHost = booking.property.hostId === userId;
  if (!isAdmin && !isGuest && !isHost) throw new Error("Forbidden");
  if (!["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status))
    throw new Error("Invalid booking state");

  const cancelledBooking = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    // Nếu đơn CONFIRMED bị hủy và có dùng mã giảm giá, hoàn lại 1 lượt dùng
    if (booking.status === "CONFIRMED" && booking.discountCodeId) {
      await tx.discountCode.update({
        where: { id: booking.discountCodeId },
        data: { usedCount: { decrement: 1 } },
      });
    }

    // Cập nhật trạng thái Payment tương ứng
    if (booking.payment) {
      if (booking.payment.status === "SUCCESS") {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: "REFUNDED" },
        });
      } else if (booking.payment.status === "PENDING") {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: "CANCELLED" },
        });
      }
    }

    return updated;
  });

  // Gửi email thông báo hủy
  if (booking.guest?.email) {
    try {
      await sendBookingCancelled(booking.guest.email, {
        bookingId: booking.id,
        propertyTitle: booking.property.title,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalPrice: Number(booking.totalPrice),
      });
    } catch {
      // ignore email error
    }
  }

  return cancelledBooking;
}

function formatVnpayDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

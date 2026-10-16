import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { sendBookingConfirmed } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { verifyReturn } from "@/lib/vnpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query as Record<string, string>;

    if (!query || !query.vnp_TxnRef) {
      return NextResponse.json(fail("Thiếu thông tin giao dịch"), { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { providerTxnRef: query.vnp_TxnRef },
      include: {
        booking: {
          include: { guest: true, property: true, discountCode: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(fail("Không tìm thấy giao dịch thanh toán"), { status: 404 });
    }

    const verifyResult = verifyReturn(query);
    if (!verifyResult.valid) {
      return NextResponse.json(fail("Chữ ký VNPay không hợp lệ"), { status: 400 });
    }

    const success = query.vnp_ResponseCode === "00";

    if (payment.status !== "SUCCESS") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: success ? "SUCCESS" : "FAILED",
            providerTransactionNo: query.vnp_TransactionNo,
            rawResponse: query,
            paidAt: success ? new Date() : null,
          },
        });

        await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: success ? "CONFIRMED" : "CANCELLED",
            cancelledAt: success ? null : new Date(),
          },
        });

        if (success && payment.booking.discountCodeId) {
          await tx.discountCode.update({
            where: { id: payment.booking.discountCodeId },
            data: { usedCount: { increment: 1 } },
          });
        }
      });

      if (success && payment.booking.guest.email) {
        try {
          await sendBookingConfirmed(payment.booking.guest.email, {
            bookingId: payment.booking.id,
            propertyTitle: payment.booking.property.title,
            checkInDate: payment.booking.checkInDate,
            checkOutDate: payment.booking.checkOutDate,
            totalPrice: Number(payment.booking.totalPrice),
          });
        } catch {
          // Ignore email sending error
        }
      }
    }

    return NextResponse.json(
      ok({
        success,
        bookingId: payment.bookingId,
        status: success ? "SUCCESS" : "FAILED",
      })
    );
  } catch {
    return NextResponse.json(fail("Lỗi hệ thống khi xác minh thanh toán"), { status: 500 });
  }
}

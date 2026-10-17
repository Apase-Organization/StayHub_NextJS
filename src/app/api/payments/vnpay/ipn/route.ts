import { NextResponse } from "next/server";

import { sendBookingConfirmed } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { verifyIpn } from "@/lib/vnpay";

export async function GET(request: Request) {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const payment = await prisma.payment.findUnique({
    where: { providerTxnRef: query.vnp_TxnRef },
    include: { booking: { include: { guest: true, property: true, discountCode: true } } },
  });

  if (!payment) return NextResponse.json({ RspCode: "01", Message: "Payment not found" });
  if (!verifyIpn(query, Number(payment.amount)).valid) return NextResponse.json({ RspCode: "97", Message: "Invalid checksum" });
  if (payment.status === "SUCCESS") return NextResponse.json({ RspCode: "00", Message: "OK" });

  const success = query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00";

  let shouldSendEmail = false;

  await prisma.$transaction(async (tx) => {
    const currentPayment = await tx.payment.findUnique({
      where: { id: payment.id },
    });
    if (!currentPayment || currentPayment.status === "SUCCESS") {
      return;
    }

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

    if (success) {
      shouldSendEmail = true;
    }
  });

  if (shouldSendEmail && payment.booking.guest?.email) {
    try {
      await sendBookingConfirmed(payment.booking.guest.email, {
        bookingId: payment.booking.id,
        propertyTitle: payment.booking.property.title,
        checkInDate: payment.booking.checkInDate,
        checkOutDate: payment.booking.checkOutDate,
        totalPrice: Number(payment.booking.totalPrice),
      });
    } catch {
      // ignore email error
    }
  }

  return NextResponse.json({ RspCode: "00", Message: "OK" });
}

import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  const payment = await prisma.payment.findUnique({
    where: { bookingId: (await params).bookingId },
    include: { booking: true },
  });
  if (!payment)
    return NextResponse.json(fail("Không tìm thấy payment"), { status: 404 });
  if (
    session.user.role !== "ADMIN" &&
    payment.booking.guestId !== session.user.id
  )
    return NextResponse.json(fail("Không có quyền"), { status: 403 });

  return NextResponse.json(
    ok({ status: payment.status, bookingStatus: payment.booking.status })
  );
}

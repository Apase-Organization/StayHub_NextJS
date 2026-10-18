import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  expireOldPendingBookings,
  syncCompletedBookings,
} from "@/services/booking.service";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  await syncCompletedBookings();
  await expireOldPendingBookings();

  const bookings = await prisma.booking.findMany({
    where: { property: { hostId: session.user.id } },
    include: {
      property: { select: { id: true, title: true, city: true } },
      guest: { select: { id: true, fullName: true, email: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ok(bookings));
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BookingConflictError,
  createBooking,
  expireOldPendingBookings,
  syncCompletedBookings,
} from "@/services/booking.service";

const createSchema = z.object({
  propertyId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int().positive(),
  discountCode: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(fail("Dữ liệu không hợp lệ"), { status: 400 });

  try {
    return NextResponse.json(
      ok(await createBooking(parsed.data, session), "Tạo booking thành công"),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof BookingConflictError)
      return NextResponse.json(fail(error.message, "ERR_ROOM_NOT_AVAILABLE"), {
        status: 409,
      });
    return NextResponse.json(fail("Không thể tạo booking"), { status: 400 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  await syncCompletedBookings();
  await expireOldPendingBookings();

  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  const bookings = await prisma.booking.findMany({
    where: {
      guestId: session.user.id,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      property: { include: { images: { where: { isCover: true }, take: 1 } } },
      payment: true,
      review: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ok(bookings));
}

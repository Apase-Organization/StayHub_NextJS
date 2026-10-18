import { NextResponse } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReview } from "@/services/review.service";

const schema = z.object({
  bookingId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(fail("Dữ liệu không hợp lệ"), { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { review: true },
  });

  if (!booking) {
    return NextResponse.json(fail("Không tìm thấy đơn đặt phòng"), {
      status: 404,
    });
  }

  if (booking.guestId !== session.user.id) {
    return NextResponse.json(
      fail("Bạn không có quyền đánh giá đơn đặt phòng này"),
      { status: 403 }
    );
  }

  if (booking.review) {
    return NextResponse.json(fail("Đơn đặt phòng này đã được đánh giá rồi"), {
      status: 400,
    });
  }

  const now = new Date();
  const isEligible =
    booking.status === "COMPLETED" ||
    (booking.status === "CONFIRMED" && booking.checkOutDate <= now);
  if (!isEligible) {
    return NextResponse.json(
      fail("Bạn chỉ có thể đánh giá sau khi hoàn tất kỳ nghỉ"),
      { status: 400 }
    );
  }

  const review = await createReview({
    ...parsed.data,
    guestId: session.user.id,
  });
  if (!review)
    return NextResponse.json(fail("Không thể tạo review"), { status: 400 });

  return NextResponse.json(ok(review, "Tạo review thành công"), {
    status: 201,
  });
}

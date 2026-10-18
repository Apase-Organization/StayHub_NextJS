import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: (await params).id },
    include: {
      property: true,
      guest: { select: { id: true, fullName: true, email: true } },
      payment: true,
      review: true,
    },
  });
  if (!booking)
    return NextResponse.json(fail("Không tìm thấy booking"), { status: 404 });
  if (session.user.role !== "ADMIN" && booking.guestId !== session.user.id)
    return NextResponse.json(fail("Không có quyền"), { status: 403 });

  return NextResponse.json(ok(booking));
}

import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json(fail("Không có quyền"), { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const limit = Math.max(Number(searchParams.get("limit") ?? 10), 1);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  const where: Prisma.BookingWhereInput = {
    ...(status ? { status: status as never } : {}),
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { property: { title: { contains: search, mode: "insensitive" } } },
            { guest: { fullName: { contains: search, mode: "insensitive" } } },
            { guest: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        property: { select: { id: true, title: true } },
        guest: { select: { id: true, fullName: true, email: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json(
    ok({
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  );
}

import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  const [activeProperties, totalBookings, revenueAgg] = await Promise.all([
    prisma.property.count({
      where: { hostId: session.user.id, status: "ACTIVE" },
    }),
    prisma.booking.count({ where: { property: { hostId: session.user.id } } }),
    prisma.payment.aggregate({
      where: {
        status: "SUCCESS",
        booking: { property: { hostId: session.user.id } },
      },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json(
    ok({
      totalBookings,
      totalRevenue: Number(revenueAgg._sum.amount ?? 0),
      activeProperties,
    })
  );
}

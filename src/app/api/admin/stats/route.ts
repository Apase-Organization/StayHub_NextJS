import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json(fail("Không có quyền"), { status: 403 });

  const [totalUsers, activeHosts, bookingsToday, revenueAgg] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "HOST", status: "ACTIVE" } }),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
    ]);

  return NextResponse.json(
    ok({
      totalUsers,
      activeHosts,
      bookingsToday,
      platformRevenue: Number(revenueAgg._sum.amount ?? 0),
    })
  );
}

import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapProperty } from "@/services/property.service";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  const properties = await prisma.property.findMany({
    where: { hostId: session.user.id },
    include: {
      images: { orderBy: { displayOrder: "asc" } },
      amenities: { include: { amenity: true } },
      host: { select: { id: true, fullName: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ok(properties.map(mapProperty)));
}

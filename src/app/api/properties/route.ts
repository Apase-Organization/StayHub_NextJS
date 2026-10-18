import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertyQuerySchema, propertySchema } from "@/schemas/property.schema";
import { createProperty, listProperties } from "@/services/property.service";

export async function GET(request: Request) {
  const query = propertyQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  const where = {
    ...(query.city
      ? { city: { contains: query.city, mode: "insensitive" as const } }
      : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.guests ? { maxGuests: { gte: query.guests } } : {}),
  };

  return NextResponse.json(
    ok(
      await listProperties(where, query.page, query.featured ? 6 : query.limit)
    )
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  const parsed = propertySchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(fail("Dữ liệu không hợp lệ"), { status: 400 });

  const property = await createProperty(session.user.id, parsed.data);

  // If user is currently a GUEST, upgrade their role to HOST upon publishing their first listing
  if (session.user.role === "GUEST") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "HOST" },
    });
  }

  return NextResponse.json(ok(property, "Tạo property thành công"), {
    status: 201,
  });
}

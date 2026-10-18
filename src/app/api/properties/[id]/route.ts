import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertyUpdateSchema } from "@/schemas/property.schema";
import {
  archiveProperty,
  getProperty,
  updateProperty,
} from "@/services/property.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property)
    return NextResponse.json(fail("Không tìm thấy property"), { status: 404 });

  if (property.status !== "ACTIVE") {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "ADMIN" && property.host.id !== session.user.id)
    ) {
      return NextResponse.json(fail("Không tìm thấy property"), { status: 404 });
    }
  }

  return NextResponse.json(ok(property));
}

export async function PATCH(request: Request, { params }: Context) {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { hostId: true },
  });
  if (!property)
    return NextResponse.json(fail("Không tìm thấy property"), { status: 404 });
  if (session.user.role !== "ADMIN" && property.hostId !== session.user.id) {
    return NextResponse.json(fail("Không có quyền"), { status: 403 });
  }

  const parsed = propertyUpdateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(fail("Dữ liệu không hợp lệ"), { status: 400 });

  return NextResponse.json(
    ok(await updateProperty(id, parsed.data), "Cập nhật property thành công")
  );
}

export async function DELETE(_request: Request, { params }: Context) {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { hostId: true },
  });
  if (!property)
    return NextResponse.json(fail("Không tìm thấy property"), { status: 404 });
  if (session.user.role !== "ADMIN" && property.hostId !== session.user.id) {
    return NextResponse.json(fail("Không có quyền"), { status: 403 });
  }

  await archiveProperty(id);
  return NextResponse.json(ok(null, "Đã archive property"));
}

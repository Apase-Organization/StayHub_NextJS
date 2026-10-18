import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";
import { updateProfileSchema } from "@/schemas/user.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      bio: true,
      role: true,
      status: true,
      provider: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
          properties: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(fail("Không tìm thấy người dùng"), {
      status: 404,
    });
  }

  return NextResponse.json(
    ok({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      status: user.status,
      provider: user.provider,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      isGoogleUser: user.provider === "GOOGLE",
      stats: {
        totalBookings: user._count.bookings,
        totalProperties: user._count.properties,
        totalReviews: user._count.reviews,
      },
    })
  );
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, provider: true },
  });

  if (!currentUser) {
    return NextResponse.json(fail("Không tìm thấy người dùng"), {
      status: 404,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(fail("Dữ liệu JSON không hợp lệ"), {
      status: 400,
    });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ";
    return NextResponse.json(fail(errorMsg), { status: 400 });
  }

  // Google User rule: Cannot change email
  if (currentUser.provider === "GOOGLE") {
    if (
      parsed.data.email &&
      parsed.data.email.toLowerCase() !== currentUser.email.toLowerCase()
    ) {
      return NextResponse.json(
        fail("Tài khoản liên kết Google không thể thay đổi địa chỉ email."),
        { status: 400 }
      );
    }
  }

  // Local User: Check email uniqueness if email changed
  if (
    currentUser.provider !== "GOOGLE" &&
    parsed.data.email &&
    parsed.data.email.toLowerCase() !== currentUser.email.toLowerCase()
  ) {
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== currentUser.id) {
      return NextResponse.json(
        fail("Email này đã được sử dụng bởi tài khoản khác"),
        { status: 409 }
      );
    }
  }

  const data: {
    fullName?: string;
    phone?: string | null;
    bio?: string | null;
    email?: string;
    emailVerified?: null;
  } = {};

  if (parsed.data.fullName !== undefined) data.fullName = parsed.data.fullName;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
  if (parsed.data.bio !== undefined) data.bio = parsed.data.bio || null;
  if (currentUser.provider !== "GOOGLE" && parsed.data.email) {
    data.email = parsed.data.email.toLowerCase();
    if (data.email !== currentUser.email.toLowerCase()) {
      data.emailVerified = null;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Codes sent to the previous address must not verify the new address.
    if (data.emailVerified === null) {
      await tx.verificationToken.updateMany({
        where: { userId: currentUser.id, usedAt: null },
        data: { usedAt: new Date() },
      });
    }
    return tx.user.update({
      where: { id: currentUser.id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        role: true,
        provider: true,
        updatedAt: true,
      },
    });
  });

  return NextResponse.json(ok(updated, "Cập nhật thông tin hồ sơ thành công"));
}

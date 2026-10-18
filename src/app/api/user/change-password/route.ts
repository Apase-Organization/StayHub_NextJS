import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";
import { changePasswordSchema } from "@/schemas/user.schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, provider: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json(fail("Không tìm thấy người dùng"), { status: 404 });
  }

  // Google User rule: Cannot change password
  if (user.provider === "GOOGLE") {
    return NextResponse.json(
      fail("Tài khoản liên kết Google không sử dụng mật khẩu trên StayHub."),
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(fail("Dữ liệu JSON không hợp lệ"), { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ";
    return NextResponse.json(fail(errorMsg), { status: 400 });
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      fail("Tài khoản chưa thiết lập mật khẩu."),
      { status: 400 }
    );
  }

  const isMatch = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash
  );

  if (!isMatch) {
    return NextResponse.json(
      fail("Mật khẩu hiện tại không chính xác."),
      { status: 400 }
    );
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return NextResponse.json(ok(null, "Đổi mật khẩu thành công."));
}

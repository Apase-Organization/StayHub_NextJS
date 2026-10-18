import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { ok, fail } from "@/lib/api-response";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(fail("Dữ liệu form không hợp lệ"), { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(fail("Vui lòng chọn ảnh đại diện"), { status: 400 });
  }

  // Validate mime type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      fail("Định dạng file không hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP."),
      { status: 400 }
    );
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      fail("Kích thước file ảnh không được vượt quá 5MB."),
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadImage(buffer, "stayhub/avatars");

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: uploadResult.url },
      select: { id: true, avatarUrl: true },
    });

    return NextResponse.json(
      ok({ avatarUrl: updatedUser.avatarUrl }, "Cập nhật ảnh đại diện thành công")
    );
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      fail(error.message || "Lỗi khi tải ảnh đại diện lên Cloudinary"),
      { status: 500 }
    );
  }
}

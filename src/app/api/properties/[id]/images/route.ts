import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { deleteImage, uploadImage } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

async function canEdit(propertyId: string) {
  const session = await auth();
  if (!session)
    return {
      error: NextResponse.json(fail("Chưa đăng nhập"), { status: 401 }),
    };

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { hostId: true },
  });
  if (!property)
    return {
      error: NextResponse.json(fail("Không tìm thấy property"), {
        status: 404,
      }),
    };
  if (session.user.role !== "ADMIN" && property.hostId !== session.user.id) {
    return {
      error: NextResponse.json(fail("Không có quyền"), { status: 403 }),
    };
  }

  return { session };
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const guard = await canEdit(id);
  if (guard.error) return guard.error;

  const formData = await request.formData();
  const fileEntries = formData.getAll("files");
  const singleFile = formData.get("file");

  const files: File[] = [];
  if (fileEntries.length > 0) {
    for (const entry of fileEntries) {
      if (entry instanceof File) files.push(entry);
    }
  } else if (singleFile instanceof File) {
    files.push(singleFile);
  }

  if (files.length === 0) {
    return NextResponse.json(fail("Vui lòng chọn ít nhất một hình ảnh"), {
      status: 400,
    });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const maxFileSize = Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 10_485_760); // 10MB default

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        fail(`Định dạng không hỗ trợ (${file.name}). Vui lòng chọn JPEG, PNG hoặc WebP`),
        { status: 400 }
      );
    }
    if (file.size > maxFileSize) {
      return NextResponse.json(
        fail(`Ảnh ${file.name} vượt quá dung lượng cho phép (tối đa 10MB)`),
        { status: 400 }
      );
    }
  }

  let count = await prisma.propertyImage.count({ where: { propertyId: id } });
  const createdImages = [];

  for (const file of files) {
    const uploaded = await uploadImage(
      Buffer.from(await file.arrayBuffer()),
      `properties/${id}`
    );
    const isCover = count === 0;
    const image = await prisma.propertyImage.create({
      data: {
        propertyId: id,
        imageUrl: uploaded.url,
        publicId: uploaded.publicId,
        displayOrder: count,
        isCover,
      },
    });
    createdImages.push(image);
    count++;
  }

  return NextResponse.json(
    ok(
      createdImages.length === 1 ? createdImages[0] : createdImages,
      `Đã tải lên ${createdImages.length} hình ảnh thành công`
    ),
    { status: 201 }
  );
}

export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  const guard = await canEdit(id);
  if (guard.error) return guard.error;

  const url = new URL(request.url);
  const publicId = url.searchParams.get("publicId");
  const imageId = url.searchParams.get("imageId");

  if (!publicId && !imageId) {
    return NextResponse.json(
      fail("Thiếu publicId hoặc imageId"),
      { status: 400 }
    );
  }

  const targetImage = imageId
    ? await prisma.propertyImage.findUnique({ where: { id: imageId } })
    : await prisma.propertyImage.findFirst({
        where: { propertyId: id, publicId: publicId! },
      });

  if (!targetImage) {
    return NextResponse.json(fail("Không tìm thấy hình ảnh"), { status: 404 });
  }

  if (targetImage.publicId) {
    try {
      await deleteImage(targetImage.publicId);
    } catch {
      // Ignore if image is already deleted on provider
    }
  }

  await prisma.propertyImage.delete({ where: { id: targetImage.id } });

  // If deleted image was cover, promote another image to cover
  if (targetImage.isCover) {
    const nextImage = await prisma.propertyImage.findFirst({
      where: { propertyId: id },
      orderBy: { displayOrder: "asc" },
    });
    if (nextImage) {
      await prisma.propertyImage.update({
        where: { id: nextImage.id },
        data: { isCover: true },
      });
    }
  }

  return NextResponse.json(ok(null, "Xoá ảnh thành công"));
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const guard = await canEdit(id);
  if (guard.error) return guard.error;

  const { imageId } = (await request.json()) as { imageId?: string };
  if (!imageId)
    return NextResponse.json(fail("Thiếu imageId"), { status: 400 });

  await prisma.$transaction([
    prisma.propertyImage.updateMany({
      where: { propertyId: id },
      data: { isCover: false },
    }),
    prisma.propertyImage.update({
      where: { id: imageId },
      data: { isCover: true },
    }),
  ]);

  return NextResponse.json(ok(null, "Đã đặt ảnh cover"));
}

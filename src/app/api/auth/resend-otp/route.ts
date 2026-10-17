import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api-response";
import { sendOtpEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const resendOtpSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ"),
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        fail("Không tìm thấy tài khoản với email này", "ERR_USER_NOT_FOUND"),
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        fail("Tài khoản này đã được xác thực trước đó", "ERR_ALREADY_VERIFIED"),
        { status: 400 }
      );
    }

    // Kiểm tra cooldown 60 giây chống spam
    const recentToken = await prisma.verificationToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (recentToken) {
      const timeSinceCreated = Date.now() - new Date(recentToken.createdAt).getTime();
      const cooldownMs = 60 * 1000;
      if (timeSinceCreated < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - timeSinceCreated) / 1000);
        return NextResponse.json(
          fail(
            `Vui lòng đợi ${remainingSec} giây trước khi yêu cầu mã mới`,
            "ERR_RATE_LIMIT"
          ),
          { status: 429 }
        );
      }
    }

    // Tạo mã OTP 6 số mới
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    // Hủy các token cũ chưa dùng và tạo token mới
    await prisma.$transaction([
      prisma.verificationToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.verificationToken.create({
        data: {
          userId: user.id,
          otpHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      }),
    ]);

    await sendOtpEmail(user.email, otp);

    return NextResponse.json(
      ok(null, "Mã xác nhận mới đã được gửi tới email của bạn")
    );
  } catch {
    return NextResponse.json(
      fail("Không thể gửi lại mã xác thực. Vui lòng thử lại sau.", "ERR_INTERNAL"),
      { status: 500 }
    );
  }
}

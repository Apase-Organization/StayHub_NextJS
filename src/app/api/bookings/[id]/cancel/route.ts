import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { cancelBooking } from "@/services/booking.service";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json(fail("Chưa đăng nhập"), { status: 401 });

  try {
    return NextResponse.json(
      ok(
        await cancelBooking(
          (await params).id,
          session.user.id,
          session.user.role === "ADMIN"
        ),
        "Huỷ booking thành công"
      )
    );
  } catch {
    return NextResponse.json(fail("Không thể huỷ booking"), { status: 400 });
  }
}

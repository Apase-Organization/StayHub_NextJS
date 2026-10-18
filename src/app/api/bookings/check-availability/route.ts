import { NextResponse } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api-response";
import { checkOverlap } from "@/services/booking.service";

const schema = z.object({
  propertyId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(fail("Dữ liệu không hợp lệ"), { status: 400 });

  const overlap = await checkOverlap(
    parsed.data.propertyId,
    parsed.data.checkIn,
    parsed.data.checkOut
  );
  if (overlap)
    return NextResponse.json(
      fail(
        "Chỗ ở không còn trống trong khoảng ngày này",
        "ERR_ROOM_NOT_AVAILABLE"
      ),
      { status: 409 }
    );

  return NextResponse.json(ok({ available: true }));
}

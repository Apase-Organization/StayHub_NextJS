import { NextResponse } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api-response";
import { validateDiscount } from "@/services/discount.service";

const schema = z.object({
  code: z.string(),
  subtotal: z.coerce.number().min(0),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(fail("Dữ liệu không hợp lệ"), { status: 400 });

  const result = await validateDiscount(parsed.data.code, parsed.data.subtotal);
  if (!result)
    return NextResponse.json(
      fail("Mã giảm giá không hợp lệ", "ERR_INVALID_DISCOUNT"),
      { status: 400 }
    );

  return NextResponse.json(
    ok({ code: result.discount.code, discountAmount: result.discountAmount })
  );
}

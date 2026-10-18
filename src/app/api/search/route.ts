import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { searchProperties, searchSchema } from "@/services/search.service";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = searchSchema.safeParse({
    ...Object.fromEntries(params),
    amenities: params.getAll("amenities"),
  });
  if (!parsed.success)
    return NextResponse.json(fail("Dữ liệu không hợp lệ"), { status: 400 });

  return NextResponse.json(ok(await searchProperties(parsed.data)));
}

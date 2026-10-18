import { NextResponse } from "next/server";

import { ok } from "@/lib/api-response";
import { listPropertyReviews } from "@/services/review.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(ok(await listPropertyReviews((await params).id)));
}

/* eslint-disable */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // ABANDO_NEXT_API_AUTH_ALIAS_V1
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop") || "";
  const qs = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  return NextResponse.redirect(new URL(`/shopify/install${qs}`, url.origin), 302);
}

/* eslint-disable */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // ABANDO_NEXT_API_AUTH_CALLBACK_ALIAS_V1
  const url = new URL(req.url);
  const qs = url.search ? url.search : "";
  return NextResponse.redirect(new URL(`/shopify/callback${qs}`, url.origin), 302);
}

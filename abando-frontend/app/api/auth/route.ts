import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop") || "";
  const qs = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const backendOrigin = process.env.ABANDO_BACKEND_ORIGIN || process.env.NEXT_PUBLIC_ABANDO_BACKEND_ORIGIN || url.origin;
  return NextResponse.redirect(new URL(`/shopify/install${qs}`, backendOrigin), 302);
}

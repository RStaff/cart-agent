import { NextRequest, NextResponse } from "next/server";

export function backendOrigin(): string {
  const origin = process.env.ABANDO_BACKEND_ORIGIN || process.env.NEXT_PUBLIC_ABANDO_BACKEND_ORIGIN;
  if (!origin) {
    // Fail loudly so you don't accidentally ship a broken build.
    throw new Error("Missing env var ABANDO_BACKEND_ORIGIN on Vercel.");
  }
  return origin.replace(/\/+$/, "");
}

export function redirectToBackend(req: NextRequest, backendPath: string) {
  const origin = backendOrigin();
  const incoming = new URL(req.url);
  const target = new URL(origin + backendPath);
  // Preserve query parameters Shopify sends (shop, host, hmac, timestamp, code, state, etc.)
  incoming.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  return NextResponse.redirect(target.toString(), 302);
}

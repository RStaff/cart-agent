import { NextResponse } from "next/server";

// Very light in-memory token bucket (per-IP). Works on Vercel regions for low-volume endpoints.
// For serious scale, swap to Upstash or Redis and keep the same interface.
const WINDOW_MS = 15 * 1000;       // 15s window
const MAX_REQS  = 10;              // 10 requests / 15s per IP

type Entry = { count: number; ts: number };
const bucket = new Map<string, Entry>();

export const config = {
  matcher: ["/api/:path*"]
};

export function middleware(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "0.0.0.0").split(",")[0].trim();
  const now = Date.now();
  const key = ip;

  const e = bucket.get(key);
  if (!e || now - e.ts > WINDOW_MS) {
    bucket.set(key, { count: 1, ts: now });
    return NextResponse.next();
  }

  if (e.count >= MAX_REQS) {
    return new NextResponse(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(Math.ceil((e.ts + WINDOW_MS - now) / 1000)),
        "cache-control": "no-store"
      }
    });
  }

  e.count++;
  return NextResponse.next();
}

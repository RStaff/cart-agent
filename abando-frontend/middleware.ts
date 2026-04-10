import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const WINDOW_MS = 15 * 1000;
const MAX_REQS = 10;

type Entry = { count: number; ts: number };
const bucket = new Map<string, Entry>();

function applyApiRateLimit(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "0.0.0.0").split(",")[0].trim();
  const now = Date.now();
  const key = ip;

  const entry = bucket.get(key);
  if (!entry || now - entry.ts > WINDOW_MS) {
    bucket.set(key, { count: 1, ts: now });
    return NextResponse.next();
  }

  if (entry.count >= MAX_REQS) {
    return new NextResponse(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(Math.ceil((entry.ts + WINDOW_MS - now) / 1000)),
        "cache-control": "no-store",
      },
    });
  }

  entry.count += 1;
  return NextResponse.next();
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname || "";

  if (pathname.startsWith("/api/")) {
    return applyApiRateLimit(req);
  }

  const map: Record<string, string> = {
    "/demo/playground": "/marketing/demo/playground",
    "/verticals/women-boutique": "/marketing/verticals/women-boutique",
    "/verticals": "/marketing/verticals",
  };

  const target = map[pathname];
  if (target) {
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/demo/playground", "/verticals", "/verticals/women-boutique", "/marketing/:path*"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Canonical policy:
 * - Marketing pages live under /marketing/*
 * - "Short" public routes redirect to their /marketing equivalents
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  matcher: ["/demo/playground", "/verticals", "/verticals/women-boutique", "/marketing/:path*"],
};

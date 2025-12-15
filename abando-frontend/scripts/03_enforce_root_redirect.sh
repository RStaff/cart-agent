#!/usr/bin/env bash
set -euo pipefail

TARGET="middleware.ts"
STAMP="$(date +%s)"

# Backup if exists
if [ -f "$TARGET" ]; then
  cp -p "$TARGET" "${TARGET}.bak_${STAMP}"
  echo "🗂️ Backup: ${TARGET}.bak_${STAMP}"
fi

cat << 'EOR' > middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Root Route Policy (Production + Local):
 * - "/" ALWAYS temporarily redirects (307) to "/demo/playground"
 * - Reason: merchants should not land on "/" during beta
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Only redirect the exact root path
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/demo/playground";
    url.search = search; // preserve query params if any
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

// Avoid running middleware on Next internal assets
export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
EOR

echo "✅ middleware.ts written with root redirect policy"

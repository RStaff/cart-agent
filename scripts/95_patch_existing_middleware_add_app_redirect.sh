#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/middleware.ts"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "🔒 Backing up $FILE..."
cp "$FILE" "$FILE.bak_$(date +%Y%m%d_%H%M%S)"

cat > "$FILE" << 'TS'
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Root-cause: dashboard must be public for sales/demo.
// Keep everything public, but make /app an alias to the real embedded entry.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect /app and anything under it to the embedded entry
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/embedded";
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  // only run middleware for /app so we don't accidentally affect anything else
  matcher: ["/app", "/app/:path*"],
};
TS

echo "✅ Patched $FILE"
echo "🔎 Preview:"
nl -ba "$FILE" | sed -n '1,140p'

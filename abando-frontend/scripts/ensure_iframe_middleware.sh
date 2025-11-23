#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "▶ Writing middleware.ts to enforce iframe-safe headers for /embedded"

cat > "$ROOT/middleware.ts" <<'MWEOF'
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Allow embedding (Shopify admin + *.myshopify.com already covered by CSP)
  res.headers.set('X-Frame-Options', 'ALLOWALL');

  // Ensure frame-ancestors is present (in case Next/Vercel strip or override later)
  const existingCsp = res.headers.get('Content-Security-Policy') ?? '';
  const required = "frame-ancestors https://admin.shopify.com https://*.myshopify.com;";

  if (!existingCsp.includes('frame-ancestors')) {
    const merged = [required, existingCsp].filter(Boolean).join(' ');
    res.headers.set('Content-Security-Policy', merged);
  }

  return res;
}

// Apply only to the embedded app shell
export const config = {
  matcher: ['/embedded', '/embedded/:path*'],
};
MWEOF

echo "✅ middleware.ts written for /embedded"

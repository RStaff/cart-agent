#!/usr/bin/env bash
set -euo pipefail

ROOT="abando-frontend"
API_DIR="$ROOT/src/app/api/health"

echo "🔧 Adding frontend /api/health route for Abando…"
if [[ ! -d "$ROOT" ]]; then
  echo "❌ $ROOT not found. Run this from the cart-agent repo root."
  exit 1
fi

mkdir -p "$API_DIR"

cat << 'ROUTE' > "$API_DIR/route.ts"
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "abando-frontend",
    connected_to: "abando-backend",
    ok: true,
  });
}
ROUTE

echo "✅ Wrote $API_DIR/route.ts"

echo
echo "🔍 Quick grep check:"
grep -n "abando-frontend" "$API_DIR/route.ts" || echo " (not found?)"

echo
echo "✅ Frontend /api/health route ready. Deploy via Vercel as usual."

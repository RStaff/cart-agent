#!/usr/bin/env bash
set -euo pipefail

APP_DIR="abando-frontend"

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: $APP_DIR not found. Run from repo root (cart-agent)."
  exit 1
fi

TS="$(date +%Y%m%d_%H%M%S)"

# 1) Create Next.js route handlers for /api/auth and /api/auth/callback
mkdir -p "$APP_DIR/src/app/api/auth" "$APP_DIR/src/app/api/auth/callback"

AUTH_FILE="$APP_DIR/src/app/api/auth/route.ts"
CALLBACK_FILE="$APP_DIR/src/app/api/auth/callback/route.ts"

cp -a "$AUTH_FILE" "${AUTH_FILE}.bak_${TS}" 2>/dev/null || true
cp -a "$CALLBACK_FILE" "${CALLBACK_FILE}.bak_${TS}" 2>/dev/null || true

cat > "$AUTH_FILE" <<'TS'
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop") || "";
  const qs = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  return NextResponse.redirect(new URL(`/shopify/install${qs}`, url.origin), 302);
}
TS

cat > "$CALLBACK_FILE" <<'TS'
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.search ? url.search : "";
  return NextResponse.redirect(new URL(`/shopify/callback${qs}`, url.origin), 302);
}
TS

echo "Wrote:"
echo " - $AUTH_FILE"
echo " - $CALLBACK_FILE"

# 2) Patch middleware to bypass session-token checks for /api/auth*
# Find middleware file
MW_CANDIDATES=(
  "$APP_DIR/middleware.ts"
  "$APP_DIR/src/middleware.ts"
)

MW_FILE=""
for f in "${MW_CANDIDATES[@]}"; do
  if [[ -f "$f" ]]; then
    MW_FILE="$f"
    break
  fi
done

if [[ -z "$MW_FILE" ]]; then
  echo
  echo "WARNING: No middleware.ts found at:"
  printf " - %s\n" "${MW_CANDIDATES[@]}"
  echo "If your app has a different middleware path, locate it with:"
  echo "  rg -n \"from 'next/server'|NextResponse|export const config|middleware\\(\" $APP_DIR"
  echo
  echo "Done (routes created)."
  exit 0
fi

cp -a "$MW_FILE" "${MW_FILE}.bak_${TS}"
echo "Backup created: ${MW_FILE}.bak_${TS}"

python3 - <<'PY'
import pathlib, re, sys

p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding="utf-8")

marker = "// --- ABANDO_SKIP_SESSION_TOKEN_FOR_AUTH_ALIASES_V1 ---"
skip_block = (
  f"\n{marker}\n"
  "  // Allow Shopify to hit these without an App Bridge session token.\n"
  "  const pathname = req.nextUrl?.pathname || \"\";\n"
  "  if (pathname === \"/api/auth\" || pathname === \"/api/auth/callback\") {\n"
  "    return NextResponse.next();\n"
  "  }\n"
)

if marker in s:
    print("middleware: skip block already present (no duplicate)")
    sys.exit(0)

# Try to insert right after function middleware(req) {  OR export function middleware(req) {
m = re.search(r'(export\s+)?function\s+middleware\s*\(\s*req\s*[:\w\s]*\)\s*\{', s)
if not m:
    # Try default export style: export default function middleware(req) {
    m = re.search(r'export\s+default\s+function\s+middleware\s*\(\s*req\s*[:\w\s]*\)\s*\{', s)

if not m:
    print("ERROR: Could not find middleware(req) function in", p)
    sys.exit(2)

insert_at = m.end()
s2 = s[:insert_at] + skip_block + s[insert_at:]

# Ensure NextResponse is imported (most middleware already has it)
if "NextResponse" not in s2:
    # Try to add import if missing
    # If there's an import from next/server, append NextResponse
    s2b = re.sub(
        r'from\s+[\'"]next/server[\'"];',
        lambda mm: mm.group(0),
        s2
    )
    s2 = s2b

p.write_text(s2, encoding="utf-8")
print("middleware: inserted skip block for /api/auth and /api/auth/callback")
PY "$MW_FILE"

echo
echo "Diff (abando-frontend routes + middleware):"
git --no-pager diff -- "$APP_DIR/src/app/api/auth/route.ts" "$APP_DIR/src/app/api/auth/callback/route.ts" "$MW_FILE" || true

echo
echo "Next steps:"
echo "  git add -A"
echo "  git commit -m \"Add Next /api/auth aliases and bypass session-token middleware\""
echo "  git push"

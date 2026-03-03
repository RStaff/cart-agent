#!/usr/bin/env bash
set -euo pipefail

APP_DIR="abando-frontend"
TS="$(date +%Y%m%d_%H%M%S)"

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: $APP_DIR not found. Run from repo root (cart-agent)."
  exit 1
fi

write_if_missing_marker () {
  local file="$1"
  local marker="$2"
  local tmp="${file}.tmp_${TS}"

  if [[ -f "$file" ]] && rg -qF "$marker" "$file"; then
    echo "skip: marker already present in $file"
    return 0
  fi

  [[ -f "$file" ]] && cp -a "$file" "${file}.bak_${TS}"

  cat > "$tmp"
  mv "$tmp" "$file"
  echo "wrote: $file"
}

# -------------------------------------------------------------------
# 1) Create Next.js route handlers for /api/auth and /api/auth/callback
# -------------------------------------------------------------------
mkdir -p "$APP_DIR/src/app/api/auth" "$APP_DIR/src/app/api/auth/callback"

AUTH_FILE="$APP_DIR/src/app/api/auth/route.ts"
CALLBACK_FILE="$APP_DIR/src/app/api/auth/callback/route.ts"

AUTH_MARKER="// ABANDO_NEXT_API_AUTH_ALIAS_V1"
CALLBACK_MARKER="// ABANDO_NEXT_API_AUTH_CALLBACK_ALIAS_V1"

write_if_missing_marker "$AUTH_FILE" "$AUTH_MARKER" <<'TSFILE'
/* eslint-disable */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // ABANDO_NEXT_API_AUTH_ALIAS_V1
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop") || "";
  const qs = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  return NextResponse.redirect(new URL(`/shopify/install${qs}`, url.origin), 302);
}
TSFILE

write_if_missing_marker "$CALLBACK_FILE" "$CALLBACK_MARKER" <<'TSFILE'
/* eslint-disable */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // ABANDO_NEXT_API_AUTH_CALLBACK_ALIAS_V1
  const url = new URL(req.url);
  const qs = url.search ? url.search : "";
  return NextResponse.redirect(new URL(`/shopify/callback${qs}`, url.origin), 302);
}
TSFILE

# -------------------------------------------------------------------
# 2) Patch middleware to bypass session-token enforcement for /api/auth*
# -------------------------------------------------------------------
MW_FILE=""
if [[ -f "$APP_DIR/middleware.ts" ]]; then
  MW_FILE="$APP_DIR/middleware.ts"
elif [[ -f "$APP_DIR/src/middleware.ts" ]]; then
  MW_FILE="$APP_DIR/src/middleware.ts"
fi

if [[ -z "$MW_FILE" ]]; then
  echo
  echo "WARNING: No middleware.ts found. Skipping middleware patch."
  echo "Try:"
  echo "  rg -n \"middleware\\s*\\(\" $APP_DIR"
  echo
  echo "Diff (routes only):"
  git --no-pager diff -- "$AUTH_FILE" "$CALLBACK_FILE" || true
  exit 0
fi

cp -a "$MW_FILE" "${MW_FILE}.bak_${TS}"
echo "backup: ${MW_FILE}.bak_${TS}"

python3 - "$MW_FILE" <<'PY'
import re, sys, pathlib

mw_path = pathlib.Path(sys.argv[1])
s = mw_path.read_text(encoding="utf-8")

marker = "// --- ABANDO_SKIP_SESSION_TOKEN_FOR_AUTH_ALIASES_V1 ---"
skip_block = (
    "\n" + marker + "\n"
    "  // Allow Shopify to hit these without an App Bridge session token.\n"
    "  const pathname = (req as any)?.nextUrl?.pathname || \"\";\n"
    "  if (pathname === \"/api/auth\" || pathname === \"/api/auth/callback\") {\n"
    "    return NextResponse.next();\n"
    "  }\n"
)

if marker in s:
    print("middleware: skip block already present (no duplicate)")
    sys.exit(0)

# Ensure NextResponse is imported from next/server
def ensure_nextresponse_import(text: str) -> str:
    # If there's already an import that includes NextResponse, done.
    if re.search(r'import\s*\{[^}]*\bNextResponse\b[^}]*\}\s*from\s*[\'"]next/server[\'"]', text):
        return text

    # If there's an import { ... } from "next/server", append NextResponse
    m = re.search(r'import\s*\{\s*([^}]*)\s*\}\s*from\s*[\'"]next/server[\'"];?', text)
    if m:
        inside = m.group(1).strip()
        parts = [p.strip() for p in inside.split(",") if p.strip()]
        if "NextResponse" not in parts:
            parts.append("NextResponse")
        new_import = f'import {{ {", ".join(parts)} }} from "next/server";'
        return text[:m.start()] + new_import + text[m.end():]

    # Otherwise, add a new import near the top (after any shebang/comments is fine)
    # Put it after the first block of imports if any, else at top.
    if re.search(r'^\s*import\s', text, flags=re.M):
        first_import = re.search(r'^\s*import\s', text, flags=re.M)
        i = first_import.start()
        return text[:i] + 'import { NextResponse } from "next/server";\n' + text[i:]
    return 'import { NextResponse } from "next/server";\n' + text

s = ensure_nextresponse_import(s)

# Find middleware function block start: export function middleware(...) { OR export default function middleware(...) {
m = re.search(r'(export\s+default\s+)?export\s+function\s+middleware\s*\(\s*req\b[^)]*\)\s*\{', s)
if not m:
    m = re.search(r'(export\s+default\s+)?function\s+middleware\s*\(\s*req\b[^)]*\)\s*\{', s)

if not m:
    print(f"ERROR: Could not find a middleware(req) function in {mw_path}", file=sys.stderr)
    sys.exit(2)

insert_at = m.end()
s2 = s[:insert_at] + skip_block + s[insert_at:]

mw_path.write_text(s2, encoding="utf-8")
print("middleware: inserted skip block and ensured NextResponse import")
PY

echo
echo "Diff (routes + middleware):"
git --no-pager diff -- "$AUTH_FILE" "$CALLBACK_FILE" "$MW_FILE" || true

echo
echo "If diff looks good, run:"
echo "  git add -A"
echo "  git commit -m \"Add Next /api/auth aliases + bypass session-token middleware\""
echo "  git push"

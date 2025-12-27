#!/usr/bin/env bash
set -euo pipefail

START_DIR="$(pwd)"

# Find shopify.app.toml by walking up from current directory
find_toml_up() {
  local d="$START_DIR"
  while true; do
    if [[ -f "$d/shopify.app.toml" ]]; then
      echo "$d/shopify.app.toml"
      return 0
    fi
    [[ "$d" == "/" ]] && return 1
    d="$(cd "$d/.." && pwd)"
  done
}

TOML="$(find_toml_up || true)"
if [[ -z "${TOML:-}" ]]; then
  echo "❌ Could not find shopify.app.toml by searching upward from: $START_DIR"
  echo "   Run this from somewhere inside your cart-agent repo."
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$TOML")" && pwd)"

# We are in abando-frontend; ensure we patch the Next.js app route there
FRONTEND_DIR="$START_DIR"
if [[ ! -d "$FRONTEND_DIR/app" ]]; then
  # if script is run from elsewhere, try to locate abando-frontend under repo root
  if [[ -d "$REPO_ROOT/abando-frontend/app" ]]; then
    FRONTEND_DIR="$REPO_ROOT/abando-frontend"
  else
    echo "❌ Could not locate Next.js app directory."
    echo "   Expected either ./app (current dir) or $REPO_ROOT/abando-frontend/app"
    exit 1
  fi
fi

ROUTE_DIR="$FRONTEND_DIR/app/api/webhooks/gdpr"
ROUTE_FILE="$ROUTE_DIR/route.ts"

echo "🔎 Abando GDPR Webhook Patch (auto-find)"
echo "📁 Start dir:     $START_DIR"
echo "📄 TOML found:    $TOML"
echo "🏠 Repo root:     $REPO_ROOT"
echo "🧩 Frontend dir:  $FRONTEND_DIR"

# Pull application_url from shopify.app.toml
APP_URL="$(perl -ne 'if(/^\s*application_url\s*=\s*"([^"]+)"/){print $1; exit}' "$TOML" || true)"
if [[ -z "${APP_URL:-}" ]]; then
  echo "❌ Could not find application_url in $TOML"
  echo "   Expected: application_url = \"https://...\""
  exit 1
fi
APP_URL="${APP_URL%/}"
GDPR_ENDPOINT="${APP_URL}/api/webhooks/gdpr"

echo "✅ application_url: $APP_URL"
echo "✅ GDPR endpoint:   $GDPR_ENDPOINT"

# Backup toml
BK_TOML="$TOML.bak_$(date +%s)"
cp "$TOML" "$BK_TOML"
echo "🧾 Backup created: $BK_TOML"

# Create route file if missing
mkdir -p "$ROUTE_DIR"
if [[ -f "$ROUTE_FILE" ]]; then
  echo "ℹ️ Route already exists: $ROUTE_FILE (leaving as-is)"
else
  cat << 'ROUTE' > "$ROUTE_FILE"
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyShopifyHmac(req: NextRequest, rawBody: string) {
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  if (!hmacHeader) return false;

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyShopifyHmac(req, rawBody)) {
    return new NextResponse("Invalid HMAC", { status: 401 });
  }

  // Minimal compliance no-op (OK for apps storing no customer PII)
  return NextResponse.json({ ok: true });
}
ROUTE
  echo "✅ Created route: $ROUTE_FILE"
fi

# Ensure 3 mandatory webhook blocks exist in TOML (idempotent)
ensure_block () {
  local topic="$1"
  if grep -qE 'topic\s*=\s*"'$topic'"' "$TOML"; then
    echo "✅ Webhook already present: $topic"
  else
    cat << TOML_APPEND >> "$TOML"

[[webhooks]]
topic = "$topic"
address = "$GDPR_ENDPOINT"
format = "json"
TOML_APPEND
    echo "➕ Added webhook: $topic"
  fi
}

ensure_block "customers/data_request"
ensure_block "customers/redact"
ensure_block "shop/redact"

echo
echo "🔍 Confirming..."
test -f "$ROUTE_FILE" && echo "✅ Route exists: $ROUTE_FILE" || { echo "❌ Missing route: $ROUTE_FILE"; exit 1; }

for t in customers/data_request customers/redact shop/redact; do
  grep -qE 'topic\s*=\s*"'$t'"' "$TOML" && echo "✅ TOML has $t" || { echo "❌ Missing $t in TOML"; exit 1; }
done

echo
echo "⚠️ IMPORTANT: Shopify will validate HMAC using SHOPIFY_API_SECRET at runtime."
echo "   Ensure SHOPIFY_API_SECRET is set in production where your app is deployed."
echo
echo "🎯 Next (copy/paste):"
echo "  cd \"$REPO_ROOT\""
echo "  shopify app deploy"
echo "  # then rerun the checks in Partners → Distribution"

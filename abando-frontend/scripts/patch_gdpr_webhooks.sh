#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TOML="$ROOT/shopify.app.toml"
ROUTE_DIR="$ROOT/app/api/webhooks/gdpr"
ROUTE_FILE="$ROUTE_DIR/route.ts"

echo "🔎 Abando GDPR Webhook Patch (no manual edits)"
echo "📁 Root: $ROOT"

# --- Preconditions ---
test -f "$TOML" || { echo "❌ shopify.app.toml not found at: $TOML"; exit 1; }

# Pull application_url from shopify.app.toml
APP_URL="$(perl -ne 'if(/^\s*application_url\s*=\s*"([^"]+)"/){print $1; exit}' "$TOML" || true)"
if [[ -z "${APP_URL:-}" ]]; then
  echo "❌ Could not find application_url in shopify.app.toml"
  echo "   Expected a line like: application_url = \"https://...\""
  exit 1
fi

# Normalize: no trailing slash
APP_URL="${APP_URL%/}"

# Require https (Shopify expects https in production)
if [[ "$APP_URL" != https://* ]]; then
  echo "⚠️ application_url is not https: $APP_URL"
  echo "   Shopify App Store checks generally require https endpoints."
fi

GDPR_ENDPOINT="${APP_URL}/api/webhooks/gdpr"

echo "✅ application_url: $APP_URL"
echo "✅ GDPR endpoint:   $GDPR_ENDPOINT"

# --- Backup shopify.app.toml ---
BK_TOML="$TOML.bak_$(date +%s)"
cp "$TOML" "$BK_TOML"
echo "🧾 Backup created: $BK_TOML"

# --- Create the GDPR webhook route (Next.js App Router) ---
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

  // Intentionally minimal/no-op for compliance:
  // - customers/data_request
  // - customers/redact
  // - shop/redact
  // Abando can respond 200 even if it stores no customer PII.
  return NextResponse.json({ ok: true });
}
ROUTE

  echo "✅ Created route: $ROUTE_FILE"
fi

# --- Idempotently ensure webhooks exist in shopify.app.toml ---
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

# --- Confirm results ---
echo
echo "🔍 Confirming assets + config..."
test -f "$ROUTE_FILE" && echo "✅ Route exists: $ROUTE_FILE" || { echo "❌ Missing route: $ROUTE_FILE"; exit 1; }

grep -nE '^\s*\[\[webhooks\]\]|^\s*topic\s*=|^\s*address\s*=' "$TOML" | tail -n 60 || true

echo
echo "✅ Mandatory topics present?"
for t in customers/data_request customers/redact shop/redact; do
  if grep -qE 'topic\s*=\s*"'$t'"' "$TOML"; then
    echo "  ✅ $t"
  else
    echo "  ❌ $t (missing)"
    exit 1
  fi
done

echo
echo "⚠️ Environment reminder:"
echo "   This route requires SHOPIFY_API_SECRET at runtime (local + production)."
echo "   If missing or wrong, Shopify will keep failing HMAC verification."

echo
echo "🎯 Next commands (copy/paste):"
echo "  1) npm run dev"
echo "  2) shopify app deploy"
echo "  3) In Partners → Distribution → Run checks"

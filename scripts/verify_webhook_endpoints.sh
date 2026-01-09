#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
BASE="$(rg -No '^\s*application_url\s*=\s*"(https://[^"]+)"' "$TOML" --replace '$1' | head -n 1)"
test -n "${BASE:-}" || { echo "❌ Could not read application_url from $TOML"; exit 2; }

echo "🔗 application_url: $BASE"
echo

echo "== HEAD /api/webhooks/gdpr =="
curl -sS -I "$BASE/api/webhooks/gdpr" | head -n 25 || true
echo

echo "== POST /api/webhooks/gdpr (no HMAC) expect 401 =="
curl -sS -i -X POST "$BASE/api/webhooks/gdpr" \
  -H "Content-Type: application/json" \
  --data '{"ping":true}' | head -n 40 || true
echo

echo "== POST /api/webhooks (no HMAC) expect 401 =="
curl -sS -i -X POST "$BASE/api/webhooks" \
  -H "Content-Type: application/json" \
  --data '{"ping":true}' | head -n 40 || true

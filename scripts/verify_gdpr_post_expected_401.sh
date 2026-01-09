#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
URL="$(rg -No '^\s*uri\s*=\s*"(https://[^"]+/api/webhooks/gdpr)"' "$TOML" --replace '$1' | head -n 1)"
test -n "${URL:-}" || { echo "❌ Could not find GDPR uri in $TOML"; exit 2; }

echo "🔗 POST (no HMAC) to: $URL"
echo "Expected: HTTP/1.1 401"
echo

curl -sS -i -X POST "$URL" \
  -H "Content-Type: application/json" \
  --data '{"ping":true}' | head -n 60

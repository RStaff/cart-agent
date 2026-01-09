#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -f "$TOML" || { echo "❌ Missing $TOML"; exit 1; }

# Pull ONLY the quoted URL (no line numbers)
URL="$(rg -No '^\s*uri\s*=\s*"(https://[^"]+/api/webhooks/gdpr)"' "$TOML" --replace '$1' | head -n 1)"
test -n "${URL:-}" || { echo "❌ Could not find GDPR uri in $TOML"; exit 2; }

BASE="${URL%/api/webhooks/gdpr}"
echo "🔗 GDPR endpoint: $URL"
echo "🔗 Base:          $BASE"
echo

echo "== HEAD =="
curl -sS -I "$URL" | head -n 20
echo

echo "== GET =="
curl -sS "$URL" | head -n 50
echo

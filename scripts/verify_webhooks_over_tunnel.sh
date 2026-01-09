#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -n "${BASE:-}" || { echo "❌ Could not read application_url from $TOML"; exit 2; }

# BASE can be provided via env var:
#   BASE="https://xxxx.trycloudflare.com" bash scripts/verify_webhooks_over_tunnel.sh
# If not provided, read application_url from shopify.app.toml
if [ -z "${BASE:-}" ]; then
  BASE="$(rg -n '^application_url\s*=' shopify.app.toml | head -n 1 | sed -E 's/.*"([^"]+)".*/\1/')"
fi
test -n "${BASE:-}" || { echo "❌ BASE not set and application_url not found in shopify.app.toml"; exit 1; }

echo "🔗 Tunnel BASE: $BASE"
echo

echo "== HEAD /api/webhooks/gdpr =="
curl -sS -I "$BASE/api/webhooks/gdpr" | head -n 40 || true
echo

echo "== POST /api/webhooks/gdpr (no HMAC) expect 401 (or 400) =="
curl -sS -i -X POST "$BASE/api/webhooks/gdpr" \
  -H "Content-Type: application/json" \
  --data '{"ping":true}' | head -n 60 || true
echo

echo "== POST /api/webhooks (no HMAC) expect 401 (or 404 if only gdpr wired) =="
curl -sS -i -X POST "$BASE/api/webhooks" \
  -H "Content-Type: application/json" \
  --data '{"ping":true}' | head -n 60 || true
echo

echo "✅ Done."

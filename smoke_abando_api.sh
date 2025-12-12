#!/usr/bin/env bash
set -euo pipefail

BASE="https://pay.abando.ai"

say() {
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

say "1) GET /healthz"
curl -s "$BASE/healthz" | jq . || curl -s "$BASE/healthz"

say "2) POST /webhooks/shopify/app-uninstalled"
curl -i "$BASE/webhooks/shopify/app-uninstalled" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"source":"smoke-test"}'

say "3) POST /api/cart-event (dev-store)"
curl -i "$BASE/api/cart-event" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "dev-store",
    "eventType": "checkout_creation_smoke",
    "eventSource": "smoke-script",
    "value": 19.99,
    "metadata": { "note": "smoke test from script" }
  }'

say "4) GET /api/ai-segments/dev-store"
curl -s "$BASE/api/ai-segments/dev-store" | jq .

echo
echo "✅ Smoke test finished."

#!/usr/bin/env bash
set -euo pipefail
: "${CART_AGENT_API_BASE:?Set CART_AGENT_API_BASE to your live app origin}"

echo "→ Hitting metrics…"
curl -fsS "$CART_AGENT_API_BASE/api/metrics" | jq . || { echo "❌ metrics failed"; exit 1; }

echo "→ Creating test abandoned cart…"
payload='{"checkoutId":"SMOKE-'$RANDOM'","email":"smoke@example.com","lineItems":[{"id":1,"title":"Test Item","quantity":1}],"totalPrice":9.99}'
curl -fsS -X POST "$CART_AGENT_API_BASE/api/abandoned-cart" \
  -H "Content-Type: application/json" -d "$payload" | jq .

echo "✅ Prod smoke passed."

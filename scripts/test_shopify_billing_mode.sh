#!/usr/bin/env bash
set -euo pipefail

SHOP_DOMAIN="${SHOP_DOMAIN:-your-store.myshopify.com}"

echo "🚀 Testing REAL Shopify billing mode against shop: $SHOP_DOMAIN"

./scripts/kill_web_port_3000.sh || true

cd web
BILLING_MODE=shopify npm run dev > /tmp/web_billing_shopify.log 2>&1 &
SERVER_PID=$!
cd ..

sleep 6

echo "🧪 POST /billing/create (shopify mode)..."
curl -s -X POST "http://localhost:3000/billing/create?shop=${SHOP_DOMAIN}" \
  -H "Content-Type: application/json" \
  -d '{"planKey":"starter"}' | jq .

echo
echo "🧹 Stopping dev server..."
kill $SERVER_PID 2>/dev/null || true
echo "✅ Shopify billing test complete. See /tmp/web_billing_shopify.log for server logs."

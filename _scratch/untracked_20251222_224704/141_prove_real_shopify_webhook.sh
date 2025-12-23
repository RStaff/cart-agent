#!/usr/bin/env bash
set -euo pipefail

# 1) Paste CURRENT tunnel + backend port (from shopify app dev output)
TUNNEL="${TUNNEL:-https://dam-carlo-emails-nuke.trycloudflare.com}"
BACKEND_PORT="${BACKEND_PORT:-51745}"

EXPRESS_LOG=".dev_express.log"
touch "$EXPRESS_LOG" 2>/dev/null || true

echo "✅ Using:"
echo "   TUNNEL=$TUNNEL"
echo "   BACKEND_PORT=$BACKEND_PORT"
echo

echo "🧪 Backend sanity (expect 401 missing hmac):"
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,18p'
echo

echo "🧪 Tunnel sanity (expect SAME 401 missing hmac):"
curl -sS -i "${TUNNEL}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,18p'
echo

MARK="$(wc -l < "$EXPRESS_LOG" | tr -d ' ')"
echo "🧷 Log marker at line: $MARK"
echo

echo "🚀 Trigger REAL Shopify webhook → tunnel"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "${TUNNEL}/api/webhooks" \
  --api-version 2025-07
echo "✅ Enqueued. Waiting 20s..."
sleep 20
echo

echo "🔎 New webhook blocks AFTER trigger (from $EXPRESS_LOG):"
NEW="$(tail -n +$((MARK+1)) "$EXPRESS_LOG" || true)"

if echo "$NEW" | grep -q "has_x_shopify_topic: true"; then
  echo "✅ REAL SHOPIFY HEADERS CONFIRMED (has_x_shopify_topic: true)"
  echo
  echo "$NEW" | grep -n "received POST /api/webhooks" -A 10 -B 1 | tail -n 60
else
  echo "❌ Did NOT see has_x_shopify_topic: true in Express log yet."
  echo
  echo "Last 120 lines of Express log:"
  tail -n 120 "$EXPRESS_LOG" || true
  echo
  echo "Tip: if you only see content_length: '2', that's your local curl test, not Shopify."
fi

echo
echo "✅ Done."

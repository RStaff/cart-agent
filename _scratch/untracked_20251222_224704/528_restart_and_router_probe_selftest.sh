#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🔪 Killing listener on :3000 (child process) so nodemon restarts it..."
PIDS="$(lsof -nP -tiTCP:3000 -sTCP:LISTEN || true)"
if [ -n "${PIDS}" ]; then
  echo "💀 kill -9 ${PIDS}"
  kill -9 ${PIDS} || true
else
  echo "⚠️ Nothing listening on :3000 right now."
fi

echo "🔁 Touching watched files to ensure nodemon notices..."
touch web/index.js web/lib/.nodemon_restart 2>/dev/null || true

echo "⏳ Give nodemon 2 seconds to relaunch..."
sleep 2

echo "🧪 Hitting webhook endpoint..."
TS="$(date +%s)"
curl -s -i -X POST "http://localhost:3000/api/webhooks" \
  -H "content-type: application/json" \
  -H "x-shopify-topic: checkouts/update" \
  -H "x-shopify-shop-domain: cart-agent-dev.myshopify.com" \
  -H "x-shopify-hmac-sha256: test" \
  --data "{\"hello\":\"world\",\"t\":${TS}}"

echo
echo "📄 Expect router probe at: web/.abando_webhook_router_enter.jsonl"
if [ -f "web/.abando_webhook_router_enter.jsonl" ]; then
  ls -lahT web/.abando_webhook_router_enter.jsonl
  tail -n 20 web/.abando_webhook_router_enter.jsonl
else
  echo "❌ Still missing: web/.abando_webhook_router_enter.jsonl"
  echo "🔎 Showing first lines in webhooks.js around inserted probe:"
  grep -n "ROUTER_USE_PROBE" -n web/src/routes/webhooks.js || true
fi

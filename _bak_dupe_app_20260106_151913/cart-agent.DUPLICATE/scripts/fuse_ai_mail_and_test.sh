#!/usr/bin/env bash
set -euo pipefail

echo "==> Starting local server..."
PORT_FILE=$(mktemp)
trap 'rm -f "$PORT_FILE"' EXIT

# Start server and capture logs to find the port
npm run dev:web-backend > >(tee /tmp/web-backend.log) 2>&1 &
APP_PID=$!

echo "==> Waiting for server to start..."
PORT=""
for i in {1..30}; do
  if grep -q "webhook receiver listening at http://localhost:" /tmp/web-backend.log; then
    PORT=$(grep -m1 "webhook receiver listening at http://localhost:" /tmp/web-backend.log | sed -E 's/.*localhost:([0-9]+).*/\1/')
    break
  fi
  sleep 1
done

if [ -z "$PORT" ]; then
  echo "❌ Could not detect port from logs."
  kill $APP_PID || true
  exit 1
fi

echo "==> Detected port: $PORT"
sleep 1

echo "==> Sending test abandoned-cart POST..."
RESP=$(curl -sS -i -X POST "http://localhost:$PORT/api/abandoned-cart" \
  -H "Content-Type: application/json" \
  -d '{"checkoutId":"SMOKE-'"$RANDOM"'","email":"smoke@example.com","lineItems":[{"id":1,"title":"Test Item","quantity":1}],"totalPrice":9.99}')

echo "$RESP" | sed -n '1,20p'
STATUS=$(printf "%s" "$RESP" | awk 'NR==1{print $2}')

kill $APP_PID >/dev/null 2>&1 || true

if [ "$STATUS" = "201" ]; then
  echo "==> ✅ Row created. Check your main dev terminal for: 📬 Email queued (previewUrl)"
else
  echo "==> ⚠️ Non-201 ($STATUS). Check error logs above."
fi

echo
echo "==> Next:"
echo "  • Put your real OpenAI key in web/.env as OPENAI_API_KEY=\"sk-proj-...\" (optional)."
echo "  • Then run:  shopify app dev   (for the full tunnel + proxy flow)."
echo "  • Webhook path: /api/abandoned-cart"

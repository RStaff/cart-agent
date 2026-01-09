#!/usr/bin/env bash
set -euo pipefail

echo "==> 0) Sanity checks"
command -v shopify >/dev/null || { echo "Shopify CLI not found. Install with: npm i -g @shopify/cli"; exit 1; }
command -v curl >/dev/null || { echo "curl not found"; exit 1; }

LOG=dev.log

echo "==> 1) (Re)start dev server in background -> $LOG"
# Stop any previous run
pkill -f "shopify app dev" >/dev/null 2>&1 || true
sleep 1

# Start fresh (background)
( shopify app dev | tee "$LOG" ) &
APP_PID=$!
trap 'echo "==> Cleaning up (pid $APP_PID)"; kill $APP_PID >/dev/null 2>&1 || true' EXIT

echo "==> 2) Waiting for proxy port from Shopify CLI..."
# Wait up to ~30s for the proxy to appear in logs
for i in {1..60}; do
  if grep -q "Proxy server started on port" "$LOG"; then
    break
  fi
  sleep 0.5
done

if ! grep -q "Proxy server started on port" "$LOG"; then
  echo "❌ Could not detect proxy port in $LOG"
  exit 1
fi

PROXY_PORT=$(awk '/Proxy server started on port/{print $NF}' "$LOG" | tail -n1)
echo "==> Using proxy port: $PROXY_PORT"

# Show the local backend port too (nice to know)
LOCAL_BACKEND=$(awk '/webhook receiver listening at http:\/\/localhost:/{print $NF}' "$LOG" | sed 's#.*/##' | tail -n1)
[ -n "$LOCAL_BACKEND" ] && echo "==> Local backend listening on: $LOCAL_BACKEND"

echo "==> 3) POST smoke test to /api/abandoned-cart via CLI proxy"
JSON='{"checkoutId":"SMOKE-'"$RANDOM"'","email":"smoke@example.com","lineItems":[{"id":1,"title":"Test Item","quantity":1}],"totalPrice":9.99}'
RESP=$(curl -sS -i -X POST "http://localhost:$PROXY_PORT/api/abandoned-cart" \
  -H "Content-Type: application/json" -d "$JSON")

echo "---- response (head) ----"
echo "$RESP" | sed -n '1,15p'
STATUS=$(printf "%s" "$RESP" | awk 'NR==1{print $2}')

if [ "$STATUS" = "201" ]; then
  echo "==> ✅ 201 Created — row saved."
else
  echo "==> ⚠️ Non-201 ($STATUS). Check $LOG and server output above."
fi

echo "==> 4) Looking for AI copy + Ethereal preview URL in logs…"
# Give nodemon a beat to flush logs
sleep 1

PREVIEW=$(awk '/📬 Email queued:/{print $NF}' "$LOG" | tail -n1)
if [ -n "${PREVIEW:-}" ]; then
  echo "📬 Email preview: $PREVIEW"
else
  echo "ℹ️ No preview URL found yet. (If you haven’t added the mailer hook, that’s expected.)"
fi

echo
echo "==> Done. Dev server is still running in the background (pid: $APP_PID)."
echo "   • Keep this shell open to keep the server alive."
echo "   • Re-run smoke test quickly with:"
echo "       curl -i -X POST \"http://localhost:$PROXY_PORT/api/abandoned-cart\" \\"
echo "         -H \"Content-Type: application/json\" \\"
echo "         -d '{\"checkoutId\":\"SMOKE-'"$RANDOM"'\",\"email\":\"smoke@example.com\",\"lineItems\":[{\"id\":1,\"title\":\"Test Item\",\"quantity\":1}],\"totalPrice\":9.99}'"

#!/usr/bin/env bash
set -euo pipefail

APP_STORE="${1:-cart-agent-dev.myshopify.com}"
LOGDIR=".tunnel_logs"
mkdir -p "$LOGDIR"

echo "🧹 Freeing ports 3000/3001..."
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

echo
echo "🚀 Starting your local stack (Express:3000 + Next:3001) via scripts/dev.sh ..."
# Start in background and log
( ./scripts/dev.sh "$APP_STORE" ) > "$LOGDIR/dev_stack.log" 2>&1 &
DEV_PID=$!
echo "🟢 dev.sh PID: $DEV_PID"
echo "   log: $LOGDIR/dev_stack.log"

echo
echo "⏳ Waiting for Express to listen on :3000..."
for i in {1..40}; do
  if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✅ Express is listening on :3000"
    break
  fi
  sleep 0.25
done

if ! lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "❌ Express did not bind :3000. Tail log:"
  tail -n 120 "$LOGDIR/dev_stack.log" || true
  exit 1
fi

echo
echo "🌩️ Starting Cloudflare QUICK tunnel -> http://localhost:3000"
echo "   (This bypasses Shopify CLI preview/proxy completely.)"

# Start cloudflared in background, capture URL
( cloudflared tunnel --url http://localhost:3000 --no-autoupdate ) > "$LOGDIR/cloudflared.log" 2>&1 &
CF_PID=$!
echo "🟢 cloudflared PID: $CF_PID"
echo "   log: $LOGDIR/cloudflared.log"

echo
echo "⏳ Waiting for trycloudflare URL..."
TUNNEL=""
for i in {1..120}; do
  # Cloudflared prints something like: https://xxxxx.trycloudflare.com
  TUNNEL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOGDIR/cloudflared.log" | tail -n 1 || true)"
  if [[ -n "${TUNNEL}" ]]; then
    break
  fi
  sleep 0.25
done

if [[ -z "${TUNNEL}" ]]; then
  echo "❌ Could not detect tunnel URL. Tail cloudflared log:"
  tail -n 160 "$LOGDIR/cloudflared.log" || true
  exit 1
fi

echo
echo "✅ TUNNEL = $TUNNEL"
echo
echo "🧪 Sanity: tunnel should reach your Express server (expect 401 missing hmac):"
curl -i "$TUNNEL/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,25p' || true

echo
echo "📌 Export this in your current shell (copy/paste):"
echo "export TUNNEL=\"$TUNNEL\""
echo
echo "🛑 To stop everything:"
echo "kill -9 $DEV_PID $CF_PID 2>/dev/null || true"

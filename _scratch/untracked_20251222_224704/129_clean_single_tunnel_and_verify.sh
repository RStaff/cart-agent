#!/usr/bin/env bash
set -euo pipefail

APP_STORE="${1:-cart-agent-dev.myshopify.com}"
LOGDIR=".tunnel_logs"
mkdir -p "$LOGDIR"

echo "🧨 0) Hard cleanup: stop Shopify app dev + Shopify cloudflared + user cloudflared"
# Stop shopify app dev (node) sessions
pkill -f "node .*shopify app dev" || true
pkill -f "/bin/shopify app dev" || true

# Stop Shopify-managed cloudflared (the one inside @shopify/cli)
pkill -f "@shopify/cli.*/cloudflared tunnel" || true

# Stop any other cloudflared tunnels you started
pkill -f "^cloudflared tunnel --url http://localhost:" || true

sleep 0.5

echo
echo "🧹 1) Free ports 3000/3001"
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

echo
echo "🚀 2) Start local stack via scripts/dev.sh (Express:3000 + Next:3001)"
( ./scripts/dev.sh "$APP_STORE" ) > "$LOGDIR/dev_stack.log" 2>&1 &
DEV_PID=$!
echo "🟢 dev.sh PID: $DEV_PID  (log: $LOGDIR/dev_stack.log)"

echo
echo "⏳ 3) Wait for Express :3000"
for i in {1..80}; do
  lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1 && break
  sleep 0.25
done
if ! lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "❌ Express did not bind :3000"
  tail -n 160 "$LOGDIR/dev_stack.log" || true
  exit 1
fi
echo "✅ Express is listening on :3000"

echo
echo "🌩️ 4) Start ONE quick tunnel -> http://localhost:3000"
( cloudflared tunnel --url http://localhost:3000 --no-autoupdate ) > "$LOGDIR/cloudflared.log" 2>&1 &
CF_PID=$!
echo "🟢 cloudflared PID: $CF_PID (log: $LOGDIR/cloudflared.log)"

echo
echo "⏳ 5) Wait for trycloudflare URL"
TUNNEL=""
for i in {1..200}; do
  TUNNEL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOGDIR/cloudflared.log" | tail -n 1 || true)"
  [[ -n "$TUNNEL" ]] && break
  sleep 0.25
done
if [[ -z "$TUNNEL" ]]; then
  echo "❌ Could not detect tunnel URL"
  tail -n 200 "$LOGDIR/cloudflared.log" || true
  exit 1
fi

HOST="$(python3 - << 'PY'
import os, urllib.parse
print(urllib.parse.urlparse(os.environ["TUNNEL"]).hostname)
PY
)" TUNNEL="$TUNNEL" python3 - << 'PY'
import os, urllib.parse
t=os.environ["TUNNEL"]
h=urllib.parse.urlparse(t).hostname
print("✅ TUNNEL =", t)
print("✅ HOST   =", h)
PY

HOST="$(python3 - << 'PY'
import urllib.parse, os
print(urllib.parse.urlparse(os.environ["TUNNEL"]).hostname)
PY
)" TUNNEL="$TUNNEL"

echo
echo "🧪 6) Local direct should be 401 missing hmac"
curl -i "http://localhost:3000/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,18p' || true

echo
echo "🧪 7) DNS-free tunnel test (bypass resolver):"
IPS="$(dig @1.1.1.1 +short "$HOST" | head -n 2 | tr '\n' ' ')"
echo "Edge IPs: $IPS"

for ip in $IPS; do
  echo
  echo "== Using --resolve $HOST:443:$ip =="
  curl -sS -I --resolve "$HOST:443:$ip" "https://$HOST/" | sed -n '1,12p' || true
  echo
  curl -sS -i --resolve "$HOST:443:$ip" "https://$HOST/api/webhooks" \
    -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,25p' || true
done

echo
echo "🔎 8) Did Express see the tunnel hit?"
tail -n 400 .dev_express.log | grep -n "\[webhooks\]" | tail -n 30 || echo "(no [webhooks] lines)"

echo
echo "📌 Export for your shell:"
echo "export TUNNEL=\"$TUNNEL\""
echo
echo "🛑 Stop everything:"
echo "kill -9 $DEV_PID $CF_PID 2>/dev/null || true"

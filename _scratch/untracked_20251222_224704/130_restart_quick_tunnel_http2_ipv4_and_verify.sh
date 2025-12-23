#!/usr/bin/env bash
set -euo pipefail

LOGDIR=".tunnel_logs"
mkdir -p "$LOGDIR"

echo "🛑 Killing existing quick cloudflared (non-Shopify) if running..."
# kill cloudflared that points to localhost:3000 (ours)
ps aux | awk '/cloudflared/ && /localhost:3000/ {print $2}' | xargs -r kill -9 || true

echo
echo "✅ Confirm Express is up locally (must be 401 missing hmac):"
curl -sS -i http://localhost:3000/api/webhooks -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,15p'
echo

echo "🌩️ Starting NEW quick tunnel -> http://localhost:3000 (FORCE http2 + ipv4)"
TS="$(date +%s)"
CFLOG="$LOGDIR/cloudflared_http2_$TS.log"

( cloudflared tunnel \
    --url http://localhost:3000 \
    --no-autoupdate \
    --protocol http2 \
    --edge-ip-version 4 \
) > "$CFLOG" 2>&1 &

CF_PID=$!
echo "🟢 cloudflared PID: $CF_PID"
echo "   log: $CFLOG"
echo

echo "⏳ Waiting for trycloudflare URL..."
TUNNEL=""
for i in {1..160}; do
  TUNNEL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$CFLOG" | tail -n 1 || true)"
  [[ -n "$TUNNEL" ]] && break
  sleep 0.25
done

if [[ -z "$TUNNEL" ]]; then
  echo "❌ Did not get a tunnel URL. Tail log:"
  tail -n 120 "$CFLOG" || true
  exit 1
fi

export TUNNEL
HOST="$(python3 - <<'PY'
import os, urllib.parse
print(urllib.parse.urlparse(os.environ["TUNNEL"]).hostname or "")
PY
)"

echo "✅ TUNNEL=$TUNNEL"
echo "✅ HOST=$HOST"
echo

echo "🔎 DNS via 1.1.1.1:"
dig @1.1.1.1 +short "$HOST" | head -n 6 || true
echo

echo "🧪 Tunnel HEAD / (force IPv4) — should NOT be 530:"
curl -4 -sS -I "$TUNNEL/" | sed -n '1,12p' || true
echo

echo "🧪 Tunnel POST /api/webhooks (force IPv4) — should match local 401 missing hmac:"
curl -4 -sS -i "$TUNNEL/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,20p' || true
echo

echo "== Express webhook logs (last 20) =="
tail -n 500 .dev_express.log | grep -n "\[webhooks\]" | tail -n 20 || true
echo

echo "📌 Export for your current shell:"
echo "export TUNNEL=\"$TUNNEL\""
echo
echo "🛑 Stop this tunnel:"
echo "kill -9 $CF_PID 2>/dev/null || true"

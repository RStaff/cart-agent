#!/usr/bin/env bash
set -euo pipefail

SHOPIFY_LOG=".shopify_dev.log"
EXPRESS_LOG=".dev_express.log"
LOGDIR=".tunnel_logs"
mkdir -p "$LOGDIR"

test -f "$SHOPIFY_LOG" || { echo "❌ $SHOPIFY_LOG not found. Start: shopify app dev  (and make sure it logs to .shopify_dev.log)"; exit 1; }

clean_log() {
  SHOPIFY_LOG_PATH="$SHOPIFY_LOG" python3 - << 'PY'
import os, re
p=os.environ["SHOPIFY_LOG_PATH"]
s=open(p,'rb').read().decode('utf-8','ignore').replace('\r','')
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', s)
print(s)
PY
}

# Parse backend port from Shopify dev log (the REAL Express listener)
START_LINE="$(clean_log | grep -E '\[start\] listening on http://0\.0\.0\.0:[0-9]+' | tail -n 1 || true)"
BACKEND_PORT="$(printf "%s" "$START_LINE" | grep -Eo '[0-9]+' | tail -n 1 || true)"

if [[ -z "${BACKEND_PORT}" ]]; then
  echo "❌ Could not parse BACKEND_PORT from $SHOPIFY_LOG"
  echo "Tail cleaned log:"
  clean_log | tail -n 120
  exit 1
fi

echo "✅ Backend detected: http://127.0.0.1:${BACKEND_PORT}"
echo

echo "<0001f9ea> Local sanity (expect 401 missing hmac):"
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,20p'
echo

echo "🧹 Stop any previous direct cloudflared tunnels we started (best-effort)..."
pkill -f "cloudflared tunnel --url http://localhost:${BACKEND_PORT}" >/dev/null 2>&1 || true
pkill -f "cloudflared tunnel --url http://127.0.0.1:${BACKEND_PORT}" >/dev/null 2>&1 || true
sleep 0.3

STAMP="$(date +%s)"
CFLOG="$LOGDIR/cloudflared_backend_${BACKEND_PORT}_${STAMP}.log"

echo "🌩️ Starting DIRECT quick tunnel -> http://127.0.0.1:${BACKEND_PORT}"
( cloudflared tunnel --url "http://127.0.0.1:${BACKEND_PORT}" --no-autoupdate ) > "$CFLOG" 2>&1 &
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
  echo "❌ No tunnel URL found. Tail cloudflared log:"
  tail -n 160 "$CFLOG" || true
  kill -9 "$CF_PID" 2>/dev/null || true
  exit 1
fi

HOST="$(python3 - << PY
import urllib.parse
print(urllib.parse.urlparse("$TUNNEL").hostname)
PY
)"

echo "✅ TUNNEL=$TUNNEL"
echo "✅ HOST=$HOST"
echo

echo "🔎 DNS via 1.1.1.1 (should show 2 IPs):"
dig @1.1.1.1 +short "$HOST" || true
echo

echo "🧪 Tunnel -> /api/webhooks (expect 401 missing hmac; if you see 530/500 Invalid path, tunnel is not reaching backend):"
curl -sS -i "$TUNNEL/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,25p' || true
echo

echo "🧷 Setting log marker in $EXPRESS_LOG..."
MARK=0
if [[ -f "$EXPRESS_LOG" ]]; then
  MARK="$(wc -l < "$EXPRESS_LOG" | tr -d ' ')"
fi
echo "🧷 Marker line: $MARK"
echo

echo "🚀 Trigger Shopify webhook -> DIRECT tunnel (this should include x-shopify-* headers):"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "$TUNNEL/api/webhooks" \
  --api-version 2025-07
echo "✅ Enqueued. Waiting 15s..."
sleep 15
echo

echo "🔎 New [webhooks] blocks AFTER trigger (from Express log):"
if [[ -f "$EXPRESS_LOG" ]]; then
  nl -ba "$EXPRESS_LOG" | sed -n "$((MARK+1)),\$p" | grep -n "\[webhooks\]" || echo "(none found)"
  echo
  echo "✅ Show the last webhook block (40-line window):"
  START_LINE="$(grep -n "\[webhooks\] received POST /api/webhooks" "$EXPRESS_LOG" | tail -n 1 | cut -d: -f1 || true)"
  if [[ -n "$START_LINE" ]]; then
    END_LINE=$((START_LINE + 40))
    nl -ba "$EXPRESS_LOG" | sed -n "${START_LINE},${END_LINE}p"
  else
    echo "(no webhook start line found)"
  fi
else
  echo "❌ $EXPRESS_LOG not found"
fi

echo
echo "📌 Export for your shell:"
echo "export TUNNEL=\"$TUNNEL\""
echo
echo "🛑 Stop this tunnel:"
echo "kill -9 $CF_PID 2>/dev/null || true"
echo "✅ Done."

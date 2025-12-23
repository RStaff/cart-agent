#!/usr/bin/env bash
set -euo pipefail

SHOPIFY_LOG=".shopify_dev.log"
EXPRESS_LOG=".dev_express.log"
LOGDIR=".tunnel_logs"
mkdir -p "$LOGDIR"

test -f "$SHOPIFY_LOG" || { echo "❌ $SHOPIFY_LOG not found"; exit 1; }

clean_log() {
  SHOPIFY_LOG_PATH="$SHOPIFY_LOG" python3 - << 'PY'
import os, re
p=os.environ["SHOPIFY_LOG_PATH"]
s=open(p,'rb').read().decode('utf-8','ignore').replace('\r','')
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', s)
print(s)
PY
}

START_LINE="$(clean_log | grep -E '\[start\] listening on http://0\.0\.0\.0:[0-9]+' | tail -n 1 || true)"
BACKEND_PORT="$(printf "%s" "$START_LINE" | grep -Eo '[0-9]+' | tail -n 1 || true)"

if [[ -z "${BACKEND_PORT}" ]]; then
  echo "❌ Could not parse BACKEND_PORT from $SHOPIFY_LOG"
  clean_log | tail -n 140
  exit 1
fi

echo "✅ Backend detected: http://127.0.0.1:${BACKEND_PORT}"
echo

echo "<0001f9ea> Local sanity (expect 401 missing hmac):"
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,20p'
echo

echo "🧹 Stop older direct cloudflared tunnels to this port (best-effort)..."
pkill -f "cloudflared tunnel --url http://127.0.0.1:${BACKEND_PORT}" >/dev/null 2>&1 || true
pkill -f "cloudflared tunnel --url http://localhost:${BACKEND_PORT}" >/dev/null 2>&1 || true
sleep 0.25

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
for i in {1..200}; do
  TUNNEL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$CFLOG" | tail -n 1 || true)"
  [[ -n "$TUNNEL" ]] && break
  sleep 0.25
done

if [[ -z "$TUNNEL" ]]; then
  echo "❌ No tunnel URL found. Tail cloudflared log:"
  tail -n 200 "$CFLOG" || true
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

echo "⏳ Waiting for DNS to resolve (dig @1.1.1.1)..."
IPS=""
for i in {1..120}; do
  IPS="$(dig @1.1.1.1 +short "$HOST" | tr '\n' ' ' | xargs || true)"
  if [[ -n "$IPS" ]]; then
    echo "✅ DNS OK: $IPS"
    break
  fi
  sleep 0.5
done

if [[ -z "$IPS" ]]; then
  echo "❌ DNS still not resolving for $HOST"
  echo "Tail cloudflared log:"
  tail -n 220 "$CFLOG" || true
  echo
  echo "🛑 Stop tunnel:"
  echo "kill -9 $CF_PID 2>/dev/null || true"
  exit 1
fi

echo
echo "⏳ Waiting for tunnel to be reachable (avoid CF 530)."
echo "    We test via --resolve against each edge IP until we get a non-530 response."
OK=0
for try in {1..90}; do
  for ip in $IPS; do
    code="$(curl -sS -o /dev/null -w "%{http_code}" --resolve "$HOST:443:$ip" "https://$HOST/" || true)"
    if [[ "$code" != "530" && "$code" != "000" ]]; then
      echo "✅ Tunnel reachable via $ip (HTTP $code)"
      OK=1
      break
    fi
  done
  [[ "$OK" == "1" ]] && break
  sleep 0.5
done

if [[ "$OK" != "1" ]]; then
  echo "❌ Tunnel never became reachable (kept getting 530/000)."
  echo "Tail cloudflared log:"
  tail -n 220 "$CFLOG" || true
  echo
  echo "🛑 Stop tunnel:"
  echo "kill -9 $CF_PID 2>/dev/null || true"
  exit 1
fi

echo
echo "🧪 Tunnel -> /api/webhooks (expect 401 missing hmac):"
# Use first IP to bypass flaky local resolver
FIRST_IP="$(printf "%s\n" $IPS | head -n 1)"
curl -sS -i --resolve "$HOST:443:$FIRST_IP" "https://$HOST/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,25p'
echo

MARK=0
if [[ -f "$EXPRESS_LOG" ]]; then
  MARK="$(wc -l < "$EXPRESS_LOG" | tr -d ' ')"
fi
echo "🧷 Marker line in $EXPRESS_LOG: $MARK"
echo

echo "🚀 Trigger Shopify webhook -> DIRECT tunnel:"
export TUNNEL="$TUNNEL"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "$TUNNEL/api/webhooks" \
  --api-version 2025-07
echo "✅ Enqueued. Waiting 18s..."
sleep 18
echo

echo "🔎 New [webhooks] blocks AFTER trigger (from Express log):"
if [[ -f "$EXPRESS_LOG" ]]; then
  nl -ba "$EXPRESS_LOG" | sed -n "$((MARK+1)),\$p" | grep -n "\[webhooks\]" || echo "(none found)"
else
  echo "❌ $EXPRESS_LOG not found"
fi
echo

echo "🧯 If nodemon crashed, show the crash cause (tail logs):"
if [[ -f "$EXPRESS_LOG" ]] && grep -q "\[nodemon\] app crashed" "$EXPRESS_LOG"; then
  echo "---- .dev_express.log tail (last 220) ----"
  tail -n 220 "$EXPRESS_LOG" || true
  echo
fi

echo "---- .shopify_dev.log tail (cleaned, last 220) ----"
clean_log | tail -n 220 || true
echo

echo "📌 Export for your shell:"
echo "export TUNNEL=\"$TUNNEL\""
echo
echo "🛑 Stop this tunnel:"
echo "kill -9 $CF_PID 2>/dev/null || true"
echo "✅ Done."

#!/usr/bin/env bash
set -euo pipefail

SHOPIFY_LOG=".shopify_dev.log"
test -f "$SHOPIFY_LOG" || { echo "❌ $SHOPIFY_LOG not found."; exit 1; }

clean_log() {
  SHOPIFY_LOG_PATH="$SHOPIFY_LOG" python3 - << 'PY'
import os, re
p=os.environ["SHOPIFY_LOG_PATH"]
s=open(p,'rb').read().decode('utf-8','ignore').replace('\r','')
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', s)  # ANSI
print(s)
PY
}

# Extract values robustly
TUNNEL="$(clean_log | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)"
START_LINE="$(clean_log | grep -E '\[start\] listening on http://0\.0\.0\.0:[0-9]+' | tail -n 1 || true)"
BACKEND_PORT="$(printf "%s" "$START_LINE" | grep -Eo '[0-9]+' | tail -n 1 || true)"
PROXY_LINE="$(clean_log | grep -E 'Proxy server started on port [0-9]+' | tail -n 1 || true)"
PROXY_PORT="$(printf "%s" "$PROXY_LINE" | grep -Eo '[0-9]+' | tail -n 1 || true)"

echo "✅ Parsed from $SHOPIFY_LOG"
echo "   TUNNEL      = ${TUNNEL:-<missing>}"
echo "   START_LINE  = ${START_LINE:-<missing>}"
echo "   BACKEND_PORT= ${BACKEND_PORT:-<missing>}"
echo "   PROXY_LINE  = ${PROXY_LINE:-<missing>}"
echo "   PROXY_PORT  = ${PROXY_PORT:-<missing>}"
echo

if [[ -z "${BACKEND_PORT}" ]]; then
  echo "❌ Could not parse BACKEND_PORT. Showing last 120 cleaned log lines:"
  clean_log | tail -n 120
  exit 1
fi

echo "🧪 A1) Direct to BACKEND /api/webhooks (expect 401 missing hmac if Express route exists):"
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,35p' || true
echo

echo "🧪 A2) Direct to BACKEND /api/billing/status (should NOT be 'Invalid path ...'):"
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/billing/status?shop=cart-agent-dev.myshopify.com" \
  | sed -n '1,25p' || true
echo

if [[ -n "${PROXY_PORT}" ]]; then
  echo "🧪 B) Direct to SHOPIFY PROXY port (should forward to backend if proxy is healthy):"
  curl -sS -i "http://127.0.0.1:${PROXY_PORT}/api/webhooks" \
    -X POST -H "Content-Type: application/json" -d '{}' \
    | sed -n '1,35p' || true
  echo
else
  echo "⚠️ PROXY_PORT not parsed; skipping proxy test."
  echo
fi

if [[ -n "${TUNNEL}" ]]; then
  echo "🧪 C) Through TUNNEL (should match backend, not 'Invalid path'):"
  curl -sS -i "${TUNNEL}/api/webhooks" \
    -X POST -H "Content-Type: application/json" -d '{}' \
    | sed -n '1,35p' || true
  echo
else
  echo "⚠️ TUNNEL not parsed; skipping tunnel test."
  echo
fi

echo "✅ Done."

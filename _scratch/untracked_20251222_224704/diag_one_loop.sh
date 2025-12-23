#!/usr/bin/env bash
set -euo pipefail

: "${TUNNEL:?❌ TUNNEL env var not set. Example: export TUNNEL=\"https://xxxx.trycloudflare.com\"}"

EXPRESS_LOG=".dev_express.log"
test -f "$EXPRESS_LOG" || { echo "❌ $EXPRESS_LOG not found. Start shopify app dev first."; exit 1; }

# Find the active backend port by locating the node process listening on localhost
BACKEND_PORT="$(lsof -nP -iTCP -sTCP:LISTEN | awk '/node/ && /TCP \*:/ {print $0}' | grep -Eo 'TCP \*:[0-9]+' | head -n 1 | cut -d: -f2 || true)"

# If that fails, fallback: parse from express log if present
if [[ -z "${BACKEND_PORT}" ]]; then
  BACKEND_PORT="$(grep -Eo 'listening on http://0\.0\.0\.0:[0-9]+' "$EXPRESS_LOG" | tail -n 1 | awk -F: '{print $3}' || true)"
fi

if [[ -z "${BACKEND_PORT}" ]]; then
  echo "❌ Could not determine BACKEND_PORT."
  echo "   Try: lsof -nP -iTCP -sTCP:LISTEN | grep node"
  exit 1
fi

MARK="$(wc -l < "$EXPRESS_LOG" | tr -d ' ')"

echo "✅ TUNNEL  = $TUNNEL"
echo "✅ BACKEND = http://127.0.0.1:$BACKEND_PORT"
echo "🧷 MARK    = $MARK"
echo

echo "🧪 Backend sanity (expect 401 missing hmac):"
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,12p'
echo

echo "🧪 Tunnel routing sanity (should NOT say 'Invalid path ...'):"
curl -sS -i "${TUNNEL}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,15p' || true
echo

echo "🚀 Trigger Shopify webhook → tunnel"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "${TUNNEL}/api/webhooks" \
  --api-version 2025-07
echo "✅ Enqueued. Waiting 20s..."
sleep 20
echo

echo "🔎 New webhook lines AFTER trigger (from Express log):"
nl -ba "$EXPRESS_LOG" | sed -n "$((MARK+1)),\$p" | grep -n "\[webhooks\]" -B 2 -A 25 || echo "(none found)"
echo

echo "🔎 Last webhook block (look for has_x_shopify_* true):"
START_LINE="$(grep -n "\[webhooks\] received POST /api/webhooks" "$EXPRESS_LOG" | tail -n 1 | cut -d: -f1 || true)"
if [[ -n "$START_LINE" ]]; then
  END_LINE=$((START_LINE + 60))
  nl -ba "$EXPRESS_LOG" | sed -n "${START_LINE},${END_LINE}p"
else
  echo "(no webhook start line found)"
fi

echo
echo "✅ Done."

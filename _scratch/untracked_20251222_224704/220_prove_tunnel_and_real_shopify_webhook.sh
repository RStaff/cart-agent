#!/usr/bin/env bash
set -euo pipefail

LOG=".shopify_dev.log"
test -f "$LOG" || { echo "❌ $LOG not found. Are you running script -q -f .shopify_dev.log in Terminal A?"; exit 1; }

strip_ansi() { python3 - <<'PY'
import re,sys
s=sys.stdin.read().replace("\r","")
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]','',s)
print(s)
PY
}

TUNNEL="$(tr -d '\r' < "$LOG" | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)"
BACKEND_PORT="$(
  tr -d '\r' < "$LOG" \
  | grep -Eo 'listening on http://0\.0\.0\.0:[0-9]+' \
  | tail -n 1 \
  | sed -E 's/.*:([0-9]+)/\1/' \
  || true
)"

if [[ -z "${TUNNEL}" || -z "${BACKEND_PORT}" ]]; then
  echo "❌ Could not parse TUNNEL and/or BACKEND_PORT from $LOG yet."
  echo "TUNNEL='$TUNNEL'"
  echo "BACKEND_PORT='$BACKEND_PORT'"
  echo "Tip: wait until Terminal A shows both 'Using URL:' and 'listening on ...' then rerun."
  exit 1
fi

echo "✅ Parsed:"
echo "   TUNNEL=$TUNNEL"
echo "   BACKEND_PORT=$BACKEND_PORT"
echo

echo "🧪 Backend sanity (expect 401 missing hmac):"
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,20p'
echo

echo "🧪 Tunnel sanity (should match backend; expect 401 missing hmac):"
curl -sS -i "${TUNNEL}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,20p'
echo

MARK="$(wc -l < "$LOG" | tr -d ' ')"
echo "🧷 Log marker line: $MARK"
echo

echo "🚀 Trigger REAL Shopify webhook → tunnel"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "${TUNNEL}/api/webhooks" \
  --api-version 2025-07
echo "✅ Enqueued. Waiting 25s..."
sleep 25
echo

NEW_RAW="$(tail -n +$((MARK+1)) "$LOG" || true)"
NEW="$(printf "%s" "$NEW_RAW" | strip_ansi)"

echo "🔎 New webhook evidence (REAL Shopify headers):"
if echo "$NEW" | grep -q "has_x_shopify_topic: true"; then
  echo "✅ REAL SHOPIFY WEBHOOK ARRIVED (has_x_shopify_topic: true)"
  echo
  echo "$NEW" | grep -n "has_x_shopify_topic: true" -B 6 -A 20 | tail -n 120
else
  echo "❌ Did NOT see has_x_shopify_topic: true in new log lines."
  echo "Showing last 140 new lines for debugging:"
  echo
  echo "$NEW" | tail -n 140
fi

echo
echo "📌 Export for your shell:"
echo "export TUNNEL=\"$TUNNEL\""
echo "export BACKEND_PORT=\"$BACKEND_PORT\""
echo "✅ Done."

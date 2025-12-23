#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
test -f "$LOG" || { echo "Log not found: $LOG"; exit 1; }

strip_ansi() {
  python3 - << 'PY'
import re,sys
s=sys.stdin.read().replace("\r","")
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', s)
print(s)
PY
}

TUNNEL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | tail -n 1 || true)"
BACKEND_PORT="$(
  grep -Eo 'listening on http://0\.0\.0\.0:[0-9]+' "$LOG" | tail -n 1 | sed -E 's/.*:([0-9]+)/\1/' || true
)"

if [[ -z "$TUNNEL" || -z "$BACKEND_PORT" ]]; then
  echo "Could not parse TUNNEL/BACKEND_PORT from $LOG yet."
  echo "TUNNEL='$TUNNEL' BACKEND_PORT='$BACKEND_PORT'"
  exit 1
fi

export TUNNEL BACKEND_PORT
echo "TUNNEL=$TUNNEL"
echo "BACKEND_PORT=$BACKEND_PORT"
echo

# marker before trigger
MARK="$(wc -l < "$LOG" | tr -d ' ')"

echo "Triggering webhook (HTTP) ..."
shopify app webhook trigger \
  --topic checkouts/update \
  --delivery-method http \
  --address "${TUNNEL}/api/webhooks" \
  --api-version 2025-07

echo "Polling log for up to 120s for has_x_shopify_topic: true ..."
for i in {1..24}; do
  sleep 5
  NEW_RAW="$(tail -n +$((MARK+1)) "$LOG" || true)"
  NEW="$(printf "%s" "$NEW_RAW" | strip_ansi)"

  if echo "$NEW" | grep -q "has_x_shopify_topic: true"; then
    echo
    echo "REAL SHOPIFY WEBHOOK ARRIVED ✅"
    echo
    echo "$NEW" | grep -n "has_x_shopify_topic: true" -B 6 -A 30 | tail -n 200
    exit 0
  fi

  echo "…still waiting ($((i*5))s)"
done

echo
echo "No real webhook detected within 120s."
echo "Last 220 new lines since marker:"
echo
NEW_RAW="$(tail -n +$((MARK+1)) "$LOG" || true)"
NEW="$(printf "%s" "$NEW_RAW" | strip_ansi)"
echo "$NEW" | tail -n 220
exit 1

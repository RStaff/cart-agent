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

echo "Backend direct sanity (should be 401 missing hmac):"
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,12p' || true
echo

echo "Tunnel sanity (should match backend; must NOT be Invalid path):"
curl -sS -i "${TUNNEL}/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,12p' || true
echo

MARK="$(wc -l < "$LOG" | tr -d ' ')"
echo "MARK=$MARK"
echo

for n in 1 2 3; do
  echo "Trigger attempt #$n ..."
  shopify app webhook trigger \
    --topic checkouts/update \
    --delivery-method http \
    --address "${TUNNEL}/api/webhooks" \
    --api-version 2025-07
  sleep 3
done

echo
echo "Watching for up to 180s for has_x_shopify_topic: true ..."
for i in {1..36}; do
  sleep 5
  NEW_RAW="$(tail -n +$((MARK+1)) "$LOG" || true)"
  NEW="$(printf "%s" "$NEW_RAW" | strip_ansi)"

  if echo "$NEW" | grep -q "has_x_shopify_topic: true"; then
    echo
    echo "REAL SHOPIFY WEBHOOK ARRIVED ✅"
    echo
    echo "$NEW" | grep -n "has_x_shopify_topic: true" -B 8 -A 40 | tail -n 220
    exit 0
  fi

  # If nodemon crashed, you'll often see it here
  if echo "$NEW" | grep -qi "\[nodemon\].*crashed"; then
    echo
    echo "Detected nodemon crash ❌ (this would prevent logging webhook receipt)."
    echo
    echo "$NEW" | tail -n 120
    exit 2
  fi

  echo "…still waiting ($((i*5))s)"
done

echo
echo "No real webhook detected in 180s."
echo "Last 240 new lines since marker:"
echo
NEW_RAW="$(tail -n +$((MARK+1)) "$LOG" || true)"
NEW="$(printf "%s" "$NEW_RAW" | strip_ansi)"
echo "$NEW" | tail -n 240
exit 1

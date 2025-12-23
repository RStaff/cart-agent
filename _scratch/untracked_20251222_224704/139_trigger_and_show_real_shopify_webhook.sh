#!/usr/bin/env bash
set -euo pipefail

SHOPIFY_LOG=".shopify_dev.log"
test -f "$SHOPIFY_LOG" || { echo "❌ $SHOPIFY_LOG not found (run shopify app dev first)"; exit 1; }

strip_ansi() {
  python3 - << 'PY'
import re,sys
s=sys.stdin.read().replace("\r","")
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', s)
print(s)
PY
}

# Marker from the REAL FILE (raw line count)
MARK="$(wc -l < "$SHOPIFY_LOG" | tr -d ' ')"

# Get latest tunnel from log (cleaned)
TUNNEL="$(
  cat "$SHOPIFY_LOG" \
  | strip_ansi \
  | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' \
  | tail -n 1 || true
)"

if [[ -z "$TUNNEL" ]]; then
  echo "❌ Could not find trycloudflare URL in $SHOPIFY_LOG. Tail:"
  cat "$SHOPIFY_LOG" | strip_ansi | tail -n 200
  exit 1
fi

echo "✅ Using Shopify app_home tunnel:"
echo "export TUNNEL=\"$TUNNEL\""
echo "🧷 Log marker line: $MARK"
echo

echo "🚀 Trigger Shopify webhook → tunnel"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "$TUNNEL/api/webhooks" \
  --api-version 2025-07

echo "✅ Enqueued. Waiting 25s for delivery..."
sleep 25
echo

NEW_RAW="$(tail -n +"$((MARK+1))" "$SHOPIFY_LOG" || true)"
NEW="$(printf "%s" "$NEW_RAW" | strip_ansi)"

echo "🔎 New webhook blocks AFTER trigger (from Shopify CLI log):"
echo "$NEW" | grep -n "\[webhooks\]" -B 2 -A 20 || echo "(none found)"
echo

echo "🔎 New REAL Shopify webhooks (has_x_shopify_topic: true) AFTER trigger:"
echo "$NEW" | grep -n "has_x_shopify_topic: true" -B 3 -A 10 || echo "(none found)"
echo

echo "✅ Done."

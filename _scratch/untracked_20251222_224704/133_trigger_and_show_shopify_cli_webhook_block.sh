#!/usr/bin/env bash
set -euo pipefail

LOG=".shopify_dev.log"
test -f "$LOG" || { echo "❌ $LOG not found. Start dev with: script -q .shopify_dev.log shopify app dev --reset"; exit 1; }

echo "⏳ Waiting for app_home trycloudflare URL in $LOG..."
TUNNEL=""
for i in {1..240}; do
  TUNNEL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | tail -n 1 || true)"
  if [[ -n "$TUNNEL" ]]; then break; fi
  sleep 0.25
done

if [[ -z "$TUNNEL" ]]; then
  echo "❌ Could not find trycloudflare URL yet. Tail:"
  tail -n 80 "$LOG" || true
  exit 1
fi

export TUNNEL
echo "✅ TUNNEL=$TUNNEL"
echo

MARKER="$(wc -l < "$LOG" | tr -d ' ')"
echo "🧷 Log marker at line: $MARKER"
echo

echo "🚀 Trigger Shopify webhook → tunnel"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "$TUNNEL/api/webhooks" \
  --api-version 2025-07

echo "✅ Enqueued. Waiting 12s for delivery..."
sleep 12
echo

echo "🔎 New webhook blocks AFTER trigger (from Shopify CLI log):"
tail -n +"$((MARKER+1))" "$LOG" \
  | awk '
      /received POST \/api\/webhooks/ {show=22}
      show>0 {print; show--}
    ' \
  | nl -ba || true

echo
echo "📌 Export for this shell:"
echo "export TUNNEL=\"$TUNNEL\""
echo
echo "✅ Done."

#!/usr/bin/env bash
set -euo pipefail

LOG=".shopify_dev.log"
rm -f "$LOG"

echo "🧹 Killing common ports (best effort)..."
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

echo
echo "🚀 Starting shopify app dev --reset (logging to $LOG) ..."
# Run in background, log everything
( shopify app dev --reset ) >"$LOG" 2>&1 &
SHOPIFY_PID=$!
echo "🟢 shopify app dev PID: $SHOPIFY_PID"
echo "   tail -f $LOG"

echo
echo "⏳ Waiting for app_home trycloudflare URL..."
TUNNEL=""
for i in {1..180}; do
  TUNNEL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | tail -n 1 || true)"
  if [[ -n "$TUNNEL" ]]; then
    break
  fi
  sleep 0.25
done

if [[ -z "$TUNNEL" ]]; then
  echo "❌ Could not find tunnel URL in $LOG. Tail:"
  tail -n 160 "$LOG" || true
  echo
  echo "🛑 Stop:"
  echo "kill -9 $SHOPIFY_PID 2>/dev/null || true"
  exit 1
fi

export TUNNEL
echo "✅ TUNNEL=$TUNNEL"
echo

MARKER="$(wc -l < "$LOG" | tr -d ' ')"
echo "🧷 Shopify log marker at line: $MARKER"
echo

echo "🚀 Trigger Shopify webhook → tunnel"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "$TUNNEL/api/webhooks" \
  --api-version 2025-07
echo "✅ Enqueued. Waiting for delivery..."
sleep 10
echo

echo "🔎 New webhook blocks AFTER trigger (from Shopify CLI log):"
tail -n +"$((MARKER+1))" "$LOG" \
  | awk '
      /received POST \/api\/webhooks/ {show=18}
      show>0 {print; show--}
    ' \
  | nl -ba || true

echo
echo "📌 Export (for other shells):"
echo "export TUNNEL=\"$TUNNEL\""
echo
echo "🛑 Stop shopify dev:"
echo "kill -9 $SHOPIFY_PID 2>/dev/null || true"
echo
echo "✅ Done."

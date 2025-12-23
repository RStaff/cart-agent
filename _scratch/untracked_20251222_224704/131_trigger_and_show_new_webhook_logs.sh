#!/usr/bin/env bash
set -euo pipefail

LOG=".dev_express.log"
test -f "$LOG" || { echo "❌ $LOG not found"; exit 1; }

: "${TUNNEL:?❌ TUNNEL is not set. Export it from shopify app dev output first.}"

echo "✅ Using tunnel:"
echo "   $TUNNEL"
echo

echo "<0001f9ea> Local Express sanity (expect 401 missing hmac):"
curl -i http://localhost:3000/api/webhooks \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{}' | sed -n '1,20p' || true
echo

MARKER="$(wc -l < "$LOG" | tr -d ' ')"
echo "🧷 Log marker set at line: $MARKER"
echo

echo "🚀 Trigger Shopify webhook → tunnel"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "$TUNNEL/api/webhooks" \
  --api-version 2025-07
echo "✅ Enqueued. Waiting for delivery..."
sleep 8
echo

echo "🔎 New webhook logs AFTER the trigger (these should show has_x_shopify_* = true):"
# Print only lines after the marker, then show any webhook blocks (start line + next 10 lines)
tail -n +"$((MARKER+1))" "$LOG" \
  | awk '
      /\[webhooks\] received POST \/api\/webhooks/ {show=12}
      show>0 {print; show--}
    ' \
  | nl -ba || true

echo
echo "✅ Done."

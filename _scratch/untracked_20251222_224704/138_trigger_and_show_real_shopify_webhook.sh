#!/usr/bin/env bash
set -euo pipefail

SHOPIFY_LOG=".shopify_dev.log"
test -f "$SHOPIFY_LOG" || { echo "❌ $SHOPIFY_LOG not found"; exit 1; }

clean_log() {
  python3 - << 'PY'
import re
s=open(".shopify_dev.log","rb").read().decode("utf-8","ignore").replace("\r","")
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', s)
print(s)
PY
}

TUNNEL="$(clean_log | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)"
if [[ -z "$TUNNEL" ]]; then
  echo "❌ Could not find trycloudflare URL in $SHOPIFY_LOG"
  clean_log | tail -n 220
  exit 1
fi

echo "✅ Using Shopify app_home tunnel:"
echo "export TUNNEL=\"$TUNNEL\""
echo

MARK="$(clean_log | wc -l | tr -d ' ')"
echo "🧷 Log marker line: $MARK"
echo

echo "🚀 Trigger Shopify webhook → tunnel"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "$TUNNEL/api/webhooks" \
  --api-version 2025-07
echo "✅ Enqueued. Waiting 18s..."
sleep 18
echo

echo "🔎 New REAL Shopify webhook blocks (has_x_shopify_topic: true) AFTER trigger:"
NEW="$(clean_log | nl -ba | awk -v m="$MARK" '$1>m{print}')"
echo "$NEW" | grep -n "has_x_shopify_topic: true" -B 3 -A 8 || echo "(none found)"
echo

echo "🔎 New LOCAL curl test hits (has_x_shopify_topic: false) AFTER trigger (if any):"
echo "$NEW" | grep -n "has_x_shopify_topic: false" -B 3 -A 6 | tail -n 80 || echo "(none found)"
echo

echo "✅ Done."

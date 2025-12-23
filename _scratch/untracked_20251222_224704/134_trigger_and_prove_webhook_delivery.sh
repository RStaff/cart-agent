#!/usr/bin/env bash
set -euo pipefail

SHOPIFY_LOG=".shopify_dev.log"
test -f "$SHOPIFY_LOG" || {
  echo "❌ $SHOPIFY_LOG not found."
  echo "Start dev with (interactive + logged):"
  echo "  script -q .shopify_dev.log shopify app dev --reset"
  exit 1
}

clean_log() {
  SHOPIFY_LOG_PATH="$SHOPIFY_LOG" python3 - << 'PY'
import os, re
p=os.environ["SHOPIFY_LOG_PATH"]
s=open(p,'rb').read().decode('utf-8','ignore')
s=s.replace('\r','')
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', s)  # ANSI escapes
print(s)
PY
}

echo "⏳ Waiting for app_home trycloudflare URL..."
TUNNEL=""
for i in {1..240}; do
  TUNNEL="$(clean_log | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)"
  if [[ -n "$TUNNEL" ]]; then break; fi
  sleep 0.25
done

if [[ -z "$TUNNEL" ]]; then
  echo "❌ Could not find trycloudflare URL yet. Tail (cleaned):"
  clean_log | tail -n 160 || true
  exit 1
fi

export TUNNEL
echo "✅ TUNNEL=$TUNNEL"
echo

echo "🧪 1) Local sanity (must be 401 missing hmac):"
curl -sS -i http://localhost:3000/api/webhooks \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,20p' || true
echo

echo "🧪 2) Tunnel routing sanity (POST /api/webhooks should hit your app, not CF 'Invalid path'):"
curl -sS -i "$TUNNEL/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,25p' || true
echo

MARK_LINE="$(clean_log | wc -l | tr -d ' ')"
echo "🧷 Log marker at line: $MARK_LINE"
echo

echo "🚀 3) Trigger Shopify webhook → tunnel"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "$TUNNEL/api/webhooks" \
  --api-version 2025-07
echo "✅ Enqueued. Waiting 15s for delivery..."
sleep 15

echo
echo "🔎 4) New webhook lines AFTER trigger (from Shopify dev log, cleaned):"
clean_log | nl -ba | sed -n "$((MARK_LINE+1)),\$p" | grep -n "\[webhooks\]" || echo "(none found)"

echo
echo "📌 Export for this shell:"
echo "export TUNNEL=\"$TUNNEL\""
echo "✅ Done."

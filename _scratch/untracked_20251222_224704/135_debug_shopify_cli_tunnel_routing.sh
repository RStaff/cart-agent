#!/usr/bin/env bash
set -euo pipefail

SHOPIFY_LOG=".shopify_dev.log"
test -f "$SHOPIFY_LOG" || { echo "❌ $SHOPIFY_LOG not found."; exit 1; }

clean_log() {
  SHOPIFY_LOG_PATH="$SHOPIFY_LOG" python3 - << 'PY'
import os, re
p=os.environ["SHOPIFY_LOG_PATH"]
s=open(p,'rb').read().decode('utf-8','ignore').replace('\r','')
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', s)  # ANSI
print(s)
PY
}

TUNNEL="$(clean_log | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)"
BACKEND_PORT="$(clean_log | grep -Eo '\[start\] listening on http://0\.0\.0\.0:[0-9]+' | tail -n 1 | grep -Eo '[0-9]+' || true)"
PROXY_PORT="$(clean_log | grep -Eo 'Proxy server started on port [0-9]+' | tail -n 1 | grep -Eo '[0-9]+' || true)"

echo "✅ Extracted from $SHOPIFY_LOG"
echo "   TUNNEL      = ${TUNNEL:-<missing>}"
echo "   BACKEND_PORT= ${BACKEND_PORT:-<missing>}"
echo "   PROXY_PORT  = ${PROXY_PORT:-<missing>}"
echo

if [[ -z "${TUNNEL}" || -z "${BACKEND_PORT}" || -z "${PROXY_PORT}" ]]; then
  echo "❌ Missing one or more values. Tail (cleaned) to inspect:"
  clean_log | tail -n 140 || true
  exit 1
fi

echo "🧪 A) Direct to BACKEND (this should be 401 missing hmac):"
curl -sS -i "http://localhost:${BACKEND_PORT}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,25p' || true
echo

echo "🧪 B) Direct to SHOPIFY PROXY (this should NOT say 'Invalid path /api/webhooks'):"
curl -sS -i "http://localhost:${PROXY_PORT}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,25p' || true
echo

echo "🧪 C) Through TUNNEL (this should match A or B, and NOT be 'Invalid path'):"
curl -sS -i "${TUNNEL}/api/webhooks" \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,25p' || true
echo

MARK_LINE="$(clean_log | wc -l | tr -d ' ')"
echo "🧷 Log marker at line: $MARK_LINE"
echo

echo "🚀 D) Trigger Shopify webhook → tunnel"
shopify app webhook trigger \
  --topic checkouts/update \
  --address "${TUNNEL}/api/webhooks" \
  --api-version 2025-07
echo "✅ Enqueued. Waiting 15s..."
sleep 15

echo
echo "🔎 E) New [webhooks] lines after trigger (from Shopify dev log, cleaned):"
clean_log | nl -ba | sed -n "$((MARK_LINE+1)),\$p" | grep -n "\[webhooks\]" || echo "(none found)"
echo

echo "📌 Export for this shell:"
echo "export TUNNEL=\"${TUNNEL}\""
echo "✅ Done."

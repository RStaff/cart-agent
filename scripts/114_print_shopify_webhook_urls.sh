#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

LOG="/tmp/abando_shopify_dev.log"
test -f "$LOG" || { echo "❌ Missing $LOG"; exit 1; }

BASE="$(rg -o 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG" | tail -n 1 || true)"
test -n "${BASE:-}" || { echo "❌ Could not find trycloudflare URL in $LOG"; exit 1; }

echo "== Cloudflare base URL =="
echo "$BASE"
echo
echo "== GDPR Webhook URL (paste into Shopify webhook destination) =="
echo "$BASE/api/webhooks/gdpr"
echo
echo "== Extra: If you need other mandatory GDPR topics, they usually map similarly =="
echo "$BASE/api/webhooks/customers/data_request"
echo "$BASE/api/webhooks/customers/redact"
echo "$BASE/api/webhooks/shop/redact"

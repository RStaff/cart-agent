#!/usr/bin/env bash
set -euo pipefail
SHOP="${1:-cart-agent-dev.myshopify.com}"

echo "🧪 Billing Stub E2E (NO BOOT) — assumes dev is already running"
echo "Shop: $SHOP"
echo

BASE="http://localhost:3001"
STATUS="$BASE/api/billing/status?shop=$SHOP"
PREVIEW="$BASE/api/rescue/preview?shop=$SHOP"

echo "1) Checking billing status…"
curl -fsS "$STATUS" | sed -n '1,240p'
echo
echo "✅ status ok"
echo

echo "2) Checking rescue preview…"
curl -fsS "$PREVIEW" | sed -n '1,240p'
echo
echo "✅ preview ok"
echo
echo "Done."

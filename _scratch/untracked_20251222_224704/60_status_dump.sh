#!/usr/bin/env bash
set -euo pipefail
SHOP="${1:-cart-agent-dev.myshopify.com}"
BASE="${2:-http://localhost:3001}"

echo "📋 Abando Status Dump"
echo "Shop: $SHOP"
echo "Base: $BASE"
echo

for path in "api/billing/status" "api/rescue/preview" "api/rescue/real"; do
  echo "== GET /$path =="
  curl -fsS "$BASE/$path?shop=$SHOP" | sed -n '1,260p'
  echo
done

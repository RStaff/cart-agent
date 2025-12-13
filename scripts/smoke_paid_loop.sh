#!/usr/bin/env bash
set -euo pipefail
SHOP="${1:-example.myshopify.com}"

echo "== Preview (should always work) =="
curl -s "http://localhost:3000/api/rescue/preview?shop=$SHOP" | jq .

echo ""
echo "== Billing status =="
curl -s "http://localhost:3000/api/billing/status?shop=$SHOP" | jq .

echo ""
echo "== Real metrics (should be ready:false until webhooks) =="
curl -s "http://localhost:3000/api/rescue/real?shop=$SHOP" | jq .

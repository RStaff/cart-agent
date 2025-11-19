#!/usr/bin/env bash
set -euo pipefail

STORE_ID="${1:-demo-store-ai}"
BASE_URL="https://pay.abando.ai"

echo "🔎 Checking $BASE_URL/api/ai-segments/$STORE_ID"
echo

echo "📡 Status + headers:"
curl -i "$BASE_URL/api/ai-segments/$STORE_ID"
echo
echo "──────────────"
echo

echo "📦 Raw body:"
curl -s "$BASE_URL/api/ai-segments/$STORE_ID"
echo

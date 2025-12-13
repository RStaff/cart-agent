#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Detecting active billing route..."

TARGET="$(grep -RIl 'appSubscriptionCreate' web/src/routes || true)"

if [ -z "$TARGET" ]; then
  echo "❌ No billing route with appSubscriptionCreate found."
  echo "Scanning for fallback billing files..."
  grep -RIl 'billing' web/src/routes
  exit 1
fi

echo "📌 Billing route found at: $TARGET"
echo

echo "🧪 Testing syntax..."
node -c "$TARGET" 2>/tmp/billing_syntax.err || {
  echo "❌ Syntax error detected:"
  cat /tmp/billing_syntax.err
  exit 1
}

echo "✅ Syntax OK"

echo
echo "🧪 Sending test request to billing endpoint..."
curl -s -X POST http://localhost:3000/billing/create \
  -H "Content-Type: application/json" \
  -d '{"planKey":"starter"}' | jq .

echo "🎉 Validation complete."

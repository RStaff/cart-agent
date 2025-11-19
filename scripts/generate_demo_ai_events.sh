#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://pay.abando.ai"
STORE_ID="${1:-demo-store-ai}"

echo "🧪 Generating demo AI-labeled cart events for store_id='$STORE_ID'…"

read -r -d '' EVENTS << 'DATA' || true
29.99|low value tester 1
45.00|low value tester 2
79.00|high value tester 1
120.50|high value tester 2
151.00|vip tester 1
220.00|vip tester 2
DATA

i=0
echo "$EVENTS" | while IFS='|' read -r VALUE NOTE; do
  # skip empty lines
  if [[ -z "$VALUE" ]]; then
    continue
  fi

  i=$((i+1))
  PAYLOAD=$(cat <<JSON
{
  "storeId": "$STORE_ID",
  "eventType": "cart_abandoned",
  "eventSource": "demo-generator",
  "customerId": "cust_demo_$i",
  "cartId": "cart_demo_$i",
  "checkoutId": "chk_demo_$i",
  "value": $VALUE,
  "metadata": { "note": "$NOTE" }
}
JSON
)

  echo "➡️  Event #$i: value=$VALUE note=\"$NOTE\""
  curl -s -X POST "$BASE_URL/api/cart-event" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" > /dev/null
done

echo
echo "✅ Demo events sent for store '$STORE_ID'."
echo "   Now run:"
echo "     ./scripts/ai_segment_report.sh $STORE_ID"

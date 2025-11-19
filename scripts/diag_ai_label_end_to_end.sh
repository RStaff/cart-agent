#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${ABANDO_BACKEND_SERVICE:-}" ]]; then
  echo "❌ ABANDO_BACKEND_SERVICE is not set"; exit 1;
fi
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set"; exit 1;
fi

STORE_ID="demo-store-ai"
EVENT_SOURCE="curl-ai-diag"
VALUE="199.99"
NOTE="diag end-to-end aiLabel test"

echo "🚀 Sending /api/cart-event diag request…"
RESP=$(curl -s -X POST https://pay.abando.ai/api/cart-event \
  -H "Content-Type: application/json" \
  -d "{
    \"storeId\": \"${STORE_ID}\",
    \"eventType\": \"cart_abandoned\",
    \"eventSource\": \"${EVENT_SOURCE}\",
    \"customerId\": \"cust_diag_1\",
    \"cartId\": \"cart_diag_1\",
    \"checkoutId\": \"chk_diag_1\",
    \"value\": ${VALUE},
    \"metadata\": { \"note\": \"${NOTE}\" }
  }")

echo
echo "🌐 HTTP response from /api/cart-event:"
echo "$RESP" | jq . || echo "$RESP"
echo

echo "📜 Recent backend logs (looking for /api/cart-event lines)…"
render logs "$ABANDO_BACKEND_SERVICE" --tail 80 | grep -E "/api/cart-event" -n || echo "(no /api/cart-event lines found in last 80 log lines)"
echo

echo "🗄  Latest events rows for ${STORE_ID}:"
psql "$DATABASE_URL" -c "
SELECT
  id,
  store_id,
  event_type,
  metadata,
  created_at
FROM events
WHERE store_id = '${STORE_ID}'
ORDER BY created_at DESC
LIMIT 5;
"

echo
echo "🔍 Projection of metadata->'aiLabel' for ${STORE_ID}:"
psql "$DATABASE_URL" -c "
SELECT
  store_id,
  event_type,
  metadata->'aiLabel'               AS ai_label_json,
  metadata->'aiLabel'->>'segment'   AS segment,
  metadata->'aiLabel'->>'urgency'   AS urgency,
  metadata->'aiLabel'->>'risk'      AS risk,
  metadata->>'note'                 AS note,
  created_at
FROM events
WHERE store_id = '${STORE_ID}'
ORDER BY created_at DESC
LIMIT 5;
"

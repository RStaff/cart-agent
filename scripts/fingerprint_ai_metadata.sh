#!/usr/bin/env bash
set -euo pipefail

# Pick up your Render backend + base URL
SERVICE_ID="${ABANDO_BACKEND_SERVICE:-srv-d47kiehr0fns73fh5vr0}"
BASE_URL="${ABANDO_BACKEND_BASE_URL:-https://pay.abando.ai}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set. Export it and rerun."
  exit 1
fi

echo "🔎 Using service: $SERVICE_ID"
echo "🔎 Using base URL: $BASE_URL"
echo

# Unique note so we can find THIS event only
NOTE="ai_fingerprint_$(date +%s)"
echo "📝 Using unique note: $NOTE"
echo

# 1) Send a single /api/cart-event with this unique note
echo "🚀 Sending /api/cart-event fingerprint request…"
HTTP_RESPONSE="$(
  curl -s -X POST "$BASE_URL/api/cart-event" \
    -H "Content-Type: application/json" \
    -d "{
      \"storeId\": \"demo-store-ai\",
      \"eventType\": \"cart_abandoned\",
      \"eventSource\": \"curl-ai-fingerprint\",
      \"customerId\": \"cust_fp_1\",
      \"cartId\": \"cart_fp_1\",
      \"checkoutId\": \"chk_fp_1\",
      \"value\": 199.99,
      \"metadata\": { \"note\": \"$NOTE\" }
    }"
)"

echo
echo "🌐 HTTP response from /api/cart-event:"
if command -v jq >/dev/null 2>&1; then
  echo "$HTTP_RESPONSE" | jq .
else
  echo "$HTTP_RESPONSE"
fi
echo

# 2) Give Postgres a moment to commit
sleep 2

# 3) Query the DB for the row with this exact note
echo "📊 Querying Postgres for the event with note = '$NOTE'…"
psql "$DATABASE_URL" <<SQL
SELECT
  id,
  store_id,
  event_type,
  event_source,
  metadata,
  metadata->'aiLabel'               AS ai_label_json,
  metadata->'aiLabel'->>'segment'   AS segment,
  metadata->'aiLabel'->>'urgency'   AS urgency,
  metadata->'aiLabel'->>'risk'      AS risk,
  metadata->>'note'                 AS note,
  created_at
FROM events
WHERE metadata->>'note' = '$NOTE'
ORDER BY created_at DESC
LIMIT 1;
SQL

echo
echo "✅ Fingerprint complete. Compare HTTP aiLabel/metadata vs DB row above."

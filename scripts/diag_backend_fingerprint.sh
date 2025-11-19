#!/usr/bin/env bash
set -euo pipefail

SERVICE_ID="${ABANDO_BACKEND_SERVICE:-srv-d47kiehr0fns73fh5vr0}"
BASE_URL="https://pay.abando.ai"

echo "🔎 Using service: $SERVICE_ID"
echo "🔎 Using base URL: $BASE_URL"
echo

echo "⚙️ Render service description (look for Build/Start command)…"
render services get "$SERVICE_ID" || echo "⚠️ render services get failed"
echo

# Unique fingerprint for this run
FINGERPRINT="diag_$(date +%s)_$RANDOM"
echo "🧬 Fingerprint for this run: $FINGERPRINT"
echo

echo "🧪 Sending fingerprinted /api/cart-event request…"
HTTP_JSON=$(
  curl -s -X POST "$BASE_URL/api/cart-event" \
    -H "Content-Type: application/json" \
    -d "{
      \"storeId\": \"diag-store\",
      \"eventType\": \"cart_abandoned\",
      \"eventSource\": \"$FINGERPRINT\",
      \"customerId\": \"cust_$FINGERPRINT\",
      \"cartId\": \"cart_$FINGERPRINT\",
      \"checkoutId\": \"chk_$FINGERPRINT\",
      \"value\": 199.99,
      \"metadata\": { \"note\": \"$FINGERPRINT\" }
    }"
)

echo
echo "🌐 HTTP response from /api/cart-event:"
echo "$HTTP_JSON" | jq . || echo "$HTTP_JSON"
echo

echo "🪵 Recent logs for fingerprint on Render service $SERVICE_ID…"
render logs "$SERVICE_ID" --tail 200 | grep -i "$FINGERPRINT" || echo "❌ No fingerprint lines found in logs."
echo

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set in this shell; export it and rerun."
  exit 1
fi

echo "🧾 DB row for this fingerprint note (metadata + aiLabel)…"
psql "$DATABASE_URL" -c "
SELECT
  id,
  store_id,
  event_type,
  event_source,
  metadata,
  metadata->'aiLabel' AS ai_label_json,
  created_at
FROM events
WHERE metadata->>'note' = '$FINGERPRINT'
ORDER BY created_at DESC
LIMIT 1;
"

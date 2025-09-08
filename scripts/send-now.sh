#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
SHOP_KEY="${SHOP_KEY:-demo-shop.myshopify.com}"
QUEUE_DELAY_MINUTES="${QUEUE_DELAY_MINUTES:-0}"

RECIPIENT="${1:-your.email@yourdomain.com}"
IMAGE_URL="${2:-https://resend.com/static/sample/logo.png}"
RESUME_URL="${3:-https://example-shop.test/cart?cart_id=\$CID}"

for bin in curl jq node; do
  command -v "$bin" >/dev/null || { echo "Missing dependency: $bin"; exit 1; }
done

CID="c_img_$RANDOM"
echo ">> Ingesting cart (CID=$CID) for $RECIPIENT"
RESP=$(
  curl -sS -X POST "$BASE_URL/api/carts/ingest" \
    -H 'content-type: application/json' \
    -H "x-shop-key: $SHOP_KEY" \
    --data-binary "$(cat <<JSON
{
  "cartId":"$CID",
  "userEmail":"$RECIPIENT",
  "resumeUrl":"$(eval echo "$RESUME_URL")",
  "items":[{"sku":"sku_x","qty":1,"image":"$IMAGE_URL"}]
}
JSON
)"
)
echo "$RESP" | jq .

echo ">> Requeue newest queued email to now (if any)"
EMAIL_ID="$(curl -sS "$BASE_URL/api/emails?status=queued&limit=1" | jq -r '.[0].id // empty')"
if [[ -n "$EMAIL_ID" && "$EMAIL_ID" != "null" ]]; then
  curl -sS -X POST "$BASE_URL/api/emails/$EMAIL_ID/requeue" | jq .
else
  echo "No queued email found (may already be due)."
fi

echo ">> Run worker once"
node web/src/lib/send-worker.js

echo ">> Latest sent email HTML"
curl -sS "$BASE_URL/api/emails?status=sent&limit=1" | jq -r '.[0].html // "None sent yet"'

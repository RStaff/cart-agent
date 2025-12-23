#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

# Pull secret from web/.env (supports spaces/quotes)
SECRET_LINE="$(grep -E '^SHOPIFY_API_SECRET=' web/.env | tail -n1 || true)"
SECRET="${SECRET_LINE#SHOPIFY_API_SECRET=}"
SECRET="${SECRET%$'\r'}"
SECRET="${SECRET%\"}"; SECRET="${SECRET#\"}"
SECRET="${SECRET%\'}"; SECRET="${SECRET#\'}"

if [ -z "${SECRET}" ]; then
  echo "❌ SHOPIFY_API_SECRET not found/empty in web/.env"
  exit 1
fi

TS="$(date +%s)"
PAYLOAD="{\"hello\":\"world\",\"t\":${TS}}"

HMAC_B64="$(
  SECRET="$SECRET" PAYLOAD="$PAYLOAD" node --input-type=module - <<'NODE'
import crypto from "node:crypto";
const secret = process.env.SECRET;
const payload = process.env.PAYLOAD;
if (!secret) { console.error("NO_SECRET"); process.exit(2); }
const h = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("base64");
console.log(h);
NODE
)"

if [ -z "${HMAC_B64}" ]; then
  echo "❌ Failed to compute HMAC_B64"
  exit 1
fi

echo "✅ HMAC_B64 computed (len=${#HMAC_B64})"
echo

echo "➡️ POST signed webhook..."
curl -s -i -X POST "http://localhost:3000/api/webhooks" \
  -H "content-type: application/json" \
  -H "x-shopify-topic: checkouts/update" \
  -H "x-shopify-shop-domain: cart-agent-dev.myshopify.com" \
  -H "x-shopify-hmac-sha256: ${HMAC_B64}" \
  --data "${PAYLOAD}"

echo
echo "=== LAST 6 inbox ==="
tail -n 6 web/.abando_webhook_inbox.jsonl 2>/dev/null || true

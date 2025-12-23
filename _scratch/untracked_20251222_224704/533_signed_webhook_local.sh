#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

SECRET="$(grep -E '^SHOPIFY_API_SECRET=' web/.env | tail -n1 | cut -d= -f2- | tr -d '\r' || true)"
if [ -z "${SECRET}" ]; then
  echo "❌ SHOPIFY_API_SECRET not found in web/.env"
  exit 1
fi

TS="$(date +%s)"
PAYLOAD="{\"hello\":\"world\",\"t\":${TS}}"

HMAC_B64="$(node - <<NODE
import crypto from "node:crypto";
const secret = process.env.SECRET;
const payload = process.env.PAYLOAD;
const h = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("base64");
console.log(h);
NODE
SECRET="$SECRET" PAYLOAD="$PAYLOAD")"

echo "✅ HMAC_B64=${HMAC_B64}"

echo
echo "➡️ POST signed webhook..."
curl -s -i -X POST "http://localhost:3000/api/webhooks" \
  -H "content-type: application/json" \
  -H "x-shopify-topic: checkouts/update" \
  -H "x-shopify-shop-domain: cart-agent-dev.myshopify.com" \
  -H "x-shopify-hmac-sha256: ${HMAC_B64}" \
  --data "${PAYLOAD}"

echo
echo "=== LAST 5 router_use ==="
tail -n 5 web/.abando_webhook_router_enter.jsonl 2>/dev/null || true

echo
echo "=== LAST 8 inbox ==="
tail -n 8 web/.abando_webhook_inbox.jsonl 2>/dev/null || true

echo
echo "=== LAST 15 probe ==="
tail -n 15 web/.abando_webhook_probe.jsonl 2>/dev/null || true

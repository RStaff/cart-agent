#!/usr/bin/env bash
set -euo pipefail

TOPIC="${1:-checkouts/update}"
SHOP="${2:-shop.myshopify.com}"

: "${TUNNEL:?TUNNEL is required (eval your 240_refresh_env script first)}"

# Load secret if not already in env (optional; keep if you want it)
if [[ -z "${SHOPIFY_API_SECRET:-}" && -f "web/.env" ]]; then
  export $(grep -E '^SHOPIFY_API_SECRET=' web/.env | xargs) || true
fi
: "${SHOPIFY_API_SECRET:?SHOPIFY_API_SECRET is required}"

TMP="$(mktemp -t abando_webhook_payload.XXXXXX.json)"
trap 'rm -f "$TMP"' EXIT

# Create payload with NO trailing newline (printf, not echo)
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '%s' "{\"test\":true,\"source\":\"262_post_signed_webhook_bytesafe\",\"ts\":\"$TS\"}" > "$TMP"

# Compute HMAC over the EXACT bytes we will send
HMAC_B64="$(TMP="$TMP" SHOPIFY_API_SECRET="$SHOPIFY_API_SECRET" node - <<'NODE'
const fs = require("fs");
const crypto = require("crypto");
const secret = process.env.SHOPIFY_API_SECRET;
const file = process.env.TMP;
const buf = fs.readFileSync(file);
const h = crypto.createHmac("sha256", secret).update(buf).digest("base64");
process.stdout.write(h);
NODE
)"

WEBHOOK_ID="262-local-$(date +%s)"

# Send the SAME bytes file
curl -sS -i "${TUNNEL}/api/webhooks" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: ${TOPIC}" \
  -H "X-Shopify-Shop-Domain: ${SHOP}" \
  -H "X-Shopify-Hmac-Sha256: ${HMAC_B64}" \
  -H "X-Shopify-Webhook-Id: ${WEBHOOK_ID}" \
  -H "X-Shopify-Triggered-At: ${TS}" \
  --data-binary @"$TMP" | sed -n '1,25p'

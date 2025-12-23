#!/usr/bin/env bash
set -euo pipefail

: "${TUNNEL:?TUNNEL is required (eval 240_refresh_env_from_shopify_log.sh first)}"

TOPIC="${1:-checkouts/update}"
SHOP="${2:-shop.myshopify.com}"

# Load SHOPIFY_API_SECRET from web/.env or web/.env.local (source-of-truth)
load_secret() {
  local env1="web/.env" env2="web/.env.local"
  if [[ -f "$env1" ]]; then
    set -a; source "$env1"; set +a
  elif [[ -f "$env2" ]]; then
    set -a; source "$env2"; set +a
  fi

  if [[ -z "${SHOPIFY_API_SECRET:-}" ]]; then
    echo "❌ SHOPIFY_API_SECRET not found in web/.env or web/.env.local" >&2
    echo "   Try: rg -n \"SHOPIFY_API_SECRET\" web/.env web/.env.local .env .env.local || true" >&2
    exit 1
  fi
}
load_secret

PAYLOAD='{"test":true,"source":"261_post_signed_webhook","ts":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}'

# Compute HMAC-SHA256 base64, like Shopify expects
HMAC_B64="$(PAYLOAD="$PAYLOAD" SHOPIFY_API_SECRET="$SHOPIFY_API_SECRET" node - <<'NODE'
const crypto = require("crypto");
const secret = process.env.SHOPIFY_API_SECRET;
const payload = process.env.PAYLOAD;
if (!secret) throw new Error("SHOPIFY_API_SECRET missing in node env");
if (!payload) throw new Error("PAYLOAD missing in node env");
process.stdout.write(
  crypto.createHmac("sha256", secret).update(payload, "utf8").digest("base64")
);
NODE
)"

curl -sS -i "${TUNNEL}/api/webhooks" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: ${TOPIC}" \
  -H "X-Shopify-Shop-Domain: ${SHOP}" \
  -H "X-Shopify-Hmac-Sha256: ${HMAC_B64}" \
  -H "X-Shopify-Webhook-Id: 261-local-$(date +%s)" \
  -H "X-Shopify-Triggered-At: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -d "$PAYLOAD" | sed -n '1,25p'

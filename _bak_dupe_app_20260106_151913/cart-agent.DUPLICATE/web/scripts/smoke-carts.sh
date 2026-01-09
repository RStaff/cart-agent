#!/usr/bin/env bash
set -euo pipefail

# Cart Agent API smoke tests
# Usage:
#   web/scripts/smoke-carts.sh
#   BASE_URL=https://cart-agent-backend.onrender.com web/scripts/smoke-carts.sh
# Env: BASE_URL (default http://localhost:3000) | SHOP_KEY (default demo-shop.myshopify.com) | VERBOSE=1

BASE_URL="${BASE_URL:-http://localhost:3000}"
SHOP_KEY="${SHOP_KEY:-demo-shop.myshopify.com}"
JQ_BIN="${JQ_BIN:-jq}"

if ! command -v "$JQ_BIN" >/dev/null 2>&1; then
  echo "❌ jq not found. Install jq (brew install jq) and re-run." >&2
  exit 1
fi

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
say() { printf "\n\033[1m[%s]\033[0m %s\n" "$(ts)" "$*"; }
curlj() {
  [ "${VERBOSE:-0}" = "1" ] && echo "curl $*" >&2
  if ! out=$(curl -sS "$@"); then
    echo "❌ curl failed" >&2; return 1
  fi
  if echo "$out" | "$JQ_BIN" . >/dev/null 2>&1; then
    echo "$out" | "$JQ_BIN" .
  else
    echo "$out"
  fi
}

RID="$(date +%s%N)"
CID_AGN="c_agnostic_${RID}"
CID_SH1="c_shop_hdr_${RID}"
CID_SH2="c_shop_body_${RID}"

say "Using BASE_URL=${BASE_URL}"
say "Using SHOP_KEY=${SHOP_KEY}"

# 0) health & env
say "GET /healthz"
curlj "${BASE_URL}/healthz"

say "GET /_env"
curlj "${BASE_URL}/_env"

# 1) AGNOSTIC: POST /api/carts/ingest  (no shop)
say "POST /api/carts/ingest (agnostic) cartId=${CID_AGN}"
curlj -X POST "${BASE_URL}/api/carts/ingest" \
  -H 'content-type: application/json' \
  --data-binary @- <<JSON
{
  "cartId": "${CID_AGN}",
  "userEmail": "buyer+agnostic@example.com",
  "items": [
    { "sku": "sku_a", "qty": 1 },
    { "sku": "sku_b", "qty": 2 }
  ]
}
JSON

# 2) SHOPIFY-STYLE HEADER: POST with x-shop-key
say "POST /api/carts/ingest (x-shop-key header=${SHOP_KEY}) cartId=${CID_SH1}"
resp_hdr="$(curl -sS -X POST "${BASE_URL}/api/carts/ingest" \
  -H "x-shop-key: ${SHOP_KEY}" \
  -H 'content-type: application/json' \
  --data-binary @- <<JSON
{
  "cartId": "${CID_SH1}",
  "userEmail": "buyer+hdr@example.com",
  "items": [{ "sku": "sku_hdr", "qty": 3 }]
}
JSON
)"
echo "$resp_hdr" | "$JQ_BIN" .
SHOP_ID="$(echo "$resp_hdr" | "$JQ_BIN" -r '.cart.shopId // empty')"
if [ -n "${SHOP_ID}" ]; then
  say "Captured shopId from response: ${SHOP_ID}"
else
  say "No shopId returned (OK in agnostic mode)."
fi

# 3) BODY shopKey: POST with { "shopKey": "..."}
say "POST /api/carts/ingest (body shopKey=${SHOP_KEY}) cartId=${CID_SH2}"
resp_body="$(curl -sS -X POST "${BASE_URL}/api/carts/ingest" \
  -H 'content-type: application/json' \
  --data-binary @- <<JSON
{
  "shopKey": "${SHOP_KEY}",
  "cartId": "${CID_SH2}",
  "userEmail": "buyer+body@example.com",
  "items": [{ "sku": "sku_body", "qty": 1 }]
}
JSON
)"
echo "$resp_body" | "$JQ_BIN" .

# 4) LIST all carts
say "GET /api/carts (list up to latest 100)"
curlj "${BASE_URL}/api/carts"

# 5) LIST by shopKey (if available)
say "GET /api/carts?shopKey=${SHOP_KEY}"
curlj "${BASE_URL}/api/carts?shopKey=${SHOP_KEY}"

# 6) GET by cartId
say "GET /api/carts/${CID_AGN}"
curlj "${BASE_URL}/api/carts/${CID_AGN}"

say "GET /api/carts/${CID_SH1}"
curlj "${BASE_URL}/api/carts/${CID_SH1}"

say "GET /api/carts/${CID_SH2}"
curlj "${BASE_URL}/api/carts/${CID_SH2}"

say "✅ Smoke tests complete."

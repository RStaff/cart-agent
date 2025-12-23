#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
TOPIC="${2:-checkouts/update}"
SHOP="${3:-cart-agent-dev.myshopify.com}"
PAYLOAD="${4:-{}}"

# 1) Parse tunnel from log
eval "$(./scripts/340_wait_parse_shopify_dev_env.sh "$LOG" 120)" || true
if [[ -z "${TUNNEL:-}" ]]; then
  echo "ERR: could not parse TUNNEL from $LOG" >&2
  exit 2
fi

# 2) Read dev token from web/.env
TOKEN="$(
  perl -ne 'if(/^ABANDO_DEV_SIGN_TOKEN=(.*)\s*$/){ print $1; exit 0 }' web/.env 2>/dev/null || true
)"
if [[ -z "$TOKEN" ]]; then
  echo "ERR: ABANDO_DEV_SIGN_TOKEN missing in web/.env" >&2
  exit 3
fi

# 3) Ask server to sign payload (returns JSON {hmac_b64})
REQ_JSON="$(node -e 'console.log(JSON.stringify({payload: process.argv[1]}))' "$PAYLOAD")"

SIGN_BODY="$(curl -sS "$TUNNEL/__abando/sign" \
  -H "Content-Type: application/json" \
  -H "X-Abando-Dev-Token: $TOKEN" \
  -d "$REQ_JSON")"

HMAC_B64="$(printf "%s" "$SIGN_BODY" | node -e '
let d=""; process.stdin.on("data",c=>d+=c).on("end",()=> {
  try { const j=JSON.parse(d); process.stdout.write(String(j.hmac_b64||"")) }
  catch(e){ process.stdout.write("") }
});
')"

if [[ -z "$HMAC_B64" ]]; then
  echo "ERR: /__abando/sign did not return JSON {hmac_b64}." >&2
  echo "SIGN_BODY=$SIGN_BODY" >&2
  exit 4
fi

TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
ID="dev-$(date +%s)"

echo "TUNNEL=$TUNNEL"
echo "TOPIC=$TOPIC"
echo "SHOP=$SHOP"
echo "HMAC_B64=$HMAC_B64"
echo

# 4) Send signed webhook to mounted route /api/webhooks
curl -sS -i -X POST "$TUNNEL/api/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: $TOPIC" \
  -H "X-Shopify-Shop-Domain: $SHOP" \
  -H "X-Shopify-Hmac-Sha256: $HMAC_B64" \
  -H "X-Shopify-Triggered-At: $TS" \
  -H "X-Shopify-Webhook-Id: $ID" \
  --data-binary "$PAYLOAD" | sed -n '1,120p'

echo
echo "Inbox tail (web/.abando_webhook_inbox.jsonl):"
tail -n 5 web/.abando_webhook_inbox.jsonl 2>/dev/null || true

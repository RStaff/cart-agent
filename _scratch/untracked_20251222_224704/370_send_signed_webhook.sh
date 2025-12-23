#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
TOPIC="${2:-checkouts/update}"
SHOP="${3:-cart-agent-dev.myshopify.com}"

test -f "$LOG" || { echo "ERR: missing log file: $LOG" >&2; exit 2; }

eval "$(./scripts/340_wait_parse_shopify_dev_env.sh "$LOG" 120)" || true
if [[ -z "${TUNNEL:-}" ]]; then
  echo "ERR: could not parse TUNNEL from $LOG" >&2
  exit 3
fi

# Pull runtime fp from server
DBG_JSON="$(curl -sS "$TUNNEL/__abando/debug-env" || true)"
SERVER_FP="$(
  DBG_JSON="$DBG_JSON" node -e '
    try { const j=JSON.parse(process.env.DBG_JSON||"{}"); process.stdout.write(String(j.secret_fp||"")); }
    catch(e){ process.exit(4); }
  '
)"

if [[ -z "$SERVER_FP" ]]; then
  echo "ERR: server secret_fp missing from /__abando/debug-env JSON" >&2
  echo "DBG_JSON=$DBG_JSON" >&2
  exit 4
fi

# Try to find a matching local secret (may fail)
set +e
PICK_OUT="$(./scripts/369_pick_secret_matching_server_fp.sh "$TUNNEL" 2>&1)"
PICK_RC=$?
set -e

if [[ $PICK_RC -ne 0 ]]; then
  echo "ERR: could not find a local secret matching server secret_fp=$SERVER_FP" >&2
  echo "$PICK_OUT" >&2
  echo
  echo "NEXT: run -> ./scripts/372_scan_repo_for_shopify_secret_by_fp.sh $SERVER_FP" >&2
  exit 5
fi

eval "$PICK_OUT"

# Build payload + HMAC
PAYLOAD='{}'
TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
ID="$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)"

HMAC_B64="$(
  SECRET="$(printf "%b" "$ABANDO_MATCHED_SECRET")" \
  TOPIC="$TOPIC" SHOP="$SHOP" PAYLOAD="$PAYLOAD" \
  node -e '
    const crypto = require("node:crypto");
    const secret = process.env.SECRET || "";
    const payload = Buffer.from(process.env.PAYLOAD || "", "utf8");
    const h = crypto.createHmac("sha256", secret).update(payload).digest("base64");
    process.stdout.write(h);
  '
)"

echo "TUNNEL=$TUNNEL"
echo "TOPIC=$TOPIC"
echo "SHOP=$SHOP"
echo "server_secret_fp=$ABANDO_SERVER_SECRET_FP"
echo "matched_secret_fp=$ABANDO_MATCHED_SECRET_FP (from $ABANDO_MATCHED_SECRET_FILE)"
echo "hmac_b64=$HMAC_B64"
echo

curl -sS -i -X POST "$TUNNEL/api/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: $TOPIC" \
  -H "X-Shopify-Shop-Domain: $SHOP" \
  -H "X-Shopify-Hmac-Sha256: $HMAC_B64" \
  -H "X-Shopify-Triggered-At: $TS" \
  -H "X-Shopify-Webhook-Id: $ID" \
  --data-binary "$PAYLOAD" | sed -n '1,60p'

echo
echo "Inbox tail (web/.abando_webhook_inbox.jsonl):"
tail -n 5 web/.abando_webhook_inbox.jsonl 2>/dev/null || true

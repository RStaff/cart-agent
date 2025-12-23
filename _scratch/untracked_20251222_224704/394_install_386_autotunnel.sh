#!/usr/bin/env bash
set -euo pipefail

TARGET="scripts/386_send_signed_webhook_clean.sh"
cp -f "$TARGET" "$TARGET.bak_$(date +%s)" 2>/dev/null || true

cat > "$TARGET" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
TOPIC="${2:-checkouts/update}"
SHOP="${3:-cart-agent-dev.myshopify.com}"
PAYLOAD="${4:-{}}"

discover_tunnel() {
  local tunnel=""

  # Primary: repo tee log from the interactive `shopify app dev`
  if [[ -f "$LOG" ]]; then
    tunnel="$(perl -ne 'if(/Using URL:\s*(https:\/\/\S+)/){ $u=$1 } END{ print $u||"" }' "$LOG" 2>/dev/null || true)"
  fi

  # Fallback: Shopify CLI logs
  if [[ -z "$tunnel" ]]; then
    tunnel="$(rg -h -o 'https:\/\/[a-z0-9-]+\.trycloudflare\.com' ~/.shopify/logs/*.log 2>/dev/null | tail -n 1 || true)"
  fi

  if [[ -z "$tunnel" ]]; then
    echo "❌ Could not discover active tunnel." >&2
    echo "   Fix: run in Terminal A (interactive):" >&2
    echo "        shopify app dev 2>&1 | tee .shopify_dev.log" >&2
    exit 22
  fi

  echo "$tunnel"
}

TUNNEL="$(discover_tunnel)"

TOKEN="$(
  perl -ne 'if(/^ABANDO_DEV_SIGN_TOKEN=(.*)\s*$/){ print $1; exit 0 }' web/.env 2>/dev/null || true
)"
if [[ -z "$TOKEN" ]]; then
  echo "ERR: ABANDO_DEV_SIGN_TOKEN missing in web/.env" >&2
  exit 3
fi

# Make payload canonical JSON text (ensures signer matches what we send)
PAYLOAD_CANON="$(node -e 'let s=process.argv[1]; try{process.stdout.write(JSON.stringify(JSON.parse(s)))}catch(e){process.stdout.write(String(s))}' "$PAYLOAD")"

HMAC_B64="$(
  curl -sS "$TUNNEL/__abando/sign" \
    -H "Content-Type: application/json" \
    -H "X-Abando-Dev-Token: $TOKEN" \
    -d "$(node -e 'console.log(JSON.stringify({payload: process.argv[1]}))' "$PAYLOAD_CANON")" \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);process.stdout.write(String(j.hmac_b64||""))}catch(e){process.stdout.write("")}})'
)"

if [[ -z "$HMAC_B64" ]]; then
  echo "ERR: /__abando/sign did not return JSON {hmac_b64}" >&2
  echo "TUNNEL=$TUNNEL" >&2
  exit 5
fi

TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
ID="abando-dev-$(date +%s)"

echo "TUNNEL=$TUNNEL"
echo "TOPIC=$TOPIC"
echo "SHOP=$SHOP"
echo "TS=$TS"
echo "ID=$ID"
echo "HMAC_B64=$HMAC_B64"
echo

curl -sS -i -X POST "$TUNNEL/api/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: $TOPIC" \
  -H "X-Shopify-Shop-Domain: $SHOP" \
  -H "X-Shopify-Hmac-Sha256: $HMAC_B64" \
  -H "X-Shopify-Triggered-At: $TS" \
  -H "X-Shopify-Webhook-Id: $ID" \
  --data-binary "$PAYLOAD_CANON" | sed -n '1,80p'

echo
echo "Inbox tail (web/.abando_webhook_inbox.jsonl):"
tail -n 5 web/.abando_webhook_inbox.jsonl 2>/dev/null || true
SH

chmod +x "$TARGET"
echo "✅ Installed $TARGET (auto-tunnel, no more manual export TUNNEL)."

#!/usr/bin/env bash
set -euo pipefail

BODY_FILE=""

LOG_FILE="${1:-.shopify_dev.log}"
TOPIC="${2:-checkouts/update}"
SHOP="${3:-cart-agent-dev.myshopify.com}"
PAYLOAD="${4:-{}}"

ENV_FILE="web/.env"

die(){ echo "ERR: $*" >&2; exit 1; }

cleanup() {
  if [[ -n "${BODY_FILE:-}" && -f "$BODY_FILE" ]]; then rm -f "$BODY_FILE"; fi
}
trap cleanup EXIT

sanitize_tunnel(){ perl -pe 's/\r//g; s/\x1b\[[0-9;]*[A-Za-z]//g; s/[^[:print:]]//g; s/\s+$//; s/^\s+//;'; }

extract_tunnel_from_file() {
  local f="$1"; [[ -f "$f" ]] || return 1
  perl -0777 -ne 'if (m/Using URL:\s*[\r\n]*\s*(https:\/\/[^\s]+trycloudflare\.com[^\s]*)/s){print "$1\n"; exit 0} exit 1' "$f"
}

discover_tunnel() {
  local u=""
  u="$(extract_tunnel_from_file "$LOG_FILE" 2>/dev/null || true)"
  if [[ -n "${u:-}" ]]; then printf "%s" "$u" | sanitize_tunnel; return 0; fi
  local newest=""
  newest="$(ls -t ~/.shopify/logs/*.log 2>/dev/null | head -n 1 || true)"
  [[ -n "$newest" ]] || return 1
  u="$(extract_tunnel_from_file "$newest" 2>/dev/null || true)"
  [[ -n "${u:-}" ]] || return 1
  printf "%s" "$u" | sanitize_tunnel
}

read_env_var() {
  local key="$1" file="$2"
  [[ -f "$file" ]] || return 1
  awk -v k="$key" -F= '
    $1==k {
      v=$0; sub(/^[^=]*=/,"",v); sub(/\r$/,"",v);
      sub(/^"/,"",v); sub(/"$/,"",v);
      sub(/^'\''/,"",v); sub(/'\''$/,"",v);
      print v; exit 0
    }
  ' "$file"
}

secret_fp() {
  python3 - <<PY
import hashlib
s = """$1"""
print(hashlib.sha256(s.encode()).hexdigest()[:12])
PY
}

b64_hmac_file() {
  local secret="$1" file="$2"
  openssl dgst -sha256 -hmac "$secret" -binary "$file" | base64
}

main() {
  local TUNNEL SECRET TS ID HMAC_B64 BODY_BYTES

  TUNNEL="$(discover_tunnel)" || die "could not discover tunnel"
  echo "TUNNEL=$TUNNEL"

  SECRET="$(read_env_var "SHOPIFY_API_SECRET" "$ENV_FILE" 2>/dev/null || true)"
  [[ -n "${SECRET:-}" ]] || die "SHOPIFY_API_SECRET missing in $ENV_FILE"

  echo "LOCAL_SECRET_FP=$(secret_fp "$SECRET")"

  BODY_FILE="$(mktemp -t abando_body.XXXXXX)"
  # IMPORTANT: write EXACT bytes, no newline.
  printf "%s" "$PAYLOAD" > "$BODY_FILE"

  BODY_BYTES="$(wc -c < "$BODY_FILE" | tr -d ' ')"
  echo "BODY_BYTES=$BODY_BYTES"
  echo "BODY_HEX=$(xxd -p -c 9999 "$BODY_FILE")"

  HMAC_B64="$(b64_hmac_file "$SECRET" "$BODY_FILE")"

  TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  ID="abando-dev-$(date +%s)"

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
    --data-binary "@$BODY_FILE" | sed -n '1,120p'

  echo
  echo "Inbox tail (web/.abando_webhook_inbox.jsonl):"
  tail -n 8 web/.abando_webhook_inbox.jsonl 2>/dev/null || true
}

main "$@"

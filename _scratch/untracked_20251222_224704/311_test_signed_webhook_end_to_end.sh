#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
TOPIC="${2:-checkouts/update}"
SHOP="${3:-shop.myshopify.com}"

test -f "$LOG" || { echo "❌ Missing $LOG"; exit 1; }
test -f ".env" || { echo "❌ Missing .env"; exit 1; }

# Load .env into shell (no manual export)
set -a
source ./.env
set +a

# Pull tunnel + backend port from the current log
eval "$(./scripts/240_refresh_env_from_shopify_log.sh "$LOG")"

echo "TUNNEL=${TUNNEL:-}"
echo "BACKEND_PORT=${BACKEND_PORT:-}"

if [[ -z "${TUNNEL:-}" ]]; then
  echo "❌ TUNNEL not found. Is 'shopify app dev' currently running and writing to $LOG?"
  exit 1
fi

if [[ -z "${SHOPIFY_API_SECRET:-}" ]]; then
  echo "❌ SHOPIFY_API_SECRET not loaded from .env"
  exit 1
fi

# Ensure inbox enabled
export ABANDO_EVENT_INBOX=1
export ABANDO_EVENT_INBOX_PATH="$PWD/web/.abando_webhook_inbox.jsonl"
mkdir -p "$(dirname "$ABANDO_EVENT_INBOX_PATH")"
touch "$ABANDO_EVENT_INBOX_PATH"

echo "🚀 Posting bytesafe signed webhook via 262..."
./scripts/262_post_signed_webhook_bytesafe.sh "$TOPIC" "$SHOP" >/dev/null || true

echo
echo "=== last 6 inbox lines ==="
tail -n 6 "$ABANDO_EVENT_INBOX_PATH" || true

echo
echo "🔎 Latest verification verdict:"
LAST="$(tail -n 1 "$ABANDO_EVENT_INBOX_PATH" || true)"
echo "$LAST" | rg -q '"stage":"verified"' || { echo "❌ Latest line is not stage=verified"; exit 1; }
echo "$LAST" | rg -q '"hmac_ok":true' && echo "✅ PASS: hmac_ok=true" || { echo "❌ FAIL: hmac_ok is not true"; exit 1; }

#!/usr/bin/env bash
set -euo pipefail

TUNNEL="${TUNNEL:-}"; BACKEND_PORT="${BACKEND_PORT:-}"

LOG="${1:-.shopify_dev.log}"
TOPIC="${2:-checkouts/update}"
SHOP="${3:-shop.myshopify.com}"

test -f "$LOG" || { echo "❌ LOG not found: $LOG"; exit 1; }

# Ensure inbox env vars exist (script still works if server doesn't write inbox)
export ABANDO_EVENT_INBOX="${ABANDO_EVENT_INBOX:-1}"
export ABANDO_EVENT_INBOX_PATH="${ABANDO_EVENT_INBOX_PATH:-$PWD/web/.abando_webhook_inbox.jsonl}"
mkdir -p "$(dirname "$ABANDO_EVENT_INBOX_PATH")"
touch "$ABANDO_EVENT_INBOX_PATH"

# Parse tunnel + backend port from log (ANSI-safe)
TUNNEL=""
BACKEND_PORT=""
if test -x ./scripts/331_parse_shopify_dev_env_ansi_safe.sh; then
  TUNNEL=""; BACKEND_PORT=""; eval "$(./scripts/340_wait_parse_shopify_dev_env.sh "$LOG" || true 90)"
else
  echo "❌ Missing ./scripts/331_parse_shopify_dev_env_ansi_safe.sh"
  exit 1
fi

if [[ -z "${TUNNEL:-}" || -z "${BACKEND_PORT:-}" ]]; then
  echo "❌ ERR: Could not parse TUNNEL/BACKEND_PORT from $LOG"
  echo "   TUNNEL='${TUNNEL:-}' BACKEND_PORT='${BACKEND_PORT:-}'"
  echo
  echo "🔎 Quick checks:"
  echo "   - does the log contain a trycloudflare URL?"
  rg -n "trycloudflare\.com" "$LOG" | tail -n 5 || true
  echo
  echo "   - does the log contain a listening line?"
  rg -n "listening on http://0\.0\.0\.0:" "$LOG" | tail -n 5 || true
  exit 1
fi

echo "TUNNEL=$TUNNEL"
echo "BACKEND_PORT=$BACKEND_PORT"
echo

echo "➡️ Posting bytesafe signed webhook..."
./scripts/262_post_signed_webhook_bytesafe.sh "$TOPIC" "$SHOP" | sed -n '1,18p' || true

echo
echo "➡️ Last 12 inbox lines:"
tail -n 12 "$ABANDO_EVENT_INBOX_PATH" || true

echo
./scripts/322_compare_local_secret_fp_vs_server.sh || true

echo
LAST="$(tail -n 1 "$ABANDO_EVENT_INBOX_PATH" 2>/dev/null || true)"
echo "➡️ Verdict:"
echo "$LAST" | rg -q '"stage":"verified"' || { echo "❌ latest is not stage=verified"; exit 1; }
echo "$LAST" | rg -q '"hmac_ok":true' && echo "✅ PASS: hmac_ok=true" || { echo "❌ FAIL: hmac_ok is not true"; exit 1; }

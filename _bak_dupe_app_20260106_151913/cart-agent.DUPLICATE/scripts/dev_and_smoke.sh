#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

LOG="dev.log"

echo "==> Ensuring Shopify dev server is running (or will start)…"
# If no active process, start it in background
if ! pgrep -f "shopify app dev" >/dev/null 2>&1; then
  echo "   • Starting: shopify app dev | tee $LOG"
  (shopify app dev | tee "$LOG") &
  DEV_PID=$!
  # Give it a moment to boot and write ports
  sleep 3
else
  echo "   • Reusing existing dev server"
  # Make sure we have a fresh log snapshot
  if [ ! -f "$LOG" ]; then
    echo "   • $LOG not found; re-running server to capture logs"
    pkill -f "shopify app dev" >/dev/null 2>&1 || true
    (shopify app dev | tee "$LOG") &
    DEV_PID=$!
    sleep 3
  fi
fi

echo "==> Discovering ports from $LOG …"
PROXY_PORT="$(grep -oE 'Proxy server started on port [0-9]+' "$LOG" | tail -n1 | awk '{print $NF}')"
LOCAL_PORT="$(grep -oE '\[local\] webhook receiver listening at http://localhost:[0-9]+' "$LOG" | tail -n1 | sed 's/.*://')"

if [ -z "${PROXY_PORT:-}" ] && [ -z "${LOCAL_PORT:-}" ]; then
  echo "   ⚠️  Could not detect ports yet. Waiting a bit more…"
  sleep 2
  PROXY_PORT="$(grep -oE 'Proxy server started on port [0-9]+' "$LOG" | tail -n1 | awk '{print $NF}')"
  LOCAL_PORT="$(grep -oE '\[local\] webhook receiver listening at http://localhost:[0-9]+' "$LOG" | tail -n1 | sed 's/.*://')"
fi

echo "   • Proxy port: ${PROXY_PORT:-N/A}"
echo "   • Local port: ${LOCAL_PORT:-N/A}"

TARGET_KIND="${1:-proxy}"   # use "local" to hit local backend directly
if [ "$TARGET_KIND" = "local" ]; then
  if [ -z "${LOCAL_PORT:-}" ]; then
    echo "   ❌ Local port not found in $LOG. Aborting."
    exit 1
  fi
  TARGET_URL="http://localhost:$LOCAL_PORT/api/abandoned-cart"
else
  if [ -z "${PROXY_PORT:-}" ]; then
    echo "   ❌ Proxy port not found in $LOG. Try: ./scripts/dev_and_smoke.sh local"
    exit 1
  fi
  TARGET_URL="http://localhost:$PROXY_PORT/api/abandoned-cart"
fi

echo "==> Smoke test → $TARGET_URL"
PAYLOAD='{"checkoutId":"SMOKE-'"$RANDOM"'","email":"smoke@example.com","lineItems":[{"id":1,"title":"Test Item","quantity":1}],"totalPrice":9.99}'
RESP="$(curl -sS -i -X POST "$TARGET_URL" -H "Content-Type: application/json" -d "$PAYLOAD" || true)"

echo "---- response (head) ----"
printf "%s\n" "$RESP" | sed -n '1,20p'
STATUS="$(printf "%s" "$RESP" | awk 'NR==1{print $2}')"

if [ "$STATUS" = "201" ]; then
  echo "==> ✅ 201 Created."
else
  echo "==> ⚠️ Non-201 status ($STATUS). Check your dev terminal and $LOG."
fi

echo "==> Looking for latest Ethereal preview URL…"
PREVIEW_URL="$(grep -oE 'https://ethereal\.email/message/[A-Za-z0-9\.\-]+' "$LOG" | tail -n1 || true)"
if [ -n "$PREVIEW_URL" ]; then
  echo "   📬 Email preview: $PREVIEW_URL"
else
  echo "   ℹ️  No preview URL seen yet. (If mailer not wired, this is expected.)"
fi

if command -v sqlite3 >/dev/null 2>&1 && [ -f dev.db ]; then
  echo "==> Latest DB row:"
  sqlite3 dev.db "SELECT id, checkoutId, email, totalPrice, datetime(createdAt/1000,'unixepoch') FROM AbandonedCart ORDER BY id DESC LIMIT 1;" \
    || echo "   (Could not query dev.db)"
else
  echo "==> DB check skipped (sqlite3 not installed or dev.db missing)."
fi

echo "==> Done."
echo "   • Re-run:   ./scripts/dev_and_smoke.sh          # via proxy"
echo "   • Or:       ./scripts/dev_and_smoke.sh local    # hit local backend"

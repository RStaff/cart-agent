#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"

# Load env (tunnel/backend_port) if possible, but don't hard-fail.
if [[ -f "$LOG" ]]; then
  eval "$(./scripts/240_refresh_env_from_shopify_log.sh "$LOG" || true)"
fi

echo "TUNNEL=${TUNNEL:-}"
echo "BACKEND_PORT=${BACKEND_PORT:-}"

echo
echo "🚀 Triggering REAL Shopify webhook (HTTP)..."
shopify app webhook trigger --topic checkouts/update >/dev/null

echo "✅ Enqueued. Waiting 25s..."
sleep 25

# Prove arrival via inbox (source of truth)
INBOX="web/.abando_webhook_inbox.jsonl"
test -f "$INBOX" || { echo "❌ Missing inbox: $INBOX"; exit 1; }

LAST_LINE="$(tail -n 1 "$INBOX" || true)"
if [[ -z "$LAST_LINE" ]]; then
  echo "❌ Inbox is empty."
  exit 1
fi

WEBHOOK_ID="$(echo "$LAST_LINE" | node -pe 'try{process.stdout.write(JSON.parse(fs.readFileSync(0,"utf8")).webhook_id||"")}catch(e){}' 2>/dev/null || true)"
EVENT_ID="$(echo "$LAST_LINE"   | node -pe 'try{process.stdout.write(JSON.parse(fs.readFileSync(0,"utf8")).event_id||"")}catch(e){}' 2>/dev/null || true)"
HMAC_OK="$(echo "$LAST_LINE"    | node -pe 'try{process.stdout.write(String(JSON.parse(fs.readFileSync(0,"utf8")).hmac_ok))}catch(e){}' 2>/dev/null || true)"
STAGE="$(echo "$LAST_LINE"      | node -pe 'try{process.stdout.write(JSON.parse(fs.readFileSync(0,"utf8")).stage||"")}catch(e){}' 2>/dev/null || true)"

echo
echo "🔎 Inbox evidence (latest line):"
echo "$LAST_LINE"

if [[ "$STAGE" != "verified" || "$HMAC_OK" != "true" ]]; then
  echo "⚠️ Webhook arrived but not verified yet (stage=$STAGE hmac_ok=$HMAC_OK)."
  echo "   Try: tail -n 5 $INBOX"
  exit 1
fi

echo "✅ VERIFIED via inbox (stage=verified, hmac_ok=true)."

# Optional: also verify the dev log if present
if [[ -f "$LOG" && -n "${WEBHOOK_ID:-}" ]]; then
  echo
  echo "🔎 Searching $LOG for webhook id: $WEBHOOK_ID"
  if rg -n "$WEBHOOK_ID" "$LOG" >/dev/null 2>&1; then
    echo "✅ Found webhook id in dev log."
    rg -n "$WEBHOOK_ID|\\[webhooks\\]" "$LOG" | tail -n 30 || true
  else
    echo "⚠️ Did not find webhook id in dev log (log may not be recording this session)."
  fi
fi

#!/usr/bin/env bash
set -euo pipefail

EXPRESS_LOG="${EXPRESS_LOG:-.dev_express.log}"
SHOPIFY_LOG="${SHOPIFY_LOG:-.shopify_dev.log}"

eval "$(./scripts/200_extract_runtime.sh "$SHOPIFY_LOG")"

test -f "$EXPRESS_LOG" || { echo "❌ Missing $EXPRESS_LOG (your express log)."; exit 1; }

echo "✅ Using:"
echo "   TUNNEL=$TUNNEL"
echo "   BACKEND_PORT=$BACKEND_PORT"
echo "   EXPRESS_LOG=$EXPRESS_LOG"
echo

# Mark current end of Express log
MARK="$(wc -l < "$EXPRESS_LOG" | tr -d ' ')"
echo "🧷 Marker line in $EXPRESS_LOG: $MARK"
echo

# Try to run webhook trigger without prompts. If the CLI prompts for delivery method,
# we detect it and fail fast with an actionable message.
set +e
OUT="$(
  shopify app webhook trigger \
    --topic checkouts/update \
    --address "${TUNNEL}/api/webhooks" \
    --api-version 2025-07 2>&1
)"
RC=$?
set -e

echo "$OUT" | sed -n '1,200p'
echo

if echo "$OUT" | grep -qi "Delivery method"; then
  echo "❌ Shopify CLI prompted for Delivery method (interactive)."
  echo "Fix (one-time): run this ONCE interactively and choose HTTP:"
  echo "  shopify app webhook trigger --topic checkouts/update --address \"${TUNNEL}/api/webhooks\" --api-version 2025-07"
  echo
  echo "After that, rerun: ./scripts/220_trigger_real_webhook.sh"
  exit 2
fi

if [[ $RC -ne 0 ]]; then
  echo "❌ webhook trigger failed (rc=$RC)."
  exit $RC
fi

echo "✅ Enqueued. Waiting 25s for delivery..."
sleep 25
echo

NEW="$(tail -n +$((MARK+1)) "$EXPRESS_LOG" || true)"

echo "🔎 New webhook blocks (tail):"
echo "$NEW" | grep -n "\[webhooks\]" -B 2 -A 25 | tail -n 120 || true
echo

if echo "$NEW" | grep -q "has_x_shopify_topic: true"; then
  echo "✅ REAL SHOPIFY WEBHOOK CONFIRMED (has_x_shopify_topic: true)"
else
  echo "❌ Did NOT confirm has_x_shopify_topic: true yet."
  echo "Tip: if you only see content_length: '2', you're hitting it with curl (local), not Shopify."
  exit 3
fi

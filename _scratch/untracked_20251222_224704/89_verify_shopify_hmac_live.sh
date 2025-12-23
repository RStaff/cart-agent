#!/usr/bin/env bash
set -euo pipefail

SHOP="${1:-shop.myshopify.com}"
TUNNEL="${TUNNEL:-}"

if [[ -z "$TUNNEL" ]]; then
  echo "❌ Set TUNNEL env var first, e.g.:"
  echo '   export TUNNEL="https://tin-perfume-breaking-mounted.trycloudflare.com"'
  exit 1
fi

unset ABANDO_ALLOW_INSECURE_WEBHOOKS || true
export ABANDO_DEBUG_HMAC=1

echo "🧹 Restarting dev stack..."
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true
./scripts/dev.sh cart-agent-dev.myshopify.com >/dev/null 2>&1 || true

echo "🌐 Tunnel check:"
curl -fsSI "$TUNNEL/" | sed -n '1,12p' || true

echo
echo "📨 Triggering Shopify test webhook to: ${TUNNEL}/api/webhooks"
shopify app webhook trigger \
  --topic checkouts/update \
  --api-version 2025-07 \
  --delivery-method http \
  --address "${TUNNEL}/api/webhooks" >/dev/null

echo "⏳ Waiting briefly for delivery..."
sleep 2

echo
echo "📄 Recent webhook logs:"
grep -n "\[webhooks\]" .dev_express.log | tail -n 20 || true
grep -n "\[webhooks\]\[hmac-debug\]" .dev_express.log | tail -n 20 || true

echo
echo "🧾 Latest DB event evidence for: $SHOP"
./scripts/85_check_latest_webhook_event.sh "$SHOP"

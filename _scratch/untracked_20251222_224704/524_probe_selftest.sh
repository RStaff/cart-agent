#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🧪 ABANDO webhook probe self-test"
echo "  - hits POST /api/webhooks on :3000"
echo "  - then checks probe + inbox logs (both possible cwd locations)"

TS="$(date +%s)"

echo
echo "➡️  POSTing synthetic webhook..."
curl -s -i -X POST "http://localhost:3000/api/webhooks" \
  -H "content-type: application/json" \
  -H "x-shopify-topic: checkouts/update" \
  -H "x-shopify-shop-domain: cart-agent-dev.myshopify.com" \
  -H "x-shopify-hmac-sha256: test" \
  --data "{\"hello\":\"world\",\"t\":${TS}}"

echo
echo "📄 Probe files (if present):"
for f in \
  "web/.abando_webhook_probe.jsonl" \
  "web/.abando_webhook_inbox.jsonl" \
  "web/.abando_webhook_probe.jsonl" \
  "web/.abando_webhook_inbox.jsonl" \
  ".abando_webhook_probe.jsonl" \
  ".abando_webhook_inbox.jsonl"
do
  if [ -f "$f" ]; then
    echo "=== $f ==="
    ls -lahT "$f" || true
    tail -n 25 "$f" || true
    echo
  fi
done

echo "✅ Done. If probe is still empty, run: tail -n 60 web/src/index.js | nl -ba | sed -n '1,80p'"

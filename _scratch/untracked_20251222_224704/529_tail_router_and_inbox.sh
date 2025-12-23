#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "=== LAST 25 router_use ==="
tail -n 25 web/.abando_webhook_router_enter.jsonl 2>/dev/null || true

echo
echo "=== LAST 25 inbox ==="
tail -n 25 web/.abando_webhook_inbox.jsonl 2>/dev/null || true

echo
echo "✅ Tip: If you see webhook_id + triggered_at lines in inbox after doing a real checkout, Shopify is delivering."

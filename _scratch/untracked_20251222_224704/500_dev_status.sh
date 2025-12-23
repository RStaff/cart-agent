#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "📊 Abando Dev Status"
echo

echo "=== Ports (3000/3001/3457 + proxy/tunnel 52k-59k) ==="
lsof -nP -iTCP -sTCP:LISTEN | egrep ":(3000|3001|3457|5[2-9][0-9]{3})\b" || echo "✅ none"
echo

echo "=== Dev processes (shopify/nodemon/start/cloudflared) ==="
ps aux | egrep "shopify app dev|cloudflared.*trycloudflare|nodemon start\.mjs|node start\.mjs" | egrep -v egrep || echo "✅ none"
echo

echo "=== Latest webhooks (last 8) ==="
test -f web/.abando_webhook_inbox.jsonl && tail -n 8 web/.abando_webhook_inbox.jsonl || echo "✅ no inbox file yet"

#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🔎 Searching for webhook route declarations (/api/webhooks)..."
rg -n --hidden --no-ignore "\"/api/webhooks\"|'/api/webhooks'" web/src || true

echo
echo "🔎 Searching for webhooks router imports/uses..."
rg -n --hidden --no-ignore "routes/webhooks|from\\s+[\"']\\./routes/webhooks|require\\(.+webhooks|webhooksRouter|router\\." web/src || true

echo
echo "🔎 Searching for app.use(...) that might mount routes twice..."
rg -n --hidden --no-ignore "app\\.use\\(|server\\.use\\(|express\\(\\)" web/src || true

echo
echo "✅ If you see the same router mounted twice, that explains duplicated handler_ok_send."

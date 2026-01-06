#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "== shopify app dev processes =="
pgrep -af "shopify app dev" || echo "❌ none"

echo
echo "== node src/index.js processes (web backend) =="
pgrep -af "node src/index.js" || echo "❌ none"

echo
echo "== last 120 log lines =="
tail -n 120 /tmp/abando_shopify_dev.log || true

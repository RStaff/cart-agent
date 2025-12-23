#!/usr/bin/env bash
set -euo pipefail

echo "🧨 Killing Shopify CLI / node dev processes..."
pkill -9 -f "shopify app dev" || true
pkill -9 -f "shopify-cli" || true
pkill -9 -f "cloudflared" || true
pkill -9 -f "nodemon" || true
pkill -9 -f "node start\.mjs" || true

echo
echo "🧨 Killing ANY listeners on 3000/3001/3457 and Shopify random ports (52000-59999)..."
pids=$(
  lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null \
  | awk '$1 ~ /(node|cloudflar|ruby|shopify)/ {
      split($9,a,":"); port=a[length(a)];
      if (port==3000 || port==3001 || port==3457 || (port>=52000 && port<=59999)) print $2
    }' \
  | sort -u
)

if [ -n "${pids:-}" ]; then
  echo "Killing PIDs: $pids"
  kill -9 $pids || true
else
  echo "✅ No matching listeners found."
fi

echo
echo "🔍 Remaining listeners (should be empty):"
lsof -nP -iTCP -sTCP:LISTEN | egrep ":(3000|3001|3457|5[2-9][0-9]{3})\b" || echo "✅ none"

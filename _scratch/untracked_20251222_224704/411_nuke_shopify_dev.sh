#!/usr/bin/env bash
set -euo pipefail

echo "🧨 Killing Shopify dev processes by signature..."
pkill -9 -fl -f "shopify app dev" || true
pkill -9 -l -f "shopify-cli" || true
pkill -9 -l -f "cloudflared" || true
pkill -9 -l -f "node start\.mjs" || true
pkill -9 -l -f "nodemon" || true

echo
echo "🧨 Killing listeners on common dev ports (3000/3001/3457)..."
for port in 3000 3001 3457; do
  pids=$(lsof -tiTCP:$port -sTCP:LISTEN || true)
  if [ -n "${pids:-}" ]; then
    echo " - port $port => $pids"
    kill -9 $pids || true
  else
    echo " - port $port => (none)"
  fi
done

echo
echo "🔍 Remaining listeners (sanity check):"
lsof -nP -iTCP -sTCP:LISTEN | egrep ":(3000|3001|3457)\b" || echo "✅ none on 3000/3001/3457"

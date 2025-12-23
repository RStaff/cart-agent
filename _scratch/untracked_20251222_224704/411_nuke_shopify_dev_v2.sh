#!/usr/bin/env bash
set -euo pipefail

echo "🧨 Killing Shopify dev processes (broader signatures)..."

# kill shopify CLI + its node children + cloudflared
pkill -9 -f "shopify.*app.*dev" || true
pkill -9 -f "@shopify/cli" || true
pkill -9 -f "cloudflared.*trycloudflare" || true
pkill -9 -f "node .*start\.mjs" || true
pkill -9 -f "nodemon .*start\.mjs" || true

echo
echo "🧨 Killing listeners on common dev ports + Shopify random ports..."
for port in 3000 3001 3457; do
  pids=$(lsof -tiTCP:$port -sTCP:LISTEN || true)
  [ -n "${pids:-}" ] && kill -9 $pids || true
done

# kill anything listening on 52000-59999 (GraphiQL/proxy random ports)
for pid in $(lsof -tiTCP -sTCP:LISTEN | sort -u); do
  ports=$(lsof -nP -p "$pid" -iTCP -sTCP:LISTEN 2>/dev/null | awk '{print $9}' | sed 's/.*://')
  for p in $ports; do
    if [[ "$p" =~ ^[0-9]+$ ]] && [ "$p" -ge 52000 ] && [ "$p" -le 59999 ]; then
      kill -9 "$pid" || true
      break
    fi
  done
done

echo
echo "🔍 Remaining dev listeners:"
lsof -nP -iTCP -sTCP:LISTEN | egrep ":(3000|3001|3457|5[2-9][0-9]{3})\b" || echo "✅ clean"

#!/usr/bin/env bash
set -euo pipefail

echo "🔁 Restarting dev stack (kill :3000/:3001)..."
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

./scripts/dev.sh cart-agent-dev.myshopify.com

echo
echo "🧪 Validate root redirect behavior (after restart):"
echo "-- embedded request --"
curl -fsSI "http://localhost:3000/?embedded=1&shop=cart-agent-dev.myshopify.com&hmac=x" | sed -n '1,16p' || true
echo
echo "-- normal request --"
curl -fsSI "http://localhost:3000/" | sed -n '1,16p' || true

echo
echo "✅ Done."

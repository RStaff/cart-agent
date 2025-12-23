#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🧹 Stopping current Shopify dev session (safe)..."
pkill -f "shopify app dev" 2>/dev/null || true
pkill -f "cloudflared.*trycloudflare" 2>/dev/null || true

echo "🧹 Stopping web backend (port 3000) if still running..."
p3000="$(lsof -nP -tiTCP:3000 -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$p3000" ]; then
  echo " - Killing PID(s) on :3000 => $p3000"
  for pid in $p3000; do kill -9 "$pid" 2>/dev/null || true; done
else
  echo " - :3000 already free"
fi

echo
echo "🚀 Starting fresh dev session..."
exec shopify app dev --reset

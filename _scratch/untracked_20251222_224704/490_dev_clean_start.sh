#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🧨 Stopping duplicate Shopify dev + tunnels (safe targets only)..."
pkill -f "shopify app dev" 2>/dev/null || true
pkill -f "cloudflared.*trycloudflare" 2>/dev/null || true

echo "🧨 Freeing port :3000 (kills only listeners on that port)..."
pids="$(lsof -nP -tiTCP:3000 -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$pids" ]; then
  echo "⚠️ :3000 held by PID(s): $pids"
  for pid in $pids; do
    ps -p "$pid" -o pid,ppid,command || true
    kill -9 "$pid" 2>/dev/null || true
  done
else
  echo "✅ :3000 is free"
fi

echo
echo "✅ Starting ONE dev session now..."
exec shopify app dev --reset

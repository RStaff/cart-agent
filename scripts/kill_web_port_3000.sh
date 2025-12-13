#!/usr/bin/env bash
set -euo pipefail

echo "🔪 Killing anything related to web dev + freeing port 3000..."

# Kill nodemon/web start processes first (they respawn children)
pkill -f "nodemon start.mjs" 2>/dev/null || true
pkill -f "node start.mjs" 2>/dev/null || true
pkill -f "shopify-app-template-node@1.0.0 dev" 2>/dev/null || true

# Then kill whatever is listening on 3000
if lsof -ti tcp:3000 >/dev/null 2>&1; then
  PIDS="$(lsof -ti tcp:3000 | tr '\n' ' ')"
  echo "🧹 Killing port 3000 listener(s): $PIDS"
  kill -9 $PIDS 2>/dev/null || true
fi

sleep 0.4

if lsof -ti tcp:3000 >/dev/null 2>&1; then
  echo "❌ Port 3000 still busy. Listener:"
  lsof -nP -iTCP:3000 -sTCP:LISTEN || true
  exit 1
fi

echo "✅ Port 3000 is free."

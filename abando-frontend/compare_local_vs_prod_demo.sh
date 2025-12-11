#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting dev server on port 3030..."
PORT=3030 npm run dev > /tmp/abando-dev.log 2>&1 &
DEV_PID=$!

# Give dev server time to boot
sleep 25

echo
echo "=== LOCAL /demo/playground (dev) ==="
curl -s http://localhost:3030/demo/playground | sed -n '1,60p'
echo

echo "=== PROD /demo/playground ==="
curl -s https://app.abando.ai/demo/playground | sed -n '1,60p'
echo

kill $DEV_PID || true
echo "🛑 Stopped dev server (PID $DEV_PID)"

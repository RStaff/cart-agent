#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Listening ports (3000/3001/3457)..."
for p in 3000 3001 3457; do
  echo "---- :$p ----"
  lsof -nP -iTCP:$p -sTCP:LISTEN || true
done

echo
echo "🧹 Killing known dev processes (shopify/node/nodemon/cloudflared)..."
pkill -9 -f "shopify app dev" || true
pkill -9 -f "node start\.mjs" || true
pkill -9 -f "nodemon" || true
pkill -9 -f "cloudflared" || true
pkill -9 -f "trycloudflare" || true
pkill -9 -f "shopify-cli" || true
pkill -9 -f "graphql" || true

echo
echo "🧨 Killing anything still holding ports..."
for p in 3000 3001 3457; do
  PIDS="$(lsof -t -iTCP:$p -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "${PIDS}" ]; then
    echo "Killing PIDs on :$p => $PIDS"
    kill -9 $PIDS || true
  else
    echo "OK: no listeners on :$p"
  fi
done

echo
echo "✅ Hard stop complete."

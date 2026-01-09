#!/usr/bin/env bash
set -euo pipefail

echo "== Killing dev processes =="
pkill -f "shopify app dev" || true
pkill -f cloudflared || true
pkill -f "node src/index.js" || true
pkill -f "next dev" || true
pkill -f "PORT=3000 npm run dev" || true

echo
echo "== Clearing common ports =="
for p in 3000 3457; do
  lsof -nP -iTCP:$p -sTCP:LISTEN -t 2>/dev/null | xargs -r kill -9 || true
done

echo
echo "== Starting dev stack =="
cd "$(dirname "$0")/.."
bash scripts/12_dev_up_next_then_shopify.sh

#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent/web || exit 1

echo "🔎 Verifying nothing is listening on :3000..."
lsof -nP -iTCP:3000 -sTCP:LISTEN || echo "✅ :3000 is free"

echo
echo "🚀 Starting web server (nodemon -> start.mjs) on :3000..."
# Use the same entrypoint you already hardened (start.mjs loads web/.env)
NODE_ENV=development npx nodemon start.mjs

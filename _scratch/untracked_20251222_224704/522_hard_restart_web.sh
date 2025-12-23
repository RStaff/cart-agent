#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🔎 Killing anything listening on :3000 (if any)..."
PIDS="$(lsof -nP -tiTCP:3000 -sTCP:LISTEN || true)"
if [ -n "${PIDS}" ]; then
  echo "💀 Killing: ${PIDS}"
  kill -9 ${PIDS} || true
else
  echo "✅ Nothing listening on :3000"
fi

echo "🔁 Touching watched files to force nodemon restart..."
touch web/src/index.js web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done. Check your dev terminal for nodemon restart output."

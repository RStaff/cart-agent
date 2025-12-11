#!/usr/bin/env bash
set -euo pipefail

echo "🔪 Killing anything on port 3000..."

PIDS="$(lsof -ti tcp:3000 || true)"

if [ -z "$PIDS" ]; then
  echo "✅ Nothing is listening on port 3000."
  exit 0
fi

echo "🧹 Killing PIDs: $PIDS"
echo "$PIDS" | xargs kill -9 2>/dev/null || true

sleep 1

if lsof -ti tcp:3000 >/dev/null 2>&1; then
  echo "⚠️ Port 3000 still in use after kill attempt."
else
  echo "✅ Port 3000 is now free."
fi

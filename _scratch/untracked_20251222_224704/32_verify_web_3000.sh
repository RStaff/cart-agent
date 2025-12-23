#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

SHOP="${1:-cart-agent-dev.myshopify.com}"
LOG="$ROOT/.verify_web_3000.log"
: > "$LOG"

echo "🧪 Verifying web dev server binds :3000 and stays up..."
echo "Root: $ROOT"
echo "Shop: $SHOP"
echo "Log:  $LOG"

# Ensure port is free
lsof -ti tcp:3000 | xargs -r kill -9 || true

# Start the Shopify web dev server (which runs web/start.mjs)
bash -lc "cd web && npm run dev" >"$LOG" 2>&1 &
PID="$!"
echo "PID:  $PID"

# Wait up to ~20s for port 3000
for i in {1..40}; do
  if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✅ Port 3000 is listening."
    echo
    echo "---- last 120 log lines ----"
    tail -n 120 "$LOG" || true
    echo
    echo "Stopping dev server..."
    kill "$PID" >/dev/null 2>&1 || true
    exit 0
  fi

  if ! kill -0 "$PID" >/dev/null 2>&1; then
    echo "❌ Dev process exited early."
    echo
    echo "---- log ----"
    tail -n 200 "$LOG" || true
    exit 1
  fi

  sleep 0.5
done

echo "❌ Timed out waiting for :3000."
echo
echo "---- log ----"
tail -n 200 "$LOG" || true
echo
echo "Stopping dev server..."
kill "$PID" >/dev/null 2>&1 || true
exit 1

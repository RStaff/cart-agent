#!/usr/bin/env bash
set -euo pipefail
OUT=".prod"
PORT="${PORT:-4000}"

if [ -f "$OUT/next.pid" ]; then
  PID="$(cat "$OUT/next.pid" || true)"
  if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
    echo "→ Stopping PID $PID"
    kill "$PID" || true
    sleep 0.5
  fi
  rm -f "$OUT/next.pid"
fi

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti :$PORT || true)"
  if [ -n "$PIDS" ]; then
    echo "→ Force-killing port :$PORT PIDs: $PIDS"
    kill -9 $PIDS || true
  fi
fi
echo "✅ Stopped"

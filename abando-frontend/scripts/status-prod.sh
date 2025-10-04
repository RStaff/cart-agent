#!/usr/bin/env bash
set -euo pipefail
OUT=".prod"
PORT="${PORT:-4000}"
echo "→ Status"
if [ -f "$OUT/next.pid" ]; then
  PID="$(cat "$OUT/next.pid" || true)"
  if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
    echo " PID file: $PID (running)"
  else
    echo " PID file: stale or not running"
  fi
else
  echo " No PID file"
fi
if command -v lsof >/dev/null 2>&1; then
  L="$(lsof -i :$PORT || true)"
  if [ -n "$L" ]; then
    echo " Port :$PORT listeners:"
    echo "$L"
  else
    echo " Port :$PORT is free"
  fi
fi

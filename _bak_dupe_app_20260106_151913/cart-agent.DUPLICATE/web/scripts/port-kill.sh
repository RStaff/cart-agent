#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-3000}"
if lsof -i ":${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1; then
  PIDS=$(lsof -i ":${PORT}" -sTCP:LISTEN -t)
  echo "[port-kill] killing ${PIDS} on :${PORT}…"
  kill -9 ${PIDS} || true
else
  echo "[port-kill] nothing listening on :${PORT}"
fi

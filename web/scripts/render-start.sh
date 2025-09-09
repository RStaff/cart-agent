#!/usr/bin/env bash
set -euo pipefail
echo "[start] node: $(node -v)"
echo "[start] cwd: $(pwd)  |  PORT=${PORT:-<unset>}"

(
  if [ ! -d node_modules ] || ! node -e "require.resolve('cors')" >/dev/null 2>&1; then
    echo "[start] background: installing deps…"
    npm install --omit=dev --no-audit --no-fund || true
    echo "[start] background: deps install finished"
  fi
) &

exec node start.mjs

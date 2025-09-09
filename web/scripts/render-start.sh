#!/usr/bin/env bash
set -euo pipefail
echo "[start] node: $(node -v)"
echo "[start] cwd: $(pwd)  |  PORT=${PORT:-<unset>}"

# Self-heal: if express is missing, install prod deps
if ! node -e "require.resolve('express')" >/dev/null 2>&1; then
  echo "[start] express missing; installing deps (npm ci -> npm install fallback)…"
  if [ -f package-lock.json ]; then
    npm ci --omit=dev || npm install --omit=dev --no-audit --no-fund
  else
    npm install --omit=dev --no-audit --no-fund
  fi
fi

exec node start.mjs

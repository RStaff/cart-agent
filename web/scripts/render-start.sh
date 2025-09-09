#!/usr/bin/env bash
set -euo pipefail
echo "[start] node: $(node -v)"
echo "[start] cwd: $(pwd)  |  PORT=${PORT:-<unset>}"

if [ ! -d node_modules ] || ! node -e "require.resolve('cors')" >/dev/null 2>&1; then
  echo "[start] installing deps (node_modules missing or cors not found)…"
  npm ci --include=dev
fi

echo "[start] deps ready: $(node -e "try{console.log(require.resolve('cors'))}catch(e){console.log('cors:missing')}")"
exec node start.mjs

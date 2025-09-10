#!/usr/bin/env bash
set -euo pipefail
echo "[start] node: $(node -v)"
echo "[start] cwd: $(pwd)  |  PORT=${PORT:-<unset>}"

# If express (or any core dep) is missing at runtime, install with npm install (not ci)
if ! node -e "require.resolve(\"express\")" >/dev/null 2>&1; then
  echo "[start] express missing; installing deps with npm install fallback…"
  npm install --omit=dev --no-audit --no-fund
fi

exec node start.mjs

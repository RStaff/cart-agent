#!/usr/bin/env bash
set -euo pipefail
echo "[start] node: $(node -v)"
echo "[start] cwd: $(pwd)  |  PORT=${PORT:-<unset>}"
# Strict: do NOT install at runtime; rely on CI & lockfile
exec node start.mjs

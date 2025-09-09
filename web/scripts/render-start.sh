#!/usr/bin/env bash
set -euo pipefail
echo "[start] node: $(node -v)"
echo "[start] cwd: $(pwd)  |  PORT=${PORT:-<unset>}"
exec node start.mjs

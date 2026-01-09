#!/usr/bin/env bash
set -euo pipefail
echo "[start] node: $(node -v)"
echo "[start] cwd: $(pwd)  |  PORT=${PORT:-<unset>}"
exec node start.mjs

# --- ensure DB is ready, then run migrations (resilient) ---
if [ -n "${DATABASE_URL:-}" ]; then
  /bin/bash "$(dirname "$0")/prisma-wait-and-migrate.sh"
else
  echo "[start] WARNING: DATABASE_URL is empty; skipping migrations"
fi

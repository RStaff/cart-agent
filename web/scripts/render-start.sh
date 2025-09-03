#!/usr/bin/env bash
set -euo pipefail

# App directory = the "web" folder (this file lives in web/scripts)
APP_DIR="$(cd "$(dirname "$0")/.."; pwd)"
cd "$APP_DIR"

echo "[render-start] node: $(node -v)"
export PORT="${PORT:-3000}"
echo "[render-start] cwd: $(pwd)  |  using PORT=${PORT}"

# 1) Resolve any failed/incomplete Prisma migrations (safe no-op if none)
if [ -x "$APP_DIR/scripts/resolve-failed-migrations.sh" ]; then
  echo "[render-start] resolving any failed/incomplete migrations (SQL)…"
  "$APP_DIR/scripts/resolve-failed-migrations.sh" || echo "[migrate-safe] continuing (non-fatal)…"
else
  echo "[render-start] (skip) resolve-failed-migrations.sh not found/executable"
fi

# 2) Ensure Prisma Client exists (safe retry)
echo "[render-start] checking Prisma Client presence…"
if ! node -e "require.resolve(@prisma/client)" >/dev/null 2>&1; then
  echo "[render-start] @prisma/client missing — running npx

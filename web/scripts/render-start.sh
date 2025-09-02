#!/usr/bin/env bash
set -euo pipefail

# Always run from the web workspace root (npm -w web run start:render does this, but be explicit)
cd "$(dirname "$0")/.."

echo "[render-start] resolving any failed/incomplete migrations (SQL)…"
if [ -x "./scripts/resolve-failed-migrations.sh" ]; then
  ./scripts/resolve-failed-migrations.sh
else
  echo "[render-start] (warn) resolve-failed-migrations.sh not found; skipping"
fi

echo "[render-start] checking Prisma Client presence…"
NEED_GENERATE=0

# 1) If folder is missing, we need generate
if [ ! -d "node_modules/@prisma/client" ]; then
  NEED_GENERATE=1
else
  # 2) Try requiring the client; if it fails, regenerate
  if ! node -e "require('@prisma/client')"; then
    NEED_GENERATE=1
  fi
fi

if [ "$NEED_GENERATE" -eq 1 ]; then
  echo "[render-start] @prisma/client not present/usable — running 'npx prisma generate' (safe retry)…"
  npx prisma generate --schema=./prisma/schema.prisma || {
    echo "[render-start] (warn) prisma generate failed; will still attempt migrate+start"
  }
else
  echo "[render-start] Prisma Client OK."
fi

echo "[render-start] running prisma migrate deploy…"
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "[render-start] starting app…"
exec node ./src/index.js


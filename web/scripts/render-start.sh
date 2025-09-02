#!/usr/bin/env bash
set -euo pipefail

echo "[render-start] resolving any failed/incomplete migrations (SQL)…"
scripts/resolve-failed-migrations.sh || true

echo "[render-start] running prisma migrate deploy…"
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "[render-start] starting app…"
exec node ./src/index.js

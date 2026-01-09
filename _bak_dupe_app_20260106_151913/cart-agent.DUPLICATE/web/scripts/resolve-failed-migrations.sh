#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.."; pwd)"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[migrate-safe] ❌ DATABASE_URL is not set (skip resolver)"
  exit 0
fi

echo "[migrate-safe] scanning for incomplete migrations via SQL…"
# List incomplete migrations (finished_at null and not rolled back)
INCOMPLETE=$(
  psql "$DATABASE_URL" -tA -c \
  'select migration_name from "_prisma_migrations" where finished_at is null and rolled_back_at is null;' \
  2>/dev/null || true
)

if [ -z "$INCOMPLETE" ]; then
  echo "[migrate-safe] no incomplete migrations found."
  exit 0
fi

echo "[migrate-safe] found incomplete migrations:"
echo "$INCOMPLETE" | sed 's/^/  - /'

# Mark each as rolled back so prisma migrate deploy can proceed
while IFS= read -r name; do
  [ -z "$name" ] && continue
  echo "[migrate-safe] resolving as rolled-back: $name"
  npx prisma migrate resolve --rolled-back "$name" --schema="$APP_DIR/prisma/schema.prisma"
done <<< "$INCOMPLETE"

echo "[migrate-safe] resolution complete."

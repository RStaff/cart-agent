#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[migrate-safe] ❌ DATABASE_URL is not set"; exit 0
fi

echo "[migrate-safe] scanning for incomplete migrations via SQL…"
# Get distinct names that have started but neither finished nor rolled back
names=$(psql "$DATABASE_URL" -At -c 'select distinct migration_name from "_prisma_migrations" where finished_at is null and rolled_back_at is null;') || names=""

if [ -z "$names" ]; then
  echo "[migrate-safe] no incomplete migrations found."
  exit 0
fi

echo "[migrate-safe] found incomplete migrations:"
echo "$names" | sed 's/^/  - /'

# Mark each as rolled back so prisma can proceed
while IFS= read -r name; do
  [ -z "$name" ] && continue
  echo "[migrate-safe] resolving as rolled-back: $name"
  npx prisma migrate resolve --rolled-back "$name" --schema=./prisma/schema.prisma
done <<< "$names"

echo "[migrate-safe] resolution complete."

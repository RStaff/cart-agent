#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root (works even if invoked from subdirs)
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

cd web
echo "== prisma format =="
npx prisma format

echo "== ensure single init migration =="
# use 'find' so zsh globbing never errors
if find prisma/migrations -maxdepth 1 -type d -name "*_init_carts_and_copy" | grep -q .; then
  echo "✔ init migration already present; skipping creation"
else
  echo "== try: migrate dev --create-only =="
  if DATABASE_URL="postgresql://user:pass@localhost:5432/placeholder" \
     SHADOW_DATABASE_URL="postgresql://user:pass@localhost:5432/placeholder_shadow" \
     npx prisma migrate dev --name init_carts_and_copy --create-only; then
    echo "✔ created migration via create-only"
  else
    echo "↪ falling back to prisma migrate diff"
    ts="$(date +%s)"
    dir="prisma/migrations/${ts}_init_carts_and_copy"
    mkdir -p "$dir"
    npx prisma migrate diff \
      --from-empty \
      --to-schema-datamodel prisma/schema.prisma \
      --script > "$dir/migration.sql"
    echo "✔ wrote $dir/migration.sql"
  fi
fi

echo "== prisma generate =="
npx prisma generate

echo "== git add/commit (schema + migrations) =="
git add prisma/schema.prisma prisma/migrations
git commit -m "db: init carts/items/generated_copy migrations" || true

#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../web"

echo "🔎 Prisma validate (web/)"
echo "PWD: $(pwd)"

# Ensure Prisma can see env
if [ -f .env ]; then
  echo "✔ web/.env present"
else
  echo "⚠️ web/.env missing (Prisma may still use process env)"
fi

# Validate schema + env resolution
npx prisma validate

echo "✅ prisma validate OK"

#!/usr/bin/env bash
set -euo pipefail

# Always start from the repo root (this file lives in ./scripts)
cd "$(dirname "$0")/.."

echo "📦 Resetting dev DB and reapplying migrations (including billing_models_v1)..."

cd web

# Drop and recreate the *dev* database from local migrations.
# This is safe: no live merchants, dev only.
npx prisma migrate reset --force --skip-generate --skip-seed

# Re-apply all migrations based on the current schema, including billing_models_v1
npx prisma migrate dev --name billing_models_v1

cd ..

echo "✅ Done: dev DB reset and billing_models_v1 migration applied."

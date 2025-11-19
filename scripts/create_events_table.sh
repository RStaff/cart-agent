#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set."
  echo "   Export your Render Postgres URL, e.g.:"
  echo "   export DATABASE_URL='postgres://user:pass@host:port/dbname'"
  exit 1
fi

ROOT_DIR="${HOME}/projects/cart-agent"

echo "📂 Using repo root: $ROOT_DIR"
cd "$ROOT_DIR"

echo "🗄  Applying sql/create_events_table.sql to DATABASE_URL…"
psql "$DATABASE_URL" -f sql/create_events_table.sql

echo
echo "✅ Unified events table created (or already existed)."

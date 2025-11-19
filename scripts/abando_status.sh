#!/usr/bin/env bash
set -euo pipefail

# Simple status dashboard for Abando backend + events DB

ROOT_DIR="${ROOT_DIR:-$HOME/projects/cart-agent}"
cd "$ROOT_DIR"

# Try to load env (DATABASE_URL, etc.)
if [ -f "$HOME/.zshrc" ]; then
  # Don't fail if this errors for some reason
  source "$HOME/.zshrc" || true
fi

BACKEND_URL="${ABANDO_BACKEND_URL:-https://pay.abando.ai}"

echo "📂 Repo: $PWD"
echo "🌐 Backend URL: $BACKEND_URL"
echo

echo "1) Backend health:"
curl -s "$BACKEND_URL/api/health" || echo "❌ health check failed"
echo
echo "────────────"

echo "2) Log-test → backend → DB:"
curl -s -X POST "$BACKEND_URL/api/log-test" || echo "❌ log-test call failed"
echo
echo "────────────"

if [ -z "${DATABASE_URL-}" ]; then
  echo "⚠️ DATABASE_URL is not set in this shell; skipping DB checks."
  exit 0
fi

echo "3) Events table summary:"
psql "$DATABASE_URL" -c "SELECT COUNT(*) AS events_now FROM events;"
echo "────────────"

echo "4) Last 10 events:"
psql "$DATABASE_URL" -c \
  "SELECT id,
          store_id,
          event_type,
          event_source,
          metadata->>'note' AS note,
          created_at
   FROM events
   ORDER BY created_at DESC
   LIMIT 10;"

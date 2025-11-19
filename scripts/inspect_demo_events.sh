#!/usr/bin/env bash
set -euo pipefail

ROOT_ALLOWED="$HOME/projects/cart-agent"
CWD="$(pwd)"

if [[ "$CWD" != "$ROOT_ALLOWED" ]]; then
  echo "❌ scripts/inspect_demo_events.sh must be run from:"
  echo "   $ROOT_ALLOWED"
  echo "   You are currently in:"
  echo "   $CWD"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set."
  echo "   Export it before running this script."
  exit 1
fi

echo "🔍 Inspecting recent demo-store-ai events…"
psql "$DATABASE_URL" -c "
SELECT
  store_id,
  event_type,
  metadata->'aiLabel'               AS ai_label_json,
  metadata->'aiLabel'->>'segment'   AS segment,
  metadata->'aiLabel'->>'urgency'   AS urgency,
  metadata->'aiLabel'->>'risk'      AS risk,
  metadata->>'note'                 AS note,
  created_at
FROM events
WHERE store_id = 'demo-store-ai'
ORDER BY created_at DESC
LIMIT 10;
"

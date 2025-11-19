#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set. Export it and rerun."
  exit 1
fi

STORE_ID="${1:-demo-store-ai}"

echo "📊 AI Segment Report for store_id = '$STORE_ID'"
echo

psql "$DATABASE_URL" <<SQL
-- 1) Segment distribution
SELECT
  metadata->'aiLabel'->>'segment'   AS segment,
  metadata->'aiLabel'->>'urgency'   AS urgency,
  metadata->'aiLabel'->>'risk'      AS risk,
  COUNT(*)                          AS event_count,
  ROUND(SUM(value)::numeric, 2)     AS total_value
FROM events
WHERE store_id = '$STORE_ID'
  AND metadata->'aiLabel' IS NOT NULL
GROUP BY 1,2,3
ORDER BY event_count DESC;
SQL

echo
echo "🧾 Recent labeled events for '$STORE_ID' (latest 10)…"
echo

psql "$DATABASE_URL" <<SQL
SELECT
  created_at,
  event_type,
  value,
  metadata->'aiLabel'->>'segment'   AS segment,
  metadata->'aiLabel'->>'urgency'   AS urgency,
  metadata->'aiLabel'->>'risk'      AS risk,
  metadata->>'note'                 AS note
FROM events
WHERE store_id = '$STORE_ID'
  AND metadata->'aiLabel' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
SQL

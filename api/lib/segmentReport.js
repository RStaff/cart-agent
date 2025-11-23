"use strict";

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getSegmentSummary(storeId) {
  const text = `
    SELECT
      metadata->'aiLabel'->>'segment'   AS segment,
      metadata->'aiLabel'->>'urgency'   AS urgency,
      metadata->'aiLabel'->>'risk'      AS risk,
      COUNT(*)                          AS event_count,
      ROUND(SUM(value)::numeric, 2)     AS total_value
    FROM events
    WHERE store_id = $1
      AND metadata->'aiLabel' IS NOT NULL
    GROUP BY 1,2,3
    ORDER BY event_count DESC
  `;
  const { rows } = await pool.query(text, [storeId]);
  return rows;
}

async function getRecentLabeledEvents(storeId, limit = 10) {
  const text = `
    SELECT
      created_at,
      event_type,
      value,
      metadata->'aiLabel'->>'segment'   AS segment,
      metadata->'aiLabel'->>'urgency'   AS urgency,
      metadata->'aiLabel'->>'risk'      AS risk,
      metadata->>'note'                 AS note
    FROM events
    WHERE store_id = $1
      AND metadata->'aiLabel' IS NOT NULL
    ORDER BY created_at DESC
    LIMIT $2
  `;
  const { rows } = await pool.query(text, [storeId, limit]);
  return rows;
}

module.exports = { getSegmentSummary, getRecentLabeledEvents };

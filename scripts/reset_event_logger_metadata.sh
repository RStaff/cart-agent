#!/usr/bin/env bash
set -euo pipefail

########################################
# SAFETY GUARD: enforce correct directory
########################################
ROOT_ALLOWED="$HOME/projects/cart-agent"
CWD="$(pwd)"

if [[ "$CWD" != "$ROOT_ALLOWED" ]]; then
  echo "❌ scripts/reset_event_logger_metadata.sh must be run from:"
  echo "   $ROOT_ALLOWED"
  echo "   You are currently in:"
  echo "   $CWD"
  echo
  echo "👉 Fix it with:"
  echo "   cd ~/projects/cart-agent"
  echo "   scripts/reset_event_logger_metadata.sh"
  exit 1
fi

########################################
# OVERWRITE eventLogger.js SAFELY
########################################
echo "📄 Overwriting api/lib/eventLogger.js with metadata-preserving version…"

mkdir -p api/lib

cat <<'NODE' > api/lib/eventLogger.js
"use strict";

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * logEvent: writes *exactly* the metadata you pass in to the events.metadata column.
 * No rebuilding, no stripping fields.
 */
async function logEvent(event) {
  const {
    storeId,
    eventType,
    eventSource,
    customerId,
    cartId,
    checkoutId,
    value,
    metadata,
  } = event;

  const text = `
    INSERT INTO events
      (store_id, event_type, event_source, customer_id, cart_id, checkout_id, value, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;

  const params = [
    storeId || "unknown-store",
    eventType || "event",
    eventSource || "unknown-source",
    customerId || null,
    cartId || null,
    checkoutId || null,
    value != null ? Number(value) : 0,
    metadata || {}, // <-- full JSON (includes aiLabel if you put it there)
  ];

  await pool.query(text, params);
}

module.exports = { logEvent };
NODE

echo "✅ api/lib/eventLogger.js now preserves full metadata JSON (including aiLabel)"

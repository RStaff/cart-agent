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

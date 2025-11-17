const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

async function logEvent({
  storeId,
  eventType,
  eventSource,
  customerId = null,
  cartId = null,
  checkoutId = null,
  value = null,
  aiLabel = null,
  metadata = null,
}) {
  if (!pool) return;

  const text = \`
    INSERT INTO events (
      store_id,
      event_type,
      event_source,
      customer_id,
      cart_id,
      checkout_id,
      value,
      ai_label,
      metadata
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
  \`;

  const values = [
    storeId,
    eventType,
    eventSource,
    customerId,
    cartId,
    checkoutId,
    value,
    aiLabel ? JSON.stringify(aiLabel) : null,
    metadata ? JSON.stringify(metadata) : null,
  ];

  try {
    await pool.query(text, values);
  } catch (e) {
    console.error("[eventLogger] Error:", e.message);
  }
}

module.exports = { logEvent };

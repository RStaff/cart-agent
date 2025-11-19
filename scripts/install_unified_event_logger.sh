#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"
API_DIR="$ROOT_DIR/api"
SERVER_JS="$API_DIR/server.js"
LOGGER_JS="$API_DIR/lib/eventLogger.js"

mkdir -p "$API_DIR/lib"

echo "📄 Writing unified event logger to $LOGGER_JS …"
cat << 'LOGEOF' > "$LOGGER_JS"
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

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
  const text = `
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
  `;

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
    console.log("[eventLogger] inserted event:", { storeId, eventType, eventSource });
  } catch (err) {
    console.error("[eventLogger] Failed to insert event:", err.message);
  }
}

module.exports = {
  logEvent,
};
LOGEOF

echo "✅ eventLogger.js written."

if [[ ! -f "$SERVER_JS" ]]; then
  echo "❌ $SERVER_JS not found. Aborting."
  exit 1
fi

echo "📄 Ensuring server.js requires eventLogger…"
if ! grep -q "require('./lib/eventLogger')" "$SERVER_JS"; then
  # insert require near top, after first group of requires
  perl -0pi -e "s|(const express[^\\n]*\\n)|\$1const { logEvent } = require('./lib/eventLogger');\\n|;" "$SERVER_JS"
  echo "   ✅ Added require('./lib/eventLogger') to server.js"
else
  echo "   ℹ️  Require already present, leaving as-is."
fi

echo "📌 Ensuring /api/log-test route exists…"
if ! grep -q "/api/log-test" "$SERVER_JS"; then
  cat << 'ROUTEEOF' >> "$SERVER_JS"

/**
 * Test route to verify unified events logging.
 * Safe to leave in non-prod or guard behind auth later.
 */
app.post('/api/log-test', async (req, res) => {
  try {
    await logEvent({
      storeId: 'test-store',
      eventType: 'test_event',
      eventSource: 'manual_log_test',
      customerId: 'test-customer',
      cartId: 'test-cart',
      checkoutId: 'test-checkout',
      value: 1,
      aiLabel: { kind: 'test' },
      metadata: { note: 'log-test route hit' },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error in /api/log-test:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
ROUTEEOF
  echo "   ✅ /api/log-test route appended to server.js"
else
  echo "   ℹ️  /api/log-test route already present (or at least the string is)."
fi

echo "💾 Committing changes…"
cd "$ROOT_DIR"
git add api/server.js api/lib/eventLogger.js || true
git commit -m "Ensure unified event logger and /api/log-test route" || echo "(no changes)"

echo "✅ install_unified_event_logger.sh complete."

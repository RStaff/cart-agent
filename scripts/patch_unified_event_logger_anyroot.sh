#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"

CANDIDATES=(
  "$ROOT_DIR/server.js"
  "$ROOT_DIR/api/server.js"
)

log_info() {
  echo "[$(date +%H:%M:%S)] $*"
}

for SERVER_JS in "${CANDIDATES[@]}"; do
  if [[ ! -f "$SERVER_JS" ]]; then
    log_info "Skipping $SERVER_JS (not found)."
    continue
  fi

  DIR="$(dirname "$SERVER_JS")"
  LOGGER_JS="$DIR/lib/eventLogger.js"

  log_info "▶ Patching backend root at: $SERVER_JS"
  mkdir -p "$DIR/lib"

  log_info "  • Writing logger: $LOGGER_JS"
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

  log_info "  • Ensuring require('./lib/eventLogger') is present…"
  if ! grep -q "require('./lib/eventLogger')" "$SERVER_JS"; then
    # insert require after first express require line
    perl -0pi -e "s|(const express[^\\n]*\\n)|\$1const { logEvent } = require('./lib/eventLogger');\\n|;" "$SERVER_JS"
    log_info "    ✅ Added require('./lib/eventLogger') to $(basename "$SERVER_JS")"
  else
    log_info "    ℹ️  Require already present."
  fi

  log_info "  • Ensuring /api/log-test route exists…"
  if ! grep -q "/api/log-test" "$SERVER_JS"; then
    cat << 'ROUTEEOF' >> "$SERVER_JS"

/**
 * Test route to verify unified events logging.
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
    log_info "    ✅ /api/log-test route appended to $(basename "$SERVER_JS")"
  else
    log_info "    ℹ️  /api/log-test already present in $(basename "$SERVER_JS")."
  fi

done

log_info "💾 Committing changes…"
cd "$ROOT_DIR"
git add server.js api/server.js */lib/eventLogger.js api/lib/eventLogger.js || true
git commit -m "Patch unified event logger + /api/log-test for all backends" || echo "(no changes)"

log_info "✅ patch_unified_event_logger_anyroot.sh complete."

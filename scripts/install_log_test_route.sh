#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"
SERVER_FILE="$ROOT_DIR/api/server.js"
LOGGER_FILE="$ROOT_DIR/api/lib/eventLogger.js"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set in this shell."
  echo "   Make sure it's in your ~/.zshrc or export it before running this."
  exit 1
fi

# -------------------------------
# 1) Create/overwrite eventLogger
# -------------------------------
echo "📄 Writing unified event logger to $LOGGER_FILE …"
mkdir -p "$(dirname "$LOGGER_FILE")"

cat << 'LOGGER' > "$LOGGER_FILE"
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Log a unified event into the events table.
 */
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
    console.log("[eventLogger] inserting event", eventType, storeId);
    await pool.query(text, values);
  } catch (err) {
    console.error("[eventLogger] Failed to insert event:", err);
  }
}

module.exports = { logEvent };
LOGGER

echo "✅ eventLogger.js written."

# --------------------------------------
# 2) Ensure require line in api/server.js
# --------------------------------------
echo "📄 Ensuring server.js requires eventLogger…"

if ! grep -q 'lib/eventLogger' "$SERVER_FILE"; then
  tmpfile="$(mktemp)"
  {
    echo 'const { logEvent } = require("./lib/eventLogger");'
    cat "$SERVER_FILE"
  } > "$tmpfile"
  mv "$tmpfile" "$SERVER_FILE"
  echo "   ✅ Added require('./lib/eventLogger') at top of server.js"
else
  echo "   ℹ️  Require already present, leaving as-is."
fi

# ----------------------------------
# 3) Append /api/log-test route once
# ----------------------------------
echo "📌 Ensuring /api/log-test route exists…"

if ! grep -q '/api/log-test' "$SERVER_FILE"; then
  cat << 'ROUTE' >> "$SERVER_FILE"

app.post("/api/log-test", async (req, res) => {
  try {
    await logEvent({
      storeId: "debug-store",
      eventType: "debug_log_test",
      eventSource: "api/log-test",
      customerId: null,
      cartId: null,
      checkoutId: null,
      value: null,
      aiLabel: { reason: "manual-test" },
      metadata: { ts: new Date().toISOString() },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[log-test] failed:", err);
    res.status(500).json({ ok: false, error: "log-test-failed" });
  }
});
ROUTE
  echo "   ✅ /api/log-test route appended to server.js"
else
  echo "   ℹ️  /api/log-test route already present, leaving as-is."
fi

# ----------------------------
# 4) Commit & deploy backend
# ----------------------------
cd "$ROOT_DIR"
echo "💾 Committing changes…"
git add api/lib/eventLogger.js api/server.js || true
git commit -m "Add unified event logger and /api/log-test route" || echo "(no changes to commit)"

if [[ -z "${ABANDO_BACKEND_SERVICE:-}" ]]; then
  echo "❌ ABANDO_BACKEND_SERVICE is not set."
  echo "   Example:"
  echo "   export ABANDO_BACKEND_SERVICE=\"srv-d47kiehr0fns73fh5vr0\""
  exit 1
fi

echo "🚀 Triggering backend deploy via Render CLI for $ABANDO_BACKEND_SERVICE…"
render deploys create "$ABANDO_BACKEND_SERVICE" --confirm || true

echo "⏳ Waiting 15s for deploy to settle…"
sleep 15

# ----------------------------
# 5) Hit test route + show rows
# ----------------------------
echo "📡 Calling /api/log-test on pay.abando.ai…"
curl -s -X POST https://pay.abando.ai/api/log-test ; echo

echo "🔍 Checking events table row count…"
psql "$DATABASE_URL" -c "SELECT COUNT(*) AS events_now FROM events;"

echo "🧾 Recent events:"
psql "$DATABASE_URL" -c "SELECT id, store_id, event_type, created_at FROM events ORDER BY id DESC LIMIT 5;"

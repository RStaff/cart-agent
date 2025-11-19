#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"
API_DIR="$ROOT_DIR/api"
LIB_DIR="$API_DIR/lib"

echo "📁 Ensuring lib directory exists…"
mkdir -p "$LIB_DIR"

echo "📄 Writing eventLogger.js…"
cat << 'JS' > "$LIB_DIR/eventLogger.js"
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
JS

echo "⚙️ Injecting event logger into backend routes (safe, idempotent)…"

# Add require line if missing
grep -q "eventLogger" "$API_DIR/server.js" || \
  sed -i '' '1s/^/const { logEvent } = require(".\/lib\/eventLogger");\n/' "$API_DIR/server.js"

# Add a simple event emission into autosend/scan route (first safe target)
SCAN_ROUTE="$API_DIR/routes/autosend/scan.js"
if [[ -f "$SCAN_ROUTE" ]]; then
  grep -q "logEvent" "$SCAN_ROUTE" || \
    sed -i '' 's/res.json(/await logEvent({ storeId: shop, eventType: "autosend_scan", eventSource: "backend" });\n  res.json(/' "$SCAN_ROUTE"
fi

echo "💾 Adding files to git…"
cd "$ROOT_DIR"
git add api/lib/eventLogger.js || true
git add api/routes/autosend/scan.js || true
git add api/server.js || true

git commit -m "Add automated event logger + injection" || echo "(no changes)"

echo "🚀 Triggering backend deploy on Render…"
render deploys create "$ABANDO_BACKEND_SERVICE" --confirm

echo "⏳ Waiting 5s before verifying…"
sleep 5

echo "🔍 Checking event table for new rows…"
psql "$DATABASE_URL" -c "SELECT COUNT(*) AS events_now FROM events;"

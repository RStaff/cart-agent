#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"

# DATABASE_URL must already be exported (e.g., from ~/.zshrc)
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set. Make sure it is exported or in ~/.zshrc."
  exit 1
fi

echo "📂 Using repo root: $ROOT_DIR"
cd "$ROOT_DIR"

echo "🧪 Writing Node test harness to test_log_event.js …"
cat << 'JSEOF' > test_log_event.js
const { logEvent } = require('./api/lib/eventLogger');

(async () => {
  try {
    console.log("[test_log_event] Calling logEvent()…");
    await logEvent({
      storeId: "test-store-node",
      eventType: "direct_node_test",
      eventSource: "node_test_script",
      customerId: "test-customer",
      cartId: "test-cart",
      checkoutId: "test-checkout",
      value: 123.45,
      aiLabel: { kind: "node_harness", env: "local->render" },
      metadata: {
        note: "direct Node test of logEvent()",
        ts: new Date().toISOString(),
      },
    });
    console.log("[test_log_event] logEvent() resolved without throwing.");
    process.exit(0);
  } catch (err) {
    console.error("[test_log_event] ERROR:", err);
    process.exit(1);
  }
})();
JSEOF

echo "🚀 Running Node test harness…"
node test_log_event.js || echo "⚠️ Node script exited with non-zero status."

echo
echo "🔍 Checking events table row count…"
psql "$DATABASE_URL" -c "SELECT COUNT(*) AS events_now FROM events;"

echo
echo "🧾 Last 5 events:"
psql "$DATABASE_URL" -c "SELECT id, store_id, event_type, event_source, created_at FROM events ORDER BY id DESC LIMIT 5;"

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"
API_DIR="$ROOT_DIR/api"
SERVER_FILE="$API_DIR/server.js"

if [[ ! -f "$SERVER_FILE" ]]; then
  echo "❌ server.js not found at $SERVER_FILE"
  exit 1
fi

echo "📄 Ensuring eventLogger is required in server.js…"
grep -q "eventLogger" "$SERVER_FILE" || \
  sed -i '' '1s/^/const { logEvent } = require(".\/lib\/eventLogger");\n/' "$SERVER_FILE"

echo "📌 Ensuring /api/test-event route exists…"
if grep -q "/api/test-event" "$SERVER_FILE"; then
  echo "   ✅ /api/test-event already present, skipping append."
else
  cat << 'ROUTE' >> "$SERVER_FILE"

app.post("/api/test-event", async (req, res) => {
  try {
    await logEvent({
      storeId: "test-store",
      eventType: "test_event",
      eventSource: "backend",
      metadata: { note: "manual test hit" },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("[/api/test-event] error:", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});
ROUTE
  echo "   ✅ /api/test-event appended to server.js"
fi

echo "💾 Committing changes…"
cd "$ROOT_DIR"
git add api/server.js api/lib/eventLogger.js || true
git commit -m "Add /api/test-event route for unified events logging" || echo "(no changes)"

if [[ -z "${ABANDO_BACKEND_SERVICE:-}" ]]; then
  echo "❌ ABANDO_BACKEND_SERVICE is not set. Example:"
  echo "   export ABANDO_BACKEND_SERVICE=\"srv-d47kiehr0fns73fh5vr0\""
  exit 1
fi

echo "🚀 Triggering backend deploy via Render CLI…"
render deploys create "$ABANDO_BACKEND_SERVICE" --confirm

echo "⏳ Waiting 10s for deploy to settle…"
sleep 10

echo "📡 Hitting /api/test-event on pay.abando.ai…"
curl -s -X POST https://pay.abando.ai/api/test-event || true
echo
echo "🔍 Checking events table row count…"
psql "$DATABASE_URL" -c "SELECT COUNT(*) AS events_now FROM events;"

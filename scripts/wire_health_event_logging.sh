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

echo "📌 Injecting AbandoHealthTelemetry middleware after const app = express();"
if grep -q "AbandoHealthTelemetry middleware" "$SERVER_FILE"; then
  echo "   ✅ Middleware already present, skipping insert."
else
  TMP_FILE="$SERVER_FILE.tmp"
  awk '
    /const app = express\(\);/ && !seen {
      print;
      print "";
      print "// AbandoHealthTelemetry middleware";
      print "app.use(async (req, res, next) => {";
      print "  if (req.path === \"/api/health\") {";
      print "    try {";
      print "      await logEvent({";
      print "        storeId: \"abando-system\",";
      print "        eventType: \"health_check\",";
      print "        eventSource: \"backend\",";
      print "        metadata: { path: req.path, ts: new Date().toISOString() },";
      print "      });";
      print "    } catch (e) {";
      print "      console.error(\"[health_check logger] error:\", e.message);";
      print "    }";
      print "  }";
      print "  next();";
      print "});";
      print "";
      seen=1;
      next;
    }
    { print }
  ' "$SERVER_FILE" > "$TMP_FILE"
  mv "$TMP_FILE" "$SERVER_FILE"
  echo "   ✅ Middleware inserted."
fi

echo "💾 Committing changes…"
cd "$ROOT_DIR"
git add api/server.js api/lib/eventLogger.js || true
git commit -m "Wire backend /api/health to unified events log" || echo "(no changes)"

if [[ -z "${ABANDO_BACKEND_SERVICE:-}" ]]; then
  echo "❌ ABANDO_BACKEND_SERVICE is not set. Example:"
  echo "   export ABANDO_BACKEND_SERVICE=\"srv-d2ie2c9r0fns73dbkm90\""
  exit 1
fi

echo "🚀 Triggering backend deploy via Render CLI…"
render deploys create "$ABANDO_BACKEND_SERVICE" --confirm

echo "⏳ Waiting 10s for deploy to settle…"
sleep 10

echo "📡 Hitting backend /api/health on pay.abando.ai…"
curl -s https://pay.abando.ai/api/health || true
echo
echo "🔍 Checking events table row count…"
psql "$DATABASE_URL" -c "SELECT COUNT(*) AS events_now FROM events;"

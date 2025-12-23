#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

DEV="scripts/dev.sh"
test -f "$DEV" || { echo "❌ Missing $DEV"; exit 1; }
test -f "web/start.mjs" || { echo "❌ Missing web/start.mjs"; exit 1; }
test -f "web/package.json" || { echo "❌ Missing web/package.json"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp "$DEV" "$DEV.bak_$TS"
echo "✅ Backup: $DEV.bak_$TS"

cat <<'SH' > "$DEV"
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

SHOP="${1:-cart-agent-dev.myshopify.com}"

LOG_EXPRESS=".dev_express.log"
LOG_NEXT=".dev_next.log"

echo "🚀 Starting Express via web/start.mjs (:3000) ..."
: > "$LOG_EXPRESS"

# Start Express (web dev) in background
bash -lc "cd web && npm run dev" >"$LOG_EXPRESS" 2>&1 &
PID_EXPRESS="$!"

echo "🟢 Express PID: $PID_EXPRESS"
echo "⏳ Waiting for Express (:3000)..."

# Wait up to ~20s for port 3000
for i in {1..40}; do
  if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✅ Express up (port 3000 listening)"
    break
  fi
  if ! kill -0 "$PID_EXPRESS" >/dev/null 2>&1; then
    echo "❌ Express crashed before binding :3000"
    echo "---- last 160 lines: $LOG_EXPRESS ----"
    tail -n 160 "$LOG_EXPRESS" || true
    exit 1
  fi
  sleep 0.5
done

if ! lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "❌ Timed out waiting for Express to bind :3000"
  echo "---- last 200 lines: $LOG_EXPRESS ----"
  tail -n 200 "$LOG_EXPRESS" || true
  exit 1
fi

echo "🚀 Starting Next UI (:3001) ..."
: > "$LOG_NEXT"

# Start Next in background
bash -lc "cd abando-frontend && npm run dev -- --port 3001" >"$LOG_NEXT" 2>&1 &
PID_NEXT="$!"

echo "🟢 Next PID: $PID_NEXT"
echo "⏳ Waiting for Next (:3001)..."

for i in {1..60}; do
  if lsof -nP -iTCP:3001 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✅ Next up (port 3001 listening)"
    break
  fi
  if ! kill -0 "$PID_NEXT" >/dev/null 2>&1; then
    echo "❌ Next crashed before binding :3001"
    echo "---- last 200 lines: $LOG_NEXT ----"
    tail -n 200 "$LOG_NEXT" || true
    exit 1
  fi
  sleep 0.5
done

if ! lsof -nP -iTCP:3001 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "❌ Timed out waiting for Next to bind :3001"
  echo "---- last 200 lines: $LOG_NEXT ----"
  tail -n 200 "$LOG_NEXT" || true
  exit 1
fi

echo
echo "✅ OPEN:"
echo "  UI:        http://localhost:3001/embedded?shop=$SHOP"
echo "  Playground:http://localhost:3001/demo/playground?shop=$SHOP"
echo "  Billing:   http://localhost:3001/api/billing/status?shop=$SHOP"
echo "  Preview:   http://localhost:3001/api/rescue/preview?shop=$SHOP"
echo
echo "Logs:"
echo "  tail -n 160 $LOG_EXPRESS"
echo "  tail -n 160 $LOG_NEXT"
SH

chmod +x "$DEV"
echo "✅ Patched: $DEV"

echo
echo "== Quick sanity (dev.sh launcher lines) =="
grep -nE 'cd web && npm run dev|abando-frontend|3000|3001|dev_express|dev_next' "$DEV" || true

echo
echo "NEXT:"
echo "  lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  ./scripts/dev.sh cart-agent-dev.myshopify.com"
echo "  curl -fsS 'http://localhost:3000/api/billing/status?shop=cart-agent-dev.myshopify.com' | cat"

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

TS="$(date +%Y%m%d_%H%M%S)"
echo "🔧 Aligning dev tooling to web/start.mjs"
echo "Root: $ROOT"
echo "Backup suffix: $TS"
echo

# ---------- 0) Preflight ----------
test -f "web/start.mjs" || { echo "❌ Missing web/start.mjs"; exit 1; }
test -f "web/package.json" || { echo "❌ Missing web/package.json"; exit 1; }
test -f "abando-frontend/package.json" || { echo "❌ Missing abando-frontend/package.json"; exit 1; }

# ---------- 1) Ensure web/package.json scripts ----------
cp web/package.json "web/package.json.bak_$TS"
node - <<'NODE'
const fs = require("fs");
const path = "web/package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts.dev = "cross-env NODE_ENV=development nodemon start.mjs";
pkg.scripts.start = "node start.mjs";
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
console.log("✅ web/package.json scripts set: dev -> nodemon start.mjs, start -> node start.mjs");
NODE

# ---------- 2) Patch scripts/dev.sh (authoritative launcher) ----------
DEV="scripts/dev.sh"
test -f "$DEV" || { echo "❌ Missing $DEV"; exit 1; }
cp "$DEV" "$DEV.bak_$TS"

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
bash -lc "cd web && npm run dev" >"$LOG_EXPRESS" 2>&1 &
PID_EXPRESS="$!"
echo "🟢 Express PID: $PID_EXPRESS"
echo "⏳ Waiting for Express (:3000)..."

for i in {1..60}; do
  if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✅ Express up (port 3000 listening)"
    break
  fi
  if ! kill -0 "$PID_EXPRESS" >/dev/null 2>&1; then
    echo "❌ Express crashed before binding :3000"
    echo "---- last 200 lines: $LOG_EXPRESS ----"
    tail -n 200 "$LOG_EXPRESS" || true
    exit 1
  fi
  sleep 0.5
done

if ! lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "❌ Timed out waiting for Express to bind :3000"
  echo "---- last 240 lines: $LOG_EXPRESS ----"
  tail -n 240 "$LOG_EXPRESS" || true
  exit 1
fi

echo "🚀 Starting Next UI (:3001) ..."
: > "$LOG_NEXT"
bash -lc "cd abando-frontend && npm run dev -- --port 3001" >"$LOG_NEXT" 2>&1 &
PID_NEXT="$!"
echo "🟢 Next PID: $PID_NEXT"
echo "⏳ Waiting for Next (:3001)..."

for i in {1..80}; do
  if lsof -nP -iTCP:3001 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✅ Next up (port 3001 listening)"
    break
  fi
  if ! kill -0 "$PID_NEXT" >/dev/null 2>&1; then
    echo "❌ Next crashed before binding :3001"
    echo "---- last 240 lines: $LOG_NEXT ----"
    tail -n 240 "$LOG_NEXT" || true
    exit 1
  fi
  sleep 0.5
done

if ! lsof -nP -iTCP:3001 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "❌ Timed out waiting for Next to bind :3001"
  echo "---- last 300 lines: $LOG_NEXT ----"
  tail -n 300 "$LOG_NEXT" || true
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

# ---------- 3) Patch scripts/40_dev_clean.sh to call scripts/dev.sh and VERIFY ----------
CLEAN="scripts/40_dev_clean.sh"
test -f "$CLEAN" || { echo "❌ Missing $CLEAN"; exit 1; }
cp "$CLEAN" "$CLEAN.bak_$TS"

cat <<'SH' > "$CLEAN"
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

SHOP="${1:-cart-agent-dev.myshopify.com}"

echo "🧹 Killing ports 3000 + 3001..."
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

echo "🚀 Starting Express (:3000) + Next (:3001)..."
./scripts/dev.sh "$SHOP"

echo
echo "🔎 Verifying curl to Express (:3000) and UI proxy (:3001)..."
curl -fsS "http://localhost:3000/api/billing/status?shop=$SHOP" >/dev/null
curl -fsS "http://localhost:3001/api/billing/status?shop=$SHOP" >/dev/null
echo "✅ Verified: billing/status responds on both :3000 and :3001"

echo
echo "✅ OPEN:"
echo "  UI:        http://localhost:3001/embedded?shop=$SHOP"
echo "  Playground:http://localhost:3001/demo/playground?shop=$SHOP"
echo "  Billing:   http://localhost:3001/api/billing/status?shop=$SHOP"
echo "  Preview:   http://localhost:3001/api/rescue/preview?shop=$SHOP"
echo "  Real:      http://localhost:3001/api/rescue/real?shop=$SHOP"

echo
echo "Logs:"
echo "  tail -n 160 .dev_express.log"
echo "  tail -n 160 .dev_next.log"
SH

chmod +x "$CLEAN"
echo "✅ Patched: $CLEAN"

# ---------- 4) Patch scripts/32_verify_web_3000.sh to always create log in ROOT ----------
VERIFY="scripts/32_verify_web_3000.sh"
test -f "$VERIFY" || { echo "❌ Missing $VERIFY"; exit 1; }
cp "$VERIFY" "$VERIFY.bak_$TS"

cat <<'SH' > "$VERIFY"
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

SHOP="${1:-cart-agent-dev.myshopify.com}"
LOG="$ROOT/.verify_web_3000.log"
: > "$LOG"

echo "🧪 Verifying web dev server binds :3000 and stays up..."
echo "Root: $ROOT"
echo "Shop: $SHOP"
echo "Log:  $LOG"

# Ensure port is free
lsof -ti tcp:3000 | xargs -r kill -9 || true

# Start the Shopify web dev server (which runs web/start.mjs)
bash -lc "cd web && npm run dev" >"$LOG" 2>&1 &
PID="$!"
echo "PID:  $PID"

# Wait up to ~20s for port 3000
for i in {1..40}; do
  if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✅ Port 3000 is listening."
    echo
    echo "---- last 120 log lines ----"
    tail -n 120 "$LOG" || true
    echo
    echo "Stopping dev server..."
    kill "$PID" >/dev/null 2>&1 || true
    exit 0
  fi

  if ! kill -0 "$PID" >/dev/null 2>&1; then
    echo "❌ Dev process exited early."
    echo
    echo "---- log ----"
    tail -n 200 "$LOG" || true
    exit 1
  fi

  sleep 0.5
done

echo "❌ Timed out waiting for :3000."
echo
echo "---- log ----"
tail -n 200 "$LOG" || true
echo
echo "Stopping dev server..."
kill "$PID" >/dev/null 2>&1 || true
exit 1
SH

chmod +x "$VERIFY"
echo "✅ Patched: $VERIFY"

echo
echo "✅ Alignment complete"
echo
echo "NEXT (run in order):"
echo "  1) lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  2) ./scripts/40_dev_clean.sh cart-agent-dev.myshopify.com"
echo "  3) curl -fsS 'http://localhost:3000/api/billing/status?shop=cart-agent-dev.myshopify.com' | cat"
echo "  4) curl -fsS 'http://localhost:3001/api/billing/status?shop=cart-agent-dev.myshopify.com' | cat"
echo "  5) ./scripts/41_test_billing_stub_e2e_no_boot.sh cart-agent-dev.myshopify.com"
echo "  6) ./scripts/32_verify_web_3000.sh cart-agent-dev.myshopify.com"

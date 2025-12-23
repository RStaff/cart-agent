#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

DEV="scripts/dev.sh"
WEBPKG="web/package.json"

test -f "$DEV" || { echo "❌ Missing $DEV"; exit 1; }
test -f "$WEBPKG" || { echo "❌ Missing $WEBPKG"; exit 1; }
test -f "web/start.mjs" || { echo "❌ Missing web/start.mjs"; exit 1; }

echo "🔧 Aligning scripts/dev.sh to start Express via web/start.mjs (npm run dev in /web)"
echo "Root: $ROOT"
echo

TS="$(date +%Y%m%d_%H%M%S)"
cp "$DEV" "$DEV.bak_$TS"
echo "✅ Backup: $DEV.bak_$TS"
echo

echo "1) Ensure web/package.json scripts are correct (dev uses start.mjs)…"
node - <<'NODE'
const fs = require("fs");
const path = "web/package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
pkg.scripts = pkg.scripts || {};

if (!pkg.scripts.dev || !pkg.scripts.dev.includes("nodemon") || !pkg.scripts.dev.includes("start.mjs")) {
  pkg.scripts.dev = 'cross-env NODE_ENV=development nodemon start.mjs';
}
if (!pkg.scripts.start || !pkg.scripts.start.includes("start.mjs")) {
  pkg.scripts.start = 'node start.mjs';
}

fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
console.log("✅ web/package.json scripts verified/updated");
NODE

echo
echo "2) Patch scripts/dev.sh so Express is launched with: (cd web && npm run dev)"
echo "   and logs still go to .dev_express.log as before."

# Replace any "npm start" / "npm run start" usage that is starting the server
# with a guaranteed "cd web && npm run dev" launcher.
# This is a best-effort patch: it targets the command that backgrounds Express and writes .dev_express.log.
perl -0777 -i -pe '
  # Replace common patterns that launch root start -> web/src/index.js
  s{
    (?:npm\s+run\s+start|npm\s+start)              # npm start
    (?:[^\n]*?)                                   # anything on same line
  }{bash -lc "cd web && npm run dev"}gix;

  # If dev.sh uses a bash -lc wrapper already, ensure it cd\'s into web
  s{
    bash\s+-lc\s+["'\'']\s*(?:set\s+-a;[^"'\'']*;\s*)?npm\s+(?:run\s+dev|run\s+start|start)\s*["'\'']
  }{bash -lc "cd web && npm run dev"}gix;
' "$DEV"

echo "✅ Patched: $DEV"
echo

echo "== Sanity: show dev.sh lines that start Express =="
grep -nE 'cd web && npm run dev|npm start|npm run start|node .*web/src/index\.js' "$DEV" || true

echo
echo "✅ Alignment complete."
echo
echo "NEXT (run in order):"
echo "  1) lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  2) ./scripts/40_dev_clean.sh cart-agent-dev.myshopify.com"
echo "  3) curl -fsS http://localhost:3000/api/billing/status?shop=cart-agent-dev.myshopify.com | cat"
echo "  4) curl -fsS http://localhost:3001/api/billing/status?shop=cart-agent-dev.myshopify.com | cat"
echo "  5) ./scripts/41_test_billing_stub_e2e_no_boot.sh cart-agent-dev.myshopify.com"

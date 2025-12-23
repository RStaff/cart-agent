#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

echo "🛠  Fixing: ensure smc-preload.cjs is applied when running web/start.mjs"
echo "Root: $ROOT"
echo

WEB_PKG="web/package.json"
DEV_SH="scripts/dev.sh"
PRELOAD_WEB="./smc-preload.cjs"          # relative to web/
PRELOAD_ROOT="./web/smc-preload.cjs"     # relative to repo root

test -f "$WEB_PKG" || { echo "❌ Missing $WEB_PKG"; exit 1; }
test -f "$DEV_SH" || { echo "❌ Missing $DEV_SH"; exit 1; }
test -f "web/smc-preload.cjs" || { echo "❌ Missing web/smc-preload.cjs"; exit 1; }
test -f "web/start.mjs" || { echo "❌ Missing web/start.mjs"; exit 1; }

echo "1) Patching web/package.json scripts (dev/start) to include preload via NODE_OPTIONS..."

node - <<'NODE'
import fs from "fs";

const pkgPath = "web/package.json";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.scripts = pkg.scripts || {};

pkg.scripts.dev =
  'cross-env NODE_ENV=development NODE_OPTIONS="--require ./smc-preload.cjs" nodemon start.mjs';

pkg.scripts.start =
  'NODE_OPTIONS="--require ./smc-preload.cjs" node start.mjs';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log("✅ web/package.json updated (dev/start now preload env)");
NODE

echo
echo "2) Patching scripts/dev.sh to run web/start.mjs WITH preload..."

# Replace "node web/start.mjs" with "node --require ./web/smc-preload.cjs web/start.mjs" (idempotent)
perl -i -pe '
  s{node\s+web/start\.mjs}{node --require ./web/smc-preload.cjs web/start.mjs}g;
' "$DEV_SH"

echo "✅ scripts/dev.sh updated"
echo
echo "== Sanity =="
echo "--- scripts/dev.sh (start command lines) ---"
grep -nE 'node .*web/start\.mjs' "$DEV_SH" || true

echo
echo "--- web/package.json scripts ---"
node - <<'NODE'
const pkg = require("./web/package.json");
console.log(pkg.scripts);
NODE

echo
echo "✅ Preload restored for start.mjs"
echo "Next:"
echo "  lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  ./scripts/40_dev_clean.sh cart-agent-dev.myshopify.com"
echo "  ./scripts/48_diag_billing_500.sh cart-agent-dev.myshopify.com"

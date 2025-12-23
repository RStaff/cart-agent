#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

echo "🔧 Aligning dev + start to web/start.mjs"
echo "Root: $ROOT"
echo

### ------------------------------------------------------------------
### 1) Patch web/package.json
### ------------------------------------------------------------------

WEB_PKG="web/package.json"
test -f "$WEB_PKG" || { echo "❌ $WEB_PKG not found"; exit 1; }

echo "📦 Patching web/package.json scripts..."

node - <<'NODE'
import fs from "fs";

const pkgPath = "web/package.json";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

pkg.scripts = pkg.scripts || {};

// dev → nodemon start.mjs
pkg.scripts.dev =
  "cross-env NODE_ENV=development nodemon start.mjs";

// start → plain node start.mjs (prod / render)
pkg.scripts.start =
  "node start.mjs";

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log("✅ web/package.json updated");
NODE

echo

### ------------------------------------------------------------------
### 2) Patch scripts/dev.sh to call web/start.mjs
### ------------------------------------------------------------------

DEV_SH="scripts/dev.sh"
test -f "$DEV_SH" || { echo "❌ $DEV_SH not found"; exit 1; }

echo "🚀 Patching scripts/dev.sh..."

perl -0777 -i -pe '
  s{
    node\s+--require\s+\S+\s+web/src/index\.js
  }{
    node web/start.mjs
  }gx
' "$DEV_SH"

echo "✅ scripts/dev.sh updated"
echo

### ------------------------------------------------------------------
### 3) Sanity checks
### ------------------------------------------------------------------

echo "🔎 Sanity checks"

echo
echo "--- index.js listen/export ---"
grep -nE 'app\.listen\(|export\s+default\s+app' web/src/index.js || true

echo
echo "--- start.mjs listen ---"
grep -nE 'server\.listen|EADDRINUSE|listening' web/start.mjs || true

echo
echo "--- web/package.json scripts ---"
node - <<'NODE'
const pkg = require("./web/package.json");
console.log(pkg.scripts);
NODE

echo
echo "✅ Alignment complete"
echo
echo "NEXT (run in order):"
echo "  1) lsof -ti tcp:3000 | xargs -r kill -9"
echo "     lsof -ti tcp:3001 | xargs -r kill -9"
echo "  2) ./scripts/40_dev_clean.sh cart-agent-dev.myshopify.com"
echo "  3) ./scripts/41_test_billing_stub_e2e_no_boot.sh cart-agent-dev.myshopify.com"
echo "  4) ./scripts/32_verify_web_3000.sh"

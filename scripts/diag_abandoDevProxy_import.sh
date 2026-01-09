#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/abandoDevProxy.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "===== abandoDevProxy.js (imports) ====="
rg -n 'from\s+"http-proxy-middleware"|require\("http-proxy-middleware"\)|http-proxy-middleware' "$FILE" || true

echo
echo "===== web/package.json (dependency lines) ====="
node - <<'NODE'
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("web/package.json","utf8"));
console.log("dependencies:", p.dependencies?.["http-proxy-middleware"] || null);
console.log("devDependencies:", p.devDependencies?.["http-proxy-middleware"] || null);
NODE

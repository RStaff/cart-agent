#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

NODE_VER="20.19.5"

echo "$NODE_VER" > .nvmrc
echo "✅ Wrote .nvmrc = $NODE_VER"

node - <<'NODE'
const fs = require("fs");
const path = "package.json";
const pkg = JSON.parse(fs.readFileSync(path,"utf8"));
pkg.engines = pkg.engines || {};
pkg.engines.node = ">=20 <21";
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
console.log("✅ Patched package.json engines.node to '>=20 <21'");
NODE

echo ""
echo "ℹ️ Current node:"
node -v || true
echo "ℹ️ Current npm:"
npm -v || true

echo ""
echo "NEXT:"
echo "  (optional) nvm install && nvm use"

#!/usr/bin/env bash
set -euo pipefail

FILE="package.json"
test -f "$FILE" || { echo "❌ package.json not found"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

node <<'NODE'
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
pkg.engines ||= {};
pkg.engines.node = "20.x";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("✅ Set engines.node = 20.x");
NODE

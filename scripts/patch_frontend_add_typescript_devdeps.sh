#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/package.json"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

node <<'NODE'
const fs = require("fs");
const p = "abando-frontend/package.json";
const pkg = JSON.parse(fs.readFileSync(p, "utf8"));

pkg.devDependencies ||= {};
pkg.devDependencies.typescript ||= "^5.6.3";
pkg.devDependencies["@types/node"] ||= "^20.17.10";

fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
console.log("✅ Added devDependencies: typescript, @types/node");
NODE

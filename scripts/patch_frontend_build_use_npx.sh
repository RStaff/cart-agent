#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/package.json"

test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

node <<'NODE'
const fs = require("fs");

const path = "abando-frontend/package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));

pkg.scripts ||= {};

if (!pkg.scripts.build) {
  console.error("❌ No build script found in abando-frontend");
  process.exit(1);
}

if (pkg.scripts.build.trim() === "next build") {
  pkg.scripts.build = "npx next build";
  console.log("✅ Replaced frontend build with `npx next build`");
} else {
  console.log("ℹ️ Frontend build already patched:", pkg.scripts.build);
}

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
NODE

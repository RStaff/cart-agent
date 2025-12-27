#!/usr/bin/env bash
set -euo pipefail

FILE="package.json"

test -f "$FILE" || { echo "❌ package.json not found"; exit 1; }

# Backup
cp "$FILE" "$FILE.bak_$(date +%s)"

node <<'NODE'
const fs = require("fs");

const path = "package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));

pkg.scripts ||= {};

if (!pkg.scripts.build) {
  console.error("❌ No build script found");
  process.exit(1);
}

if (pkg.scripts.build.includes("shopify")) {
  pkg.scripts.build = "npm --prefix abando-frontend run build";
  console.log("✅ Replaced build script to frontend-only build");
} else {
  console.log("ℹ️ Build script already does not reference shopify");
}

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
NODE

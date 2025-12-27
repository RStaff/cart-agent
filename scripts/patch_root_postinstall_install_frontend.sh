#!/usr/bin/env bash
set -euo pipefail

FILE="package.json"
test -f "$FILE" || { echo "❌ package.json not found"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

node <<'NODE'
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
pkg.scripts ||= {};

// Ensure abando-frontend dependencies are installed in CI/Vercel
// Using npm ci when lockfile exists; fallback to install.
const cmd = "cd abando-frontend && (test -f package-lock.json && npm ci || npm install)";

if (!pkg.scripts.postinstall) {
  pkg.scripts.postinstall = cmd;
  console.log("✅ Added postinstall to install abando-frontend deps");
} else if (!pkg.scripts.postinstall.includes("abando-frontend")) {
  pkg.scripts.postinstall = pkg.scripts.postinstall + " && " + cmd;
  console.log("✅ Appended abando-frontend install to existing postinstall");
} else {
  console.log("ℹ️ postinstall already handles abando-frontend");
}

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
NODE

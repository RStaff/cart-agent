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
if (pkg.scripts.build && pkg.scripts.build.includes("npx next build")) {
  pkg.scripts.build = pkg.scripts.build.replace("npx next build", "next build");
  console.log("✅ Replaced build script: npx next build -> next build");
} else {
  console.log("ℹ️ build script not using npx next build (no change)");
}

// Ensure next is declared so CI doesn't auto-install random versions
pkg.dependencies ||= {};
pkg.devDependencies ||= {};

const hasNext = (pkg.dependencies.next || pkg.devDependencies.next);
if (!hasNext) {
  pkg.dependencies.next = "15.5.3";
  console.log("✅ Added dependencies.next = 15.5.3 (align with your earlier lock)");
} else {
  console.log("ℹ️ next already declared:", hasNext);
}

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
NODE

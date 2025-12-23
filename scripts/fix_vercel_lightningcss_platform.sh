#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Removing darwin-only dependency: lightningcss-darwin-arm64"

# Safety backups
cp package.json "package.json.bak_$(date +%s)"
[ -f package-lock.json ] && cp package-lock.json "package-lock.json.bak_$(date +%s)" || true
[ -f abando-frontend/package-lock.json ] && cp abando-frontend/package-lock.json "abando-frontend/package-lock.json.bak_$(date +%s)" || true

# Remove the bad dependency from package.json (root)
node - <<'NODE'
const fs = require("fs");
const p = "package.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));

let changed = false;
for (const k of ["dependencies","devDependencies","optionalDependencies"]) {
  if (j[k] && j[k]["lightningcss-darwin-arm64"]) {
    delete j[k]["lightningcss-darwin-arm64"];
    changed = true;
  }
}

if (!changed) {
  console.log("ℹ️  dependency not found in package.json (already fixed?)");
} else {
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  console.log("✅ package.json updated");
}
NODE

echo "🧹 Removing lockfiles + node_modules to regenerate cleanly..."
rm -rf node_modules package-lock.json
rm -rf abando-frontend/node_modules abando-frontend/package-lock.json || true

echo "📦 Reinstalling at repo root..."
npm install

echo "🔍 Confirm darwin-arm64 is NOT a direct dependency anymore..."
node - <<'NODE'
const j = require("./package.json");
const has = (obj)=> obj && obj["lightningcss-darwin-arm64"];
if (has(j.dependencies) || has(j.devDependencies) || has(j.optionalDependencies)) {
  console.error("❌ Still present in package.json (unexpected).");
  process.exit(1);
}
console.log("✅ package.json clean (no lightningcss-darwin-arm64)");
NODE

echo "🔍 Confirm npm tree no longer forces it..."
npm ls lightningcss-darwin-arm64 --all || true

echo "✅ Done. Commit these changes and push."

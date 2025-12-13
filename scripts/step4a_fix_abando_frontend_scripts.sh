#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

PKG="abando-frontend/package.json"
if [ ! -f "$PKG" ]; then
  echo "❌ Missing $PKG"
  exit 1
fi

cp "$PKG" "$PKG.bak_$(date +%s)"
echo "✅ Backup: $PKG.bak_$(date +%s 2>/dev/null || true)"

node - <<'NODE'
const fs = require("fs");
const path = "abando-frontend/package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));

pkg.scripts = pkg.scripts || {};

// Ensure Next scripts exist (do not overwrite if you already customized)
if (!pkg.scripts.dev)   pkg.scripts.dev   = "next dev";
if (!pkg.scripts.build) pkg.scripts.build = "next build";
if (!pkg.scripts.start) pkg.scripts.start = "next start -p 3001";

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
console.log("✅ Patched abando-frontend/package.json scripts:");
console.log("   dev  =", pkg.scripts.dev);
console.log("   build=", pkg.scripts.build);
console.log("   start=", pkg.scripts.start);
NODE

echo ""
echo "NEXT:"
echo "  (if needed) npm --prefix abando-frontend install"
echo "  npm --prefix abando-frontend run dev -- --port 3001"

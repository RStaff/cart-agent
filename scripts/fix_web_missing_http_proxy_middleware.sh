#!/usr/bin/env bash
set -euo pipefail

PKG="web/package.json"
test -f "$PKG" || { echo "❌ Missing $PKG"; exit 1; }

TS="$(date +%s)"
cp "$PKG" "$PKG.bak_$TS"
echo "📦 Backup: $PKG.bak_$TS"

node - <<'NODE'
const fs = require("fs");

const pkgPath = "web/package.json";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

pkg.dependencies ||= {};
pkg.devDependencies ||= {};

// Put it in dependencies so runtime imports always resolve (safe choice).
if (!pkg.dependencies["http-proxy-middleware"] && !pkg.devDependencies["http-proxy-middleware"]) {
  pkg.dependencies["http-proxy-middleware"] = "^3.0.0";
  console.log("✅ Added dependency: http-proxy-middleware@^3.0.0");
} else {
  console.log("ℹ️ http-proxy-middleware already present in package.json");
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
NODE

echo
echo "📥 Installing in ./web ..."
( cd web && npm install )

echo
echo "🔎 Verify install:"
( cd web && node -p "require('./package.json').dependencies?.['http-proxy-middleware'] || require('./package.json').devDependencies?.['http-proxy-middleware'] || 'MISSING'" )

echo
echo "✅ Done. Re-run: shopify app dev"

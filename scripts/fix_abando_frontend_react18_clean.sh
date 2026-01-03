#!/usr/bin/env bash
set -euo pipefail

DIR="abando-frontend"
PKG="$DIR/package.json"

test -f "$PKG" || { echo "❌ Missing $PKG"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
echo "📦 Backing up package files..."
cp "$PKG" "$PKG.bak_$TS"
test -f "$DIR/package-lock.json" && cp "$DIR/package-lock.json" "$DIR/package-lock.json.bak_$TS" || true

echo "🩹 Patching package.json to React 18.2.0 + removing react-server-dom-webpack if present..."
node - <<'NODE'
const fs = require("fs");
const path = require("path");
const pkgPath = path.resolve("abando-frontend/package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

pkg.dependencies = pkg.dependencies || {};
pkg.dependencies["react"] = "18.2.0";
pkg.dependencies["react-dom"] = "18.2.0";

// Remove if it exists (this is the common React 19 residue causing invalid trees)
if (pkg.dependencies["react-server-dom-webpack"]) delete pkg.dependencies["react-server-dom-webpack"];
if (pkg.devDependencies && pkg.devDependencies["react-server-dom-webpack"]) delete pkg.devDependencies["react-server-dom-webpack"];

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log("✅ Updated", pkgPath);
NODE

echo "🧨 Removing node_modules + lock (clean slate)..."
rm -rf "$DIR/node_modules" || true
rm -f "$DIR/package-lock.json" || true

echo "📥 Reinstalling..."
npm --prefix "$DIR" install

echo
echo "🔎 Verifying key versions..."
npm --prefix "$DIR" ls react react-dom next @shopify/app-bridge @shopify/app-bridge-react @shopify/polaris | head -n 120 || true

echo
echo "✅ Done."

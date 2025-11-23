#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
BACKEND_DIR="$ROOT/web"

echo "=== Backend manifest inspector ==="
echo "Repo root: $ROOT"
echo "Backend dir: $BACKEND_DIR"
echo

if [ ! -d "$BACKEND_DIR" ]; then
  echo "❌ web/ backend directory not found."
  exit 1
fi

cd "$BACKEND_DIR"

if [ ! -f package.json ]; then
  echo "❌ No package.json in web/; cannot inspect scripts."
  exit 1
fi

echo "→ web/package.json:"
node - << 'NODE'
const fs = require('fs');
const path = require('path');
const pkg = JSON.parse(fs.readFileSync(path.join('package.json'), 'utf8'));
console.log(JSON.stringify({
  name: pkg.name,
  version: pkg.version,
  main: pkg.main || null,
  type: pkg.type || null,
  scripts: pkg.scripts || {}
}, null, 2));
NODE

echo
if [ -d prisma ]; then
  echo "→ Prisma schema present:"
  ls -1 prisma
else
  echo "⚠️ No prisma directory in web/ (unexpected for the real backend)."
fi

echo
echo "✅ Backend manifest inspected."

#!/usr/bin/env bash
set -euo pipefail

echo "=== Abando: full frontend clean ==="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/abando-frontend"

cd "$FRONTEND"

echo "→ Removing .next ..."
rm -rf .next || true

echo "→ Removing node_modules ..."
rm -rf node_modules || true

echo "→ Installing fresh deps (npm install) ..."
npm install

echo "=== Frontend clean complete ==="

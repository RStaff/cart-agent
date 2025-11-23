#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/abando-frontend"

echo "=== Abando frontend dev (fixed port 3001) ==="
echo "→ Frontend dir: $FRONTEND"

cd "$FRONTEND"

# Ensure deps are present
if [ ! -d "node_modules" ]; then
  echo "→ node_modules missing, running npm install..."
  npm install
fi

echo "→ Running: npm run dev -- -p 3001"
npm run dev -- -p 3001

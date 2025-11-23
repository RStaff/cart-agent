#!/usr/bin/env bash
set -euo pipefail

echo "=== Abando frontend deploy → Vercel production ==="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT/abando-frontend"

cd "$FRONTEND_DIR"

if [ ! -x "./scripts/deploy_abando_frontend.sh" ]; then
  echo "❌ ./scripts/deploy_abando_frontend.sh not found or not executable."
  echo "   Check abando-frontend/scripts and fix before re-running."
  exit 1
fi

./scripts/deploy_abando_frontend.sh

echo "✅ Frontend deploy script finished."

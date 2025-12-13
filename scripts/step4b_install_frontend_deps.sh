#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ ! -d "abando-frontend/node_modules" ]; then
  echo "📦 Installing abando-frontend dependencies..."
  npm --prefix abando-frontend install
else
  echo "✅ abando-frontend/node_modules exists (skipping install)"
fi

echo "NEXT:"
echo "  ./scripts/step4c_dev_boot_and_paid_smoke_v2.sh example.myshopify.com"

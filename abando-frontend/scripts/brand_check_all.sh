#!/usr/bin/env bash
set -e

echo "🔄 Running full brand sync + tests…"
echo

./scripts/sync_brand_assets.sh
./scripts/test_brand_assets.sh

echo
echo "✨ Brand system fully validated."

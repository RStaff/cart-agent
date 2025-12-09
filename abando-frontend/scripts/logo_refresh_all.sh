#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🔁 Refreshing Abando logo + brand assets…"

./scripts/set_correct_logo.sh
./scripts/clean_logo_variants.sh
./scripts/sync_brand_assets.sh
./scripts/brand_check_all.sh

echo "✅ Logo + brand refresh complete."
echo "   If dev server is running on :3000, URL checks were included."

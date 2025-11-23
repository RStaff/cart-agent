#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! git diff --quiet -- shopify-listing/shopify-listing.md 2>/dev/null; then
  echo "▶ Staging Shopify listing file…"
  git add shopify-listing/shopify-listing.md

  echo "▶ Committing Shopify listing file…"
  git commit -m "Add Shopify App Store listing copy pack"

  echo "✅ Commit created."
else
  echo "ℹ️ No changes detected in shopify-listing/shopify-listing.md"
fi

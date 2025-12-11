#!/usr/bin/env bash
set -euo pipefail

echo "[shopify-sync] Starting…"

# Resolve repo root so the script works from anywhere
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Base folder where Shopify put the monotone SVGs in iCloud
BASE="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Downloads/Shopify brand assets/03 - Monotone/svg"

FILES=(
  "shopify_monotone_white.svg"
  "shopify_monotone_black.svg"
)

mkdir -p "$REPO_ROOT/public"

copied=0
missing=0

for NAME in "${FILES[@]}"; do
  SRC="$BASE/$NAME"
  DEST="$REPO_ROOT/public/$NAME"

  if [ -f "$SRC" ]; then
    cp "$SRC" "$DEST"
    echo "[shopify-sync] ✅ Copied: $NAME → public/$NAME"
    ((copied++))
  else
    echo "[shopify-sync] ⚠️ Missing source:"
    echo "                $SRC"
    ((missing++))
  fi
done

echo
echo "[shopify-sync] Summary: copied=$copied missing=$missing"

# Fail hard if anything is missing so CI / future scripts can catch it
if [ "$missing" -gt 0 ]; then
  echo "[shopify-sync] ❌ One or more Shopify logo files are missing."
  exit 1
fi

echo "[shopify-sync] ✅ All Shopify logo assets are in public/."

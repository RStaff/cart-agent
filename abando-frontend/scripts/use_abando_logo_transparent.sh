#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRAND_DIR="$ROOT/public/brand"
LOGO_FILE="$BRAND_DIR/abando-logo-transparent.png"

echo "▶ Checking for transparent logo at: $LOGO_FILE"
if [ ! -f "$LOGO_FILE" ]; then
  echo "❌ abando-logo-transparent.png not found in public/brand."
  echo "   Make sure it exists at: $LOGO_FILE"
  exit 1
fi

NAV_FILE="$ROOT/src/components/NavbarV2.tsx"

if [ ! -f "$NAV_FILE" ]; then
  echo "❌ NavbarV2.tsx not found at $NAV_FILE"
  exit 1
fi

echo "▶ Updating NavbarV2 to use /brand/abando-logo-transparent.png"

# Replace any existing abando logo png path with the transparent one
perl -0pi -e '
  s{(/brand/)[^"]*abando[^"]*\.png}{$1abando-logo-transparent.png}gi;
  s{(/)abando-logo\.png}{$1brand/abando-logo-transparent.png}gi;
' "$NAV_FILE"

echo "✅ NavbarV2 now points to /brand/abando-logo-transparent.png"

#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRAND_DIR="$PROJECT_ROOT/public/brand"
mkdir -p "$BRAND_DIR"

echo "▶ Syncing brand assets into: $BRAND_DIR"

# ---- SOURCE PATHS (based on your screenshots) ----
SHOPIFY_LOGO_SRC="$HOME/Downloads/Shopify brand assets/01 - Logo/png/shopify_logo_white.png"
ABANDO_TRANSPARENT_SRC="$HOME/projects/cart-agent/abando-frontend/public/brand/abando-logo-transparent.png"

# If abando transparent logo doesn't exist at that path yet, fall back to Downloads
if [ ! -f "$ABANDO_TRANSPARENT_SRC" ]; then
  ABANDO_TRANSPARENT_SRC="$HOME/Downloads/abando-logo-transparent.png"
fi

# ---- COPY INTO FRONTEND PUBLIC FOLDER ----
if [ ! -f "$SHOPIFY_LOGO_SRC" ]; then
  echo "❌ Shopify logo source not found at:"
  echo "   $SHOPIFY_LOGO_SRC"
  exit 1
fi

if [ ! -f "$ABANDO_TRANSPARENT_SRC" ]; then
  echo "❌ Abando transparent logo source not found."
  echo "   Tried:"
  echo "   - $HOME/projects/cart-agent/abando-frontend/public/brand/abando-logo-transparent.png"
  echo "   - $HOME/Downloads/abando-logo-transparent.png"
  exit 1
fi

cp "$SHOPIFY_LOGO_SRC"       "$BRAND_DIR/shopify-logo-white.png"
cp "$ABANDO_TRANSPARENT_SRC" "$BRAND_DIR/abando-logo-transparent.png"

echo "✅ Copied:"
echo "   - shopify-logo-white.png"
echo "   - abando-logo-transparent.png"

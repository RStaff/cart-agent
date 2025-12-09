#!/usr/bin/env bash
# Sync Shopify + Abando logo assets into Next.js public/

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[brand-sync] Repo root: $REPO_ROOT"
echo "[brand-sync] Starting…"
echo

mkdir -p "$REPO_ROOT/public"

#######################################
# Shopify monotone logos (white/black)
#######################################
SHOPIFY_BASE="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Downloads/Shopify brand assets/03 - Monotone/svg"

SHOPIFY_FILES=(
  "shopify_monotone_white.svg"
  "shopify_monotone_black.svg"
)

for NAME in "${SHOPIFY_FILES[@]}"; do
  SRC="$SHOPIFY_BASE/$NAME"
  DEST="$REPO_ROOT/public/$NAME"

  if [ -f "$SRC" ]; then
    cp "$SRC" "$DEST"
    echo "[brand-sync] ✅ Copied: $NAME → public/$NAME"
  else
    echo "[brand-sync] ⚠️ Missing Shopify asset:"
    echo "            $SRC"
  fi
done

############################
# Abando primary logo (PNG)
############################

# Try to auto-locate abando-logo.png in common places
ABANDO_SRC="$(find "$HOME/Downloads" "$HOME/Library/Mobile Documents/com~apple~CloudDocs" -type f -name 'abando-logo.png' 2>/dev/null | head -n 1 || true)"
ABANDO_DEST="$REPO_ROOT/public/abando-logo.png"

if [ -n "$ABANDO_SRC" ] && [ -f "$ABANDO_SRC" ]; then
  cp "$ABANDO_SRC" "$ABANDO_DEST"
  echo "[brand-sync] ✅ Copied: $(basename "$ABANDO_SRC") → public/abando-logo.png"
else
  if [ -f "$ABANDO_DEST" ]; then
    echo "[brand-sync] ✅ Using existing public/abando-logo.png"
  else
    echo "[brand-sync] ⚠️ Abando logo not found in Downloads/iCloud and not in public/."
    echo "            Make sure abando-logo.png exists either in Downloads or public/."
  fi
fi

echo
echo "[brand-sync] Done."

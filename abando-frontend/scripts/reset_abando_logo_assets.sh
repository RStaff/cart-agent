#!/usr/bin/env bash
set -e

# Resolve repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_SMALL="$HOME/Downloads/abando-logo-transparent.png.png"
DEST_DIR="$REPO_ROOT/public"

echo "[logo-reset] Repo root: $REPO_ROOT"
echo "[logo-reset] Source small transparent logo: $SRC_SMALL"
echo

if [ ! -f "$SRC_SMALL" ]; then
  echo "[logo-reset] ❌ Expected source logo not found."
  exit 1
fi

mkdir -p "$DEST_DIR"

# Use the tiny transparent logo for BOTH filenames
cp "$SRC_SMALL" "$DEST_DIR/abando-logo-transparent.png"
cp "$SRC_SMALL" "$DEST_DIR/abando-logo.png"

# If the big inline logo exists, back it up so nothing in the UI can accidentally use it
if [ -f "$DEST_DIR/abando-logo.inline.png" ]; then
  mv "$DEST_DIR/abando-logo.inline.png" "$DEST_DIR/abando-logo.inline.backup.png"
  echo "[logo-reset] 🗂  Backed up abando-logo.inline.png → abando-logo.inline.backup.png"
fi

echo "[logo-reset] ✅ public/abando-logo-transparent.png → 28x26 transparent"
echo "[logo-reset] ✅ public/abando-logo.png → 28x26 transparent"

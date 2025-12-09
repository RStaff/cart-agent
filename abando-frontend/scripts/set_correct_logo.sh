#!/usr/bin/env bash
set -e

# Resolve repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC="$HOME/Downloads/abando-logo-transparent.png.png"
DEST="$REPO_ROOT/public/abando-logo.png"

echo "[logo-set] Using source:"
echo "  $SRC"
echo

if [ ! -f "$SRC" ]; then
  echo "[logo-set] ❌ Source file not found."
  exit 1
fi

mkdir -p "$REPO_ROOT/public"
cp "$SRC" "$DEST"

echo "[logo-set] ✅ Copied:"
echo "  $SRC"
echo "    → $DEST"

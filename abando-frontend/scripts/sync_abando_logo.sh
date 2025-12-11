#!/bin/bash

echo "[abando-logo] Starting logo sync…"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Your actual file from the screenshot:
SRC_LOGO="$HOME/Downloads/abando-logo-transparent.png.png"

DEST_LOGO="$REPO_ROOT/public/abando-logo.png"

echo "[abando-logo] Repo root: $REPO_ROOT"
echo "[abando-logo] Source:    $SRC_LOGO"
echo "[abando-logo] Dest:      $DEST_LOGO"
echo

mkdir -p "$REPO_ROOT/public"

if [ -f "$SRC_LOGO" ]; then
  cp "$SRC_LOGO" "$DEST_LOGO"
  echo "[abando-logo] ✅ Copied small Abando logo → public/abando-logo.png"
else
  echo "[abando-logo] ❌ SOURCE LOGO NOT FOUND"
  echo "              Expected at:"
  echo "              $SRC_LOGO"
  echo "              Make sure the file name is correct."
  exit 1
fi

echo "[abando-logo] Done."

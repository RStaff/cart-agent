#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[brand-logo] Scanning for existing Abando logo Image tag…"

TARGET="$(grep -rl 'abando-logo-transparent.png' "$REPO_ROOT/app" || true)"

if [ -z "$TARGET" ]; then
  echo "[brand-logo] ❌ Could not find any TSX file referencing abando-logo-transparent.png"
  exit 1
fi

echo "[brand-logo] Found in: $TARGET"

export BRAND_LOGO_TARGET="$TARGET"

python3 << 'PY'
import os
from pathlib import Path

target = Path(os.environ["BRAND_LOGO_TARGET"])
text = target.read_text()

original = text

# Swap to the new file
text = text.replace("abando-logo-transparent.png", "abando-logo.png")

# Make the displayed logo a bit smaller
text = text.replace("width={160}", "width={120}")

if text == original:
    print("[brand-logo] ⚠️ Nothing changed (patterns not found exactly as expected).")
else:
    target.write_text(text)
    print(f"[brand-logo] ✅ Updated logo src/size in {target}")
PY

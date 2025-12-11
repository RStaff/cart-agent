#!/usr/bin/env bash
set -euo pipefail

echo "[cinbos-check] Scanning repo for 'CinBos' ghost strings…"

if grep -R "CinBos" . --exclude-dir=node_modules --exclude-dir=".next" >/dev/null 2>&1; then
  echo "[cinbos-check] ❌ Found references to 'CinBos' in the codebase:"
  grep -R "CinBos" . --exclude-dir=node_modules --exclude-dir=".next"
  exit 1
else
  echo "[cinbos-check] ✅ No 'CinBos' references found."
fi

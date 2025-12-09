#!/usr/bin/env bash
set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/public"

echo "[logo-clean] Keeping abando-logo.png (28x26) as canonical."
rm -f abando-logo.inline.png abando-logo.v2.png abando-logo-transparent.png || true
echo "[logo-clean] Removed old inline/big variants (if they existed)."

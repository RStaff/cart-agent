#!/usr/bin/env bash
set -euo pipefail

FILE="shopify.app.toml"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "===== FILE HEAD (first 160 lines) ====="
nl -ba "$FILE" | sed -n '1,160p'

echo
echo "===== BLOCK INDEX (top-level headers) ====="
grep -nE '^\[|\[\[' "$FILE" || true

echo
echo "===== LINES CONTAINING 'web' / 'backend' / 'roles' ====="
grep -nEi 'web|backend|roles' "$FILE" || true

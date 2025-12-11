#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CANONICAL="${ROOT_DIR}/app/demo/playground/page.canonical.v2.tsx"
TARGET="${ROOT_DIR}/app/demo/playground/page.tsx"

if [ ! -f "$CANONICAL" ]; then
  echo "❌ Canonical v2 not found:"
  echo "   $CANONICAL"
  exit 1
fi

cp "$CANONICAL" "$TARGET"
echo "✅ /demo/playground restored to canonical v2."

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC="$ROOT/app/demo/playground/page.canonical.v1.tsx"
DEST="$ROOT/app/demo/playground/page.tsx"

if [[ ! -f "$SRC" ]]; then
  echo "❌ Canonical demo file not found at $SRC"
  exit 1
fi

cp "$SRC" "$DEST"
echo "✅ /demo/playground reset back to canonical v1."

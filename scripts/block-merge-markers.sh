#!/usr/bin/env bash
set -euo pipefail

OUT="/tmp/cart_agent_merge_markers.txt"
: > "$OUT"

grep -R -n -E '^(<<<<<<< .+|=======$|>>>>>>> .+)$' . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude-dir=coverage \
  --exclude-dir=staffordos/output \
  --exclude-dir=.hygiene-quarantine \
  --exclude="*.bak" \
  --exclude="*.pack" \
  --exclude="*.ttf" \
  --exclude="scripts/block-merge-markers.sh" \
  > "$OUT" 2>/dev/null || true

if [ -s "$OUT" ]; then
  echo "❌ Real merge markers detected:"
  cat "$OUT"
  exit 1
fi

echo "✓ No real merge markers"

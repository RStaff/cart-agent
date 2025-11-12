#!/usr/bin/env bash
set -euo pipefail
PATTERNS=(
  "set[[:space:]]*it[[:space:]]*and[[:space:]]*forget[[:space:]]*it"
  "drip[[:space:]]*campaign"
  "slow[[:space:]]*drip"
  "simple[[:space:]]*automation"
  "\bnewsletter\b"
)
FAILED=0
while IFS= read -r -d '' f; do
  for rx in "${PATTERNS[@]}"; do
    if grep -InE "$rx" "$f" >/dev/null 2>&1; then
      echo "✗ Brand-Guard: $f matches /$rx/"
      FAILED=1
    fi
  done
done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.mdx" \) -print0)
if [ "$FAILED" -ne 0 ]; then
  exit 1
else
  echo "✓ Brand-Guard clean"
fi

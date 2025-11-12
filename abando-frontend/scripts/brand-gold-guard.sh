#!/usr/bin/env bash
set -euo pipefail
# Disallow yellow/orange families, legacy gold tokens, Tailwind yellow/amber, and gold as bg
PATTERNS=(
  "bg-yellow-[0-9]+"
  "bg-amber-[0-9]+"
  "text-yellow-[0-9]+"
  "text-amber-[0-9]+"
  "#ff[0-9a-fA-F]{2,6}"        # generic bright yellows
  "\-gold\-primary"            # old var
  "--gold-"
  "background:\s*var\(--performance-gold\)"  # gold as background: disallowed
  "background-color:\s*var\(--performance-gold\)"
)
FAILED=0
while IFS= read -r -d '' f; do
  for rx in "${PATTERNS[@]}"; do
    if grep -InE "$rx" "$f" >/dev/null 2>&1; then
      echo "✗ Gold-Guard: $f matches /$rx/"
      FAILED=1
    fi
  done
done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.mdx" \) -print0)
[ "$FAILED" -eq 0 ] && echo "✓ Gold-Guard clean" || exit 1

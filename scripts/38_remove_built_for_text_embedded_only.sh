#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/app/embedded/page.tsx"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}"

echo "== Before (show the badge block) =="
nl -ba "$FILE" | sed -n '185,215p'
echo

# Remove the standalone line that contains only "Built for"
perl -i -pe '
  if (/^\s*Built for\s*$/) { $_ = ""; }
' "$FILE"

echo "== After (show the same block) =="
nl -ba "$FILE" | sed -n '185,215p'
echo
echo "✅ Removed the standalone 'Built for' text in embedded page only. Backup: ${FILE}.bak.${TS}"
echo
echo "== Build =="
npm -C abando-frontend run build

#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/app/embedded/page.tsx"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}"

echo "== Before (show block) =="
nl -ba "$FILE" | sed -n '190,210p'
echo

# Remove the now-empty label block: the wrapper div + p tag (even if p is empty)
perl -0777 -i -pe '
  s/\n\s*<div className="flex flex-col items-end gap-1">\s*\n\s*<p className="text-\[0\.6rem\][^"]*">\s*<\/p>\s*<\/div>\s*\n/\n/gms
' "$FILE"

echo "== After (show block) =="
nl -ba "$FILE" | sed -n '190,210p'
echo
echo "✅ Removed empty Built-for label block. Backup: ${FILE}.bak.${TS}"
echo
echo "== Build =="
npm -C abando-frontend run build

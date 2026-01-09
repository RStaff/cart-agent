#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/src/components/Hero.tsx"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}"

echo "== Before (context) =="
nl -ba "$FILE" | sed -n '1,80p'
echo

# Only change the demo CTA button line (contains BRAND.ctas.demo.href)
perl -i -pe '
  if (/BRAND\.ctas\.demo\.href/ && /variant="secondary"/) {
    s/variant="secondary"/variant="primary"/g;
  }
' "$FILE"

echo "== After (grep) =="
grep -nE 'BRAND\.ctas\.demo\.href|variant=' "$FILE" || true
echo
echo "✅ Updated demo CTA Button variant to primary. Backup: ${FILE}.bak.${TS}"

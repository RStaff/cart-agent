#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/app/embedded/page.tsx"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}"

echo "== Before (grep ShopifyBadge) =="
grep -nE 'ShopifyBadge|from "@/components/ShopifyBadge"|from "\@/components/ShopifyBadge"' "$FILE" || true
echo

# 1) Remove ShopifyBadge import line(s)
perl -i -pe 's/^\s*import\s+ShopifyBadge\s+from\s+["\x27]\@\/components\/ShopifyBadge["\x27];\s*\n//mg' "$FILE"
perl -i -pe 's/^\s*import\s+ShopifyBadge\s+from\s+["\x27]\@\/components\/ShopifyBadge\.tsx["\x27];\s*\n//mg' "$FILE"
perl -i -pe 's/^\s*import\s+ShopifyBadge\s+from\s+["\x27]\@\/components\/ShopifyBadge["\x27]\s*\n//mg' "$FILE"

# 2) Remove self-closing usage: <ShopifyBadge ... />
perl -0777 -i -pe 's/\n[ \t]*<ShopifyBadge\b[^>]*\/>\s*//gms' "$FILE"

# 3) Remove block usage: <ShopifyBadge ...>...</ShopifyBadge>
perl -0777 -i -pe 's/\n[ \t]*<ShopifyBadge\b[^>]*>.*?<\/ShopifyBadge>\s*//gms' "$FILE"

echo "== After (grep ShopifyBadge) =="
grep -nE 'ShopifyBadge|from "@/components/ShopifyBadge"|from "\@/components/ShopifyBadge"' "$FILE" || true
echo
echo "✅ Removed ShopifyBadge from embedded dashboard. Backup: ${FILE}.bak.${TS}"

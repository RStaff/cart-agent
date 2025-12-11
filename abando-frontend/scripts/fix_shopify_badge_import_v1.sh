#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FILE="app/embedded/page.tsx"

if [ ! -f "$FILE" ]; then
  echo "❌ Cannot find $FILE"
  exit 1
fi

STAMP=$(date +%s)
BACKUP="${FILE}.before_fix_shopify_badge_${STAMP}.tsx"
cp "$FILE" "$BACKUP"
echo "💾 Backup written to: $BACKUP"

node << 'NODE'
const fs = require('fs');
const path = 'app/embedded/page.tsx';

let src = fs.readFileSync(path, 'utf8');

if (!src.includes('ShopifyBadge')) {
  console.log("⚠️ No 'ShopifyBadge' import found in app/embedded/page.tsx; nothing to change.");
  process.exit(0);
}

const before = 'import ShopifyBadge from "@/src/components/ShopifyBadge";';
const after  = 'import ShopifyBadge from "@/components/ShopifyBadge";';

if (!src.includes(before)) {
  console.log("⚠️ Expected old import not found; showing first few lines for debugging:");
  console.log(src.split('\\n').slice(0, 20).join('\\n'));
  process.exit(1);
}

src = src.replace(before, after);
fs.writeFileSync(path, src, 'utf8');
console.log('✅ Updated ShopifyBadge import to: import ShopifyBadge from "@/components/ShopifyBadge";');
NODE

if [ -f "src/components/ShopifyBadge.tsx" ]; then
  echo "✅ Found src/components/ShopifyBadge.tsx"
else
  echo "❌ src/components/ShopifyBadge.tsx is missing"
  exit 1
fi

echo "🎯 Import fixed. Now run: npm run dev  (and hard-refresh /embedded)"

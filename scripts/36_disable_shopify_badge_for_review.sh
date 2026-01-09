#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/src/components/ShopifyBadge.tsx"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}"

cat > "$FILE" <<'EOC'
"use client";

// Disabled for Shopify review to avoid implying "Built for Shopify" designation.
// Re-enable later by restoring from the .bak.* file.

export default function ShopifyBadge() {
  return null;
}
EOC

echo "✅ ShopifyBadge disabled. Backup: ${FILE}.bak.${TS}"
echo
echo "== Build =="
npm -C abando-frontend run build

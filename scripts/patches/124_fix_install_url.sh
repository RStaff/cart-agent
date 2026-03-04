#!/usr/bin/env bash
set -e

FILE="web/src/index.js"

cp "$FILE" "${FILE}.bak_install_fix"

sed -i '' 's/client_id=${SHOPIFY_API_KEY}`scope/client_id=${SHOPIFY_API_KEY}`\&scope/g' "$FILE" 2>/dev/null || true
sed -i '' 's/client_id=${SHOPIFY_API_KEY}scope/client_id=${SHOPIFY_API_KEY}\&scope/g' "$FILE" 2>/dev/null || true

echo "✓ attempted install URL fix"

node -c "$FILE" && echo "✓ syntax OK"

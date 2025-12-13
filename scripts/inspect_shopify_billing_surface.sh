#!/usr/bin/env bash
set -euo pipefail

echo "🔎 1) Looking for Shopify config (shopifyApi, shopify app instance)..."
echo "------------------------------------------------------------"
grep -RIn "shopifyApi" web || echo "(no direct shopifyApi hits)"

echo
echo "🔎 2) Looking for shopify config files (shopify.js, etc)..."
echo "------------------------------------------------------------"
ls -R web | sed -n '1,120p' | grep -Ei 'shopify|auth' || true

echo
echo "🔎 3) Where is Shopify used in Express entrypoint?"
echo "------------------------------------------------------------"
if [ -f web/src/index.js ]; then
  sed -n '1,200p' web/src/index.js | grep -n "shopify" || echo "(no 'shopify' string in first 200 lines)"
else
  echo "web/src/index.js not found"
fi

echo
echo "🔎 4) Any existing billing helpers or GraphQL clients?"
echo "------------------------------------------------------------"
grep -RIn "billing" web/src || true
echo
grep -RIn "Graphql" web || true

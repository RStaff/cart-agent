#!/usr/bin/env bash
set -euo pipefail

URLS=(
  "https://www.abando.ai/demo/playground"
  "https://abando.ai/demo/playground"
  "https://app.abando.ai/demo/playground"
)

echo "🔎 Comparing hosts for /demo/playground"
echo

for u in "${URLS[@]}"; do
  echo "=============================="
  echo "URL: $u"
  echo "------------------------------"

  echo "➡️  Headers (key fields):"
  curl -sI "$u" | egrep -i '^(HTTP/|location:|server:|x-vercel-id:|x-vercel-cache:|x-powered-by:|cf-ray:|via:|date:)' || true

  echo
  echo "➡️  Body fingerprint (first matching markers):"
  curl -sL "$u" | egrep -i -m 3 'Abando Merchant Daily Play|Women.*boutique|Women’s boutique|shopify_monotone_white|Merchant Daily Play|playground shows' || true

  echo
done

echo "✅ Done."

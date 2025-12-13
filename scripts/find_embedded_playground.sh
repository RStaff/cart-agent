#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Searching for embedded playground assets..."

# Common locations in Shopify templates / embedded setups
CANDIDATES=(
  "web/embedded"
  "web/frontend"
  "web/app"
  "web/ui"
  "web/client"
)

for d in "${CANDIDATES[@]}"; do
  if [ -d "$d" ]; then
    echo
    echo "== Scanning: $d =="
    # Look for the playground route/files
    find "$d" -maxdepth 6 -type f \( -iname "*playground*" -o -path "*demo*playground*" \) 2>/dev/null | head -n 80 || true
    # Look for your exact page title text if it exists in source
    grep -R --line-number --fixed-strings "AI Shopping Copilot Playground" "$d" 2>/dev/null | head -n 40 || true
  fi
done

echo
echo "== Also checking for built output dirs (dist/build/out) =="
find web -maxdepth 4 -type d \( -name dist -o -name build -o -name out \) 2>/dev/null | sed 's/^/✅ /' || true

echo
echo "✅ Done."

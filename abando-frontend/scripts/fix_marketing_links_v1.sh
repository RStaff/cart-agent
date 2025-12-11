#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[fix] Patching marketing links for boutique ICP..."

CANDIDATES=(
  "app/marketing/women-boutique/page.tsx"
  "app/marketing/womens-boutique/page.tsx"
)

for FILE in "${CANDIDATES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "  - updating $FILE"

    # Fix bad demo link: /marketing/demo/playground -> /demo/playground
    perl -pi -e 's#/marketing/demo/playground#/demo/playground#g' "$FILE"

    # Fix bad vertical link: /marketing/verticals/women-boutique -> /verticals/women-boutique
    perl -pi -e 's#/marketing/verticals/women-boutique#/verticals/women-boutique#g' "$FILE"
  fi
done

echo "[fix] Done. Now run: npm run dev and re-check:"
echo "  • http://localhost:3000/marketing/women-boutique"
echo "  • CTA → /demo/playground"
echo "  • CTA → /verticals/women-boutique"

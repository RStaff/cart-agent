#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 1) Replace the main logo in NavbarV2 with the inline Abando logo
NAV_FILE="$ROOT/src/components/NavbarV2.tsx"
if [ -f "$NAV_FILE" ]; then
  perl -0pi -e '
    s{(<img[^>]+src=")(/abando-logo[^"]*)(")}
     {$1/brand/abando-logo-inline.png$3}g;
    s{(<img[^>]+alt=")Abando([^"]*")}{$1Abando™$2}g;
  ' "$NAV_FILE"
  echo "✅ Patched NavbarV2.tsx to use /brand/abando-logo-inline.png"
else
  echo "⚠️  NavbarV2.tsx not found, skipping nav patch."
fi

# 2) Patch any old Shopify badge image to use the official white logo
HERO_FILE="$ROOT/src/components/Hero.tsx"
FOOTER_FILE="$ROOT/src/components/Footer.tsx"

for f in "$HERO_FILE" "$FOOTER_FILE"; do
  if [ -f "$f" ]; then
    perl -0pi -e '
      s{(<img[^>]+src=")[^"]*shopify[^"]*(")}
       {$1/brand/shopify-logo-white.png$2}gi;
      s{alt="[^"]*Shopify[^"]*"}{alt="Shopify logo"}gi;
    ' "$f"
    echo "✅ Patched $(basename "$f") to use /brand/shopify-logo-white.png"
  fi
done

echo "🏁 Branding patch complete."

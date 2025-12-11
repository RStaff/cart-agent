#!/usr/bin/env bash
set -euo pipefail

echo "=== ABANDO FRONTEND STRUCTURE (demo + marketing) ==="
echo

echo "1) Demo page + demo components"
echo "--------------------------------"
echo "Page:"
[ -f app/demo/playground/page.tsx ] && echo "  • app/demo/playground/page.tsx" || echo "  • (missing) app/demo/playground/page.tsx"

echo
echo "Demo components (under src/components/demo):"
if [ -d src/components/demo ]; then
  find src/components/demo -maxdepth 1 -type f -name "*.tsx" | sed 's/^/  • /'
else
  echo "  • (no src/components/demo directory yet)"
fi

echo
echo "2) Vertical marketing pages"
echo "--------------------------------"
if [ -d app/verticals ]; then
  echo "Vertical routes (app/verticals):"
  find app/verticals -maxdepth 2 -type f -name "page.tsx" | sed 's/^/  • /'
else
  echo "  • (no app/verticals directory yet)"
fi

echo
echo "3) Marketing vertical landings"
echo "--------------------------------"
if [ -d app/marketing ]; then
  echo "Marketing routes (app/marketing):"
  find app/marketing -maxdepth 3 -type f -name "page.tsx" | sed 's/^/  • /'
else
  echo "  • (no app/marketing directory yet)"
fi

echo
echo "4) Shared components (src/components)"
echo "--------------------------------"
if [ -d src/components ]; then
  echo "Some shared components:"
  find src/components -maxdepth 1 -type f -name "*.tsx" | sed 's/^/  • /' | head -20
else
  echo "  • (no src/components directory yet)"
fi

echo
echo "5) Reminder: route config"
echo "--------------------------------"
if [ -f src/config/marketingRoutes.ts ]; then
  echo "  • src/config/marketingRoutes.ts (central route map)"
else
  echo "  • (missing) src/config/marketingRoutes.ts"
fi

echo
echo "Done. Use this as your 'map' before making changes."

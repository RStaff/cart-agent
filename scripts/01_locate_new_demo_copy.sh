#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

echo "🔎 Searching for NEW demo copy + likely routes..."

rg -n --hidden --no-ignore -S \
  "See how Abando reads shopper behavior|reads shopper behavior|turns it into recovered orders|Women's Boutique Apparel Demo|WOMEN'S BOUTIQUE APPAREL DEMO" \
  abando-frontend/app abando-frontend/src . || true

echo
echo "🔎 Also list pages that mention 'demo' / 'playground' / 'boutique'..."
rg -n --hidden --no-ignore -S \
  "/demo|demo/|playground|boutique|women-boutique|womens-boutique" \
  abando-frontend/app | head -n 200 || true

echo
echo "✅ Done."

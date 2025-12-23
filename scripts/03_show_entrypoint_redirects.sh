#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

echo "🔎 Entry points that redirect:"
rg -n --hidden --no-ignore -S 'redirect\("' abando-frontend/app | sed -n '1,200p' || true

echo
echo "🔎 app/page.tsx:"
sed -n '1,120p' abando-frontend/app/page.tsx || true

echo
echo "🔎 marketing/page.tsx:"
sed -n '1,120p' abando-frontend/app/marketing/page.tsx || true

echo
echo "🔎 legacy marketing demo redirect:"
sed -n '1,80p' abando-frontend/app/marketing/demo/playground/page.tsx || true

echo
echo "✅ Done."

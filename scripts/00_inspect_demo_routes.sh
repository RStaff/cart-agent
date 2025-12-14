#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

echo "🔎 Repo: $REPO_ROOT"
echo

echo "=== A) Find references to demo routes ==="
rg -n --hidden --no-ignore -S \
  "(^|/)(demo/playground|demo)(\\b|/|\\?)|Abando Merchant Daily Play|See how Abando reads shopper behavior" \
  . || true
echo

echo "=== B) Find any redirect logic (middleware / next config / server) ==="
rg -n --hidden --no-ignore -S \
  "redirect\\(|NextResponse\\.redirect|res\\.redirect|return\\s+redirect|307|308|location\\.href|/demo/playground" \
  . || true
echo

echo "=== C) List likely Next.js route folders (app/pages) ==="
for d in "abando-frontend" "web" "."; do
  if [ -d "$d/app" ] || [ -d "$d/pages" ]; then
    echo "--- $d ---"
    [ -d "$d/app" ] && find "$d/app" -maxdepth 4 -type f \( -name "page.tsx" -o -name "page.jsx" -o -name "page.js" -o -name "route.ts" -o -name "middleware.ts" \) | sed 's|^\./||'
    [ -d "$d/pages" ] && find "$d/pages" -maxdepth 4 -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.js" \) | sed 's|^\./||'
    echo
  fi
done

echo "✅ Inspection complete."
echo "Next: run scripts/01_show_current_redirect_targets.sh to pinpoint the current redirect source-of-truth."

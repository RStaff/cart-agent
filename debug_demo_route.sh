#!/usr/bin/env bash
set -euo pipefail

echo "=== 1) Repo root ==="
pwd
echo

echo "=== 2) Search for the demo heading in the repo ==="
rg -n "Abando Merchant Daily Play – Live Demo" -S || echo "No matches"
echo

echo "=== 3) List possible demo directories ==="
ls -R abando-frontend/app/demo 2>/dev/null || echo "no abando-frontend/app/demo"
echo
ls -R abando-frontend/src/app/demo 2>/dev/null || echo "no abando-frontend/src/app/demo"
echo
ls -R web/app/demo 2>/dev/null || echo "no web/app/demo"
echo
ls -R web/src/app/demo 2>/dev/null || echo "no web/src/app/demo"
echo

echo "=== 4) Show first 120 lines of each possible page.tsx ==="
for f in \
  abando-frontend/app/demo/playground/page.tsx \
  abando-frontend/src/app/demo/playground/page.tsx \
  web/app/demo/playground/page.tsx \
  web/src/app/demo/playground/page.tsx
do
  if [ -f "$f" ]; then
    echo "----- $f -----"
    sed -n '1,120p' "$f"
    echo
  else
    echo "----- $f (missing) -----"
  fi
done
echo

echo "=== 5) What does production actually serve? ==="
curl -s https://app.abando.ai/demo/playground | sed -n '1,120p'
echo

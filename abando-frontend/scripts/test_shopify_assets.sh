#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

FILES=(
  "shopify_monotone_white.svg"
  "shopify_monotone_black.svg"
)

echo "[shopify-test] Repo root: $REPO_ROOT"
echo "[shopify-test] Checking files in public/…"
echo

missing=0

for NAME in "${FILES[@]}"; do
  DEST="$REPO_ROOT/public/$NAME"
  if [ -f "$DEST" ]; then
    echo "[shopify-test] ✅ Found: public/$NAME"
  else
    echo "[shopify-test] ❌ NOT FOUND: public/$NAME"
    ((missing++))
  fi
done

echo

# Optional: if Next dev server is running on :3000, we can hit the URLs too
if nc -z localhost 3000 2>/dev/null; then
  echo "[shopify-test] Next dev server detected on http://localhost:3000"
  echo "[shopify-test] Trying HTTP GETs (this is just a smoke test)…"
  echo

  for NAME in "${FILES[@]}"; do
    URL="http://localhost:3000/$NAME"
    if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q '^200$'; then
      echo "[shopify-test] 🌐 200 OK: $URL"
    else
      echo "[shopify-test] 🌐 FAILED: $URL (non-200 response)"
    fi
  done
else
  echo "[shopify-test] ⚠️ Next dev server not running on :3000; skipping HTTP checks."
  echo "                You can rerun this after 'npm run dev' is up."
fi

echo
if [ "$missing" -gt 0 ]; then
  echo "[shopify-test] ❌ One or more logo files are missing in public/."
  exit 1
fi

echo "[shopify-test] ✅ Shopify logo assets look good."

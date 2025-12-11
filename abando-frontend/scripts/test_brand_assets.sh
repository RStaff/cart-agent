#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[brand-test] Repo root: $REPO_ROOT"
echo "[brand-test] Checking assets…"
echo

FILES=(
  "shopify_monotone_white.svg"
  "shopify_monotone_black.svg"
  "abando-logo.png"
)

missing=0

for NAME in "${FILES[@]}"; do
  if [ -f "$REPO_ROOT/public/$NAME" ]; then
    echo "[brand-test] ✅ Found: $NAME"
  else
    echo "[brand-test] ❌ Missing: $REPO_ROOT/public/$NAME"
    missing=$((missing + 1))
  fi
done

echo

# Optional HTTP smoke-test if dev server is running
if nc -z localhost 3000 2>/dev/null; then
  echo "[brand-test] Dev server detected on http://localhost:3000"
  echo "[brand-test] Checking HTTP status codes…"
  echo

  for NAME in "${FILES[@]}"; do
    URL="http://localhost:3000/$NAME"
    CODE="$(curl -s -o /dev/null -w "%{http_code}" "$URL")"
    if [ "$CODE" = "200" ]; then
      echo "[brand-test] 🌐 200 OK: $URL"
    else
      echo "[brand-test] 🌐 FAILED ($CODE): $URL"
    fi
  done
else
  echo "[brand-test] ⚠️ Dev server not running on :3000; skipping URL checks."
  echo "            You can rerun this after 'npm run dev' is up."
fi

echo
if [ "$missing" -gt 0 ]; then
  echo "[brand-test] ❌ One or more assets are missing."
  exit 1
fi

echo "[brand-test] ✅ All brand assets look good."

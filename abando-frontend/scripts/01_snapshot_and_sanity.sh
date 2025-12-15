#!/usr/bin/env bash
set -euo pipefail

echo "🧾 Repo: $(pwd)"
test -f package.json || { echo "❌ package.json not found. Run this from abando-frontend root."; exit 1; }

STAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p .backup

# Snapshot key config files if present
for f in package.json next.config.* middleware.ts middleware.js app/layout.tsx app/page.tsx pages/_app.* pages/index.*; do
  if [ -f "$f" ]; then
    cp -p "$f" ".backup/$(echo "$f" | tr '/' '__').${STAMP}.bak"
  fi
done

echo "✅ Snapshot stored in .backup/ (*.${STAMP}.bak)"

echo "🔎 Detecting framework..."
if grep -q '"next"' package.json; then
  echo "✅ Next.js detected"
else
  echo "⚠️ Next.js not detected in package.json dependencies. This script assumes Next.js."
fi

echo "🔎 App router vs Pages router..."
if [ -d app ]; then echo "✅ app/ directory present (App Router)"; else echo "ℹ️ app/ directory not found"; fi
if [ -d pages ]; then echo "✅ pages/ directory present (Pages Router)"; else echo "ℹ️ pages/ directory not found"; fi

echo "✅ Sanity check complete"

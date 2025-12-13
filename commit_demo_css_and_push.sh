#!/usr/bin/env bash
set -euo pipefail

cd ~/projects/cart-agent

echo "🔎 git status (before):"
git status

git add \
  abando-frontend/app/globals.css \
  abando-frontend/app/demo/playground \
  abando-frontend/app/layout.tsx \
  abando-frontend/tailwind.config.ts

echo
echo "📝 Committing…"
git commit -m "Fix demo playground styling: use Tailwind globals in app/" || echo "ℹ️ No changes to commit (maybe already committed)"

echo
echo "📤 Pushing to origin main…"
git push origin main

echo
echo "✅ Push done. Once Vercel finishes, reload:"
echo "   https://app.abando.ai/demo/playground"

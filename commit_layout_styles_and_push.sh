#!/usr/bin/env bash
set -euo pipefail

cd ~/projects/cart-agent

echo "🔎 git status (before):"
git status

git add abando-frontend/app/layout.tsx

echo
echo "📝 Committing…"
git commit -m "Add global Abando demo styles to layout" || echo "ℹ️ No changes to commit"

echo
echo "📤 Pushing to origin main…"
git push origin main

echo
echo "✅ Push done. After Vercel finishes, hard-reload:"
echo "   https://app.abando.ai/demo/playground"

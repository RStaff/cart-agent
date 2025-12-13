#!/usr/bin/env bash
set -euo pipefail

echo "➡️ Entering frontend app…"
cd ~/projects/cart-agent/abando-frontend

echo "🔄 Resetting demo page to last committed version…"
if [ -f app/demo/playground/page.tsx ]; then
  git restore app/demo/playground/page.tsx || echo "ℹ️ page.tsx already clean"
else
  echo "ℹ️ app/demo/playground/page.tsx not found (nothing to restore)"
fi

echo "🧹 Making demo route inherit the root layout (for global styles)…"
if [ -f app/demo/layout.tsx ]; then
  git rm app/demo/layout.tsx
  echo "🗑  Removed app/demo/layout.tsx so /demo uses the main layout."
else
  echo "ℹ️ app/demo/layout.tsx does not exist (already using root layout)."
fi

echo "🏗  Running Next.js build…"
npm run build

echo "📦 Committing and pushing changes…"
cd ~/projects/cart-agent
git add abando-frontend
git commit -m "Fix demo playground layout to use global styles" || echo "ℹ️ No changes to commit"
git push origin main || echo "ℹ️ Nothing new to push (or push failed)."

echo
echo "✅ Script finished."
echo "Now open an incognito window and hard-reload:"
echo "   https://app.abando.ai/demo/playground"

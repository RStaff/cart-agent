#!/usr/bin/env bash
set -euo pipefail

echo "🏗  Building frontend…"
cd ~/projects/cart-agent/abando-frontend
npm run build

echo "📦 Commit & push demo page…"
cd ~/projects/cart-agent
git add abando-frontend/app/demo/playground/page.tsx
git commit -m "Style demo playground with inline layout" || echo "ℹ️ No changes to commit"
git push origin main

echo "✅ Done. Hard-reload https://app.abando.ai/demo/playground"

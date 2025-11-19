#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"
FRONTEND_DIR="$ROOT_DIR/abando-frontend"

echo "📂 Switching to frontend directory…"
cd "$FRONTEND_DIR"

echo "📦 Installing deps (HUSKY disabled)…"
export HUSKY=0
npm install

echo "🏗 Building Next.js frontend (local sanity check)…"
npm run build

echo
echo "✅ Local build complete."
echo "🚀 To deploy, push your changes to GitHub (Vercel will auto-deploy):"
echo "    cd \"$ROOT_DIR\""
echo "    git status"
echo "    git push"

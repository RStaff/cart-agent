#!/usr/bin/env bash
set -euo pipefail

echo "📦 Building Abando frontend for production…"
HUSKY=0 SKIP_GUARDS=1 npm run build

echo
echo "🚀 Deploying to Vercel production…"
vercel --prod --yes

#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ [Abando] Sanity build..."
./scripts/build-check.sh

echo "▶ [Abando] Deploying to Vercel production..."
npx vercel --prod --yes

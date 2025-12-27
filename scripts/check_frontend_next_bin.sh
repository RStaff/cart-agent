#!/usr/bin/env bash
set -euo pipefail

cd abando-frontend
rm -rf node_modules
npm ci || npm install

if [ -x node_modules/.bin/next ]; then
  echo "✅ next binary present: abando-frontend/node_modules/.bin/next"
  ./node_modules/.bin/next --version || true
else
  echo "❌ next binary missing"
  exit 1
fi

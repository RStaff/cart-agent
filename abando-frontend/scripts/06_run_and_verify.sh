#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Installing deps..."
npm install

echo "🚀 Starting dev server..."
echo "Open these URLs:"
echo "  - http://localhost:3000/api/health"
echo "  - http://localhost:3000/     (should 307 -> /demo/playground)"
echo "  - http://localhost:3000/status"
npm run dev

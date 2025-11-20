#!/usr/bin/env bash
set -euo pipefail

echo "▶ [Abando] Clean install (CI-style)..."
npm install

echo "▶ [Abando] Running production build..."
npm run build

echo "✅ [Abando] Build completed successfully."

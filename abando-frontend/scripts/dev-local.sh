#!/usr/bin/env bash
set -euo pipefail

echo "▶ [Abando] Dev server – ensuring deps..."
npm install

echo "▶ [Abando] Starting Next.js dev server on http://localhost:3000 ..."
npm run dev

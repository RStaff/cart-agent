#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Scanning for router mounts inside web/src/index.js..."

TARGET="web/src/index.js"

grep -n "app.use" "$TARGET" || echo "⚠️ No app.use entries found."

echo
echo "📌 Checking whether billing routes are mounted..."
grep -RIn "billing" web/src/index.js web/src/routes || true

#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

file="scripts/check_abando_stack.sh"
test -f "$file" || { echo "❌ Missing $file"; exit 1; }

# Patch only the pay endpoint if it exists in an older form
tmp="$(mktemp)"
cp "$file" "$tmp"

# normalize pay endpoint to /health
perl -0pe 's#https://pay\.abando\.ai/(api/)?health#https://pay.abando.ai/health#g' "$tmp" > "$file"

rm -f "$tmp"
chmod +x "$file"

echo "✅ Patched $file (pay.abando.ai now uses /health)"

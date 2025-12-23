#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/db/billingState.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

# Fix the specific corruption: "{;" -> "{"
perl -0777 -i -pe 's/\{\s*;/{/g' "$FILE"

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ billingState.js parses"

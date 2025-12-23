#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

# Toggle a harmless marker comment line
if rg -q "ABANDO_NUDGE" "$FILE"; then
  perl -0777 -i -pe 's/\n\/\/ ABANDO_NUDGE\n/\n/' "$FILE"
else
  printf "\n// ABANDO_NUDGE\n" >> "$FILE"
fi

echo "✅ Nudged $FILE to trigger nodemon restart."

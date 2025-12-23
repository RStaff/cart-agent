#!/usr/bin/env bash
set -euo pipefail

FILE="web/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

# Toggle a harmless marker so nodemon sees a change
if rg -q "ABANDO_NUDGE_WEB_INDEX" "$FILE"; then
  perl -0777 -i -pe 's/\n\/\/ ABANDO_NUDGE_WEB_INDEX\n/\n/' "$FILE"
else
  printf "\n// ABANDO_NUDGE_WEB_INDEX\n" >> "$FILE"
fi

echo "✅ Nudged $FILE (watched by nodemon) to trigger restart."

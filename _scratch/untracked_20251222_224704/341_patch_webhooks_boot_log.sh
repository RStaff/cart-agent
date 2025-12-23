#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

# If already present, do nothing
if rg -q '\[abando\]\[BOOT\]' "$FILE"; then
  echo "ℹ️ BOOT line already present."
  exit 0
fi

# Insert at top of file
perl -0777 -i -pe '
  s/\A/console.log("[abando][BOOT] webhooks.js loaded at", new Date().toISOString());\n/;
' "$FILE"

echo "✅ Added BOOT log to $FILE"

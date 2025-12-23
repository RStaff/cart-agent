#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BK="$FILE.bak_rm_pathdup_$(date +%s)"
cp "$FILE" "$BK"
echo "🧾 Backup: $BK"

# Remove duplicate "import path from ..." lines after the first occurrence
perl -i -ne '
  if (/^\s*import\s+path\s+from\s+["\047]node:path["\047]\s*;\s*$/) {
    $seen++ and next;
  }
  print;
' "$FILE"

echo "✅ Removed duplicate path imports (if any)."
echo "🔎 Proof (top 12 lines):"
nl -ba "$FILE" | sed -n '1,12p'

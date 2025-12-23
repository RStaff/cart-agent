#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

# Keep only the FIRST occurrence of: import path from "node:path";
perl -0777 -i -pe '
  my $seen = 0;
  s/^import\s+path\s+from\s+"node:path";\s*\n/
    $seen++ ? "" : "import path from \"node:path\";\n"
/gme;
' "$FILE"

echo "✅ Deduped node:path import in $FILE"

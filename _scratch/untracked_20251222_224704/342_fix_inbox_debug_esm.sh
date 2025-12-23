#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

# 1) Remove the ESM-breaking require("node:path") line if present
perl -0777 -i -pe 's/\n\s*const path = require\("node:path"\);\s*\n/\n/g' "$FILE"

# 2) Ensure we have an ESM import for node:path near the top (only once)
perl -0777 -i -pe '
  if ($_=~m/\bfrom\s+"node:path"\b/){ $_=$_; }
  else {
    # insert after first import line if one exists, otherwise prepend
    if (m/^(import[^\n]*\n)/m) { s/^(import[^\n]*\n)/$1import path from "node:path";\n/m; }
    else { $_ = "import path from \"node:path\";\n" . $_; }
  }
' "$FILE"

echo "✅ Patched inbox debug to be ESM-safe in $FILE"

#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

# If code uses path.* but there is no namespace import, add: import * as path from "node:path";
if rg -q '\bpath\.' "$FILE" && ! rg -q 'import\s+\*\s+as\s+path\s+from\s+"node:path"' "$FILE"; then
  perl -0777 -i -pe '
    if ($s = $_) {
      # insert after first import line if present, otherwise prepend
      if ($s =~ /^import[^\n]*\n/m) {
        $s =~ s/^(import[^\n]*\n)/$1import * as path from "node:path";\n/m;
      } else {
        $s = "import * as path from \"node:path\";\n" . $s;
      }
      $_ = $s;
    }
  ' "$FILE"
  echo "✅ Added: import * as path from \"node:path\";"
else
  echo "ℹ️ path namespace import already present (or no path.* usage)."
fi

# Show the exact lines that matter
echo
echo "== node:path imports + path.* usage =="
rg -n 'node:path|path\.(resolve|dirname)' "$FILE" || true

#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

# If already importing node:path, do nothing
if rg -n 'from\s+"node:path"' "$FILE" >/dev/null 2>&1; then
  echo "ℹ️ node:path import already present."
  exit 0
fi

# Insert `import path from "node:path";` after the node:fs import if possible, else after first import line.
perl -0777 -i -pe '
  if ($ARGV && -f $ARGV) {
    my $s = $_;

    if ($s =~ /import\s+.*from\s+"node:fs";\s*\n/s) {
      $s =~ s/(import\s+.*from\s+"node:fs";\s*\n)/$1import path from "node:path";\n/s;
    } elsif ($s =~ /^import[^\n]*\n/m) {
      $s =~ s/^(import[^\n]*\n)/$1import path from "node:path";\n/m;
    } else {
      $s = "import path from \"node:path\";\n" . $s;
    }

    $_ = $s;
  }
' "$FILE"

echo "✅ Added import: node:path → $FILE"

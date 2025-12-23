#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BK="$FILE.bak_fix_imports_$(date +%s)"
cp "$FILE" "$BK"
echo "🧾 Backup: $BK"

# Remove ANY existing imports for fs/crypto/path, then prepend a single canonical set.
perl -0777 -i -pe '
  my $s = $_;

  # Remove any prior fs/crypto/path import lines (node: or non-node)
  $s =~ s/^\s*import\s+fs\s+from\s+["\047][^"\047]+["\047]\s*;\s*\n//mg;
  $s =~ s/^\s*import\s+crypto\s+from\s+["\047][^"\047]+["\047]\s*;\s*\n//mg;
  $s =~ s/^\s*import\s+path\s+from\s+["\047][^"\047]+["\047]\s*;\s*\n//mg;

  # Prepend canonical imports
  $s = "import fs from \"node:fs\";\nimport crypto from \"node:crypto\";\nimport path from \"node:path\";\n" . $s;

  $_ = $s;
' "$FILE"

echo "✅ Fixed imports in $FILE"
echo
echo "🔎 Proof (top 15 lines):"
nl -ba "$FILE" | sed -n '1,15p'

#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BK="$FILE.bak_final_dedupe_$(date +%s)"
cp "$FILE" "$BK"
echo "🧾 Backup: $BK"

perl -0777 -i -pe '
  my $s = $_;

  # Remove ALL fs / crypto imports
  $s =~ s/^\s*import\s+\*\s+as\s+fs\s+from\s+["\047][^"\047]+["\047]\s*;\s*\n//mg;
  $s =~ s/^\s*import\s+fs\s+from\s+["\047][^"\047]+["\047]\s*;\s*\n//mg;
  $s =~ s/^\s*import\s+crypto\s+from\s+["\047][^"\047]+["\047]\s*;\s*\n//mg;
  $s =~ s/^\s*import\s+\{[^}]*\}\s+from\s+["\047]node:crypto["\047]\s*;\s*\n//mg;

  # Prepend canonical imports
  $s = "import fs from \"node:fs\";\nimport path from \"node:path\";\nimport crypto from \"node:crypto\";\n\n" . $s;

  $_ = $s;
' "$FILE"

echo "✅ Final import dedupe applied"
echo
echo "🔎 Proof (top 15 lines):"
nl -ba "$FILE" | sed -n '1,15p'

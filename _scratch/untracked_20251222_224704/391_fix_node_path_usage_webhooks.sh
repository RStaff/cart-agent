#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

# 1) Ensure we have named imports from node:path
#    - If there's already an import from node:path, normalize it to include dirname/resolve.
#    - Otherwise, insert a new import near the top (after first import line).
perl -0777 -i -pe '
  my $s = $_;

  if ($s =~ /import\s+([^;\n]+)\s+from\s+"node:path";/s) {
    # e.g. import path from "node:path";
    # Replace with named imports
    $s =~ s/import\s+[^;\n]+\s+from\s+"node:path";/import { dirname, resolve } from "node:path";/s;
  } elsif ($s =~ /import\s+\{[^}]*\}\s+from\s+"node:path";/s) {
    # ensure dirname + resolve are present
    $s =~ s/import\s+\{([^}]*)\}\s+from\s+"node:path";/
      my $inner=$1;
      my %h = map { my $t=$_; $t =~ s/^\s+|\s+$//g; $t ? ($t=>1) : () } split(/,/, $inner);
      $h{"dirname"}=1; $h{"resolve"}=1;
      "import { ".join(", ", sort keys %h)." } from \"node:path\";";
    /sex;
  } else {
    # insert after first import line if any, else at top
    if ($s =~ /^import[^\n]*\n/m) {
      $s =~ s/^(import[^\n]*\n)/$1import { dirname, resolve } from "node:path";\n/m;
    } else {
      $s = "import { dirname, resolve } from \"node:path\";\n" . $s;
    }
  }

  $_ = $s;
' "$FILE"

# 2) Replace path.dirname(...) -> dirname(...)
perl -0777 -i -pe 's/\bpath\.dirname\s*\(/dirname(/g' "$FILE"

# 3) Replace path.resolve(...) -> resolve(...)
perl -0777 -i -pe 's/\bpath\.resolve\s*\(/resolve(/g' "$FILE"

echo "✅ Patched node:path usage in $FILE"
echo "   - import { dirname, resolve } from node:path"
echo "   - path.dirname(...) -> dirname(...)"
echo "   - path.resolve(...) -> resolve(...)"

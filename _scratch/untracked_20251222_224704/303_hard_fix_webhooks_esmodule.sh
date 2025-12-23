#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BAK="${FILE}.bak_$(date +%s)"
cp -f "$FILE" "$BAK"
echo "🧾 Backup: $BAK"

# Remove any CommonJS requires for fs/path at the very top (or anywhere)
perl -0777 -i -pe '
  s/^\s*const\s+fs\s*=\s*require\(["'\'']fs["'\'']\);\s*\n//mg;
  s/^\s*const\s+path\s*=\s*require\(["'\'']path["'\'']\);\s*\n//mg;
' "$FILE"

# Ensure ESM imports exist (add only if missing)
perl -0777 -i -pe '
  my $s = $_;

  my $has_fs   = ($s =~ /^import\s+\*\s+as\s+fs\s+from\s+["'\'']node:fs["'\''];/m);
  my $has_path = ($s =~ /^import\s+path\s+from\s+["'\'']node:path["'\''];/m);

  if (!$has_fs || !$has_path) {
    my $ins = "";
    $ins .= "import * as fs from \"node:fs\";\n"   if !$has_fs;
    $ins .= "import path from \"node:path\";\n"   if !$has_path;

    # Insert after shebang if present, else at top
    if ($s =~ /^\#\!.+\n/) {
      $s =~ s/^(\#\!.+\n)/$1$ins/;
    } else {
      $s = $ins . $s;
    }
  }

  $_ = $s;
' "$FILE"

echo "✅ Fixed: removed require(), ensured ESM imports."

echo
echo "🔎 New file head:"
sed -n '1,25p' "$FILE"

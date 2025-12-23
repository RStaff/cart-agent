#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BAK="${FILE}.bak_$(date +%s)"
cp -f "$FILE" "$BAK"
echo "🧾 Backup: $BAK"

# 1) Remove the bad CommonJS require lines if present
perl -0777 -i -pe '
  s/^\s*const\s+fs\s*=\s*require\(["'\'']fs["'\'']\);\s*\n//m;
  s/^\s*const\s+path\s*=\s*require\(["'\'']path["'\'']\);\s*\n//m;
' "$FILE"

# 2) Ensure ESM imports exist near the top (only add if missing)
perl -0777 -i -pe '
  my $s = $_;

  my $need_fs   = ($s !~ /^import\s+\*\s+as\s+fs\s+from\s+["'\'']node:fs["'\''];/m);
  my $need_path = ($s !~ /^import\s+path\s+from\s+["'\'']node:path["'\''];/m);

  if ($need_fs || $need_path) {
    # insert after first import block if it exists, else at very top
    if ($s =~ /^(import .*?;\s*\n)+/m) {
      my $imports = $&;
      my $ins = "";
      $ins .= "import * as fs from \"node:fs\";\n" if $need_fs;
      $ins .= "import path from \"node:path\";\n" if $need_path;
      $s =~ s/^\Q$imports\E/$imports$ins/m;
    } else {
      my $ins = "";
      $ins .= "import * as fs from \"node:fs\";\n" if $need_fs;
      $ins .= "import path from \"node:path\";\n" if $need_path;
      $s = $ins . $s;
    }
  }

  $_ = $s;
' "$FILE"

echo "✅ Patched $FILE to ESM-safe fs/path imports."

echo
echo "🔎 Proof (top of file):"
sed -n '1,40p' "$FILE"

echo
echo "✅ Next: restart nodemon (Terminal A: type 'rs')"

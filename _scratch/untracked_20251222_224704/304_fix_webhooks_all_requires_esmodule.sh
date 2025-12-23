#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BAK="${FILE}.bak_$(date +%s)"
cp -f "$FILE" "$BAK"
echo "🧾 Backup: $BAK"

# Remove common requires (anywhere)
perl -0777 -i -pe '
  s/^\s*const\s+crypto\s*=\s*require\(["'\'']crypto["'\'']\);\s*\n//mg;
  s/^\s*const\s+fs\s*=\s*require\(["'\'']fs["'\'']\);\s*\n//mg;
  s/^\s*const\s+path\s*=\s*require\(["'\'']path["'\'']\);\s*\n//mg;
' "$FILE"

# Ensure ESM imports exist (add only if missing)
perl -0777 -i -pe '
  my $s = $_;

  my $has_crypto = ($s =~ /^import\s+crypto\s+from\s+["'\'']node:crypto["'\''];/m);
  my $has_fs     = ($s =~ /^import\s+\*\s+as\s+fs\s+from\s+["'\'']node:fs["'\''];/m);
  my $has_path   = ($s =~ /^import\s+path\s+from\s+["'\'']node:path["'\''];/m);

  my $ins = "";
  $ins .= "import crypto from \"node:crypto\";\n"  if !$has_crypto;
  $ins .= "import * as fs from \"node:fs\";\n"     if !$has_fs;
  $ins .= "import path from \"node:path\";\n"     if !$has_path;

  if ($ins ne "") {
    if ($s =~ /^\#\!.+\n/) { $s =~ s/^(\#\!.+\n)/$1$ins/; }
    else { $s = $ins . $s; }
  }

  $_ = $s;
' "$FILE"

echo "✅ Patched to ESM-safe (no require crypto/fs/path)."
echo
echo "🔎 Head of file:"
sed -n '1,30p' "$FILE"
echo
echo "🔎 Any remaining require()?"
rg -n "require\(" "$FILE" || echo "✅ none"

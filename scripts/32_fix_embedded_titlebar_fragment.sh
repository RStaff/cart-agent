#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/app/embedded/page.tsx"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}"

echo "== Before (imports + return area) =="
nl -ba "$FILE" | sed -n '1,60p'
echo
nl -ba "$FILE" | sed -n '140,190p'
echo

# 1) Remove any bad TitleBar import from /app-bridge-react (single or double quotes)
perl -i -ne '
  next if $_ =~ /^\s*import\s+\{\s*TitleBar\s*\}\s+from\s+[\"\x27]\/app-bridge-react[\"\x27];\s*$/;
  print;
' "$FILE"

# 2) Ensure correct TitleBar import exists exactly once
perl -0777 -i -pe '
  my $good = "import { TitleBar } from \"\@shopify\/app-bridge-react\";\n";
  # Remove duplicates of the good import first
  $_ =~ s/^\s*import\s+\{\s*TitleBar\s*\}\s+from\s+\"\@shopify\/app-bridge-react\";\s*\n//mg;
  # Re-insert once after the last import line near the top
  if ($_ =~ /^(("use client";\s*\n\s*)?)(import[^\n]*\n(?:import[^\n]*\n)*)/m) {
    my $prefix = $1;
    my $imports = $3;
    my $rest = substr($_, length($prefix) + length($imports));
    $_ = $prefix . $imports . $good . $rest;
  } else {
    $_ = $good . $_;
  }
' "$FILE"

# 3) Wrap the return block in a fragment if TitleBar is a sibling before <div>
#    Transform:
#      return (
#          <TitleBar ... />
#        <div ...>
#    Into:
#      return (
#        <>
#          <TitleBar ... />
#          <div ...>
#    and add </> right before the matching );
perl -0777 -i -pe '
  # Insert opening fragment after return( if TitleBar is the first element
  s/return\s*\(\s*\n(\s*<TitleBar\b[^\n]*\/>\s*\n)(\s*<div\b)/return (\n  <>\n$1  $2/sm;

  # If we inserted <>, ensure we close it before the end of the return
  if ($_ =~ /return\s*\(\s*\n\s*<>\s*\n/sm) {
    # Add </> right before the final "\n  );" or "\n);" in this component
    $_ =~ s/\n(\s*)\);\s*$/\n$1<\/>\n$1);\n/sm;
  }
' "$FILE"

echo "== After (imports + return area) =="
nl -ba "$FILE" | sed -n '1,70p'
echo
nl -ba "$FILE" | sed -n '150,200p'
echo

echo "== Sanity: TitleBar lines =="
grep -nE 'TitleBar|@shopify/app-bridge-react|/app-bridge-react' "$FILE" || true
echo
echo "✅ Patched. Backup: ${FILE}.bak.${TS}"

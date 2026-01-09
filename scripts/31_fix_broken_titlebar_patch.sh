#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/app/embedded/page.tsx"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}"

echo "== Before (top 25 lines) =="
nl -ba "$FILE" | sed -n '1,25p'
echo

# 1) Remove the stray broken line if present
perl -i -ne 'print unless $_ =~ /^\s*ShopifyBadge";\s*$/;' "$FILE"

# 2) Fix incorrect import path (either single or double quotes)
perl -i -pe 's/import\s+\{\s*TitleBar\s*\}\s+from\s+[\"\x27]\/app-bridge-react[\"\x27];/import { TitleBar } from "\@shopify\/app-bridge-react";/g' "$FILE"

# 3) If TitleBar import missing, add it right after existing imports
perl -0777 -i -pe '
  if ($_ !~ /import\s+\{\s*TitleBar\s*\}\s+from\s+"@shopify\/app-bridge-react";/) {
    if ($_ =~ /(^import[^\n]*\n(?:import[^\n]*\n)*)/m) {
      my $imports = $1;
      my $rest = substr($_, length($imports));
      $imports .= "import { TitleBar } from \"@shopify/app-bridge-react\";\n";
      $_ = $imports . $rest;
    } else {
      $_ = "import { TitleBar } from \"@shopify/app-bridge-react\";\n\n" . $_;
    }
  }
' "$FILE"

# 4) Ensure "use client"; is the very first statement
# If it's present but not at top, remove it and re-add at top
perl -0777 -i -pe '
  s/^\s*["\x27]use client["\x27];\s*\n//m;   # remove any existing
  $_ = "\"use client\";\n\n" . $_;           # prepend
' "$FILE"

# 5) Ensure TitleBar exists exactly once near the top of the return
# If no TitleBar element exists, insert immediately after "return ("
if ! grep -q "<TitleBar" "$FILE"; then
  perl -0777 -i -pe 's/return\s*\(\s*\n/return (\n    <TitleBar title="Abando" \/>\n/sm' "$FILE"
fi

# If multiple TitleBars (unlikely), keep first only
perl -0777 -i -pe '
  my $count = 0;
  $_ = join("", map {
    if ($_ =~ /<TitleBar\b/) { $count++; ($count==1)? $_ : "" } else { $_ }
  } split(/(?=<)/, $_));
' "$FILE"

echo "== After (top 30 lines) =="
nl -ba "$FILE" | sed -n '1,30p'
echo
echo "== After (grep TitleBar) =="
grep -nE "use client|TitleBar|@shopify/app-bridge-react" "$FILE" || true
echo
echo "✅ Fixed. Backup: ${FILE}.bak.${TS}"

#!/usr/bin/env bash
set -euo pipefail

FILE="app/embedded/review/page.tsx"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

echo "✅ Target: $FILE"
cp "$FILE" "$FILE.bak_$(date +%s)"
echo "🧾 Backup created."

# 1) Ensure next/image import exists
if ! rg -q 'from "next/image"' "$FILE"; then
  echo "➕ Adding next/image import"
  perl -0777 -i -pe 's/(^import[^\n]*\n)/$1import Image from "next\/image";\n/m' "$FILE"
fi

# 2) Replace any simple "A" logo tile div with the real logo
# This targets a rounded square/circle with "A" inside (common pattern).
perl -0777 -i -pe 's/<div([^>]*\brounded[^>]*)>\s*A\s*<\/div>/<div$1><Image src="\/abando-logo.inline.png" alt="Abando logo" width={32} height={32} \/><\/div>/g' "$FILE"

# 3) If still no inline logo reference, fail loudly so we don't "half patch"
if ! rg -q 'abando-logo\.inline\.png' "$FILE"; then
  echo "❌ Patch did not find/replace the 'A' tile in $FILE."
  echo "   Open the file and search for the logo tile markup near the header."
  echo "   (We can make a tighter patch once we see that exact block.)"
  exit 1
fi

echo "✅ Patched review header to use /abando-logo.inline.png"

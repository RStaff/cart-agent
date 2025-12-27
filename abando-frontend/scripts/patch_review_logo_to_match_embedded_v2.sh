#!/usr/bin/env bash
set -euo pipefail

FILE="app/embedded/review/page.tsx"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

echo "✅ Target: $FILE"
cp "$FILE" "$FILE.bak_$(date +%s)"
echo "🧾 Backup created."

# Ensure next/image import exists (avoid duplicates)
if ! rg -q 'import\s+Image\s+from\s+"next/image"' "$FILE"; then
  echo "➕ Adding next/image import"
  perl -0777 -i -pe 's/^(import[^\n]*\n)/$1import Image from "next\/image";\n/m' "$FILE"
fi

# Replace the header "A" tile with the real logo.
# Handles:
#   <div className="...rounded...">A</div>
#   <div className="...rounded..."><span ...>A</span></div>
# Only replaces when the div content is JUST "A" (optionally wrapped in span).
perl -0777 -i -pe '
  my $repl = qq{<div$1><Image src="/abando-logo.inline.png" alt="Abando logo" width={32} height={32} /></div>};
  my $count = 0;

  s{
    <div([^>]*\bclassName=\{?"[^"]*\brounded[^"]*"[^>]*?)>
    \s*
    (?:<span[^>]*>\s*)?
    A
    \s*
    (?:</span>\s*)?
    </div>
  }{
    $count++;
    $repl
  }gsex;

  if ($count == 0) {
    die "NO_REPLACEMENT\n";
  }
' "$FILE" 2>/tmp/patch_review_logo_err || {
  if rg -q "NO_REPLACEMENT" /tmp/patch_review_logo_err; then
    echo "❌ Could not find a rounded logo tile containing only 'A'."
    echo "🔎 Showing likely logo/header lines:"
    rg -n --context 3 'Abando Dashboard|Review demo|className=.*rounded|>A<|\\bA\\b' "$FILE" || true
    exit 1
  fi
  cat /tmp/patch_review_logo_err
  exit 1
}

echo "✅ Patched: review header now uses /abando-logo.inline.png"

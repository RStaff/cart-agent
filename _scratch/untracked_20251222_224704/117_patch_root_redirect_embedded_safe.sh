#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

# Patch the existing root redirect:
# - If request includes embedded/hmac/shop in query, redirect to /embedded (preserve querystring)
# - Else keep redirect to /demo/playground
perl -0777 -i -pe '
  s{
    (res\.redirect\(\s*307\s*,\s*["\047]\/demo\/playground["\047]\s*\)\s*;?)
  }{
    my $orig = $1;
    qq{
    const _url = (req.originalUrl || req.url || "");
    const _qs  = _url.includes("?") ? _url.split("?")[1] : "";
    const _isEmbedded = (_qs && (_qs.includes("embedded=1") || _qs.includes("hmac=") || _qs.includes("shop=")));
    if (_isEmbedded) {
      return res.redirect(307, "/embedded" + (_qs ? "?" + _qs : ""));
    }
    $orig
    }
  }gex;
' "$FILE"

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ Patched: root redirect now supports embedded loads (parses)"

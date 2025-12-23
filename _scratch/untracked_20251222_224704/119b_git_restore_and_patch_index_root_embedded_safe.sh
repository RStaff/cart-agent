#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

# Must be in git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "❌ Not a git repo here (cannot restore from git)."
  exit 1
}

stamp="$(date +%s)"
cp "$FILE" "$FILE.broken_${stamp}" || true
echo "✅ Saved current broken file: $FILE.broken_${stamp}"

echo "🧼 Restoring $FILE from git (HEAD)..."
git restore --source=HEAD -- "$FILE" 2>/dev/null || git checkout -- "$FILE"

echo "🔍 Sanity check after git restore:"
node --check "$FILE"
echo "✅ Restored index.js parses"

# Replacement route block
perl -0777 -i -pe '
  my $replacement = qq{
router.get("/", (req, res) => {
  const _url = (req.originalUrl || req.url || "");
  const _qs  = _url.includes("?") ? _url.split("?")[1] : "";
  const _isEmbedded = (_qs && (_qs.includes("embedded=1") || _qs.includes("hmac=") || _qs.includes("shop=")));

  if (_isEmbedded) {
    return res.redirect(307, "/embedded" + (_qs ? "?" + _qs : ""));
  }

  return res.redirect(307, "/demo/playground");
});
};

  my $did = 0;

  # Case A: replace an existing router.get("/", ...) (any body)
  $did ||= s{
    router\.(get|all)\(\s*["\047]\/["\047]\s*,\s*(async\s*)?\([^)]*\)\s*=>\s*
    (?:\{.*?\}|[^;]*?)
    \)\s*;
  }{$replacement}gsx;

  # Case B: if no root route exists, insert right after router creation
  if (!$did) {
    s{
      (const\s+router\s*=\s*[^;]+;\s*\n)
    }{$1\n$replacement\n}sx or
    s{
      (let\s+router\s*=\s*[^;]+;\s*\n)
    }{$1\n$replacement\n}sx;
  }
' "$FILE"

echo "🔍 Sanity check after patch:"
node --check "$FILE"
echo "✅ Patched index.js parses"

echo
echo "🧪 Validate root redirect behavior:"
curl -fsSI "http://localhost:3000/?embedded=1&shop=cart-agent-dev.myshopify.com&hmac=x" | sed -n '1,12p' || true
curl -fsSI "http://localhost:3000/" | sed -n '1,12p' || true

echo
echo "✅ Done."

#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

echo "🔎 Looking for newest index.js backup that parses..."
candidates=($(ls -1t "$FILE".bak_* 2>/dev/null || true))

if [ ${#candidates[@]} -eq 0 ]; then
  echo "❌ No backups found ($FILE.bak_*)"
  exit 1
fi

good=""
for b in "${candidates[@]}"; do
  if node --check "$b" >/dev/null 2>&1; then
    good="$b"
    break
  fi
done

if [ -z "$good" ]; then
  echo "❌ None of the backups parse. Need a different recovery path."
  exit 1
fi

stamp="$(date +%s)"
cp "$FILE" "$FILE.broken_${stamp}" || true
cp "$good" "$FILE"
echo "✅ Restored from parsing backup: $good"
echo "✅ Saved current broken file: $FILE.broken_${stamp}"

# Now patch the ROOT route SAFELY by replacing the whole handler
# Handles BOTH styles:
# 1) expression-bodied: router.get("/", (req,res)=>res.redirect(...));
# 2) block-bodied with res.redirect inside
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

  # Case 1: expression-bodied redirect
  s{
    router\.(get|all)\(\s*["\047]\/["\047]\s*,\s*(async\s*)?\([^)]*\)\s*=>\s*res\.redirect\(\s*307\s*,\s*["\047]\/demo\/playground["\047]\s*\)\s*\)\s*;
  }{$replacement}gsx;

  # Case 2: block-bodied containing that redirect (replace whole route block)
  s{
    router\.(get|all)\(\s*
      ["\047]\/["\047]\s*,\s*
      (async\s*)?\([^)]*\)\s*=>\s*\{
      .*?
      res\.redirect\(\s*307\s*,\s*["\047]\/demo\/playground["\047]\s*\)\s*;?
      .*?
      \}\s*
    \)\s*;
  }{$replacement}gsx;
' "$FILE"

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ index.js parses"

echo
echo "🧪 Validate root redirect behavior:"
curl -fsSI "http://localhost:3000/?embedded=1&shop=cart-agent-dev.myshopify.com&hmac=x" | sed -n '1,12p' || true
curl -fsSI "http://localhost:3000/" | sed -n '1,12p' || true

echo
echo "✅ Done."

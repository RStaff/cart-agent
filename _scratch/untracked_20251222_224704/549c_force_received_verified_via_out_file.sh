#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

begin = r"// ABANDO_FORCE_BEFORE_HANDLER_OK_STAGE"
# replace everything from the marker up to (but not including) "const line = JSON.stringify({"
pat = re.compile(rf"{begin}.*?\n\s*const\s+line\s*=\s*JSON\.stringify\(\{{", re.S)

m = pat.search(s)
if not m:
    raise SystemExit("❌ Could not find the ABANDO_FORCE block before `const line = JSON.stringify({`")

replacement = """// ABANDO_FORCE_BEFORE_HANDLER_OK_STAGE
        try {
          const a = JSON.stringify({
            ts: new Date().toISOString(),
            stage: "received",
            method: req.method,
            url: req.originalUrl || req.url || null,
            topic: req.get("x-shopify-topic") || null,
            shop: req.get("x-shopify-shop-domain") || null,
            has_hmac: !!req.get("x-shopify-hmac-sha256"),
          });
          fs.appendFileSync(out, a + "\\n");

          const b = JSON.stringify({
            ts: new Date().toISOString(),
            stage: "verified",
            method: req.method,
            url: req.originalUrl || req.url || null,
            topic: req.get("x-shopify-topic") || null,
            shop: req.get("x-shopify-shop-domain") || null,
            has_hmac: !!req.get("x-shopify-hmac-sha256"),
          });
          fs.appendFileSync(out, b + "\\n");
        } catch (_e) {}
        const line = JSON.stringify({"""

s2 = pat.sub(replacement, s, count=1)
p.write_text(s2, encoding="utf-8")
print("✅ Replaced ABANDO_FORCE block to append received+verified directly to `out`.")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

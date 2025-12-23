#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Forcing received+verified writes inside OK_SEND_PROBE (same out file)..."

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Find the OK_SEND_PROBE block's handler_ok_send line creation
needle = r'const line = JSON\.stringify\(\{\s*\n\s*ts:\s*new Date\(\)\.toISOString\(\),\s*\n\s*stage:\s*"handler_ok_send"'
m = re.search(needle, s, flags=re.M)
if not m:
    raise SystemExit("❌ Could not find handler_ok_send JSON block to anchor injection.")

inject = r'''
        // ABANDO_FORCE_STAGE_WRITES_V1 (same out file as handler_ok_send)
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
'''.lstrip("\n")

# Prevent duplicate injection if you re-run
if "ABANDO_FORCE_STAGE_WRITES_V1" in s:
    print("ℹ️ Injection already present — no changes.")
else:
    s2 = s[:m.start()] + inject + s[m.start():]
    p.write_text(s2, encoding="utf-8")
    print("✅ Injected received+verified writes before handler_ok_send.")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true

echo "✅ Done."

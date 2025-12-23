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

# Patch each occurrence of the handler_ok_send write to precede it with received+verified writes
needle = r'__abando__write_inbox\(\s*"handler_ok_send"\s*,\s*\{'
if not re.search(needle, s):
    raise SystemExit('❌ Could not find __abando__write_inbox("handler_ok_send", { ... )')

# Avoid double-applying
if "ABANDO_FORCE_BEFORE_HANDLER_OK_SEND" in s:
    print("ℹ️ Patch already applied — no changes.")
    raise SystemExit(0)

def inject(m):
    return (
        '/* ABANDO_FORCE_BEFORE_HANDLER_OK_SEND */\n'
        '__abando__write_inbox("received", {\n'
        '  method: req.method,\n'
        '  url: req.originalUrl || req.url,\n'
        '  topic: (req.get("x-shopify-topic") || null),\n'
        '  shop: (req.get("x-shopify-shop-domain") || null),\n'
        '  has_hmac: !!req.get("x-shopify-hmac-sha256"),\n'
        '});\n'
        '__abando__write_inbox("verified", {\n'
        '  method: req.method,\n'
        '  url: req.originalUrl || req.url,\n'
        '  topic: (req.get("x-shopify-topic") || null),\n'
        '  shop: (req.get("x-shopify-shop-domain") || null),\n'
        '  has_hmac: !!req.get("x-shopify-hmac-sha256"),\n'
        '});\n'
        + m.group(0)
    )

s2, n = re.subn(needle, inject, s)
if n == 0:
    raise SystemExit("❌ Patch failed (0 replacements).")

p.write_text(s2, encoding="utf-8")
print(f"✅ Patched {n} handler_ok_send site(s) to also write received+verified.")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

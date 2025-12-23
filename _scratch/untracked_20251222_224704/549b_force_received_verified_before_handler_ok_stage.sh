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

needle = 'stage: "handler_ok_send"'
hits = [m.start() for m in re.finditer(re.escape(needle), s)]
if not hits:
    raise SystemExit('❌ No `stage: "handler_ok_send"` found to patch.')

marker = "ABANDO_FORCE_BEFORE_HANDLER_OK_STAGE"
if marker in s:
    print("ℹ️ Patch already applied — no changes.")
    raise SystemExit(0)

inject = (
    f'// {marker}\n'
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
)

out = s
patched = 0

for pos in reversed(hits):
    # Look backward for the start of the JSON stringify block that contains this stage
    window_start = max(0, pos - 2000)
    window = out[window_start:pos]

    # Find the nearest "const line = JSON.stringify(" or similar above this stage
    m = None
    for pat in [
        r"\n\s*const\s+line\s*=\s*JSON\.stringify\(\{\s*\n",
        r"\n\s*let\s+line\s*=\s*JSON\.stringify\(\{\s*\n",
        r"\n\s*var\s+line\s*=\s*JSON\.stringify\(\{\s*\n",
    ]:
        mm = list(re.finditer(pat, window))
        if mm:
            m = mm[-1]
            break

    if not m:
        raise SystemExit("❌ Could not locate the `line = JSON.stringify({` block above handler_ok_send. Show surrounding code around the stage line.")

    insert_at = window_start + m.start()

    # Avoid inserting twice if multiple stage hits share the same block (very unlikely, but safe)
    if marker in out[insert_at:insert_at+500]:
        continue

    out = out[:insert_at] + "\n" + inject + out[insert_at:]
    patched += 1

p.write_text(out, encoding="utf-8")
print(f"✅ Inserted received+verified before {patched} handler_ok_send JSON blocks.")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

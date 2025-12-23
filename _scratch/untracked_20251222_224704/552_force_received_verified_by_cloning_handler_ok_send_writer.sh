#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Forcing received+verified by cloning the proven handler_ok_send writer..."

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

MARK = "ABANDO_FORCE_STAGE_TRIPLE_WRITE_V1"

# Find the *specific* block that writes handler_ok_send to `out`
# We'll replace the single append with 3 appends using same fs/out.
pat = re.compile(
    r'(?P<indent>^[ \t]*)//\s*\[abando\]\[OK_SEND_PROBE_BEGIN\](?P<body>.*?)(?P=indent)//\s*\[abando\]\[OK_SEND_PROBE_END\]',
    re.S | re.M
)

m = pat.search(s)
if not m:
    raise SystemExit("❌ Could not find OK_SEND_PROBE block boundaries.")

block = m.group(0)

# Replace ONLY the append of handler_ok_send (keep everything else intact)
needle = r'(?P<indent>^[ \t]*)fs\.appendFileSync\(out,\s*line\s*\+\s*"\\n"\s*\);\s*'
m2 = re.search(needle, block, re.M)
if not m2:
    raise SystemExit('❌ Could not find: fs.appendFileSync(out, line + "\\n"); inside OK_SEND_PROBE block.')

indent = m2.group("indent")

inject = (
f'{indent}// {MARK}\n'
f'{indent}try {{\n'
f'{indent}  const a = JSON.stringify({{\n'
f'{indent}    ts: new Date().toISOString(),\n'
f'{indent}    stage: "received",\n'
f'{indent}    method: req.method,\n'
f'{indent}    url: req.originalUrl || req.url || null,\n'
f'{indent}    topic: req.get("x-shopify-topic") || null,\n'
f'{indent}    shop: req.get("x-shopify-shop-domain") || null,\n'
f'{indent}    has_hmac: !!req.get("x-shopify-hmac-sha256"),\n'
f'{indent}  }});\n'
f'{indent}  fs.appendFileSync(out, a + "\\n");\n'
f'{indent}\n'
f'{indent}  const b = JSON.stringify({{\n'
f'{indent}    ts: new Date().toISOString(),\n'
f'{indent}    stage: "verified",\n'
f'{indent}    method: req.method,\n'
f'{indent}    url: req.originalUrl || req.url || null,\n'
f'{indent}    topic: req.get("x-shopify-topic") || null,\n'
f'{indent}    shop: req.get("x-shopify-shop-domain") || null,\n'
f'{indent}    has_hmac: !!req.get("x-shopify-hmac-sha256"),\n'
f'{indent}  }});\n'
f'{indent}  fs.appendFileSync(out, b + "\\n");\n'
f'{indent}}} catch (e) {{\n'
f'{indent}  try {{ console.warn("[abando][FORCE_STAGE_TRIPLE_WRITE] failed:", e?.message || e); }} catch (_) {{}}\n'
f'{indent}}}\n'
)

# Avoid double-apply
if MARK in block:
    print("ℹ️ Already applied — no changes.")
    raise SystemExit(0)

block2 = re.sub(needle, inject + r'\g<indent>fs.appendFileSync(out, line + "\\n");\n', block, count=1, flags=re.M)

s2 = s[:m.start()] + block2 + s[m.end():]
p.write_text(s2, encoding="utf-8")
print("✅ Patched OK_SEND_PROBE to always write received+verified using same fs/out.")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

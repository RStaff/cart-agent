#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Injecting received+verified immediately before fs.appendFileSync(out, line + \"\\\\n\")..."

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

MARK = "ABANDO_FORCE_STAGE_WRITES_V2"

# Target the *actual* append of handler_ok_send
pat = re.compile(r'(\s*)fs\.appendFileSync\(out,\s*line\s*\+\s*"\\n"\s*\);\s*', re.M)

matches = list(pat.finditer(s))
if not matches:
    raise SystemExit("❌ Could not find: fs.appendFileSync(out, line + \"\\\\n\");")

def inject(indent: str) -> str:
    return (
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
        f'{indent}  fs.appendFileSync(out, a + "\\\\n");\n'
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
        f'{indent}  fs.appendFileSync(out, b + "\\\\n");\n'
        f'{indent}}} catch (_e) {{}}\n'
    )

# Don’t double-inject if already present right before the append
out = s
repl_count = 0
for m in reversed(matches):
    indent = m.group(1)
    window_start = max(0, m.start() - 400)
    window = out[window_start:m.start()]
    if MARK in window:
        continue
    out = out[:m.start()] + inject(indent) + out[m.start():]
    repl_count += 1

p.write_text(out, encoding="utf-8")
print(f"✅ Injected before ok-append in {repl_count} place(s) (found {len(matches)} append sites).")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

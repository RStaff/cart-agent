#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Injecting received+verified immediately before handler_ok_send append (boundary-free)..."

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

MARK = "ABANDO_FORCE_STAGE_TRIPLE_WRITE_V2"

if MARK in s:
    print("ℹ️ Already applied — no changes.")
    raise SystemExit(0)

# We patch the FIRST occurrence of an append that looks like:
#   fs.appendFileSync(out, line + "\n");
# and where line is a JSON.stringify that includes stage: "handler_ok_send"
# We do NOT rely on block markers.
pat = re.compile(
    r'(?P<prefix>const\s+line\s*=\s*JSON\.stringify\(\{\s*(?:(?!\}\)\s*;).)*?stage:\s*"handler_ok_send"(?:.|\n)*?\}\)\s*;\s*)'
    r'(?P<append>fs\.appendFileSync\(\s*out\s*,\s*line\s*\+\s*"\\n"\s*\)\s*;\s*)',
    re.M
)

m = pat.search(s)
if not m:
    raise SystemExit('❌ Could not find a `handler_ok_send` JSON.stringify + `fs.appendFileSync(out, line + "\\n")` pair to patch.')

# Determine indent from append line
append_block = m.group("append")
indent_match = re.search(r'^(?P<indent>[ \t]*)fs\.appendFileSync', append_block, re.M)
indent = indent_match.group("indent") if indent_match else ""

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
f'{indent}  try {{ console.warn("[abando][{MARK}] failed:", e?.message || e); }} catch (_) {{}}\n'
f'{indent}}}\n'
)

new_append = inject + m.group("append")
s2 = s[:m.start("append")] + new_append + s[m.end("append"):]

# backup
bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

p.write_text(s2, encoding="utf-8")
print(f"✅ Patched: injected before handler_ok_send append. Backup: {bak.name}")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

# 1) Ensure the probe middleware has (req,res,next)
# We look for the ABANDO_WEBHOOK_PROBE_MW string block you already have.
# If it defines something like "(req, res) =>", make it "(req, res, next) =>"
s2 = re.sub(
  r'(ABANDO_WEBHOOK_PROBE_MW\s*=\s*\(?\s*req\s*,\s*res)\s*\)',
  r'\1, next)',
  s
)
# also handle "function (req,res)" style
s2 = re.sub(
  r'(function\s*\(\s*req\s*,\s*res)\s*\)',
  r'\1, next)',
  s2
)

# 2) Replace ONLY the "send ok" short-circuit that is associated with handler_ok_send
# If the probe wants to short-circuit, it can via env:
#   ABANDO_WEBHOOK_PROBE_SHORTCIRCUIT=1
pattern = r'''(?s)
(\{\s*"ts"\s*:\s*[^}]*"stage"\s*:\s*"handler_ok_send"[^}]*\}\s*\)\s*;.*?)
return\s+res\.status\(\s*200\s*\)\.send\(\s*["']ok["']\s*\)\s*;
'''
m = re.search(pattern, s2)
if not m:
  raise SystemExit("❌ Could not find the probe's handler_ok_send -> send('ok') block in web/src/index.js")

replacement = r'''\1
// ABANDO_PROBE_V3: do NOT short-circuit by default.
// Set ABANDO_WEBHOOK_PROBE_SHORTCIRCUIT=1 if you want the old behavior.
if (process.env.ABANDO_WEBHOOK_PROBE_SHORTCIRCUIT === "1") {
  return res.status(200).send("ok");
}
return next();
'''
s3 = re.sub(pattern, replacement, s2, count=1)

p.write_text(s3, encoding="utf-8")
print("✅ Patched probe middleware: no short-circuit by default (falls through to routes).")
PY

echo "🔎 ESM import-check web/src/index.js..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/index.js').then(()=>console.log('✅ index.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/index.js 2>/dev/null || true
echo "✅ Done."

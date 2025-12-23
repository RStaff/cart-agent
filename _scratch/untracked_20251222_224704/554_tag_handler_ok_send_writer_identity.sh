#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🏷️ Tagging handler_ok_send JSON.stringify blocks with writer identity..."

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

MARK = "ABANDO_HANDLER_OK_SEND_WRITER_TAG_V1"
if MARK in s:
    print("ℹ️ Already tagged — no changes.")
    raise SystemExit(0)

bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# Inject fields right after stage: "handler_ok_send",
needle = r'(stage:\s*"handler_ok_send"\s*,\s*\n)'
inject = r'\1          // ABANDO_HANDLER_OK_SEND_WRITER_TAG_V1\n' \
         r'          writer: "DIRECT_APPEND",\n' \
         r'          pid: process.pid,\n' \
         r'          cwd: process.cwd(),\n'

s2, n = re.subn(needle, inject, s)
if n == 0:
    raise SystemExit('❌ Could not find any `stage: "handler_ok_send",` blocks to tag.')

p.write_text(s2, encoding="utf-8")
print(f"✅ Tagged {n} handler_ok_send block(s). Backup: {bak.name}")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

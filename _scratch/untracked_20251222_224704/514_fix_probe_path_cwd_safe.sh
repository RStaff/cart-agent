#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "✅ Backup created."

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Ensure we have a single probe path constant near the probe block.
if "ABANDO_WEBHOOK_PROBE_PATH" not in s:
    s = s.replace(
        "// [abando][WEBHOOK_PROBE]",
        """// [abando][WEBHOOK_PROBE]
const __PROBE_PATH = process.env.ABANDO_WEBHOOK_PROBE_PATH
  ? path.resolve(process.cwd(), process.env.ABANDO_WEBHOOK_PROBE_PATH)
  : path.resolve(process.cwd(), ".abando_webhook_probe.jsonl");"""
    )

# Replace any hardcoded writes that include "web/.abando_webhook_probe.jsonl" (bad in cwd=web)
s = s.replace('fs.appendFileSync("web/.abando_webhook_probe.jsonl", line + "\\n");',
              'fs.appendFileSync(__PROBE_PATH, line + "\\n");')

s = s.replace('fs.appendFileSync("web/.abando_webhook_probe.jsonl", line + "\\n");',
              'fs.appendFileSync(__PROBE_PATH, line + "\\n");')

s = s.replace('fs.appendFileSync(path.join(process.cwd(), "web/.abando_webhook_probe.jsonl"), line + "\\\\n");',
              'fs.appendFileSync(__PROBE_PATH, line + "\\\\n");')

p.write_text(s, encoding="utf-8")
print("✅ Patched probe path to be cwd-safe:", str(p))
PY

echo "🔎 Import-checking as ESM..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudging nodemon restart..."
mkdir -p web/lib
touch web/index.js web/lib/.nodemon_restart 2>/dev/null || true
echo "✅ Done."

#!/usr/bin/env bash
set -euo pipefail

cd ~/projects/cart-agent || exit 1
FILE="web/src/routes/webhooks.js"

echo "🛠️ Normalizing webhook inbox path in $FILE"

test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

# Backup
cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re, sys

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Replace any process.cwd() based inbox path with canonical web path
patterns = [
    r'path\.resolve\(\s*process\.cwd\(\)\s*,\s*["\']\.abando_webhook_inbox\.jsonl["\']\s*\)',
    r'["\']\.abando_webhook_inbox\.jsonl["\']'
]

new = s
for pat in patterns:
    new = re.sub(
        pat,
        'path.resolve(process.cwd(), "web/.abando_webhook_inbox.jsonl")',
        new
    )

if new == s:
    print("⚠️ No inbox paths replaced (may already be normalized)")
else:
    p.write_text(new, encoding="utf-8")
    print("✅ Inbox path normalized to web/.abando_webhook_inbox.jsonl")

PY

echo "🔎 ESM import-check webhooks.js..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true

echo "✅ Done."

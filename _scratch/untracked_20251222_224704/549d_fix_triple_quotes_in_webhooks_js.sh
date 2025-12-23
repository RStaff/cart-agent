#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Removing accidental Python triple-quotes from JS..."
python3 - <<'PY'
from pathlib import Path
p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Remove any raw triple quotes that may have been inserted
s2 = s.replace('"""', '')

# Also fix the most likely exact bad token if present
s2 = s2.replace('const line = JSON.stringify({', 'const line = JSON.stringify({')

p.write_text(s2, encoding="utf-8")
print("✅ Cleaned triple quotes.")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

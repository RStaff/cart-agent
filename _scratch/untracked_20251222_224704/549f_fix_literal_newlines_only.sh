#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Fixing literal newline strings in webhooks.js..."

python3 - <<'PY'
from pathlib import Path

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Fix ONLY the exact broken patterns seen in the file
s = s.replace('fs.appendFileSync(out, a + "\\n");', 'fs.appendFileSync(out, a + "\\n");')
s = s.replace('fs.appendFileSync(out, b + "\\n");', 'fs.appendFileSync(out, b + "\\n");')

# Now fix the *actual* broken form: quote + newline + quote
s = s.replace('fs.appendFileSync(out, a + "\n");', 'fs.appendFileSync(out, a + "\\n");')
s = s.replace('fs.appendFileSync(out, b + "\n");', 'fs.appendFileSync(out, b + "\\n");')

# And the literal multi-line version
s = s.replace('fs.appendFileSync(out, a + "\n"\n);', 'fs.appendFileSync(out, a + "\\n");')
s = s.replace('fs.appendFileSync(out, b + "\n"\n);', 'fs.appendFileSync(out, b + "\\n");')

p.write_text(s, encoding="utf-8")
print("✅ Literal newline strings fixed.")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

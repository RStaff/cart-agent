#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Fixing broken newline literals in webhooks.js..."

python3 - <<'PY'
from pathlib import Path
p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Fix: fs.appendFileSync(out, a + "\n");
# But currently it is split across lines as: a + " <newline> ";
# Same for b.
s2 = s.replace('fs.appendFileSync(out, a + "\n");', 'fs.appendFileSync(out, a + "\\n");')
s2 = s2.replace('fs.appendFileSync(out, b + "\n");', 'fs.appendFileSync(out, b + "\\n");')

# If the above didn't match because the file literally contains a quote, newline, quote:
s2 = s2.replace('fs.appendFileSync(out, a + "\n"\n");', 'fs.appendFileSync(out, a + "\\n");')
s2 = s2.replace('fs.appendFileSync(out, b + "\n"\n");', 'fs.appendFileSync(out, b + "\\n");')

# More robust: directly collapse the known bad pattern: a + "<newline>";
s2 = s2.replace('fs.appendFileSync(out, a + "\n"\n);', 'fs.appendFileSync(out, a + "\\n");')
s2 = s2.replace('fs.appendFileSync(out, b + "\n"\n);', 'fs.appendFileSync(out, b + "\\n");')

# Nuclear-but-still-minimal: specifically target the exact broken sequences shown in your snippet
s2 = s2.replace('fs.appendFileSync(out, a + "\n"\n');', 'fs.appendFileSync(out, a + "\\n");')
s2 = s2.replace('fs.appendFileSync(out, b + "\n"\n');', 'fs.appendFileSync(out, b + "\\n");')

# Best catch-all: replace a + "<newline>" with a + "\\n"
s2 = s2.replace('fs.appendFileSync(out, a + "\n', 'fs.appendFileSync(out, a + "\\n')
s2 = s2.replace('fs.appendFileSync(out, b + "\n', 'fs.appendFileSync(out, b + "\\n')

p.write_text(s2, encoding="utf-8")
print("✅ Newline literals repaired.")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

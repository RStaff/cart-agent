#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "✅ Backup created."

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Ensure crypto import includes timingSafeEqual (ESM-safe)
if re.search(r'import\s+\{\s*createHmac\s*\}\s+from\s+"crypto"', s):
    s = re.sub(r'import\s+\{\s*createHmac\s*\}\s+from\s+"crypto"\s*;',
               'import { createHmac, timingSafeEqual } from "crypto";', s)
elif 'from "crypto"' in s and 'timingSafeEqual' not in s:
    # best-effort: prepend a clean import
    s = 'import { createHmac, timingSafeEqual } from "crypto";\n' + s

# Replace helper to avoid require()
s = re.sub(
    r'function timingSafeEqualB64\([^\)]*\)\s*\{.*?\n\}',
    '''function timingSafeEqualB64(a, b) {
  const ab = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return String(a || "") === String(b || "");
  }
}''',
    s,
    flags=re.S
)

p.write_text(s, encoding="utf-8")
print("✅ Patched crypto import + timingSafeEqualB64 for ESM.")
PY

echo "🔎 Import-checking as ESM..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudging nodemon restart..."
mkdir -p web/lib
touch web/index.js web/lib/.nodemon_restart 2>/dev/null || true
echo "✅ Done."

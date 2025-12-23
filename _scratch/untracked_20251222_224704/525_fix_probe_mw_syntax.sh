#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "🛠️  Fixing broken string literal inside ABANDO_WEBHOOK_PROBE_MW in $FILE"

cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
import re
from pathlib import Path

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

BEGIN = "// ABANDO_WEBHOOK_PROBE_MW_BEGIN"
END   = "// ABANDO_WEBHOOK_PROBE_MW_END"

if BEGIN not in s or END not in s:
    raise SystemExit("❌ ABANDO_WEBHOOK_PROBE_MW markers not found in web/src/index.js")

pre, rest = s.split(BEGIN, 1)
block, post = rest.split(END, 1)

# Fix: fs.appendFileSync(out, line + "<NEWLINE>");  -> fs.appendFileSync(out, line + "\\n");
block_fixed = re.sub(
    r'fs\.appendFileSync\(\s*out\s*,\s*line\s*\+\s*"\s*[\r\n]+\s*"\s*\)\s*;',
    r'fs.appendFileSync(out, line + "\\n");',
    block,
    flags=re.M
)

# Also catch variants like line + "  <newline>  );  (missing closing quote)
block_fixed = re.sub(
    r'fs\.appendFileSync\(\s*out\s*,\s*line\s*\+\s*"\s*[\r\n]+\s*\)\s*;',
    r'fs.appendFileSync(out, line + "\\n");',
    block_fixed,
    flags=re.M
)

# If nothing changed, still proceed but warn
if block_fixed == block:
    print("⚠️  No pattern match; attempting a broader repair...")

    block_fixed2 = re.sub(
        r'fs\.appendFileSync\(\s*out\s*,\s*line\s*\+\s*"(?:\r?\n)+',
        r'fs.appendFileSync(out, line + "\\n"',
        block_fixed,
        flags=re.M
    )
    block_fixed = block_fixed2

new_s = pre + BEGIN + block_fixed + END + post
p.write_text(new_s, encoding="utf-8")
print("✅ Patched ABANDO_WEBHOOK_PROBE_MW string literal safely.")
PY

echo "🔎 ESM import-check web/src/index.js..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/index.js').then(()=>console.log('✅ index.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/index.js 2>/dev/null || true
echo "✅ Done."

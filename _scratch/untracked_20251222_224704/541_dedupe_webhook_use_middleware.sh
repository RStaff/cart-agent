#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🛠️ Dedupe /api/webhooks app.use middlewares in $FILE"

# Backup
cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

needle = 'app.use("/api/webhooks", (req, _res, next) => {'
idxs = []
start = 0
while True:
    i = s.find(needle, start)
    if i == -1:
        break
    idxs.append(i)
    start = i + 1

print(f"Found {len(idxs)} occurrences of webhook middleware needle.")
if len(idxs) <= 1:
    print("✅ Nothing to dedupe.")
    raise SystemExit(0)

# Remove the SECOND occurrence block by scanning to its matching '});'
rm_start = idxs[1]

# Find the opening '{' for brace counting
open_brace = s.find("{", rm_start)
if open_brace == -1:
    raise SystemExit("❌ Could not find opening brace for 2nd middleware block.")

i = open_brace
depth = 0
end = None
while i < len(s):
    ch = s[i]
    if ch == "{":
        depth += 1
    elif ch == "}":
        depth -= 1
        if depth == 0:
            # expect ');' after this
            j = s.find(");", i)
            if j != -1 and j - i < 10_000:
                end = j + 2
                break
    i += 1

if end is None:
    raise SystemExit("❌ Could not find end of 2nd middleware block (matching '});').")

new_s = s[:rm_start] + "\n// [ABANDO] removed duplicate /api/webhooks middleware (was causing double handling)\n" + s[end:]
p.write_text(new_s, encoding="utf-8")
print("✅ Removed 2nd /api/webhooks middleware block.")
PY

echo "🔎 ESM import-check web/src/index.js..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/index.js').then(()=>console.log('✅ index.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch "$FILE" 2>/dev/null || true

echo "✅ Done."

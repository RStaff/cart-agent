#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
import re, pathlib

p = pathlib.Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Match full ABANDO_LOGGING_V2 blocks
pattern = re.compile(
    r"\s*// ABANDO_LOGGING_V2 \\(forced\\)(?s).*?__abando__write_inbox\\(\"verified\".*?\\);\\s*\\}",
    re.M
)

blocks = pattern.findall(s)
if not blocks:
    raise SystemExit("❌ No ABANDO_LOGGING_V2 blocks found")

# Keep the FIRST block only
kept = blocks[0]
s2 = pattern.sub("", s)
s2 = s2.replace("\n\n\n", "\n\n").strip() + "\n\n" + kept + "\n"

p.write_text(s2, encoding="utf-8")
print(f"✅ Deduped ABANDO_LOGGING_V2: kept 1, removed {len(blocks)-1}")
PY

echo "🔎 ESM import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/$FILE').then(()=>console.log('✅ imports ok')).catch(e=>{console.error(e);process.exit(1)})"

touch "$FILE"
echo "✅ Done."

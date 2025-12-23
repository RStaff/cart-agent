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

# Match ONE full ABANDO_LOGGING_V2 try/catch block
pat = re.compile(
    r"""
    ^[ \t]*//\s*ABANDO_LOGGING_V2\s*\(forced\)\s*\n
    [ \t]*try\s*\{\s*\n
    .*?
    ^[ \t]*\}\s*catch\s*\(\s*e\s*\)\s*\{\s*\n
    .*?
    ^[ \t]*\}\s*\n
    """,
    re.M | re.S | re.X,
)

matches = list(pat.finditer(s))
if not matches:
    raise SystemExit("❌ No ABANDO_LOGGING_V2 try/catch blocks found (pattern mismatch).")

keep_first = True
def repl(m):
    global keep_first
    if keep_first:
        keep_first = False
        return m.group(0)
    return ""  # drop duplicates

s2 = pat.sub(repl, s)

# tidy excessive blank lines a bit
s2 = re.sub(r"\n{4,}", "\n\n\n", s2)

p.write_text(s2, encoding="utf-8")
print(f"✅ Deduped ABANDO_LOGGING_V2: kept 1, removed {len(matches)-1}")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

touch "$FILE" 2>/dev/null || true
echo "✅ Done."

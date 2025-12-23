#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Repairing broken string literals caused by literal newlines in quotes..."

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# Focus on __abando__write_inbox() block only
m = re.search(r'function\s+__abando__write_inbox\s*\(\s*stage\s*,\s*obj\s*\)\s*\{', s)
if not m:
    raise SystemExit("❌ Could not find __abando__write_inbox()")

start = m.start()
end = s.find("\n}\n", start)
if end == -1:
    raise SystemExit("❌ Could not find end of __abando__write_inbox()")

func = s[start:end+3]

# Fix patterns like: + " <LITERAL NEWLINE> "
func2, n1 = re.subn(r'\+\s*"\s*\n\s*"\s*\)', r'+ "\\n")', func)
# Also handle single quotes: + ' <LITERAL NEWLINE> '
func2, n2 = re.subn(r"\+\s*'\s*\n\s*'\s*\)", r'+ "\\n")', func2)

out = s[:start] + func2 + s[end+3:]
p.write_text(out, encoding="utf-8")

print(f"✅ Repaired broken newline-in-string patterns in __abando__write_inbox(): {n1+n2}. Backup: {bak.name}")
PY

echo "🔎 node --check..."
node --check "$FILE"
echo "✅ node --check passed."

echo "🔁 Restart (touch)..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."

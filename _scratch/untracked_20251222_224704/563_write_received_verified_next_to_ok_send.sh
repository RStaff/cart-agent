#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# Find the canonical handler_ok_send call
pat = re.compile(
    r'(__abando__write_inbox\("handler_ok_send",\s*\{\s*\n'
    r'(?:.*\n)*?\s*\}\s*\);\s*)',
    re.M
)

m = pat.search(s)
if not m:
    raise SystemExit('❌ Could not find __abando__write_inbox("handler_ok_send", {...}); call to patch.')

block = m.group(1)

# If we've already added the siblings, do nothing
if '__abando__write_inbox("received"' in s[m.start():m.start()+800] or '__abando__write_inbox("verified"' in s[m.start():m.start()+800]:
    print("ℹ️ received/verified already appear next to handler_ok_send — no changes.")
    raise SystemExit(0)

# Clone the object body from the handler_ok_send block
obj_pat = re.compile(r'__abando__write_inbox\("handler_ok_send",\s*(\{\s*\n(?:.*\n)*?\s*\})\s*\);', re.M)
m2 = obj_pat.search(block)
if not m2:
    raise SystemExit("❌ Could not extract object body from handler_ok_send call.")

obj = m2.group(1)

inject = (
    f'__abando__write_inbox("received", {obj});\n'
    f'__abando__write_inbox("verified", {obj});\n'
    + block
)

s2 = s[:m.start()] + inject + s[m.end():]
p.write_text(s2, encoding="utf-8")
print(f"✅ Patched: wrote received+verified next to handler_ok_send. Backup: {bak.name}")
PY

echo "🔎 node --check..."
node --check "$FILE"
echo "✅ node --check passed."

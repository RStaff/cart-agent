#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "=== 1) node syntax check ==="
node --check "$FILE" && echo "✅ node --check OK" || exit 1

echo
echo "=== 2) quick duplicate-declare scan (common offenders) ==="
# counts of `const/let/var <name>` declarations (not perfect, but catches most dupes fast)
python3 - <<'PY'
import re
from collections import Counter
from pathlib import Path

s = Path("web/src/routes/webhooks.js").read_text(encoding="utf-8", errors="replace")

names = []
for m in re.finditer(r'^\s*(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=', s, flags=re.M):
    names.append(m.group(1))

c = Counter(names)
dupes = [(k,v) for k,v in c.items() if v > 1 and k not in ("i","j","k","e","err","_e","_", "req","res","next")]
dupes.sort(key=lambda x: (-x[1], x[0]))

print(f"Total declarations found: {len(names)}")
if not dupes:
    print("✅ No obvious duplicate variable declarations found (heuristic).")
else:
    print("⚠️ Potential duplicate declarations (name: count):")
    for k,v in dupes[:50]:
        print(f"  {k}: {v}")
PY

echo
echo "=== 3) show duplicate require/import lines (path/fs/crypto/express) ==="
rg -n 'require\("node:(path|fs|crypto)"\)|from\s+"node:(path|fs|crypto)"|require\("express"\)|from\s+"express"' "$FILE" || true

echo
echo "=== 4) show any literal newline tokens that would break JS strings ==="
# This prints lines that contain an unescaped quote followed by a raw newline in the source snippet area.
# Not perfect; the real gate is node --check above.
rg -n '"$|'\''$' "$FILE" || true

echo
echo "=== 5) show the __abando__write_inbox function block (for eyeballing) ==="
python3 - <<'PY'
from pathlib import Path
import re
s = Path("web/src/routes/webhooks.js").read_text(encoding="utf-8", errors="replace")
m = re.search(r'function\s+__abando__write_inbox\s*\([^)]*\)\s*\{', s)
if not m:
    print("❌ __abando__write_inbox() not found")
    raise SystemExit(1)

start = m.start()
# naive brace match
i = m.end()
depth = 1
while i < len(s) and depth:
    if s[i] == "{": depth += 1
    elif s[i] == "}": depth -= 1
    i += 1
block = s[start:i]
lines = block.splitlines()
for idx, line in enumerate(lines[:220], start=1):
    print(f"{idx:4d} {line}")
PY

echo
echo "✅ Diagnostics completed."

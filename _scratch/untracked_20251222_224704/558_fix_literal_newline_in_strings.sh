#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8", errors="replace")

bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# Fix: + "<literal newline>"  -> + "\\n"
# This targets the exact failure pattern you hit.
s2, n = re.subn(r'\+\s*"\n"\s*', r'+ "\\n"', s)

# Also fix the common variant where the newline is split across lines:
# + " <newline>  (rest)  -> + "\\n" (rest)
s2, n2 = re.subn(r'\+\s*"\n', r'+ "\\n"', s2)

p.write_text(s2, encoding="utf-8")
print(f"✅ Fixed literal newline-in-string patterns: {n+n2}. Backup: {bak.name}")
PY

node --check "$FILE"
echo "✅ node --check passed."

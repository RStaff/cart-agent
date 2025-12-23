#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Fixing __abando__write_inbox(): ESM-safe require + real \\n..."
python3 - <<'PY'
from pathlib import Path
import time, re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# 1) Ensure ESM-safe require exists (createRequire)
if "createRequire" not in s or "createRequire(import.meta.url)" not in s:
    # Insert after the last top-level import, otherwise at top
    lines = s.splitlines(True)
    insert_at = 0
    for i, line in enumerate(lines):
        if line.lstrip().startswith("import "):
            insert_at = i + 1
        elif i > 0 and not line.lstrip().startswith("import "):
            break
    inject = 'import { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\n'
    lines.insert(insert_at, inject)
    s = "".join(lines)

# 2) Fix newline literals inside __abando__write_inbox (\\n -> \n)
# Only touch within the function block to avoid collateral damage.
m = re.search(r'function\s+__abando__write_inbox\s*\([^)]*\)\s*\{', s)
if not m:
    raise SystemExit("❌ Could not find __abando__write_inbox()")

start = m.start()
# naive brace match to find end of function
i = m.end()
depth = 1
while i < len(s) and depth > 0:
    if s[i] == "{": depth += 1
    elif s[i] == "}": depth -= 1
    i += 1
func = s[m.start():i]

# Replace + "\\n" with + "\n" (runtime newline)
func2 = func.replace('+ "\\\\n"', '+ "\\n"')

s2 = s[:m.start()] + func2 + s[i:]

p.write_text(s2, encoding="utf-8")
print(f"✅ Patched. Backup: {bak.name}")
PY

echo "🔎 node --check..."
node --check "$FILE"
echo "✅ node --check passed."

echo "🔁 Restart nodemon..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."

#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Disabling direct fs.appendFileSync(out, line + \"\\n\") (bypass) so handler_ok_send only flows through __abando__write_inbox()..."

python3 - <<'PY'
import time, re
from pathlib import Path

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")
bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# Replace ONLY the direct append of the handler_ok_send line to `out`
# (we keep everything else intact for minimal risk)
needle = r'(^[ \t]*)fs\.appendFileSync\(out,\s*line\s*\+\s*"\\n"\s*\);\s*$'
m = re.search(needle, s, flags=re.M)
if not m:
    raise SystemExit("❌ Could not find `fs.appendFileSync(out, line + \"\\\\n\");` to disable.")

indent = m.group(1)
replacement = (
    f'{indent}// [ABANDO] disabled: handler_ok_send must be written via __abando__write_inbox() to enable received+verified fan-out\n'
    f'{indent}// fs.appendFileSync(out, line + \"\\\\n\");\n'
)

s2 = re.sub(needle, replacement, s, count=1, flags=re.M)
p.write_text(s2, encoding="utf-8")
print(f"✅ Patched. Backup: {bak.name}")
PY

node --check "$FILE"
echo "✅ node --check passed."

echo "🔁 Nudge nodemon restart..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."

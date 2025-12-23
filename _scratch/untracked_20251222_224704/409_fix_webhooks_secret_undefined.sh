#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BK="${FILE}.bak_$(date +%s)"
cp "$FILE" "$BK"
echo "✅ Backup: $BK"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Remove the bad injected BOOT log(s) that reference `secret` at module scope
s2, n = re.subn(
    r'^\s*console\.log\(\s*"\[abando\]\[WEBHOOK_SECRET_FP\]\[BOOT\]".*?\);\s*$\n?',
    '',
    s,
    flags=re.M
)

# Also remove any variants that still call __abandoFp(secret) on the same line
s2, n2 = re.subn(
    r'^\s*console\.log\(\s*"\[abando\]\[WEBHOOK_SECRET_FP\]\[BOOT\]".*__abandoFp\(\s*secret\s*\).*?\);\s*$\n?',
    '',
    s2,
    flags=re.M
)

print(f"✅ Removed {n+n2} bad BOOT log line(s) from {p}")

p.write_text(s2, encoding="utf-8")
PY

echo "✅ Patched $FILE"

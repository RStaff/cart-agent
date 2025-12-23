#!/usr/bin/env bash
set -euo pipefail

FILE="web/start.mjs"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BK="${FILE}.bak_$(date +%s)"
cp "$FILE" "$BK"
echo "✅ Backup: $BK"

python3 - <<'PY'
from pathlib import Path

p = Path("web/start.mjs")
s = p.read_text(encoding="utf-8")

lines = s.splitlines(True)  # keep newlines
out = []
removed = 0

for line in lines:
    if line.startswith("#!") and "env node" in line:
        removed += 1
        continue
    out.append(line)

p.write_text("".join(out), encoding="utf-8")
print(f"✅ Removed {removed} shebang line(s) from {p}")
PY

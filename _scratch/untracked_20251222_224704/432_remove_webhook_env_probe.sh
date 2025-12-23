#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
cp "$FILE" "$FILE.bak_$(date +%s)"
python3 - <<'PY'
from pathlib import Path
p = Path("web/src/routes/webhooks.js")
lines = p.read_text(encoding="utf-8").splitlines(True)
out = []
skip = False
for line in lines:
    if "[abando][WEBHOOK_ENV_PROBE]" in line:
        # drop the whole try/catch block by skipping until we hit a blank line after it
        skip = True
        continue
    if skip:
        if line.strip() == "":
            skip = False
        continue
    out.append(line)
p.write_text("".join(out), encoding="utf-8")
print("✅ Removed WEBHOOK_ENV_PROBE block")
PY

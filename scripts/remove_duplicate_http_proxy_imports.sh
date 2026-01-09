#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_dedupe_$(date +%s)"

python3 - <<'PY'
from pathlib import Path

p = Path("web/src/index.js")
lines = p.read_text().splitlines(True)

out = []
removed = 0
for line in lines:
    if "http-proxy-middleware" in line and "import" in line:
        removed += 1
        continue
    if "http-proxy-middleware" in line and "require(" in line:
        removed += 1
        continue
    out.append(line)

p.write_text("".join(out))
print(f"✅ Removed {removed} http-proxy-middleware import/require line(s).")
PY

echo "== now ensure there is exactly ONE import near top =="
rg -n 'http-proxy-middleware|createProxyMiddleware' "$FILE" || true

#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_fix_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text()

# 1) Remove the CommonJS require line if present
s2 = re.sub(r'^\s*const\s*\{\s*createProxyMiddleware\s*\}\s*=\s*require\(["\']http-proxy-middleware["\']\);\s*\n',
            '', s, flags=re.M)

# 2) If we already have an ESM import, don't add a second
if re.search(r'^\s*import\s*\{\s*createProxyMiddleware\s*\}\s*from\s*["\']http-proxy-middleware["\']\s*;\s*$',
             s2, flags=re.M):
    p.write_text(s2)
    print("✅ ESM import already present (removed require if it existed).")
    raise SystemExit(0)

# 3) Insert ESM import near the top (after the last existing import line)
lines = s2.splitlines(True)
import_line = 'import { createProxyMiddleware } from "http-proxy-middleware";\n'

# Find where imports end
idx = 0
for i, line in enumerate(lines):
    if re.match(r'^\s*import\s+', line):
        idx = i + 1

lines.insert(idx, import_line)
p.write_text(''.join(lines))
print("✅ Inserted ESM import for createProxyMiddleware.")
PY

echo "✅ Patched $FILE (backup created)."

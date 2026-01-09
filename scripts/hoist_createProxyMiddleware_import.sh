#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_hoist_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text()

# Remove any existing createProxyMiddleware import (anywhere)
s = re.sub(r'^\s*import\s*\{\s*createProxyMiddleware\s*\}\s*from\s*["\']http-proxy-middleware["\']\s*;\s*\n',
           '', s, flags=re.M)

# Also remove any old require line just in case
s = re.sub(r'^\s*const\s*\{\s*createProxyMiddleware\s*\}\s*=\s*require\(["\']http-proxy-middleware["\']\);\s*\n',
           '', s, flags=re.M)

lines = s.splitlines(True)

# Find insertion point: after the last top import line
insert_at = 0
for i, line in enumerate(lines):
    if re.match(r'^\s*import\s+', line):
        insert_at = i + 1

import_line = 'import { createProxyMiddleware } from "http-proxy-middleware";\n'
lines.insert(insert_at, import_line)

p.write_text(''.join(lines))
print("✅ Hoisted createProxyMiddleware import to top import block and removed duplicates.")
PY

echo "✅ Patched $FILE (backup created)."

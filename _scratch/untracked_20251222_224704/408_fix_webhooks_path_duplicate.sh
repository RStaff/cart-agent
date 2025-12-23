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

# If node:path import exists, remove any other path import lines.
has_node_path = re.search(r'^\s*import\s+\*\s+as\s+path\s+from\s+["\']node:path["\']\s*;\s*$', s, re.M) is not None

lines = s.splitlines(True)
out = []
for line in lines:
    if has_node_path:
        if re.search(r'^\s*import\s+path\s+from\s+["\']path["\']\s*;\s*$', line):
            continue
        if re.search(r'^\s*import\s+path\s+from\s+["\']node:path["\']\s*;\s*$', line):
            continue
    out.append(line)

s2 = "".join(out)

# If node:path import does NOT exist, ensure we have exactly one usable import:
if not has_node_path:
    # Remove any existing duplicate forms first
    s2 = re.sub(r'^\s*import\s+path\s+from\s+["\']path["\']\s*;\s*$\n?', '', s2, flags=re.M)
    s2 = re.sub(r'^\s*import\s+\*\s+as\s+path\s+from\s+["\']node:path["\']\s*;\s*$\n?', '', s2, flags=re.M)
    # Add node:path import near the top (after 'crypto' import if present)
    m = re.search(r'^(import\s+.*crypto.*\n)', s2, re.M)
    ins = m.end() if m else 0
    s2 = s2[:ins] + 'import * as path from "node:path";\n' + s2[ins:]

p.write_text(s2, encoding="utf-8")
print("✅ Deduped path imports in", p)
PY

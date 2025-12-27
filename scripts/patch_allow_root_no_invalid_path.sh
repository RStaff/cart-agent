#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"

test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

if "Invalid path" not in s:
    print("⚠️ No 'Invalid path' string found. No change made.")
    raise SystemExit(0)

# Replace any "return res.status(500).send(...Invalid path...);" with "return next();"
pattern = re.compile(r'return\s+res\.status\(\s*500\s*\)\.send\([^;]*Invalid path[^;]*\)\s*;', re.IGNORECASE)
new_s, n = pattern.subn("return next(); // patched: allow all paths during dev\n", s)

if n == 0:
    # Fallback: replace any line containing Invalid path + status(500) send
    pattern2 = re.compile(r'^.*status\(\s*500\s*\)\.send\(.*Invalid path.*\);\s*$', re.IGNORECASE|re.MULTILINE)
    new_s, n = pattern2.subn("return next(); // patched: allow all paths during dev\n", s)

if n == 0:
    print("❌ Found 'Invalid path' but couldn't patch the guard safely. No change made.")
    raise SystemExit(1)

p.write_text(new_s, encoding="utf-8")
print(f"✅ Patched {n} Invalid-path guard statement(s) in web/src/index.js")
PY

echo "🔎 Proof:"
grep -n "Invalid path" -n "$FILE" || echo "✅ No remaining 'Invalid path' guard text found."

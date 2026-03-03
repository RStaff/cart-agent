#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "ERROR: $FILE not found" >&2; exit 2; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak_${TS}" >/dev/null

python3 - <<'PY'
from pathlib import Path
import re, sys

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

# Remove an accidental extra close "});" that can appear right after the /api/version handler
# Pattern: app.get("/api/version"...); \n }); \n // --- end fingerprint ---
s2 = re.sub(
    r'(app\.get\("/api/version"[\s\S]*?\n\}\);\n)\s*\}\);\n(\s*// --- end fingerprint ---)',
    r'\1\2',
    s,
    count=1
)

if s2 == s:
    print("No double-close found (nothing changed).")
else:
    p.write_text(s2, encoding="utf-8")
    print("OK: removed extra closing '});' after /api/version handler.")
PY

echo
echo "Diff:"
git --no-pager diff -- "$FILE" || true

echo
echo "Next:"
echo "  git add -A"
echo "  git commit -m \"Fix /api/version handler block\""
echo "  git push origin main"

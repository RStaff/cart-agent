#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}" >/dev/null

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text()

# Comment out the legacy "/" handler that serves public/index.html
pat = r'(?m)^\s*app\.get\(\s*["\']\/["\']\s*,\s*\(_req\s*,\s*res\s*\)\s*=>\s*res\.sendFile\([^;]*\)\s*\)\s*;\s*$'
m = re.search(pat, s)
if not m:
    print("⚠️ Could not find the legacy one-liner app.get('/') sendFile handler. Nothing changed.")
    raise SystemExit(0)

block = m.group(0)
replacement = "\n".join([
  "// [abandoRootRedirectLegacyDisabled] Disabled legacy root handler to avoid conflict with / -> /embedded redirect",
  "// " + block.replace("\n", "\n// ")
])

s2 = s[:m.start()] + replacement + s[m.end():]
p.write_text(s2)
print("✅ Disabled legacy app.get('/') sendFile handler.")
PY

echo
echo "===== VERIFY ====="
rg -n "abandoRootRedirect|abandoRootRedirectLegacyDisabled|app\\.get\\(\"/\"" "$FILE" || true

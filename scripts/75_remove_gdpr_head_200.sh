#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -a "$FILE" "${FILE}.bak.${TS}"
echo "✅ Backup: ${FILE}.bak.${TS}"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

# Remove any HEAD handler for /api/webhooks/gdpr (especially 200 OK ones)
before = s
s = re.sub(r'^\s*app\.head\(\s*[\'"]/api/webhooks/gdpr[\'"][\s\S]*?\);\s*\n', '', s, flags=re.M)

if s == before:
    print("ℹ️ No app.head(/api/webhooks/gdpr) handler found.")
else:
    print("✅ Removed app.head(/api/webhooks/gdpr) handler.")

p.write_text(s, encoding="utf-8")
PY

echo
echo "🔎 Confirm remaining handlers:"
grep -nE 'app\.(get|post|head)\("/api/webhooks/gdpr"' "$FILE" || true

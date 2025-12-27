#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "🧹 Cleanup GDPR patch (remove duplicate express import + remove old GDPR routes)"
echo "📄 Target: $(pwd)/$FILE"

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "🧾 Backup created."

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

# 1) Remove the duplicate express import ONLY if it's inside our ABANDO_GDPR_FORCE_401 block
#    (We keep the original express import that already exists in the file.)
s = re.sub(
    r'(/\*\s*ABANDO_GDPR_FORCE_401\s*\*/[\s\S]*?)^\s*import\s+express\s+from\s+"express";\s*\n',
    r'\1',
    s,
    flags=re.M
)

# 2) Remove legacy explicit GDPR routes that were added earlier:
#    app.post/get/head("/api/webhooks/gdpr"...)
#    We do NOT remove our force-401 handler because it uses __abando_gdpr_paths.
patterns = [
    r'^\s*app\.post\(\s*["\']\/api\/webhooks\/gdpr["\'][\s\S]*?\n\s*\}\);\s*\n',
    r'^\s*app\.get\(\s*["\']\/api\/webhooks\/gdpr["\'][\s\S]*?\);\s*\n',
    r'^\s*app\.head\(\s*["\']\/api\/webhooks\/gdpr["\'][\s\S]*?\);\s*\n',
    r'^\s*app\.post\(\s*["\']\/webhooks\/gdpr["\'][\s\S]*?\n\s*\}\);\s*\n',
    r'^\s*app\.get\(\s*["\']\/webhooks\/gdpr["\'][\s\S]*?\);\s*\n',
    r'^\s*app\.head\(\s*["\']\/webhooks\/gdpr["\'][\s\S]*?\);\s*\n',
]

for pat in patterns:
    s = re.sub(pat, '', s, flags=re.M)

p.write_text(s, encoding="utf-8")
print("✅ Cleanup applied.")
PY

echo
echo "🔍 Sanity checks:"
echo "— duplicate import express?"
grep -nE '^\s*import\s+express\s+from\s+"express";\s*$' "$FILE" || true
echo

echo "— any leftover explicit /api/webhooks/gdpr routes (should be NONE):"
grep -nE 'app\.(post|get|head)\(\s*"/api/webhooks/gdpr"' "$FILE" || true
echo

echo "— force-401 handler present?"
grep -nE 'ABANDO_GDPR_FORCE_401|__abando_gdpr_paths|__abando_register_gdpr_force_401' "$FILE" | head -n 40 || true

echo
echo "✅ Next:"
echo "  1) Start ONE fresh dev session:"
echo "     cd /Users/rossstafford/projects/cart-agent"
echo "     shopify app dev"
echo "  2) Re-test POST (should be HTTP 401):"
echo "     curl -i -X POST \"https://<CURRENT>.trycloudflare.com/api/webhooks/gdpr\" -H \"Content-Type: application/json\" --data '{\"ping\":true}' | head -n 30"

#!/usr/bin/env bash
set -euo pipefail

FILE="shopify.app.toml"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
BACKUP="${FILE}.bak.${TS}"
cp -a "$FILE" "$BACKUP"
echo "🧷 Backup: $BACKUP"

python3 - <<'PY'
import re
from pathlib import Path

p = Path("shopify.app.toml")
s = p.read_text()

# Replace any existing gdpr webhook uri line with a RELATIVE path
# (Shopify CLI accepts relative paths and will tunnel + update host)
s2 = re.sub(
    r'(?m)^\s*uri\s*=\s*".*/api/webhooks/gdpr"\s*$',
    '  uri = "/api/webhooks/gdpr"',
    s
)

# If it wasn't found, try a more general replace within the first subscription block
if s2 == s:
    s2 = re.sub(
        r'(?ms)(\[\[webhooks\.subscriptions\]\].*?\n)\s*uri\s*=\s*".*?"\s*$',
        r'\1  uri = "/api/webhooks/gdpr"',
        s
    )

p.write_text(s2)
print("✅ Set GDPR webhook subscription uri to relative path: /api/webhooks/gdpr")
PY

echo
echo "===== CURRENT GDPR URI (sanity) ====="
rg -n "webhooks\.subscriptions|/api/webhooks/gdpr|^\s*uri\s*=" "$FILE" || true
echo
echo "✅ Done."

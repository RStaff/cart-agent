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

# Replace ANY gdpr webhook URI that ends with /api/webhooks/gdpr with a RELATIVE path
s2 = re.sub(
    r'(?m)^\s*uri\s*=\s*".*/api/webhooks/gdpr"\s*$',
    '  uri = "/api/webhooks/gdpr"',
    s
)

if s2 == s:
    raise SystemExit("❌ Did not find a gdpr webhook uri line to replace.")

p.write_text(s2)
print("✅ GDPR webhook uri set to /api/webhooks/gdpr")
PY

echo
echo "===== VERIFY ====="
rg -n "webhooks\.subscriptions|/api/webhooks/gdpr|^\s*uri\s*=" "$FILE" || true

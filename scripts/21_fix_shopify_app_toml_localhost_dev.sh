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

# 1) application_url -> localhost (force CLI to tunnel/update)
s2 = re.sub(
    r'(?m)^\s*application_url\s*=\s*".*"\s*$',
    'application_url = "http://localhost:3000/embedded"',
    s
)

# 2) redirect_urls -> localhost (keep same paths, dev host)
# Replace the whole array content safely
s2 = re.sub(
    r'(?ms)^\s*redirect_urls\s*=\s*\[\s*.*?\s*\]\s*$',
    'redirect_urls = [\n  "http://localhost:3000/shopify/callback",\n  "http://localhost:3000/api/auth/callback"\n]',
    s2
)

# 3) GDPR webhook uri -> localhost (CLI will tunnel/update host)
s2 = re.sub(
    r'(?m)^\s*uri\s*=\s*".*/api/webhooks/gdpr"\s*$',
    'uri = "http://localhost:3000/api/webhooks/gdpr"',
    s2
)

p.write_text(s2)
print("✅ Patched shopify.app.toml for localhost dev (application_url, redirect_urls, gdpr webhook uri).")
PY

echo
echo "===== NEW VALUES (sanity) ====="
rg -n "application_url|automatically_update_urls_on_dev|redirect_urls|/api/webhooks/gdpr" "$FILE" || true
echo
echo "✅ Done."

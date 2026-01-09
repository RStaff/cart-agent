#!/usr/bin/env bash
set -euo pipefail

FILE="shopify.app.toml"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
BACKUP="${FILE}.bak.${TS}"
cp -a "$FILE" "$BACKUP"
echo "🧷 Backup: $BACKUP"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("shopify.app.toml")
s = p.read_text()

# 1) application_url -> local dev
s = re.sub(
    r'(?m)^\s*application_url\s*=\s*".*"\s*$',
    'application_url = "https://localhost:3000/embedded"',
    s
)

# 2) Replace auth.redirect_urls block with local dev callbacks
# Match the whole redirect_urls array
pat = r'(?ms)^\s*redirect_urls\s*=\s*\[\s*.*?\s*\]\s*'
rep = (
    'redirect_urls = [\n'
    '  "https://localhost:3000/shopify/callback",\n'
    '  "https://localhost:3000/api/auth/callback"\n'
    ']\n'
)
if not re.search(pat, s):
    raise SystemExit("❌ Could not find redirect_urls = [ ... ] block to replace.")

s = re.sub(pat, rep, s)

p.write_text(s)
print("✅ Set application_url + redirect_urls to local dev defaults.")
PY

echo
echo "===== VERIFY ====="
rg -n "application_url|automatically_update_urls_on_dev|redirect_urls|/api/webhooks/gdpr" "$FILE" || true

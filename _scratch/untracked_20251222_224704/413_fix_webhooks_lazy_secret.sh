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

# 1) Remove cached module-level secret const if present
s = re.sub(r'^\s*const\s+__ABANDO_WEBHOOK_SECRET\s*=\s*process\.env\.SHOPIFY_API_SECRET\s*\|\|\s*["\']{0,1}["\']{0,1}\s*;\s*\n', '', s, flags=re.M)

# 2) Ensure helper exists: getWebhookSecret() reads env at runtime
helper = r'''
function getWebhookSecret() {
  return String(process.env.SHOPIFY_API_SECRET || "");
}
'''
if "function getWebhookSecret()" not in s:
    # Insert after crypto imports / createHash import if possible, else at top
    m = re.search(r'^\s*import\s+\{\s*createHash\s*,\s*createHmac\s*,\s*timingSafeEqual\s*\}\s+from\s+["\']node:crypto["\']\s*;\s*$', s, re.M)
    if m:
        line_end = s.find("\n", m.end())
        s = s[:line_end+1] + "\n" + helper + "\n" + s[line_end+1:]
    else:
        s = helper + "\n" + s

# 3) Replace fpSecret(__ABANDO_WEBHOOK_SECRET) logs with fpSecret(getWebhookSecret())
s = s.replace('fpSecret(__ABANDO_WEBHOOK_SECRET)', 'fpSecret(getWebhookSecret())')

# 4) In verifyShopifyHmac calls: if they pass a cached secret variable, prefer getWebhookSecret()
# Best-effort: replace "..., secret)" with "..., getWebhookSecret())" where secret is a bare identifier.
s = re.sub(r'(verifyShopifyHmac\s*\(\s*[^,]+,\s*[^,]+,\s*)secret(\s*\))', r'\1getWebhookSecret()\2', s)

p.write_text(s, encoding="utf-8")
print("✅ Patched webhooks.js to read SHOPIFY_API_SECRET at runtime (no caching).")
PY

echo "✅ Done."

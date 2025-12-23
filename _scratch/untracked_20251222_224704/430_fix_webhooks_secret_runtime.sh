#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "✅ Backup created"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# 1) Remove any ABANDO probe blocks / fp logs that execute at module load
# (WEBHOOK_ENV_PROBE / WEBHOOK_SECRET_FP / DEBUG secret fp)
patterns = [
    r'^\s*//\s*ABANDO_DEBUG_SECRET_FP_BEGIN.*?^\s*//\s*ABANDO_DEBUG_SECRET_FP_END\s*\n?',
    r'^\s*//\s*ABANDO_SECRET_FP_HELPER_BEGIN.*?^\s*//\s*ABANDO_SECRET_FP_HELPER_END\s*\n?',
    r'^\s*console\.log\(\s*"\[abando\]\[WEBHOOK_ENV_PROBE\].*?^\s*\}\s*\n?',  # loose
    r'^\s*console\.log\(\s*"\[abando\]\[WEBHOOK_SECRET_FP\].*?\);\s*\n?',
    r'^\s*try\s*\{\s*\n(?:.*\n)*?\s*\}\s*catch\s*\(e\)\s*\{\s*\n(?:.*\n)*?\s*\}\s*\n?'
]
for pat in patterns:
    s = re.sub(pat, '', s, flags=re.M|re.S)

# 2) Ensure we have a runtime getter (only once)
if "function getWebhookSecret()" not in s:
    getter = '\nfunction getWebhookSecret() {\n  return String(process.env.SHOPIFY_API_SECRET || "");\n}\n'
    # insert after imports (after last import line)
    last_import = 0
    for m in re.finditer(r'^\s*import .*?;\s*$', s, flags=re.M):
        last_import = m.end()
    s = s[:last_import] + getter + s[last_import:]

# 3) Normalize verifyShopifyHmac signature (it MUST be (rawBodyBuf, hmacHeader, secret))
s = re.sub(
    r'function\s+verifyShopifyHmac\s*\(\s*rawBodyBuf\s*,\s*hmacHeader\s*,\s*getWebhookSecret\s*\(\s*\)\s*\)\s*\{',
    'function verifyShopifyHmac(rawBodyBuf, hmacHeader, secret) {',
    s
)

# 4) Force all verifyShopifyHmac call sites to pass getWebhookSecret()
s = re.sub(
    r'(verifyShopifyHmac\s*\(\s*[^,]+,\s*[^,]+,\s*)([^)]+)(\))',
    lambda m: m.group(1) + 'getWebhookSecret()' + m.group(3),
    s
)

# 5) Also normalize any const cached secret to avoid future reads
s = re.sub(r'^\s*const\s+__ABANDO_WEBHOOK_SECRET\s*=.*?;\s*\n?', '', s, flags=re.M)

p.write_text(s, encoding="utf-8")
print("✅ Patched webhooks.js: runtime secret only, removed early probes")
PY

echo "✅ Done. Restart dev (Ctrl+C then run shopify app dev --reset)."

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

# 1) FIX the broken function signature (remove getWebhookSecret() from params)
# Handles both single-line and wrapped params.
s = re.sub(
    r'function\s+verifyShopifyHmac\s*\(([\s\S]*?),\s*getWebhookSecret\(\)\s*\)',
    r'function verifyShopifyHmac(\1, secret)',
    s,
    flags=re.M
)

# 2) Ensure helper exists (runtime env read)
helper = '''
function getWebhookSecret() {
  return String(process.env.SHOPIFY_API_SECRET || "");
}
'''
if "function getWebhookSecret()" not in s:
    # insert after node:crypto named import if found, else near top
    m = re.search(r'^\s*import\s+\{\s*createHash\s*,\s*createHmac\s*,\s*timingSafeEqual\s*\}\s+from\s+["\']node:crypto["\']\s*;\s*$', s, re.M)
    if m:
        line_end = s.find("\n", m.end())
        s = s[:line_end+1] + "\n" + helper + "\n" + s[line_end+1:]
    else:
        s = helper + "\n" + s

# 3) Remove/neutralize any BOOT-time webhook secret FP log (it runs before dotenv)
# Delete lines like: console.log("[abando][WEBHOOK_SECRET_FP] ...");
s = re.sub(r'^\s*console\.log\(\s*["\']\[abando\]\[WEBHOOK_SECRET_FP\][^;]*;\s*\n', '', s, flags=re.M)

# 4) Add a request-time log ONCE per process (first webhook hit) so it reflects dotenv-loaded env
if "[abando][WEBHOOK_SECRET_FP][REQ]" not in s:
    insert_point = s.find("router.use(")
    reqlog = '''
let __abandoLoggedWebhookFp = false;
function logWebhookFpOnce() {
  if (__abandoLoggedWebhookFp) return;
  __abandoLoggedWebhookFp = true;
  try {
    const v = getWebhookSecret();
    const fp = createHash("sha256").update(v).digest("hex").slice(0, 12);
    console.log("[abando][WEBHOOK_SECRET_FP][REQ] len=", v.length, "fp=", fp);
  } catch (e) {
    console.log("[abando][WEBHOOK_SECRET_FP][REQ] failed", e?.message || e);
  }
}
'''
    # Place before first router.use if possible, else append
    if insert_point != -1:
        s = s[:insert_point] + reqlog + "\n" + s[insert_point:]
    else:
        s += "\n" + reqlog + "\n"

# 5) Ensure verifyShopifyHmac is CALLED with runtime secret (only call-sites, not signature)
# Replace third argument in calls where it is a bare identifier named secretVar-like OR cached const name.
# We keep it conservative: only replace patterns of ", secret)" or ", __ABANDO_WEBHOOK_SECRET)" etc.
s = re.sub(r'(verifyShopifyHmac\s*\(\s*[^,]+,\s*[^,]+,\s*)(secret|__ABANDO_WEBHOOK_SECRET)\s*(\))', r'\1getWebhookSecret()\3', s)

# Also, ensure we call logWebhookFpOnce() early in request handling
# Add at top of the router.use middleware body if not present.
if "logWebhookFpOnce();" not in s:
    s = re.sub(r'(router\.use\s*\(\s*\(\s*req\s*,\s*_res\s*,\s*next\s*\)\s*=>\s*\{\s*)', r'\1\n  logWebhookFpOnce();\n', s)

p.write_text(s, encoding="utf-8")
print("✅ Repaired syntax + enforced lazy secret + moved FP log to request-time.")
PY

echo "✅ Done."

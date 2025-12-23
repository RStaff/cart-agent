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

marker = "// ABANDO_WEBHOOK_ENV_PROBE"
if marker in s:
    print("ℹ️ probe already present")
    raise SystemExit(0)

probe = '''
// ABANDO_WEBHOOK_ENV_PROBE
try {
  const v = String(process.env.SHOPIFY_API_SECRET || "");
  const fp = createHash("sha256").update(v).digest("hex").slice(0, 12);
  console.log("[abando][WEBHOOK_ENV_PROBE] SHOPIFY_API_SECRET len=", v.length, "fp=", fp);
} catch (e) {
  console.log("[abando][WEBHOOK_ENV_PROBE] failed", e?.message || e);
}
'''

# Insert right after the node:crypto named import line
m = re.search(r'^\s*import\s+\{\s*createHash\s*,\s*createHmac\s*,\s*timingSafeEqual\s*\}\s+from\s+["\']node:crypto["\']\s*;\s*$', s, re.M)
if not m:
    # fallback: insert after first createHash usage import block
    s = probe + "\n" + s
else:
    line_end = s.find("\n", m.end())
    s = s[:line_end+1] + probe + s[line_end+1:]

p.write_text(s, encoding="utf-8")
print("✅ Inserted probe into", p)
PY

echo "✅ Done. Hit 'rs' in the running nodemon terminal (or restart shopify app dev)."

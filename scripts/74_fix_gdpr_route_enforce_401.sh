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

# Ensure crypto import exists (ESM-safe)
if not re.search(r'^\s*import\s+crypto\s+from\s+[\'"]crypto[\'"]\s*;?\s*$', s, flags=re.M):
    s = re.sub(r'^(import[^\n]*\n)', r'\1import crypto from "crypto";\n', s, count=1, flags=re.M)

# Remove any previous ABANDO GDPR block(s)
s = re.sub(r'/\*\s*ABANDO_GDPR_WEBHOOK_ROUTE\s*\*/.*?/\/\*\s*END_ABANDO_GDPR_WEBHOOK_ROUTE\s*\*/\s*',
           '', s, flags=re.S)

# Remove any GET handler for /api/webhooks/gdpr (common cause of "ok")
s = re.sub(r'app\.get\(\s*[\'"]/api/webhooks/gdpr[\'"][\s\S]*?\);\s*', '', s)

# Remove any POST handler for /api/webhooks/gdpr so we don't duplicate
s = re.sub(r'app\.post\(\s*[\'"]/api/webhooks/gdpr[\'"][\s\S]*?\);\s*', '', s)

gdpr_block = r'''/* ABANDO_GDPR_WEBHOOK_ROUTE */
app.get("/api/webhooks/gdpr", (req, res) => res.status(405).send("Method Not Allowed"));

app.post("/api/webhooks/gdpr", express.raw({ type: "*/*" }), (req, res) => {
  try {
    const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || "";
    const hmacHeader = (req.get("X-Shopify-Hmac-Sha256") || "").trim();

    // Shopify requires 401 when HMAC is missing/invalid
    if (!secret || !hmacHeader) return res.status(401).send("Unauthorized");

    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

    // timing-safe compare
    const a = Buffer.from(digest);
    const b = Buffer.from(hmacHeader);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).send("Unauthorized");
    }

    return res.status(200).send("ok");
  } catch (e) {
    // Never throw / never 500
    return res.status(401).send("Unauthorized");
  }
});
/* END_ABANDO_GDPR_WEBHOOK_ROUTE */
'''

# Insert block after app creation if possible, else after first middleware line
inserted = False

# Try after `const app = express()` line
m = re.search(r'^\s*(const|let|var)\s+app\s*=\s*express\(\)\s*;?\s*$', s, flags=re.M)
if m:
    idx = m.end()
    s = s[:idx] + "\n\n" + gdpr_block + "\n\n" + s[idx:]
    inserted = True

if not inserted:
    # fallback: after first `app.use(` line
    s = re.sub(r'^(app\.use\([^\n]*\)\s*;?\s*\n)', r'\1\n' + gdpr_block + r'\n\n', s, count=1, flags=re.M)

p.write_text(s, encoding="utf-8")
print("✅ Patched GDPR route block.")
PY

echo
echo "🔎 Quick grep to confirm:"
grep -n "ABANDO_GDPR_WEBHOOK_ROUTE" -n "$FILE" || true
grep -n "/api/webhooks/gdpr" "$FILE" || true

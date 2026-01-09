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

# 1) Remove ALL ABANDO_GDPR_WEBHOOK_ROUTE marker blocks (even malformed ones)
s = re.sub(
    r'/\*\s*ABANDO_GDPR_WEBHOOK_ROUTE\s*\*/[\s\S]*?(?=(/\*\s*END_ABANDO_GDPR_WEBHOOK_ROUTE\s*\*/)|(/\*\s*ABANDO_GDPR_WEBHOOK_ROUTE\s*\*/)|$)',
    '',
    s,
    flags=re.M
)
s = re.sub(r'/\*\s*END_ABANDO_GDPR_WEBHOOK_ROUTE\s*\*/\s*\n*', '', s, flags=re.M)

# 2) Remove any direct handlers for /api/webhooks/gdpr that might still exist
s = re.sub(
    r'^\s*app\.(get|post|head|all|use)\(\s*[\'"]/api/webhooks/gdpr[\'"][\s\S]*?\);\s*\n',
    '',
    s,
    flags=re.M
)

# 3) Ensure crypto import exists (ESM-safe)
if not re.search(r'^\s*import\s+crypto\s+from\s+[\'"]crypto[\'"]\s*;?\s*$', s, flags=re.M):
    s = re.sub(r'^(import[^\n]*\n)', r'\1import crypto from "crypto";\n', s, count=1, flags=re.M)

gdpr_block = r'''/* ABANDO_GDPR_WEBHOOK_ROUTE */
/**
 * Shopify GDPR webhooks:
 * - Non-POST => 405
 * - POST missing/invalid HMAC => 401
 * Never throw.
 */
app.all("/api/webhooks/gdpr", (req, res, next) => {
  res.set("X-Abando-GDPR-Guard", "1"); // prove THIS handler is active
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  return next();
});

app.post("/api/webhooks/gdpr", express.raw({ type: "*/*" }), (req, res) => {
  try {
    const secret =
      process.env.SHOPIFY_API_SECRET ||
      process.env.SHOPIFY_API_SECRET_KEY ||
      "";

    const hmacHeader = (req.get("X-Shopify-Hmac-Sha256") || "").trim();
    if (!secret || !hmacHeader) return res.status(401).send("Unauthorized");

    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(hmacHeader, "utf8");
    if (a.length != b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).send("Unauthorized");
    }

    return res.status(200).send("ok");
  } catch (_e) {
    return res.status(401).send("Unauthorized");
  }
});
/* END_ABANDO_GDPR_WEBHOOK_ROUTE */
'''

# 4) Insert immediately after app creation
m = re.search(r'^\s*(const|let|var)\s+app\s*=\s*express\(\)\s*;?\s*$', s, flags=re.M)
if not m:
    raise SystemExit("❌ Could not find `const app = express()` line to insert after.")
idx = m.end()
s = s[:idx] + "\n\n" + gdpr_block + "\n\n" + s[idx:]

p.write_text(s, encoding="utf-8")
print("✅ Clean-replaced GDPR route block (single authoritative).")
PY

echo
echo "🔎 Confirm there is exactly ONE marker block and ONLY these handlers:"
python3 - <<'PY'
from pathlib import Path
s = Path("web/src/index.js").read_text(encoding="utf-8")
print("ABANDO_GDPR_WEBHOOK_ROUTE =", s.count("ABANDO_GDPR_WEBHOOK_ROUTE"))
print("END_ABANDO_GDPR_WEBHOOK_ROUTE =", s.count("END_ABANDO_GDPR_WEBHOOK_ROUTE"))
PY

rg -n 'app\.(get|post|head|all|use)\("/api/webhooks/gdpr"|X-Abando-GDPR-Guard|ABANDO_GDPR_WEBHOOK_ROUTE' web/src/index.js || true

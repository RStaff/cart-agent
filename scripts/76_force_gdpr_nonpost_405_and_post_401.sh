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

# 1) Remove ANY existing handlers for this path (get/post/head/all/use)
#    We will re-insert a single authoritative block.
patterns = [
    r'^\s*app\.(get|post|head|all|use)\(\s*[\'"]/api/webhooks/gdpr[\'"][\s\S]*?\);\s*\n',
]
for pat in patterns:
    s = re.sub(pat, '', s, flags=re.M)

# 2) Build the authoritative block.
marker_start = "/* ABANDO_GDPR_WEBHOOK_ROUTE */"
marker_end   = "/* END_ABANDO_GDPR_WEBHOOK_ROUTE */"

gdpr_block = r'''/* ABANDO_GDPR_WEBHOOK_ROUTE */

/**
 * Shopify GDPR webhooks must return:
 * - 405 for non-POST methods (GET/HEAD probes, etc)
 * - 401 for missing/invalid HMAC on POST
 * Never throw.
 */
app.all("/api/webhooks/gdpr", (req, res, next) => {
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

    // Shopify requires 401 when HMAC is missing/invalid
    if (!secret || !hmacHeader) return res.status(401).send("Unauthorized");

    // Verify HMAC (base64 of sha256)
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

    // timing-safe compare
    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(hmacHeader, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).send("Unauthorized");
    }

    // OK
    return res.status(200).send("ok");
  } catch (_e) {
    return res.status(401).send("Unauthorized");
  }
});

/* END_ABANDO_GDPR_WEBHOOK_ROUTE */
'''

# 3) Ensure crypto import exists (ESM-safe)
if not re.search(r'^\s*import\s+crypto\s+from\s+[\'"]crypto[\'"]\s*;?\s*$', s, flags=re.M):
    s = re.sub(r'^(import[^\n]*\n)', r'\1import crypto from "crypto";\n', s, count=1, flags=re.M)

# 4) Insert the block immediately after app creation
m = re.search(r'^\s*(const|let|var)\s+app\s*=\s*express\(\)\s*;?\s*$', s, flags=re.M)
if not m:
    raise SystemExit("❌ Could not find `const app = express()` line to insert after.")
idx = m.end()
s = s[:idx] + "\n\n" + gdpr_block + "\n\n" + s[idx:]

p.write_text(s, encoding="utf-8")
print("✅ Inserted authoritative GDPR block (non-POST=405, POST HMAC=401).")
PY

echo
echo "🔎 Confirm handlers now present:"
grep -nE 'ABANDO_GDPR_WEBHOOK_ROUTE|app\.(all|post)\("/api/webhooks/gdpr"' "$FILE" || true

echo
echo "🔎 Confirm NO stray handlers remain:"
grep -nE 'app\.(get|head|use)\("/api/webhooks/gdpr"' "$FILE" || true

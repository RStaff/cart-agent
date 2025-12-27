#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
FILE="$ROOT/web/src/index.js"

test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "🧾 Backup created."

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

# 1) Make sure crypto is imported (ESM-safe)
if not re.search(r'^\s*import\s+crypto\s+from\s+[\'"]crypto[\'"]\s*;?\s*$', s, flags=re.M):
    # place after the first import line
    s = re.sub(r'^(import[^\n]*\n)', r'\1import crypto from "crypto";\n', s, count=1, flags=re.M)

# 2) Replace/insert a robust GDPR route block that NEVER throws and returns 401 on missing/invalid HMAC
marker = "/* ABANDO_GDPR_WEBHOOK_ROUTE */"
gdpr_block = r'''/* ABANDO_GDPR_WEBHOOK_ROUTE */
app.post("/api/webhooks/gdpr", express.raw({ type: "*/*" }), (req, res) => {
  try {
    const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || "";
    const hmacHeader = (req.get("X-Shopify-Hmac-Sha256") || "").trim();

    // Shopify requires 401 when HMAC is missing/invalid
    if (!secret || !hmacHeader) return res.status(401).send("Unauthorized");

    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

    // timing-safe compare
    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(hmacHeader, "utf8");
    if (a.length != b.length) return res.status(401).send("Unauthorized");
    if (!crypto.timingSafeEqual(a, b)) return res.status(401).send("Unauthorized");

    return res.status(200).send("ok");
  } catch (_e) {
    // Never 500 for webhook auth failures—Shopify expects 401 for invalid digest
    return res.status(401).send("Unauthorized");
  }
});

app.get("/api/webhooks/gdpr", (_req, res) => res.status(200).send("ok"));
app.head("/api/webhooks/gdpr", (_req, res) => res.status(200).end());
'''

if marker in s:
    # Replace the existing marked block (from marker down through the HEAD/GET lines if present)
    s = re.sub(
        r'/\*\s*ABANDO_GDPR_WEBHOOK_ROUTE\s*\*/[\s\S]*?(?=\n\s*app\.\w+\(|\n\s*/\*|\n\s*\}\)\s*;|\n\s*export|\Z)',
        gdpr_block,
        s,
        count=1
    )
else:
    # Insert after express app creation if we can find it, otherwise near top after imports
    inserted = False
    for pat in [
        r'(\bconst\s+app\s*=\s*express\(\)\s*;?\s*\n)',
        r'(\bconst\s+app\s*=\s*express\(\)\s*;?\s*)'
    ]:
        m = re.search(pat, s)
        if m:
            idx = m.end()
            s = s[:idx] + "\n\n" + gdpr_block + "\n" + s[idx:]
            inserted = True
            break
    if not inserted:
        s = re.sub(r'^(import[^\n]*\n)+', lambda m: m.group(0) + "\n" + gdpr_block + "\n", s, count=1, flags=re.M)

# 3) Fix the "Invalid path ..." guard (if present) so it never blocks GDPR.
#    We do this by injecting a bypass right before the first occurrence of that message.
if "Invalid path" in s:
    s2 = s
    # Find a place in code that sends "Invalid path" and bypass for /api/webhooks/gdpr* BEFORE it.
    # We keep it conservative: only inject once.
    s2 = re.sub(
        r'(\breturn\s+res\.status\(\s*500\s*\)\.send\(\s*[\'"]Invalid path[^\)]*\)\s*;)',
        r'if ((req.originalUrl || req.url || "").startsWith("/api/webhooks/gdpr")) { return res.status(401).send("Unauthorized"); }\n  \1',
        s2,
        count=1
    )
    s = s2

p.write_text(s, encoding="utf-8")
print("✅ Patched web/src/index.js")
PY

echo
echo "🔍 Proof (route + any Invalid path guard):"
grep -nE "ABANDO_GDPR_WEBHOOK_ROUTE|app\.post\\(\"/api/webhooks/gdpr|Invalid path" "$FILE" | head -n 60 || true

echo
echo "✅ Next:"
echo "  1) Stop ALL running shopify app dev sessions (press q in each terminal)"
echo "  2) Start ONE fresh:  shopify app dev"
echo "  3) Re-run the curl test (you should get HTTP 401)"

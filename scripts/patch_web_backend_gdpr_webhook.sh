#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
FILE="$ROOT/web/src/index.js"

echo "🩹 Patch web-backend GDPR webhook (ESM-safe)"
echo "📄 Target: $FILE"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "🧾 Backup created."

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

MARK = "/* ABANDO_GDPR_WEBHOOK_ROUTE */"
if MARK in s:
    print("✅ GDPR route already present. No changes made.")
    raise SystemExit(0)

# Ensure we have crypto import (ESM)
if not re.search(r'^\s*import\s+crypto\s+from\s+[\'"]crypto[\'"]\s*;?\s*$', s, flags=re.M):
    # Insert after the last import line
    m = list(re.finditer(r'^\s*import\s+.*$', s, flags=re.M))
    if not m:
        raise SystemExit("❌ Could not find any import lines to insert crypto import.")
    last = m[-1]
    insert_at = last.end()
    s = s[:insert_at] + "\nimport crypto from \"crypto\";\n" + s[insert_at:]

# Find app initialization and insert immediately after it
m = re.search(r'^\s*(const|let|var)\s+app\s*=\s*express\(\)\s*;?\s*$', s, flags=re.M)
if not m:
    raise SystemExit("❌ Could not find `const app = express()` in web/src/index.js")

insert_pos = m.end()

block = r'''
''' + MARK + r'''
// GDPR / mandatory compliance webhooks endpoint.
// IMPORTANT: Shopify expects HTTP 401 when HMAC is invalid (NOT 500).
// We must compute HMAC over the raw request body.
app.post("/api/webhooks/gdpr", express.raw({ type: "*/*" }), (req, res) => {
  try {
    const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_KEY_SECRET;
    if (!secret) {
      // Misconfigured server should not look like "invalid HMAC" to Shopify,
      // but we still must not throw.
      return res.status(500).send("Missing SHOPIFY_API_SECRET");
    }

    const hmacHeader =
      req.get("x-shopify-hmac-sha256") ||
      req.get("X-Shopify-Hmac-Sha256") ||
      "";

    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const digest = crypto.createHmac("sha256", secret).update(raw).digest("base64");

    const safeEqual = (a, b) => {
      try {
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
      } catch {
        return false;
      }
    };

    if (!hmacHeader || !safeEqual(digest, hmacHeader)) {
      // ✅ This is what Shopify’s automated check wants to see.
      return res.status(401).send("Unauthorized");
    }

    // Valid webhook (for now just ACK; you can implement deletes later)
    return res.status(200).send("OK");
  } catch (e) {
    return res.status(500).send("Server error");
  }
});
''' + "\n"

s = s[:insert_pos] + "\n" + block + s[insert_pos:]

p.write_text(s, encoding="utf-8")
print("✅ Patched web/src/index.js with GDPR webhook route.")
PY

echo
echo "🔍 Confirm marker + route:"
grep -nE "ABANDO_GDPR_WEBHOOK_ROUTE|/api/webhooks/gdpr" "$FILE" | head -n 40 || true

echo
echo "✅ Done. Next:"
echo "  1) Stop ALL running `shopify app dev` sessions (q)"
echo "  2) Start ONE fresh dev session"
echo "  3) Re-run the curl test"

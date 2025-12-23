#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

TARGET="web/src/routes/webhooks.js"
test -f "$TARGET" || { echo "❌ Missing $TARGET"; exit 1; }

TS="$(date +%s)"
cp "$TARGET" "$TARGET.bak_${TS}"
echo "✅ Backup: $TARGET.bak_${TS}"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Ensure crypto import exists (ESM)
if "createHmac" not in s:
    # Try to add to existing import line
    # If file already imports crypto differently, we just insert a new import.
    if re.search(r'^\s*import\s+crypto\s+from\s+[\'"]crypto[\'"]\s*;?\s*$', s, re.M):
        pass
    else:
        s = "import { createHmac } from \"crypto\";\n" + s

# Find where rawBody is created / assigned.
# You mentioned we already insert after rawBody assignment, but we make it robust:
# Look for a line containing "rawBody" and "=" or "const rawBody"
m = re.search(r'^\s*(const|let|var)\s+rawBody\s*=\s*.*$', s, re.M)
insert_at = None

if m:
    insert_at = m.end()
else:
    # fallback: after express.raw middleware line if rawBody isn't explicit
    m2 = re.search(r'^\s*express\.raw\(\{\s*type:\s*["\']\*\/\*["\']\s*\}\),\s*$', s, re.M)
    if not m2:
        raise SystemExit("❌ Could not find rawBody assignment OR express.raw({type:'*/*'}) line to anchor probe insert.")
    insert_at = m2.end()

probe = r'''
// =======================
// [abando][WEBHOOK_PROBE]
// =======================
try {
  const method = req.method;
  const ct = req.get("content-type") || "";
  const cl = req.get("content-length") || "";
  const topicHdr = req.get("x-shopify-topic") || req.get("x-shopify-webhook-topic") || "";
  const shopHdr  = req.get("x-shopify-shop-domain") || "";
  const whId     = req.get("x-shopify-webhook-id") || "";
  const trigAt   = req.get("x-shopify-triggered-at") || "";
  const hmacHdr  = req.get("x-shopify-hmac-sha256") || "";

  // Body may be Buffer (express.raw) or something else. Normalize to Buffer safely.
  let raw = null;
  if (Buffer.isBuffer(req.body)) raw = req.body;
  else if (typeof rawBody !== "undefined" && Buffer.isBuffer(rawBody)) raw = rawBody;
  else if (typeof req.rawBody !== "undefined" && Buffer.isBuffer(req.rawBody)) raw = req.rawBody;
  else if (typeof req.body === "string") raw = Buffer.from(req.body, "utf8");
  else raw = Buffer.from("");

  const rawLen = raw.length;
  const rawHeadHex = raw.slice(0, 32).toString("hex"); // first 32 bytes
  const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || "";
  const calc = secret
    ? createHmac("sha256", secret).update(raw).digest("base64")
    : "";

  const hmacOk = !!(secret && hmacHdr && calc && timingSafeEqualB64(hmacHdr, calc));

  // Append a probe log line (separate file to avoid polluting your jsonl inbox)
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    probe: true,
    method, ct, cl,
    topicHdr, shopHdr, whId, trigAt,
    rawLen,
    rawHeadHex,
    hmacHdr_fp: (hmacHdr || "").slice(0, 10),
    calc_fp: (calc || "").slice(0, 10),
    hmacOk,
  });
  try {
    const fs = await import("fs");
    fs.appendFileSync("web/.abando_webhook_probe.jsonl", line + "\n");
  } catch (e) {
    console.warn("[abando][WEBHOOK_PROBE] failed to write probe log:", e?.message || e);
  }
} catch (e) {
  console.warn("[abando][WEBHOOK_PROBE] error:", e?.message || e);
}
'''

# We reference timingSafeEqualB64 — add helper if missing
if "timingSafeEqualB64" not in s:
    helper = r'''
function timingSafeEqualB64(a, b) {
  try {
    const { timingSafeEqual } = require("crypto");
    const ab = Buffer.from(String(a || ""), "utf8");
    const bb = Buffer.from(String(b || ""), "utf8");
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  } catch {
    // Fallback (non-constant-time) if require not available
    return String(a || "") === String(b || "");
  }
}
'''
    # Put helper near top, after imports
    ins = re.search(r'^(import[^\n]*\n)+', s, re.M)
    if ins:
        s = s[:ins.end()] + "\n" + helper + "\n" + s[ins.end():]
    else:
        s = helper + "\n" + s

# Insert probe after anchor
s = s[:insert_at] + "\n" + probe + s[insert_at:]

p.write_text(s, encoding="utf-8")
print("✅ Inserted [abando][WEBHOOK_PROBE] block.")
PY

echo "🔎 Import-checking as ESM..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudging nodemon restart..."
mkdir -p web/lib
touch web/index.js web/lib/.nodemon_restart 2>/dev/null || true
echo "✅ Done. Watch your dev terminal for nodemon restart."
echo
echo "Next:"
echo "  1) Trigger ONE checkout/update"
echo "  2) tail -n 20 -f web/.abando_webhook_probe.jsonl"

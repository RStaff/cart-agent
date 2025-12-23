#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
PROBE="web/.abando_webhook_probe.jsonl"
INBOX="web/.abando_webhook_inbox.jsonl"

test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
mkdir -p web
touch "$PROBE" "$INBOX"

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "✅ Backup created."

python3 - <<'PY'
from pathlib import Path
import re, json, hashlib, datetime

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Ensure ESM crypto import includes createHmac + timingSafeEqual
if re.search(r'import\s+\{\s*createHmac[^}]*\}\s+from\s+"crypto"\s*;', s):
    if 'timingSafeEqual' not in s:
        s = re.sub(r'import\s+\{\s*([^}]*)\}\s+from\s+"crypto"\s*;',
                   lambda m: 'import { ' + (m.group(1).strip() + ', timingSafeEqual').replace(',,',',') + ' } from "crypto";',
                   s, count=1)
elif 'from "crypto"' not in s:
    # prepend if no crypto import at all
    s = 'import { createHmac, timingSafeEqual } from "crypto";\n' + s

# Add/replace helper (ESM safe)
helper = '''
function timingSafeEqualB64(a, b) {
  const ab = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (ab.length !== bb.length) return false;
  try { return timingSafeEqual(ab, bb); } catch { return String(a||"") === String(b||""); }
}
function abandoSha256Hex(buf) {
  try { return require("crypto").createHash("sha256").update(buf).digest("hex"); } catch { return ""; }
}
'''
# We won't rely on require; sha256 helper isn't essential; keep minimal.
if 'function timingSafeEqualB64' not in s:
    ins = re.search(r'^(import[^\n]*\n)+', s, re.M)
    s = (s[:ins.end()] + "\n" + helper + "\n" + s[ins.end():]) if ins else (helper + "\n" + s)

# Remove any previous [abando][WEBHOOK_PROBE] blocks to avoid duplicates
s = re.sub(r'\n\s*/\*\s*\[abando\]\[WEBHOOK_PROBE\][\s\S]*?\[abando\]\[WEBHOOK_PROBE_END\]\s*\*/\s*\n', "\n", s)

probe = r'''
  /* [abando][WEBHOOK_PROBE]
   * Logs EXACT header/body facts used for HMAC verification.
   * Appends JSONL to web/.abando_webhook_probe.jsonl
   */
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const hmacHeader = req.get("x-shopify-hmac-sha256") || "";
    const topic = req.get("x-shopify-topic") || req.get("X-Shopify-Topic") || "";
    const shop = req.get("x-shopify-shop-domain") || "";
    const ct = req.get("content-type") || "";
    const cl = req.get("content-length") || "";
    const rawBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body||""), "utf8");

    const computed = createHmac("sha256", process.env.SHOPIFY_API_SECRET || "")
      .update(rawBuf)
      .digest("base64");

    const ok = timingSafeEqualB64(computed, hmacHeader);

    const bodyPrefixB64 = rawBuf.subarray(0, Math.min(rawBuf.length, 200)).toString("base64");
    const payloadFp = createHmac("sha256", "abando_probe_fp").update(rawBuf).digest("hex").slice(0, 16);

    const line = JSON.stringify({
      ts: new Date().toISOString(),
      topic, shop,
      ct, cl,
      bytes: rawBuf.length,
      hmac_header_len: hmacHeader.length,
      computed_len: computed.length,
      hmac_ok: ok,
      payload_fp: payloadFp,
      body_prefix_b64: bodyPrefixB64
    });

    fs.appendFileSync(path.join(process.cwd(), "web/.abando_webhook_probe.jsonl"), line + "\\n");
    console.log("[abando][WEBHOOK_PROBE]", line);
  } catch (e) {
    console.warn("[abando][WEBHOOK_PROBE] failed", e?.message || e);
  }
  /* [abando][WEBHOOK_PROBE_END] */
'''

# HARD ANCHOR STRATEGY:
# 1) Find the /api/webhooks route definition region
route_idx = s.find("/api/webhooks")
if route_idx == -1:
    raise SystemExit("❌ Could not find /api/webhooks in webhooks.js")

# 2) Search forward for a rawBody assignment *inside that route block*
window = s[route_idx: route_idx + 12000]

m = re.search(r'\bconst\s+rawBody\s*=\s*[^;]+;', window)
if m:
    insert_at = route_idx + m.end()
else:
    # fallback: insert after start of async handler: `async (req, res) => {`
    m2 = re.search(r'async\s*\(\s*req\s*,\s*res\s*\)\s*=>\s*\{', window)
    if not m2:
        raise SystemExit("❌ Could not find async(req,res)=>{ near /api/webhooks")
    insert_at = route_idx + m2.end()

# Insert probe once
s = s[:insert_at] + "\n" + probe + s[insert_at:]

p.write_text(s, encoding="utf-8")
print("✅ Re-anchored [abando][WEBHOOK_PROBE] inside /api/webhooks handler.")
PY

echo "🔎 Import-checking as ESM..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudging nodemon restart..."
mkdir -p web/lib
touch web/index.js web/lib/.nodemon_restart 2>/dev/null || true
echo "✅ Done."
echo
echo "Next:"
echo "  1) Trigger ONE checkout/update in the storefront"
echo "  2) tail -n 3 web/.abando_webhook_probe.jsonl"
echo "  3) tail -n 2 web/.abando_webhook_inbox.jsonl"

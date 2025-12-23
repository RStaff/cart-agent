#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
import re, pathlib, time
p = pathlib.Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

needle = r'return\s+res\.status\(\s*200\s*\)\.send\(\s*["\']ok["\']\s*\)\s*;'

repl = r'''
// ABANDO_FORCE_LOG_BEFORE_OK: make sure inbox has received + verified even on fast-path ok.
try {
  const topic2 = (req.get("x-shopify-topic") || req.get("x-shopify-webhook-topic") || topic || "unknown");
  const shop2  = (req.get("x-shopify-shop-domain") || shop || "unknown");
  const whId2  = req.get("x-shopify-webhook-id") || null;
  const trig2  = req.get("x-shopify-triggered-at") || null;

  __abando__write_inbox("received", {
    route: req.originalUrl || req.url,
    shop: shop2, topic: topic2,
    event_id: null,
    triggered_at: trig2,
    webhook_id: whId2,
    bytes: (typeof bytes !== "undefined" ? bytes : null),
    hmac_ok: null,
    secret_fp: __abando__fp(process.env.SHOPIFY_API_SECRET || ""),
    payload_fp: null
  });

  __abando__write_inbox("verified", {
    route: req.originalUrl || req.url,
    shop: shop2, topic: topic2,
    event_id: null,
    triggered_at: trig2,
    webhook_id: whId2,
    bytes: (typeof bytes !== "undefined" ? bytes : null),
    hmac_ok: (typeof ok !== "undefined" ? ok : null),
    secret_fp: __abando__fp(process.env.SHOPIFY_API_SECRET || ""),
    payload_fp: (typeof rawBody !== "undefined" ? __abando__payload_fp(rawBody) : null)
  });
} catch (e) {
  try { console.warn("[abando][FORCE_LOG_BEFORE_OK] failed:", e?.message || e); } catch (_) {}
}

return res.status(200).send("ok");
'''.lstrip("\n")

n = len(re.findall(needle, s))
if n == 0:
    raise SystemExit("❌ No `return res.status(200).send('ok')` found to patch.")
s2 = re.sub(needle, repl, s)
p.write_text(s2, encoding="utf-8")
print(f"✅ Patched {n} ok-return(s) to write received+verified before sending ok.")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

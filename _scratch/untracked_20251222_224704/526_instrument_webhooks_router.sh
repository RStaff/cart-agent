#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

TARGET="web/src/routes/webhooks.js"
test -f "$TARGET" || { echo "❌ Missing $TARGET"; exit 1; }

cp "$TARGET" "$TARGET.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Find the router.post handler for "/"
# (most templates do router.post("/", ...)
m = re.search(r'router\.post\(\s*["\']\/["\']\s*,', s)
if not m:
    raise SystemExit("❌ Could not find router.post('/') in webhooks.js")

# Insert after the opening of the handler function body
# look ahead for first "{"
window = s[m.start():m.start()+4000]
m2 = re.search(r'router\.post\(\s*["\']\/["\']\s*,\s*async\s*\(\s*req\s*,\s*res\s*\)\s*=>\s*\{', window)
if not m2:
    # fallback non-async
    m2 = re.search(r'router\.post\(\s*["\']\/["\']\s*,\s*\(\s*req\s*,\s*res\s*\)\s*=>\s*\{', window)
if not m2:
    raise SystemExit("❌ Could not find handler open brace for router.post('/')")

insert_at = m.start() + m2.end()

probe = r'''
// [abando][ROUTER_ENTER_PROBE]
try {
  const fsMod = await import("node:fs");
  const pathMod = await import("node:path");
  const fs = fsMod.default || fsMod;
  const path = pathMod.default || pathMod;

  const out = process.env.ABANDO_WEBHOOK_ROUTER_ENTER_PATH
    ? path.resolve(process.cwd(), process.env.ABANDO_WEBHOOK_ROUTER_ENTER_PATH)
    : path.resolve(process.cwd(), ".abando_webhook_router_enter.jsonl");

  const line = JSON.stringify({
    ts: new Date().toISOString(),
    stage: "router_enter",
    route: "/api/webhooks",
    method: req.method,
    url: req.originalUrl || req.url || null,
    cwd: process.cwd(),
    content_length: req.get("content-length") || null,
    topic: req.get("x-shopify-topic") || null,
    shop: req.get("x-shopify-shop-domain") || null,
    has_hmac: !!req.get("x-shopify-hmac-sha256"),
  });

  fs.appendFileSync(out, line + "\n");
} catch (e) {
  console.warn("[abando][ROUTER_ENTER_PROBE] failed:", e?.message || e);
}
// [abando][ROUTER_ENTER_PROBE_END]
'''.lstrip("\n")

# Avoid duplicate insertion
if "[abando][ROUTER_ENTER_PROBE]" in s:
    print("✅ Router enter probe already present; no change.")
else:
    s = s[:insert_at] + "\n" + probe + s[insert_at:]
    p.write_text(s, encoding="utf-8")
    print("✅ Inserted router enter probe into webhooks.js")
PY

echo "🔎 Import-checking webhooks.js as ESM..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."
echo
echo "NEXT:"
echo "  1) curl -s -i -X POST http://localhost:3000/api/webhooks -H 'content-type: application/json' --data '{\"t\":'\"$(date +%s)\"'}'"
echo "  2) tail -n 5 web/.abando_webhook_router_enter.jsonl"

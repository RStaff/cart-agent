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

if ".abando_webhook_router_enter.jsonl" in s or "[abando][ROUTER_USE_PROBE]" in s:
    print("✅ Router-use probe already present; no change.")
    raise SystemExit(0)

# Find router variable assignment: const <name> = express.Router();
m = re.search(r'^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*express\.Router\(\s*\)\s*;.*$',
              s, flags=re.M)
if not m:
    # fallback: express.Router() without semicolon
    m = re.search(r'^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*express\.Router\(\s*\)\s*.*$',
                  s, flags=re.M)

if not m:
    raise SystemExit("❌ Could not find `const <routerName> = express.Router()` in webhooks.js")

router_name = m.group(1)
insert_at = m.end()

probe = f"""
// [abando][ROUTER_USE_PROBE]
{router_name}.use(async (req, _res, next) => {{
  try {{
    const fsMod = await import("node:fs");
    const pathMod = await import("node:path");
    const fs = fsMod.default || fsMod;
    const path = pathMod.default || pathMod;

    const out = process.env.ABANDO_WEBHOOK_ROUTER_ENTER_PATH
      ? path.resolve(process.cwd(), process.env.ABANDO_WEBHOOK_ROUTER_ENTER_PATH)
      : path.resolve(process.cwd(), ".abando_webhook_router_enter.jsonl");

    const line = JSON.stringify({{
      ts: new Date().toISOString(),
      stage: "router_use",
      method: req.method,
      url: req.originalUrl || req.url || null,
      cwd: process.cwd(),
      content_length: req.get("content-length") || null,
      topic: req.get("x-shopify-topic") || null,
      shop: req.get("x-shopify-shop-domain") || null,
      has_hmac: !!req.get("x-shopify-hmac-sha256"),
    }});
    fs.appendFileSync(out, line + "\\n");
  }} catch (e) {{
    console.warn("[abando][ROUTER_USE_PROBE] failed:", e?.message || e);
  }}
  next();
}});
// [abando][ROUTER_USE_PROBE_END]
""".lstrip("\n")

s2 = s[:insert_at] + "\n" + probe + s[insert_at:]
p.write_text(s2, encoding="utf-8")
print(f"✅ Inserted router-use probe after `{router_name} = express.Router()`")
PY

echo "🔎 Import-checking webhooks.js as ESM..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."
echo
echo "NEXT:"
echo "  ./scripts/524_probe_selftest.sh"
echo "  tail -n 5 web/.abando_webhook_router_enter.jsonl"

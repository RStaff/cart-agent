#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

BEGIN = "// [abando][OK_SEND_PROBE_BEGIN]"
END   = "// [abando][OK_SEND_PROBE_END]"

probe = f"""{BEGIN}
      try {{
        const [fsMod, pathMod] = await Promise.all([import("node:fs"), import("node:path")]);
        const fs = fsMod.default || fsMod;
        const path = pathMod.default || pathMod;
        const out = path.resolve(process.cwd(), ".abando_webhook_inbox.jsonl");
        const line = JSON.stringify({{
          ts: new Date().toISOString(),
          stage: "handler_ok_send",
          method: req.method,
          url: req.originalUrl || req.url || null,
          topic: req.get("x-shopify-topic") || null,
          shop: req.get("x-shopify-shop-domain") || null,
          has_hmac: !!req.get("x-shopify-hmac-sha256"),
        }});
        fs.appendFileSync(out, line + "\\n");
      }} catch (e) {{
        console.warn("[abando][OK_SEND_PROBE] failed:", e?.message || e);
      }}
{END}
"""

# Replace if already present
if BEGIN in s and END in s:
    s = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), probe, s, flags=re.S)

# Insert probe before BOTH ok sends (line 242 and 246 in your grep)
pattern = r'(return\s+res\.status\(\s*200\s*\)\.send\(\s*["\']ok["\']\s*\)\s*;)'
hits = list(re.finditer(pattern, s))
if not hits:
    raise SystemExit("❌ Could not find `return res.status(200).send(\"ok\")` in webhooks.js")

# Insert from bottom-up so indices don’t shift
for m in reversed(hits):
    s = s[:m.start()] + probe + "\n" + s[m.start():]

p.write_text(s, encoding="utf-8")
print(f"✅ Inserted OK-send probe before {len(hits)} ok-return(s).")
PY

echo "🔎 Import-check webhooks.js..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."

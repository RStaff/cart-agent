#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

BEGIN = "// ABANDO_WEBHOOK_TRACE_MW_BEGIN"
END   = "// ABANDO_WEBHOOK_TRACE_MW_END"

block = r'''
// ABANDO_WEBHOOK_TRACE_MW_BEGIN
// Minimal trace: logs webhook entry + logs ANY 200/"ok" send with a short stack.
app.use("/api/webhooks", (req, res, next) => {
  try {
    const ts = new Date().toISOString();
    console.log("[abando][TRACE_WEBHOOK_ENTRY]", ts, req.method, req.originalUrl || req.url, {
      topic: req.get("x-shopify-topic") || null,
      shop: req.get("x-shopify-shop-domain") || null,
      has_hmac: !!req.get("x-shopify-hmac-sha256"),
      cl: req.get("content-length") || null,
    });

    let _status = null;
    const _origStatus = res.status.bind(res);
    const _origSend   = res.send.bind(res);

    res.status = (code) => {
      _status = code;
      return _origStatus(code);
    };

    res.send = (body) => {
      try {
        const code = (_status != null ? _status : res.statusCode);
        const b = (typeof body === "string" ? body : (body == null ? "" : String(body)));
        const isOk = (code === 200 && b.trim().toLowerCase() === "ok");
        if (isOk) {
          const st = (new Error("TRACE_OK_SEND")).stack || "";
          // keep it short + readable
          const short = st.split("\n").slice(0, 10).join("\n");
          console.log("[abando][TRACE_OK_SEND]", new Date().toISOString(), req.method, req.originalUrl || req.url, {
            topic: req.get("x-shopify-topic") || null,
            shop: req.get("x-shopify-shop-domain") || null,
          });
          console.log(short);
        }
      } catch (_e) {}
      return _origSend(body);
    };
  } catch (_e) {}
  return next();
});
// ABANDO_WEBHOOK_TRACE_MW_END
'''.lstrip("\n")

# If already present, do nothing
if BEGIN in s and END in s:
  print("ℹ️ Trace middleware already present — no changes.")
  raise SystemExit(0)

anchor = "app.use(\"/api/webhooks\", webhooksRouter);"
idx = s.find(anchor)
if idx == -1:
  raise SystemExit("❌ Could not find anchor: app.use(\"/api/webhooks\", webhooksRouter);")

# Insert immediately before the router mount
s2 = s[:idx] + block + "\n" + s[idx:]
p.write_text(s2, encoding="utf-8")
print("✅ Inserted ABANDO_WEBHOOK_TRACE middleware before webhooksRouter mount.")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/index.js').then(()=>console.log('✅ index.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/index.js 2>/dev/null || true
echo "✅ Done."

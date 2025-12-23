#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

INDEX_FILE="web/src/index.js"
test -f "$INDEX_FILE" || { echo "❌ Missing $INDEX_FILE"; exit 1; }

cp "$INDEX_FILE" "$INDEX_FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

BEGIN = "// ABANDO_WEBHOOK_PROBE_MW_BEGIN"
END   = "// ABANDO_WEBHOOK_PROBE_MW_END"

block = r'''
// ABANDO_WEBHOOK_PROBE_MW_BEGIN
// Guaranteed lightweight probe (ESM-safe): does NOT read/consume req body, just logs headers + content-length
app.use("/api/webhooks", (req, _res, next) => {
  try {
    Promise.all([import("node:fs"), import("node:path")]).then(([fsMod, pathMod]) => {
      const fs = fsMod.default || fsMod;
      const path = pathMod.default || pathMod;

      const out = process.env.ABANDO_WEBHOOK_PROBE_PATH
        ? path.resolve(process.cwd(), process.env.ABANDO_WEBHOOK_PROBE_PATH)
        : path.resolve(process.cwd(), ".abando_webhook_probe.jsonl");

      const line = JSON.stringify({
        ts: new Date().toISOString(),
        stage: "probe_mw",
        method: req.method,
        url: req.originalUrl || req.url || null,
        cwd: process.cwd(),
        content_length: req.get("content-length") || null,
        has_topic: !!req.get("x-shopify-topic"),
        has_shop: !!req.get("x-shopify-shop-domain"),
        has_hmac: !!req.get("x-shopify-hmac-sha256"),
        topic: req.get("x-shopify-topic") || null,
        shop: req.get("x-shopify-shop-domain") || null
      });

      try {
        fs.appendFileSync(out, line + "\n");
      } catch (e) {
        console.warn("[abando][PROBE_MW] append failed:", e?.message || e);
      }
    }).catch((e) => {
      console.warn("[abando][PROBE_MW] import failed:", e?.message || e);
    });
  } catch (e) {
    console.warn("[abando][PROBE_MW] unexpected:", e?.message || e);
  }
  next();
});
// ABANDO_WEBHOOK_PROBE_MW_END
'''.lstrip("\n").rstrip()

if BEGIN in s and END in s:
    s = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), block, s, flags=re.S)
else:
    raise SystemExit("❌ Could not find existing ABANDO_WEBHOOK_PROBE_MW block to replace.")

p.write_text(s, encoding="utf-8")
print("✅ Replaced ABANDO_WEBHOOK_PROBE_MW with ESM-safe version.")
PY

echo "🔁 Nudging nodemon restart..."
mkdir -p web/lib
touch web/index.js web/lib/.nodemon_restart 2>/dev/null || true
echo "✅ Done."
echo
echo "NEXT:"
echo "  curl -s -i -X POST http://localhost:3000/api/webhooks -H 'content-type: application/json' --data '{\"t\":'\"$(date +%s)\"'}'"
echo "  tail -n 10 web/.abando_webhook_probe.jsonl"

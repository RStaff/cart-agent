#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Don't double-insert
if "[abando][WEBHOOK_SECRET_FP][REQ]" in s:
    print("✅ already present")
    raise SystemExit(0)

# Ensure node:crypto helpers exist (your file currently uses `crypto` default import)
inject = r'''
      const __sec = (
        process.env.SHOPIFY_API_SECRET ||
        process.env.SHOPIFY_API_SECRET_KEY ||
        process.env.SHOPIFY_APP_SECRET ||
        ""
      );
      const __fp = __sec ? crypto.createHash("sha256").update(String(__sec)).digest("hex").slice(0,12) : "none";
      console.log("[abando][WEBHOOK_SECRET_FP][REQ] len=", (__sec||"").length, "fp=", __fp);
'''

# Insert right after: `async (req, res) => {` then first `try {`
s2, n = re.subn(r'(async\s*\(req\s*,\s*res\s*\)\s*=>\s*\{\s*try\s*\{\s*)', r'\1\n' + inject + '\n', s, count=1)
if n != 1:
    raise SystemExit("❌ Could not find handler to inject into (async(req,res)=>{ try { ).")

p.write_text(s2, encoding="utf-8")
print("✅ added request-time WEBHOOK_SECRET_FP log")
PY

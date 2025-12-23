#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re
p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# only add once
if "[abando][WEBHOOK_SECRET_FP][REQ]" in s:
    print("✅ already present")
    raise SystemExit(0)

# insert helper near top (after imports)
helper = r'''
import { createHash } from "node:crypto";

function __abandoFp(v) {
  try { return createHash("sha256").update(String(v||"")).digest("hex").slice(0,12); }
  catch { return "fp_fail"; }
}
'''
# If file already imports crypto or node:crypto differently, just prepend helper safely
s = helper + "\n" + s

# Inject log inside router.post handler right after it starts
s = re.sub(
    r'(async\s*\(req,\s*res\)\s*=>\s*\{\s*try\s*\{)',
    r'\1\n      const __sec = (process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || process.env.SHOPIFY_APP_SECRET || "");\n      console.log("[abando][WEBHOOK_SECRET_FP][REQ] len=", (__sec||"").length, "fp=", __abandoFp(__sec));\n',
    s,
    count=1
)

p.write_text(s, encoding="utf-8")
print("✅ added request-time WEBHOOK_SECRET_FP log")
PY

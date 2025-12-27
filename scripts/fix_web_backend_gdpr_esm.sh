#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
FILE="$ROOT/web/src/index.js"

echo "🔧 Fix GDPR webhook patch for ESM (no require())"
echo "📄 Target: $FILE"

test -f "$FILE" || { echo "❌ Missing file: $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "🧾 Backup created."

python3 - <<'PY'
from pathlib import Path
import re, sys

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

# 1) Remove any CommonJS crypto require we might have inserted
s = re.sub(r'^\s*const\s+crypto\s*=\s*require\("crypto"\)\s*;\s*\n', '', s, flags=re.M)

# 2) Ensure we have `import crypto from "crypto";` (only once)
if not re.search(r'^\s*import\s+crypto\s+from\s+["\']crypto["\']\s*;\s*$', s, flags=re.M):
    # Prefer inserting after the express import if present, else at top
    m = re.search(r'^\s*import\s+.*\s+from\s+["\']express["\']\s*;\s*$', s, flags=re.M)
    if m:
        insert_at = m.end()
        s = s[:insert_at] + "\nimport crypto from \"crypto\";\n" + s[insert_at:]
    else:
        s = "import crypto from \"crypto\";\n" + s

# 3) Convert require("express").raw -> express.raw
s = s.replace('require("express").raw', 'express.raw')

# 4) If GDPR block exists, ensure it’s using express.raw(...) not require(...)
# (No-op if already fixed by replacement)
# Also guard against any other require("express") usage inside the GDPR block.
s = s.replace("require('express').raw", "express.raw")

p.write_text(s, encoding="utf-8")
print("✅ Updated web/src/index.js for ESM-safe GDPR handler.")
PY

echo
echo "🔍 Confirm (show GDPR lines + crypto import):"
grep -nE 'import crypto from "crypto";|/api/webhooks/gdpr|express\.raw' "$FILE" | tail -n 80 || true

echo
echo "✅ Done. Next:"
echo "  1) Restart: shopify app dev"
echo "  2) Re-check: curl -I https://<new>.trycloudflare.com/api/webhooks/gdpr"

#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BK="${FILE}.bak_$(date +%s)"
cp "$FILE" "$BK"
echo "✅ Backup: $BK"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# 1) Ensure 'path' is imported (fixes: ReferenceError: path is not defined)
if re.search(r'from\s+[\'"]path[\'"]', s) is None:
    # Insert after fs import if present, otherwise near top
    m = re.search(r'(import\s+fs\s+from\s+[\'"]fs[\'"]\s*;\s*\n)', s)
    if m:
        insert_at = m.end()
        s = s[:insert_at] + 'import path from "path";\n' + s[insert_at:]
    else:
        s = 'import path from "path";\n' + s

# 2) Force webhook secret to come from process.env.SHOPIFY_API_SECRET (the BOOT_ENV-loaded value)
# Replace common patterns: process.env.SHOPIFY_API_SECRET_KEY, SHOPIFY_API_SECRET, SHOPIFY_API_SECRET, etc.
# We don't try to fully refactor; we just ensure a canonical const exists and is used.

if "const __ABANDO_WEBHOOK_SECRET" not in s:
    s = s.replace(
        "import crypto from \"crypto\";",
        "import crypto from \"crypto\";\n\n// Canonical secret source (must match BOOT_ENV)\nconst __ABANDO_WEBHOOK_SECRET = process.env.SHOPIFY_API_SECRET || \"\";\n"
    ) if "import crypto from" in s else (
        "import crypto from \"crypto\";\n\n// Canonical secret source (must match BOOT_ENV)\nconst __ABANDO_WEBHOOK_SECRET = process.env.SHOPIFY_API_SECRET || \"\";\n\n" + s
    )

# 3) If the file defines any secret variable for webhook verification, try to redirect it.
# Replace occurrences of process.env.<anything> that look like they were intended as the API secret:
s = re.sub(r'process\.env\.(SHOPIFY_API_SECRET_KEY|SHOPIFY_API_SECRET_SECRET|SHOPIFY_API_SECRET_TOKEN|SHOPIFY_API_SECRET2)\b',
           'process.env.SHOPIFY_API_SECRET', s)

# Replace any obvious "const secret = process.env.SOMETHING" with our canonical secret
s = re.sub(r'const\s+(secret|SHOPIFY_API_SECRET|webhookSecret)\s*=\s*process\.env\.[A-Z0-9_]+\s*\|\|\s*[\'"][^\'"]*[\'"]\s*;',
           'const secret = __ABANDO_WEBHOOK_SECRET;', s)

# Replace direct uses in createHmac().update(secret) if they reference another identifier we can’t know:
# If there is no 'const secret =' at all, add one near top.
if re.search(r'\bconst\s+secret\s*=', s) is None:
    # Put it near the canonical secret
    s = s.replace(
        "const __ABANDO_WEBHOOK_SECRET = process.env.SHOPIFY_API_SECRET || \"\";\n",
        "const __ABANDO_WEBHOOK_SECRET = process.env.SHOPIFY_API_SECRET || \"\";\nconst secret = __ABANDO_WEBHOOK_SECRET;\n"
    )

# 4) Add a log line showing which secret FP the webhook route is actually using
if "[abando][WEBHOOK_SECRET_FP]" not in s:
    # Try to insert near where you log WEBHOOK_ENTRY
    marker = "[abando][WEBHOOK_ENTRY]"
    idx = s.find(marker)
    if idx != -1:
        # Insert after that block's console.log line (best-effort)
        # We'll just inject a helper function near the top and a log in request handler.
        pass

    # Add helper at top (safe)
    if "function __abandoFp" not in s:
        helper = '\nfunction __abandoFp(v){return crypto.createHash("sha256").update(String(v||"")).digest("hex").slice(0,12)}\n'
        # after crypto import / canonical secret
        ins = s.find("const __ABANDO_WEBHOOK_SECRET")
        if ins != -1:
            line_end = s.find("\n", ins)
            s = s[:line_end+1] + helper + s[line_end+1:]
        else:
            s = helper + s

    # Inject a log in the handler: look for "WEBHOOK_ENTRY" log object; after it, log fp
    # Best-effort: after the first occurrence of WEBHOOK_ENTRY string in file.
    pos = s.find("[abando][WEBHOOK_ENTRY]")
    if pos != -1:
        # Insert after the line containing it
        line_end = s.find("\n", pos)
        inject = '  console.log("[abando][WEBHOOK_SECRET_FP]", __abandoFp(secret));\n'
        s = s[:line_end+1] + inject + s[line_end+1:]
    else:
        # Fallback: add a single boot log
        s = s + '\nconsole.log("[abando][WEBHOOK_SECRET_FP][BOOT]", __abandoFp(secret));\n'

p.write_text(s, encoding="utf-8")
print("✅ Patched:", p)
PY

echo "✅ Done. Now restart dev server (or hit 'rs' in nodemon terminal)."

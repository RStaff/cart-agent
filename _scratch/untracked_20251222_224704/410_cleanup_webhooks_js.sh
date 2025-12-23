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

def drop_block(text, begin, end):
    # Remove inclusive marker blocks
    pat = re.compile(rf"^\s*{re.escape(begin)}\s*$.*?^\s*{re.escape(end)}\s*$\n?", re.M | re.S)
    return pat.sub("", text)

# Remove the injected ABANDO blocks (they reference extra imports and add noise)
s = drop_block(s, "// ABANDO_SECRET_FP_HELPER_BEGIN", "// ABANDO_SECRET_FP_HELPER_END")
s = drop_block(s, "// ABANDO_DEBUG_SECRET_FP_BEGIN", "// ABANDO_DEBUG_SECRET_FP_END")
s = drop_block(s, "// ABANDO_DEBUG_INBOX_PATH_BEGIN", "// ABANDO_DEBUG_INBOX_PATH_END")

# Remove duplicate/unused imports that were introduced
# Keep: express, node:path (as `path`), fs, and named imports from node:crypto.
s = re.sub(r'^\s*import\s+crypto\s+from\s+["\']crypto["\']\s*;\s*$\n?', '', s, flags=re.M)
s = re.sub(r'^\s*import\s+\*\s+as\s+abandoCrypto\s+from\s+["\']node:crypto["\']\s*;\s*$\n?', '', s, flags=re.M)
s = re.sub(r'^\s*import\s+\*\s+as\s+abandoPath\s+from\s+["\']node:path["\']\s*;\s*$\n?', '', s, flags=re.M)

# Remove the early "extra helper" fp function(s) that depend on the deleted imports
s = re.sub(r'^\s*function\s+__abandoFp\([^\)]*\)\{.*?\}\s*$\n?', '', s, flags=re.M)
s = re.sub(r'^\s*// Canonical secret source.*?$.*?^\s*$\n', '', s, flags=re.M|re.S)

# Ensure we have ONE canonical secret constant near the top, using process.env
# (Insert right after the first import line.)
lines = s.splitlines(True)
ins = 0
for i, line in enumerate(lines):
    if line.lstrip().startswith("import "):
        ins = i + 1
    else:
        break

secret_block = (
    "\n"
    "// Canonical secret source (must match BOOT_ENV)\n"
    "const __ABANDO_WEBHOOK_SECRET = String(process.env.SHOPIFY_API_SECRET || \"\");\n"
    "\n"
)

# Only add if not already present
if "__ABANDO_WEBHOOK_SECRET" not in s:
    lines.insert(ins, secret_block)

s = "".join(lines)

# Ensure we still import node:path as `path`
if not re.search(r'^\s*import\s+\*\s+as\s+path\s+from\s+["\']node:path["\']\s*;\s*$', s, re.M):
    # Insert after express import if possible, else at top
    m = re.search(r'^\s*import\s+express\s+from\s+["\']express["\']\s*;\s*$', s, re.M)
    if m:
        line_end = s.find("\n", m.end())
        s = s[:line_end+1] + 'import * as path from "node:path";\n' + s[line_end+1:]
    else:
        s = 'import * as path from "node:path";\n' + s

# Add a safe boot log for the webhook secret FP AFTER fpSecret exists.
# We'll insert right after fpSecret() definition if not present.
if "[abando][WEBHOOK_SECRET_FP]" not in s:
    m = re.search(r'^\s*function\s+fpSecret\s*\(\s*secret\s*\)\s*\{.*?^\s*\}\s*$', s, re.M|re.S)
    if m:
        insert_at = m.end()
        s = s[:insert_at] + '\n\nconsole.log("[abando][WEBHOOK_SECRET_FP]", fpSecret(__ABANDO_WEBHOOK_SECRET));\n' + s[insert_at:]
    else:
        # Fallback: append at end (still safe)
        s += '\nconsole.log("[abando][WEBHOOK_SECRET_FP]", fpSecret(__ABANDO_WEBHOOK_SECRET));\n'

p.write_text(s, encoding="utf-8")
print("✅ Cleaned and normalized", p)
PY

echo "✅ Done."

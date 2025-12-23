#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "🛠️  Patching missing imports / undefined symbols in $FILE"
cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# Detect whether we already import these
has_path_import   = bool(re.search(r'^\s*import\s+path\s+from\s+["\']node:path["\']\s*;?\s*$', s, re.M))
has_fs_import     = bool(re.search(r'^\s*import\s+fs\s+from\s+["\']node:fs["\']\s*;?\s*$', s, re.M))
has_crypto_import = bool(re.search(r'^\s*import\s+crypto\s+from\s+["\']node:crypto["\']\s*;?\s*$', s, re.M))

needs_path   = ("path." in s) and (not has_path_import)
needs_fs     = ("fs." in s) and (not has_fs_import)
needs_crypto = (("createHmac(" in s) or ("crypto.createHmac(" in s) or ("timingSafeEqual(" in s)) and (not has_crypto_import)

# Fix bare createHmac(...) -> crypto.createHmac(...) if crypto import will exist
if "createHmac(" in s and "crypto.createHmac(" not in s:
    # Only rewrite calls that are not already crypto.createHmac(
    s = re.sub(r'(?<![\w.])createHmac\s*\(', 'crypto.createHmac(', s)

# Fix the "eys is not defined" typo if it exists as a bare identifier
s = re.sub(r'(?<![\w.])eys(?![\w.])', 'keys', s)

# Insert imports after the last existing import line
imports_to_add = []
if needs_fs:
    imports_to_add.append('import fs from "node:fs";')
if needs_path:
    imports_to_add.append('import path from "node:path";')
if needs_crypto:
    imports_to_add.append('import crypto from "node:crypto";')

if imports_to_add:
    lines = s.splitlines(True)
    last_import_idx = -1
    for i, line in enumerate(lines):
        if re.match(r'^\s*import\s', line):
            last_import_idx = i
    insert_at = last_import_idx + 1 if last_import_idx >= 0 else 0
    block = "".join([ln + "\n" for ln in imports_to_add]) + "\n"
    lines.insert(insert_at, block)
    s = "".join(lines)

p.write_text(s, encoding="utf-8")
print("✅ Patched webhooks.js (imports + typo + createHmac calls).")
PY

echo "🔎 ESM import-check $FILE..."
node --input-type=module -e "import('file://' + process.cwd() + '/$FILE').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."

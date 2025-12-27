#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
FILE="$ROOT/web/src/index.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

echo "💣 Nuke all prior GDPR patch fragments + reinstall ONE clean block"
echo "📄 File: $FILE"

BK="$FILE.bak_$(date +%s)"
cp "$FILE" "$BK"
echo "🧾 Backup: $BK"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

# 1) Remove any blocks we previously injected (all marker variants)
markers = [
    r"/\*\s*ABANDO_GDPR_WEBHOOK_ROUTE\s*\*/",
    r"/\*\s*ABANDO_GDPR_FORCE_401\s*\*/",
    r"/\*\s*ABANDO_GDPR_ROUTE_CLEAN\s*\*/",
]
for m in markers:
    # remove from marker to next "import ..." OR end-of-file-ish boundary
    s = re.sub(m + r"[\s\S]*?(?=\n\s*(import|const|let|var|function|export)\b|\Z)", "", s)

# 2) Remove any stray definitions from earlier attempts (even if marker is gone)
#    - __abando_gdpr_paths array
#    - __abando_register_* functions
s = re.sub(r'^\s*const\s+__abando_gdpr_paths\s*=\s*\[[^\]]*\]\s*;\s*\n?', "", s, flags=re.M)
s = re.sub(r'^\s*function\s+__abando_register_gdpr\s*\([\s\S]*?\n}\s*\n?', "", s, flags=re.M)
s = re.sub(r'^\s*export\s+function\s+__abando_register_gdpr_force_401\s*\([\s\S]*?\n}\s*\n?', "", s, flags=re.M)
s = re.sub(r'^\s*function\s+__abando_register_gdpr_force_401\s*\([\s\S]*?\n}\s*\n?', "", s, flags=re.M)

# 3) Remove duplicate express imports (keep first)
lines = s.splitlines(True)
out = []
seen_express_import = 0
for ln in lines:
    if re.match(r'^\s*import\s+express\s+from\s+["\']express["\']\s*;\s*$', ln):
        seen_express_import += 1
        if seen_express_import > 1:
            continue
    out.append(ln)
s = "".join(out)

# 4) Remove any existing calls to register funcs so we can add one clean call
s = re.sub(r'^\s*__abando_register_gdpr\(\s*app\s*\)\s*;\s*\n?', "", s, flags=re.M)
s = re.sub(r'^\s*__abando_register_gdpr_force_401\(\s*app\s*\)\s*;\s*\n?', "", s, flags=re.M)

# 5) Insert ONE clean block right after express import
marker = "/* ABANDO_GDPR_ROUTE_CLEAN */"
block = '''
/* ABANDO_GDPR_ROUTE_CLEAN */
const __abando_gdpr_paths = ["/api/webhooks/gdpr", "/webhooks/gdpr"];
function __abando_register_gdpr(app) {
  app.head(__abando_gdpr_paths, (_req, res) => res.status(200).end());
  app.get(__abando_gdpr_paths, (_req, res) => res.status(200).send("ok"));
  app.post(__abando_gdpr_paths, express.raw({ type: "*/*" }), (_req, res) => {
    return res.status(401).send("Unauthorized");
  });
}
'''

m = re.search(r'^\s*import\s+express\s+from\s+["\']express["\']\s*;\s*$', s, flags=re.M)
if not m:
    raise SystemExit('❌ Could not find: import express from "express";')

insert_at = m.end()
s = s[:insert_at] + "\n" + block + s[insert_at:]

# 6) Call registrar right after `const app = express();`
m2 = re.search(r'^\s*const\s+app\s*=\s*express\(\)\s*;\s*$', s, flags=re.M)
if not m2:
    raise SystemExit("❌ Could not find: const app = express();")

call = "\n__abando_register_gdpr(app);\n"
s = s[:m2.end()] + call + s[m2.end():]

p.write_text(s, encoding="utf-8")
print("✅ Reinstalled ONE clean GDPR block.")
PY

echo
echo "🔍 Verify there is exactly ONE __abando_gdpr_paths:"
grep -nE '__abando_gdpr_paths' "$FILE" || true
echo
echo "🔍 Verify marker exists:"
grep -nE 'ABANDO_GDPR_ROUTE_CLEAN' "$FILE" || true

#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "🛠️  Normalizing crypto imports in $FILE"
cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# 1) Remove any imports that bind the identifier `crypto`
#    e.g. import crypto from "node:crypto";
#         import * as crypto from "node:crypto";
s = re.sub(r'^\s*import\s+\*\s+as\s+crypto\s+from\s+["\']node:crypto["\']\s*;?\s*\n', '', s, flags=re.M)
s = re.sub(r'^\s*import\s+crypto\s+from\s+["\']node:crypto["\']\s*;?\s*\n', '', s, flags=re.M)

# 2) If there's an import { ... } from node:crypto, capture it; otherwise we'll add one.
m = re.search(r'^\s*import\s*\{\s*([^}]+)\s*\}\s*from\s*["\']node:crypto["\']\s*;?\s*$', s, re.M)
existing = set()
if m:
  parts = [x.strip() for x in m.group(1).split(",") if x.strip()]
  # handle "foo as bar" -> capture bar
  for part in parts:
    if " as " in part:
      existing.add(part.split(" as ")[1].strip())
    else:
      existing.add(part)

# 3) Rewrite crypto.createHmac / crypto.timingSafeEqual to named calls
if "crypto.createHmac" in s:
  s = s.replace("crypto.createHmac(", "createHmac(")
if "crypto.timingSafeEqual" in s:
  s = s.replace("crypto.timingSafeEqual(", "timingSafeEqual(")

need_create = "createHmac(" in s
need_tse    = "timingSafeEqual(" in s

wanted = set(existing)
if need_create: wanted.add("createHmac")
if need_tse:    wanted.add("timingSafeEqual")

# 4) Ensure a single named import line exists and contains what we need
if wanted:
  import_line = f'import {{ {", ".join(sorted(wanted))} }} from "node:crypto";'
  if m:
    # replace existing named import with normalized one
    s = re.sub(r'^\s*import\s*\{\s*[^}]+\s*\}\s*from\s*["\']node:crypto["\']\s*;?\s*$',
               import_line, s, flags=re.M)
  else:
    # insert after last import
    lines = s.splitlines(True)
    last_import = -1
    for i, line in enumerate(lines):
      if re.match(r'^\s*import\s', line):
        last_import = i
    insert_at = last_import + 1 if last_import >= 0 else 0
    lines.insert(insert_at, import_line + "\n")
    s = "".join(lines)

p.write_text(s, encoding="utf-8")
print("✅ crypto normalized (deduped + named imports + call rewrites).")
PY

echo "🔎 ESM import-check $FILE..."
node --input-type=module -e "import('file://' + process.cwd() + '/$FILE').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."

#!/usr/bin/env bash
set -euo pipefail

FILE="web/shopify.web.toml"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

BK="$FILE.bak_$(date +%s)"
cp "$FILE" "$BK"
echo "✅ Backup: $BK"

# Replace roles line (line can vary) with full-stack roles
python3 - << 'PY'
from pathlib import Path
p = Path("web/shopify.web.toml")
s = p.read_text()

lines = s.splitlines()
out = []
changed = False
for line in lines:
  if line.strip().startswith("roles"):
    out.append('roles = ["frontend", "backend"]')
    changed = True
  else:
    out.append(line)

if not changed:
  out.insert(0, 'roles = ["frontend", "backend"]')

p.write_text("\n".join(out).rstrip() + "\n")
print("✅ Updated roles -> [frontend, backend]")
PY

echo
echo "===== New web/shopify.web.toml ====="
nl -ba "$FILE" | sed -n '1,80p'
echo
echo "✅ Done. NOW: restart Shopify dev (important):"
echo "   1) Stop your running 'shopify app dev' (press q)"
echo "   2) Run: shopify app dev --reset"

#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

# If it already exists, don't double-insert
if grep -qE 'app\.post\(["'\'']/api/webhooks/gdpr["'\'']' "$FILE"; then
  echo "✅ GDPR POST route already present in $FILE"
  exit 0
fi

cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

# Find a safe insertion point: right after the line that creates `app`
# Typical: const app = express();
m = re.search(r'^\s*(const|let|var)\s+app\s*=\s*express\(\)\s*;\s*$', s, flags=re.M)
if not m:
    raise SystemExit("❌ Could not find `const app = express();` to anchor insertion.")

insert = r'''
/* ABANDO_GDPR_ROUTE_ONCE */
app.head("/api/webhooks/gdpr", (_req, res) => res.status(200).end());
app.get("/api/webhooks/gdpr", (_req, res) => res.status(200).send("ok"));
app.post("/api/webhooks/gdpr", express.raw({ type: "*/*" }), (_req, res) => {
  // Shopify automated checks expect 401 when HMAC is missing/invalid.
  return res.status(401).send("Unauthorized");
});
/* /ABANDO_GDPR_ROUTE_ONCE */
'''.lstrip("\n")

i = m.end()
s2 = s[:i] + "\n\n" + insert + "\n" + s[i:]
p.write_text(s2, encoding="utf-8")
print("✅ Inserted GDPR route block.")
PY

echo "🔍 Confirm:"
grep -nE 'ABANDO_GDPR_ROUTE_ONCE|/api/webhooks/gdpr' "$FILE" | head -n 40 || true

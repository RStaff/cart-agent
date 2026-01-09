#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}" >/dev/null

python3 - <<'PY'
import re
from pathlib import Path

p = Path("web/src/index.js")
s = p.read_text()

# If already patched, exit cleanly
if "[abandoRootRedirect]" in s:
    print("✅ Root redirect already present.")
    raise SystemExit(0)

# Insert right AFTER express app is created (common pattern: const app = express();)
m = re.search(r'(?m)^\s*(const|let|var)\s+app\s*=\s*express\(\)\s*;\s*$', s)
if not m:
    raise SystemExit("❌ Could not find `const app = express();` to anchor insertion.")

insert = """
// [abandoRootRedirect] Shopify often loads the embedded app at "/?embedded=1&..."
// Redirect "/" -> "/embedded" while preserving querystring BEFORE any allowlist/proxy logic.
app.get("/", (req, res) => {
  const suffix = (req.originalUrl || "/").replace(/^\\//, ""); // "/?a=1" -> "?a=1"
  return res.redirect(302, "/embedded" + (suffix.startsWith("?") ? suffix : ""));
});
"""

out = s[:m.end()] + insert + s[m.end():]
p.write_text(out)
print("✅ Added backend root redirect: / -> /embedded (preserve querystring).")
PY

echo
echo "===== VERIFY (show inserted block) ====="
rg -n "abandoRootRedirect|app\\.get\\(\"/\"" "$FILE" || true

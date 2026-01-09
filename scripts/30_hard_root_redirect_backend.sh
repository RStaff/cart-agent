#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

TS=$(date +"%Y%m%d_%H%M%S")
cp -v "$FILE" "$FILE.bak.$TS" >/dev/null
echo "🧷 Backup: $FILE.bak.$TS"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text()

# Remove any prior abandoRootRedirect blocks (we're replacing with a stronger one)
s = re.sub(r"(?s)\n\s*// \[abandoRootRedirect\].*?\n\s*\}\);\s*\n", "\n", s)

# Also disable any legacy exact root handler that serves index.html (avoid conflicts)
s = re.sub(r'(?m)^\s*app\.get\(\s*"/"\s*,\s*\(_req\s*,\s*res\)\s*=>\s*res\.sendFile\([^\)]*\)\s*\);\s*$',
           r'// [abandoRootRedirectLegacyDisabled] Disabled legacy root handler to avoid conflict\n// app.get("/", (_req, res) => res.sendFile(...));',
           s)

# Insert a "hard" redirect middleware immediately after app is created (before other middleware)
needle = "const app = express();"
idx = s.find(needle)
if idx == -1:
    raise SystemExit("❌ Could not find `const app = express();` to anchor insert.")

insert = r'''
// [abandoRootRedirect] HARD redirect for Shopify Admin which often loads "/?embedded=1&..."
// Must run before any other middleware/handlers.
app.use((req, res, next) => {
  if (req.path === "/") {
    const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return res.redirect(302, "/embedded" + q);
  }
  return next();
});
'''

# Only add if not already present
if "[abandoRootRedirect] HARD redirect" not in s:
    s = s.replace(needle, needle + insert)

p.write_text(s)
print("✅ Installed HARD backend root redirect middleware: / -> /embedded (preserves query).")
PY

echo
echo "===== VERIFY (show the redirect block) ====="
rg -n "\[abandoRootRedirect\] HARD redirect|app\.use\(\(req, res, next\)" "$FILE" || true

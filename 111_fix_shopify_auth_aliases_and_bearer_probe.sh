#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"

if [[ ! -f "$FILE" ]]; then
  echo "ERROR: $FILE not found. Run from repo root (cart-agent)."
  exit 1
fi

TS="$(date +%Y%m%d_%H%M%S)"
BAK="${FILE}.bak_${TS}"
cp -a "$FILE" "$BAK"
echo "Backup created: $BAK"

python3 - <<'PY'
import re, pathlib, sys

path = pathlib.Path("web/src/index.js")
s = path.read_text(encoding="utf-8")

changed = []

# -------------------------------------------------------------------
# 1) Fix bearer regex in /api/embedded-check
# -------------------------------------------------------------------
# Replace the exact bad line if present
bad_line = r'const hasBearer = /^Bearers+S+/.test(auth);'
good_line = r'const hasBearer = /^Bearer\\s+\\S+/.test(auth);'

if bad_line in s:
    s = s.replace(bad_line, good_line)
    changed.append("fixed embedded-check bearer regex (exact match)")
else:
    # Fallback: replace any hasBearer regex that clearly has the wrong tokens
    s2 = re.sub(
        r'const\s+hasBearer\s*=\s*/\^Bearer[^/]*?/\s*\.test\(\s*auth\s*\)\s*;',
        good_line,
        s
    )
    if s2 != s:
        s = s2
        changed.append("fixed embedded-check bearer regex (regex fallback)")

# -------------------------------------------------------------------
# 2) Add /api/auth and /api/auth/callback aliases (idempotent)
# -------------------------------------------------------------------
marker = "// --- Shopify auth aliases (for Embedded/App Bridge expectations) ---"

block = (
    "\n" + marker + "\n"
    "app.get(\"/api/auth\", (req, res) => {\n"
    "  // Alias used by Shopify embedded flows; redirect into our install route.\n"
    "  const shop = String(req.query.shop || \"\");\n"
    "  const qs = shop ? `?shop=${encodeURIComponent(shop)}` : \"\";\n"
    "  return res.redirect(302, `/shopify/install${qs}`);\n"
    "});\n\n"
    "app.get(\"/api/auth/callback\", (req, res) => {\n"
    "  // Preserve Shopify callback params exactly.\n"
    "  const i = (req.originalUrl || \"\").indexOf(\"?\");\n"
    "  const qs = i >= 0 ? (req.originalUrl || \"\").slice(i) : \"\";\n"
    "  return res.redirect(302, `/shopify/callback${qs}`);\n"
    "});\n"
)

if marker in s:
    changed.append("auth alias block already present (no duplicate)")
else:
    # Insert before the Shopify routes block (app.get("/shopify/install"...))
    m = re.search(r'\napp\.get\(\"/shopify/install\"\s*,', s)
    if not m:
        print("ERROR: Could not find app.get(\"/shopify/install\"...) in web/src/index.js", file=sys.stderr)
        sys.exit(2)

    insert_at = m.start()
    s = s[:insert_at] + block + s[insert_at:]
    changed.append("inserted /api/auth + /api/auth/callback aliases")

# -------------------------------------------------------------------
# Write back
# -------------------------------------------------------------------
path.write_text(s, encoding="utf-8")

print("Patch complete. Changes:")
for c in changed:
    print(" -", c)
PY

echo
echo "Diff vs backup:"
git --no-pager diff -- "$FILE" || true

echo
echo "If diff looks good, run:"
echo "  git add -A"
echo "  git commit -m \"Add /api/auth aliases; fix embedded-check bearer detection\""
echo "  git push"

#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "ERROR: $FILE not found" >&2; exit 2; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak_${TS}" >/dev/null

python3 - <<'PY'
from pathlib import Path
import re, sys

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

marker = "// --- ABANDO_VERSION_DYNAMIC_V1 ---"

# Replace the existing /api/version handler (keep it simple + idempotent)
pat = re.compile(r'app\.get\("/api/version",\s*\([^)]*\)\s*=>\s*\{.*?\}\);\s*', re.S)

block = (
  f'{marker}\n'
  'app.get("/api/version", (_req, res) => {\n'
  '  const git = process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || "unknown";\n'
  '  const built = process.env.BUILT_AT_UTC || new Date().toISOString();\n'
  '  res.json({ ok: true, service: "cart-agent", git, built_at_utc: built });\n'
  '});\n'
)

if pat.search(s):
    s2 = pat.sub(block, s, count=1)
else:
    # If handler not found, insert near top after middleware setup (best-effort)
    ins = s.find("app.use(express.json());")
    if ins == -1:
        print("ERROR: could not locate insertion point for /api/version", file=sys.stderr)
        sys.exit(2)
    ins_end = s.find("\n", ins) + 1
    s2 = s[:ins_end] + "\n" + block + "\n" + s[ins_end:]

p.write_text(s2, encoding="utf-8")
print("OK: patched /api/version to be dynamic")
PY

echo
echo "Diff:"
git --no-pager diff -- "$FILE" || true
echo
echo "Next:"
echo "  git add -A"
echo "  git commit -m \"Make /api/version dynamic (Render commit/env)\""
echo "  git push origin main"

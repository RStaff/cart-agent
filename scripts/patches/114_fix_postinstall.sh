#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
PKG="$ROOT/package.json"

if [[ ! -f "$PKG" ]]; then
  echo "ERROR: package.json not found at: $PKG"
  exit 2
fi

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$PKG" "${PKG}.bak_${TS}" >/dev/null

python3 - <<'PY'
import json
from pathlib import Path

p = Path("package.json")
data = json.loads(p.read_text(encoding="utf-8"))

scripts = data.setdefault("scripts", {})

# Render flow:
# - root runs: npm ci
# - then postinstall runs
# We want:
# - install Next app deps once (only if dir exists)
# - generate prisma client for the Express server (web/)
desired = (
  '[ -d "abando-frontend" ] && (cd abando-frontend && npm install --package-lock=false --no-audit --no-fund) || '
  'echo "WARN: abando-frontend directory not found; skipping its install"\n'
  'npm --prefix web run prisma:generate'
)

scripts["postinstall"] = desired
p.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print("OK: updated scripts.postinstall")
PY

echo
echo "Postinstall is now:"
node -p "require('./package.json').scripts.postinstall"

echo
echo "Sanity check: show expected dirs:"
ls -la | sed -n '1,120p'
echo
echo "If abando-frontend is missing, you'll see a WARN at install time (and should fix the repo contents)."
echo
echo "Diff:"
git --no-pager diff -- package.json || true

echo
echo "Local test:"
echo "  npm ci"
echo "  npm run postinstall"

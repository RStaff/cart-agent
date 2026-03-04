#!/usr/bin/env bash
set -euo pipefail

PKG="package.json"
test -f "$PKG" || { echo "ERROR: $PKG not found (run from repo root)"; exit 2; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$PKG" "${PKG}.bak_${TS}" >/dev/null

python3 - <<'PY'
import json
from pathlib import Path

p = Path("package.json")
data = json.loads(p.read_text(encoding="utf-8"))
scripts = data.setdefault("scripts", {})

# Render does:
#   npm ci
#   npm run postinstall
#
# Goals:
# - If abando-frontend exists: install deps deterministically when possible
# - Ensure Prisma Client is generated for web/ (where the crash occurs)
# - Prefer web's prisma:generate if it exists; fallback to npx prisma generate
#
# IMPORTANT: Use a single bash -lc string (Render-friendly). No newlines.
scripts["postinstall"] = (
  "bash -lc 'set -euo pipefail; "
  "echo \"[postinstall] start\"; "
  ""
  "# --- abando-frontend deps (optional) --- "
  "if [ -d abando-frontend ]; then "
  "  echo \"[postinstall] abando-frontend detected\"; "
  "  if [ -f abando-frontend/package-lock.json ]; then "
  "    echo \"[postinstall] npm ci (abando-frontend)\"; "
  "    (cd abando-frontend && npm ci --no-audit --no-fund); "
  "  else "
  "    echo \"[postinstall] npm install (abando-frontend; no lockfile)\"; "
  "    (cd abando-frontend && npm install --no-audit --no-fund --package-lock=false); "
  "  fi; "
  "else "
  "  echo \"[postinstall] WARN: abando-frontend not found; skipping\"; "
  "fi; "
  ""
  "# --- prisma generate for web/ --- "
  "if [ ! -d web ]; then echo \"[postinstall] ERROR: web/ missing\"; exit 2; fi; "
  ""
  "# pick schema path (prefer web/prisma/schema.prisma) "
  "SCHEMA=\"\"; "
  "if [ -f web/prisma/schema.prisma ]; then SCHEMA=\"prisma/schema.prisma\"; fi; "
  "if [ -z \"$SCHEMA\" ] && [ -f prisma/schema.prisma ]; then SCHEMA=\"../prisma/schema.prisma\"; fi; "
  "if [ -z \"$SCHEMA\" ]; then "
  "  echo \"[postinstall] ERROR: could not find prisma/schema.prisma (checked web/prisma and repo prisma/)\"; "
  "  ls -la web || true; "
  "  ls -la web/prisma || true; "
  "  ls -la prisma || true; "
  "  exit 2; "
  "fi; "
  "echo \"[postinstall] prisma schema: $SCHEMA\"; "
  ""
  "# If web defines prisma:generate, use it; else fallback to npx prisma generate "
  "HAS_WEB_SCRIPT=0; "
  "node -e \""
  "const fs=require('fs');"
  "try{"
  " const pkg=JSON.parse(fs.readFileSync('web/package.json','utf8'));"
  " const s=pkg.scripts||{};"
  " process.exit(s['prisma:generate']?0:1);"
  "}catch(e){process.exit(1)}"
  "\" && HAS_WEB_SCRIPT=1 || true; "
  ""
  "if [ \"$HAS_WEB_SCRIPT\" = \"1\" ]; then "
  "  echo \"[postinstall] running: npm --prefix web run prisma:generate\"; "
  "  npm --prefix web run prisma:generate; "
  "else "
  "  echo \"[postinstall] WARN: web prisma:generate script missing; using npx prisma generate\"; "
  "  (cd web && npx --yes prisma generate --schema=\"$SCHEMA\"); "
  "fi; "
  ""
  "echo \"[postinstall] done\"'"
)

p.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print("OK: updated scripts.postinstall")
PY

echo
echo "Postinstall is now:"
node -p "require('./package.json').scripts.postinstall"

echo
echo "Diff:"
git --no-pager diff -- package.json || true

echo
echo "Local smoke test:"
echo "  npm ci"
echo "  npm run postinstall"

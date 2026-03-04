#!/usr/bin/env bash
set -euo pipefail

FILE="package.json"
test -f "$FILE" || { echo "ERROR: $FILE not found" >&2; exit 2; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak_${TS}" >/dev/null
echo "backup: ${FILE}.bak_${TS}"

python3 - <<'PY'
import json
from pathlib import Path

p = Path("package.json")
pkg = json.loads(p.read_text(encoding="utf-8"))

scripts = pkg.setdefault("scripts", {})
post = scripts.get("postinstall", "")

need_web_generate = "npm --prefix web run prisma:generate"
need_frontend_install = "cd abando-frontend && npm install --package-lock=false"

parts = [x.strip() for x in post.split("&&") if x.strip()] if post else []

# Ensure abando-frontend install stays (if you want it)
if need_frontend_install not in parts:
    parts.append(need_frontend_install)

# Ensure prisma generate runs for web
if need_web_generate not in parts:
    parts.append(need_web_generate)

scripts["postinstall"] = " && ".join(parts)

p.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")
print("OK: ensured postinstall runs web prisma:generate")
PY

echo
echo "Diff:"
git --no-pager diff -- "$FILE" || true

echo
echo "Next:"
echo "  git add package.json"
echo "  git commit -m \"Fix Render boot: run prisma generate in postinstall\""
echo "  git push origin main"

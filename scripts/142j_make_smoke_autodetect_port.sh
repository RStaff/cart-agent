#!/usr/bin/env bash
set -euo pipefail

FILE="scripts/142f_smoke_marketing_routes.sh"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

ts="$(date +%s)"
cp "$FILE" "$FILE.bak_${ts}"

python3 - <<'PY'
from pathlib import Path
p = Path("scripts/142f_smoke_marketing_routes.sh")
s = p.read_text()

# Replace BASE line with autodetect logic (only once)
old = 'BASE="${1:-http://localhost:3000}"'
if old not in s:
    raise SystemExit("❌ Could not find BASE line to patch.")

new = r'''BASE="${1:-}"

if [ -z "$BASE" ]; then
  # Autodetect common dev ports
  if curl -sS -I "http://localhost:3000" >/dev/null 2>&1; then
    BASE="http://localhost:3000"
  elif curl -sS -I "http://localhost:3001" >/dev/null 2>&1; then
    BASE="http://localhost:3001"
  else
    BASE="http://localhost:3000"
  fi
fi'''
p.write_text(s.replace(old, new, 1))
print("✅ Patched smoke script to autodetect port (3000 -> 3001 fallback).")
PY

echo "✅ Backup: $FILE.bak_${ts}"
echo "DONE ✅"

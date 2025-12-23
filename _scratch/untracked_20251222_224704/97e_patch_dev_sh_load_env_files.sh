#!/usr/bin/env bash
set -euo pipefail

FILE="scripts/dev.sh"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_$stamp"
echo "✅ Backup: $FILE.bak_$stamp"

# If already patched, do nothing
if grep -q "ABANDO_ENV_AUTOLOAD_BEGIN" "$FILE"; then
  echo "ℹ️ dev.sh already patched for env autoload."
  exit 0
fi

python3 - <<'PY'
import re, pathlib
p = pathlib.Path("scripts/dev.sh")
s = p.read_text()

# Insert after first line (shebang) OR at top if no shebang
autoload = r'''
# === ABANDO_ENV_AUTOLOAD_BEGIN ===
# Export variables from .env and web/.env into process env for child processes.
# This avoids "defined in file but not in process.env" issues (e.g., Shopify HMAC secret).
set -a
[ -f ".env" ] && . ".env"
[ -f "web/.env" ] && . "web/.env"
set +a
# === ABANDO_ENV_AUTOLOAD_END ===

'''

lines = s.splitlines(True)
if lines and lines[0].startswith("#!"):
    out = lines[0] + autoload + "".join(lines[1:])
else:
    out = autoload + s

p.write_text(out)
print("✅ Patched scripts/dev.sh to autoload .env + web/.env")
PY

echo "🔍 Sanity:"
bash -n "$FILE"
echo "✅ bash syntax OK"
grep -n "ABANDO_ENV_AUTOLOAD_BEGIN" -n "$FILE" || true

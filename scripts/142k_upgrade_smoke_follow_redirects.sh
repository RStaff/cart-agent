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

# Replace the check() function with a stricter version
import re

pattern = r"check\(\)\s*\{\s*local path=\"\$1\"[\s\S]*?\n\}"
m = re.search(pattern, s)
if not m:
    raise SystemExit("❌ Could not find check() function to patch.")

new_check = r'''check() {
  local path="$1"
  echo
  echo "GET $path"

  # Follow redirects, fail on 4xx/5xx, and show final effective URL
  curl -sS -L --fail-with-body -o /dev/null \
    -w '  status=%{http_code}  final_url=%{url_effective}\n' \
    "$BASE$path" || {
      echo "❌ Request failed: $BASE$path"
      exit 1
    }

  # Also show the first few response headers (from the final response)
  curl -sS -L -I "$BASE$path" | sed -n '1,10p'
}'''

s2 = re.sub(pattern, new_check, s, count=1)
p.write_text(s2)
print("✅ Upgraded smoke test: follow redirects + fail on non-2xx.")
PY

echo "✅ Backup: $FILE.bak_${ts}"
echo "DONE ✅"

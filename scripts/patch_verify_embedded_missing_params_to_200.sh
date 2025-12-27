#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/app/api/shopify/verify-embedded/route.ts"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - "$FILE" <<'PY'
import sys
from pathlib import Path

p = Path(sys.argv[1])
s = p.read_text()

needle = "{ ok: false, error: 'Missing required Shopify parameters.' },\n\t\t{ status: 400 }"
if needle not in s:
    # fallback: more flexible replace
    s2 = s.replace("{ ok: false, error: 'Missing required Shopify parameters.' },", "{ ok: false, error: 'Missing required Shopify parameters.' },") \
          .replace("{ status: 400 }", "{ status: 200 }", 1)
    if s2 == s:
        raise SystemExit("❌ Patch failed: couldn't find the missing-params status block.")
    s = s2
else:
    s = s.replace("{ status: 400 }", "{ status: 200 }", 1)

p.write_text(s)
print("✅ Patched missing-params to status 200.")
PY

echo
git diff -- "$FILE" | sed -n '1,120p'

#!/usr/bin/env bash
set -euo pipefail

FILE="$(git ls-files | grep -E 'abando-frontend/app/api/shopify/verify-embedded/route\.ts$' | head -n 1 || true)"
if [[ -z "${FILE}" ]]; then
  FILE="$(git ls-files | grep -E 'app/api/shopify/verify-embedded/route\.ts$' | head -n 1 || true)"
fi

if [[ -z "${FILE}" ]]; then
  echo "❌ Could not find verify-embedded route.ts"
  echo "Try: git ls-files | grep -i verify-embedded"
  exit 1
fi

echo "✅ Found: $FILE"
cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - "$FILE" << 'PY'
import re, sys, pathlib

path = pathlib.Path(sys.argv[1])
s = path.read_text()

# Change ONLY the missing-params branch to return HTTP 200 with ok:false
# while leaving other errors (like missing secret) as 500, etc.
s2 = re.sub(
  r'(Missing required Shopify parameters\.)"\s*\}\s*,\s*\{\s*status:\s*400\s*\}\s*\)',
  r'\1" }, { status: 200 })',
  s
)

if s2 == s:
  print("⚠️ No status:400 match found for the missing-params response.")
  print("Open the file and we’ll patch the exact return statement.")
else:
  path.write_text(s2)
  print("✅ Patched: missing-params now returns status 200.")
PY

echo
echo "Next:"
echo "  git diff -- \"$FILE\""
echo "  git add \"$FILE\""
echo "  git commit -m \"api: return 200 ok:false when verify-embedded missing params\""
echo "  git push"

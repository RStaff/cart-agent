#!/usr/bin/env bash
set -euo pipefail

FILE="shopify.app.toml"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}"

echo "== Before =="
grep -nE '^application_url\s*=' "$FILE" || true
echo

# Force application_url to be the domain root (no path)
perl -i -pe 's%^application_url\s*=\s*".*"%application_url = "https://www.abando.ai"% if $. == $.;' "$FILE"

# Safer: replace any application_url line regardless of position
perl -i -pe 's%^application_url\s*=\s*".*"%application_url = "https://www.abando.ai"%' "$FILE"

echo "== After =="
grep -nE '^application_url\s*=' "$FILE" || true

echo
echo "✅ Updated application_url to https://www.abando.ai"
echo "🧾 Backup: ${FILE}.bak.${TS}"

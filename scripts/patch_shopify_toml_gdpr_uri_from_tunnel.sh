#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -f "$TOML" || { echo "❌ Missing $TOML"; exit 1; }

# Try to discover the current trycloudflare URL from common places:
#  - recent terminal scrollback isn’t accessible, but we can scan files/logs in repo
#  - many people log it into scripts or notes; we’ll search the repo for the newest one
FOUND="$(rg -n 'https://[a-z0-9-]+\.trycloudflare\.com' -S . | head -n 1 | sed -E 's/.*(https:\/\/[a-z0-9-]+\.trycloudflare\.com).*/\1/')"

if [ -z "${FOUND:-}" ]; then
  echo "⚠️ Could not auto-detect current trycloudflare URL from repo files."
  echo "Paste your current trycloudflare base URL (example: https://xxxxx.trycloudflare.com) and press Enter:"
  read -r FOUND
fi

# Normalize: ensure it is just the base
FOUND="${FOUND%/}"
GDPR="${FOUND}/api/webhooks/gdpr"

echo "🔧 Setting GDPR uri to: $GDPR"

TS="$(date +%s)"
cp "$TOML" "$TOML.bak_$TS"
echo "📦 Backup: $TOML.bak_$TS"

# Replace ONLY the GDPR uri line
# matches: uri = "https://....../api/webhooks/gdpr"
python3 - <<PY
import re, pathlib, sys
p = pathlib.Path("$TOML")
s = p.read_text()
gdpr = "$GDPR"
pat = r'(uri\\s*=\\s*")https://[^"]+/api/webhooks/gdpr(")'
if not re.search(pat, s):
    print("❌ Could not find existing GDPR uri line to replace in shopify.app.toml")
    sys.exit(2)
s2 = re.sub(pat, r'\\1' + gdpr + r'\\2', s, count=1)
p.write_text(s2)
print("✅ Updated shopify.app.toml GDPR uri")
PY

echo
echo "🔎 Result:"
rg -n 'uri\s*=\s*".*/api/webhooks/gdpr"' "$TOML" || true

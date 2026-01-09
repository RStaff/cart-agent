#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -f "$TOML" || { echo "❌ Missing $TOML"; exit 1; }

echo "Paste your CURRENT tunnel base URL (example: https://xxxxx.trycloudflare.com)"
echo "You have 60 seconds..."
BASE=""
if ! read -r -t 60 BASE; then
  echo "❌ Timed out waiting for input."
  exit 2
fi

BASE="${BASE%%[[:space:]]*}"
BASE="${BASE%/}"

if [[ ! "$BASE" =~ ^https://[a-z0-9-]+\.trycloudflare\.com$ ]]; then
  echo "❌ Invalid tunnel base URL: '$BASE'"
  exit 3
fi

GDPR="${BASE}/api/webhooks/gdpr"

TS="$(date +%s)"
cp "$TOML" "$TOML.bak_$TS"
echo "📦 Backup: $TOML.bak_$TS"
echo "🔧 Setting application_url = $BASE"
echo "🔧 Setting GDPR uri        = $GDPR"
echo "🔧 Rewriting redirect_urls that point to *.trycloudflare.com -> this base"

python3 - <<PY
import re, pathlib
p = pathlib.Path("$TOML")
s = p.read_text()
base = "$BASE"
gdpr = "$GDPR"

s = re.sub(r'(^\s*application_url\s*=\s*")https://[^"]+(")', r'\\1' + base + r'\\2', s, flags=re.M)
s = re.sub(r'(^\s*uri\s*=\s*")https://[^"]+/api/webhooks/gdpr(")', r'\\1' + gdpr + r'\\2', s, flags=re.M)

def repl(m):
    url = m.group(0)
    path = re.sub(r'^"https://[^"]+\.trycloudflare\.com', '', url[:-1])
    return '"' + base + path + '"'
s = re.sub(r'"https://[^"]+\.trycloudflare\.com[^"]*"', repl, s)

p.write_text(s)
print("✅ Updated shopify.app.toml")
PY

echo
echo "🔎 Key lines now:"
rg -n 'application_url\s*=|redirect_urls|/api/webhooks/gdpr' "$TOML" || true

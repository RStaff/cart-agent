#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -f "$TOML" || { echo "❌ Missing $TOML"; exit 1; }

echo "Paste your CURRENT tunnel base URL (example: https://xxxxx.trycloudflare.com)"
read -r BASE
BASE="${BASE%/}"

if [[ ! "$BASE" =~ ^https://[a-z0-9-]+\.trycloudflare\.com$ ]]; then
  echo "❌ Invalid tunnel base URL: '$BASE'"
  exit 2
fi

TS="$(date +%s)"
cp "$TOML" "$TOML.bak_$TS"
echo "📦 Backup: $TOML.bak_$TS"

python3 - <<PY
import re, pathlib
p = pathlib.Path("$TOML")
s = p.read_text()
base = "$BASE"

# application_url -> base
s = re.sub(r'(^\s*application_url\s*=\s*")https://[^"]+(")', r'\\1' + base + r'\\2', s, flags=re.M)

# Force GDPR webhook uri to RELATIVE /api/webhooks/gdpr
s = re.sub(r'(^\s*uri\s*=\s*")([^"]*gdpr[^"]*)(")', r'\\1/api/webhooks/gdpr\\3', s, flags=re.M)

# redirect_urls: rewrite only entries using trycloudflare.com (keep paths)
def repl(m):
    url = m.group(0)  # includes quotes
    path = re.sub(r'^"https://[^"]+\.trycloudflare\.com', '', url[:-1])
    return '"' + base + path + '"'

s = re.sub(r'"https://[^"]+\.trycloudflare\.com[^"]*"', repl, s)

p.write_text(s)
print("✅ Patched shopify.app.toml")
PY

echo
echo "🔎 Key lines now:"
rg -n 'application_url\s*=|redirect_urls|^\s*uri\s*=' "$TOML" || true

#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -f "$TOML" || { echo "❌ Missing $TOML"; exit 1; }

# Extract current GDPR uri from TOML (no line numbers)
GDPR="$(rg -No '^\s*uri\s*=\s*"(https://[^"]+/api/webhooks/gdpr)"' "$TOML" --replace '$1' | head -n 1)"
test -n "${GDPR:-}" || { echo "❌ Could not find a GDPR uri in $TOML"; exit 2; }

BASE="${GDPR%/api/webhooks/gdpr}"

TS="$(date +%s)"
cp "$TOML" "$TOML.bak_$TS"
echo "📦 Backup: $TOML.bak_$TS"
echo "🔧 Using BASE from existing GDPR uri:"
echo "   BASE = $BASE"
echo "   GDPR = $GDPR"

python3 - <<PY
import re, pathlib
p = pathlib.Path("$TOML")
s = p.read_text()
base = "$BASE"
gdpr = "$GDPR"

# application_url -> base
s = re.sub(r'(^\s*application_url\s*=\s*")https://[^"]+(")', r'\\1' + base + r'\\2', s, flags=re.M)

# any webhook uri line ending with /api/webhooks/gdpr -> gdpr
s = re.sub(r'(^\s*uri\s*=\s*")https://[^"]+/api/webhooks/gdpr(")', r'\\1' + gdpr + r'\\2', s, flags=re.M)

# redirect_urls: rewrite only entries using trycloudflare.com (keep paths)
def repl(m):
    url = m.group(0)  # includes quotes
    path = re.sub(r'^"https://[^"]+\.trycloudflare\.com', '', url[:-1])  # remove base, drop trailing quote
    return '"' + base + path + '"'
s = re.sub(r'"https://[^"]+\.trycloudflare\.com[^"]*"', repl, s)

p.write_text(s)
print("✅ Normalized shopify.app.toml to BASE derived from current GDPR uri")
PY

echo
echo "🔎 Key lines now:"
rg -n 'application_url\s*=|redirect_urls|/api/webhooks/gdpr' "$TOML" || true

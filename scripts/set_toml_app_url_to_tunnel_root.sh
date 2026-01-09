#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -f "$TOML" || { echo "❌ $TOML not found"; exit 1; }

BASE="${BASE:-}"
test -n "$BASE" || { echo '❌ Provide BASE like: BASE="https://xxxx.trycloudflare.com" bash scripts/set_toml_app_url_to_tunnel_root.sh'; exit 2; }

# Normalize: strip trailing slash, and strip /embedded if user included it
BASE="${BASE%/}"
BASE="${BASE%/embedded}"

cp "$TOML" "$TOML.bak_$(date +%s)"
echo "📦 Backup: $TOML.bak_$(date +%s)"
echo "🔧 Setting application_url -> $BASE"
echo "🔧 Rewriting redirect_urls that point to *.trycloudflare.com -> $BASE (keep paths)"

python3 - <<PY
import re
from pathlib import Path

p = Path("$TOML")
s = p.read_text()
base = "$BASE"

# application_url
s = re.sub(r'(^\\s*application_url\\s*=\\s*")[^"]+(")', r'\\1' + base + r'\\2', s, flags=re.M)

# redirect_urls: rewrite any trycloudflare urls to this base (keep path)
def repl(m):
    url = m.group(0)  # includes quotes
    # remove scheme+host only, keep path part
    path = re.sub(r'^"https://[^"]+\\.trycloudflare\\.com', '', url[:-1])
    return '"' + base + path + '"'

s = re.sub(r'"https://[^"]+\\.trycloudflare\\.com[^"]*"', repl, s)

p.write_text(s)
print("✅ Updated application_url + redirect_urls")
PY

echo
echo "🔎 Key lines now:"
rg -n '^application_url\\s*=|redirect_urls' "$TOML" || true

#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -f "$TOML" || { echo "❌ Missing $TOML"; exit 1; }

echo "Paste your CURRENT tunnel base URL (example: https://xxxxx.trycloudflare.com)"
echo "Tip: get it from the terminal running: shopify app dev"
read -r BASE

BASE="${BASE%/}"
test -n "$BASE" || { echo "❌ Empty URL"; exit 2; }

# very light validation
if ! echo "$BASE" | rg -q '^https://[a-z0-9-]+\.trycloudflare\.com$'; then
  echo "❌ That doesn't look like a trycloudflare base URL: $BASE"
  exit 3
fi

GDPR="$BASE/api/webhooks/gdpr"

TS="$(date +%s)"
cp "$TOML" "$TOML.bak_$TS"
echo "📦 Backup: $TOML.bak_$TS"
echo "🔧 Setting application_url = $BASE"
echo "🔧 Setting GDPR webhook uri = $GDPR"
echo "🔧 Rewriting any redirect_urls that point to *.trycloudflare.com to this base"

python3 - <<PY
import re, pathlib, sys
p = pathlib.Path("$TOML")
s = p.read_text()

base = "$BASE"
gdpr = "$GDPR"

# 1) application_url
s = re.sub(r'(^\s*application_url\s*=\s*")https://[^"]+(")', r'\1' + base + r'\2', s, flags=re.M)

# 2) any GDPR webhook uri line that ends with /api/webhooks/gdpr
s = re.sub(r'(^\s*uri\s*=\s*")https://[^"]+/api/webhooks/gdpr(")', r'\1' + gdpr + r'\2', s, flags=re.M)

# 3) redirect_urls entries: rewrite only those using trycloudflare.com (keep paths)
def repl_redirect(m):
    url = m.group(0)
    # url like: "https://old.trycloudflare.com/auth/callback"
    path = re.sub(r'^"https://[^"]+\.trycloudflare\.com', '', url[:-1])  # strip trailing quote too
    return '"' + base + path + '"'
s = re.sub(r'"https://[^"]+\.trycloudflare\.com[^"]*"', repl_redirect, s)

p.write_text(s)
print("✅ Updated shopify.app.toml")
PY

echo
echo "🔎 Current key lines:"
rg -n 'application_url\s*=|/api/webhooks/gdpr|redirect_urls' "$TOML" || true

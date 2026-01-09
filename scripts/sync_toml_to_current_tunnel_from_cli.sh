#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -f "$TOML" || { echo "❌ Missing $TOML"; exit 1; }

# Grab the most recent trycloudflare URL printed by shopify app dev
FOUND="$(
  (ps aux | rg -n "shopify app dev" >/dev/null 2>&1 && true) || true
  # Read from the current terminal scrollback isn't possible, so we rely on the file contents:
  # If the CLI already wrote application_url, we can just keep it.
  rg -No '^\s*application_url\s*=\s*"(https://[a-z0-9-]+\.trycloudflare\.com)"' "$TOML" --replace '$1' | head -n 1
)"

# If toml doesn't already have the new URL, user should paste it once.
if [[ -z "${FOUND:-}" || "$FOUND" == *"gray-fitting-mats-strictly"* ]]; then
  echo "Paste the CURRENT tunnel base URL shown in your dev output:"
  echo "Example: https://logged-hong-story-bookmarks.trycloudflare.com"
  read -r FOUND
fi

FOUND="${FOUND%/}"

if [[ ! "$FOUND" =~ ^https://[a-z0-9-]+\.trycloudflare\.com$ ]]; then
  echo "❌ Invalid tunnel base URL: '$FOUND'"
  exit 2
fi

TS="$(date +%s)"
cp "$TOML" "$TOML.bak_$TS"
echo "📦 Backup: $TOML.bak_$TS"
echo "🔧 Setting application_url -> $FOUND"
echo "🔧 Rewriting redirect_urls that point to *.trycloudflare.com -> this base"
echo "🔧 Leaving webhook uris as relative paths"

python3 - <<PY
import re, pathlib
p = pathlib.Path("$TOML")
s = p.read_text()
base = "$FOUND"

# application_url
s = re.sub(r'(^\s*application_url\s*=\s*")https://[^"]+(")', r'\\1' + base + r'\\2', s, flags=re.M)

# redirect_urls entries: rewrite only those using trycloudflare.com (keep paths)
def repl(m):
    url = m.group(0)  # includes quotes
    path = re.sub(r'^"https://[^"]+\.trycloudflare\.com', '', url[:-1])
    return '"' + base + path + '"'
s = re.sub(r'"https://[^"]+\.trycloudflare\.com[^"]*"', repl, s)

p.write_text(s)
print("✅ Updated shopify.app.toml application_url + redirect_urls")
PY

echo
echo "🔎 Key lines now:"
rg -n 'application_url\s*=|redirect_urls|^\s*uri\s*=' "$TOML" || true

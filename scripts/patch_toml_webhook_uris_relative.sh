#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -f "$TOML" || { echo "❌ Missing $TOML"; exit 1; }

TS="$(date +%s)"
cp "$TOML" "$TOML.bak_$TS"
echo "📦 Backup: $TOML.bak_$TS"

python3 - <<'PY'
import re, pathlib

p = pathlib.Path("shopify.app.toml")
s = p.read_text()

# Convert webhook uri lines from absolute -> relative, preserving the path.
# Example:
#   uri = "https://xxxx.trycloudflare.com/api/webhooks/gdpr"
# becomes
#   uri = "/api/webhooks/gdpr"
#
# Also handles other webhook paths like /api/webhooks or /webhooks/...
def repl(m):
    path = m.group(2)
    if not path.startswith("/"):
        path = "/" + path
    return f'{m.group(1)}{path}{m.group(3)}'

pat = r'(^\s*uri\s*=\s*")https://[^"]+(/[^"]+)(")'
s2 = re.sub(pat, repl, s, flags=re.M)

p.write_text(s2)
print("✅ Converted webhook URIs to relative paths where applicable.")
PY

echo
echo "🔎 Current webhook uri lines:"
rg -n '^\s*uri\s*=' "$TOML" || true

echo
echo "✅ Done."

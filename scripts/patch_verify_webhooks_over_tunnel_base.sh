#!/usr/bin/env bash
set -euo pipefail

FILE="scripts/verify_webhooks_over_tunnel.sh"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "📦 Backup: $FILE.bak_$(date +%s)"

python3 - <<'PY'
import re, pathlib
p = pathlib.Path("scripts/verify_webhooks_over_tunnel.sh")
s = p.read_text()

# Remove any hardcoded default BASE like abando.ai/embedded
# Replace with logic:
# - If BASE env var set, use it
# - Else read application_url from shopify.app.toml
new_base_block = r'''# BASE can be provided via env var:
#   BASE="https://xxxx.trycloudflare.com" bash scripts/verify_webhooks_over_tunnel.sh
# If not provided, we read application_url from shopify.app.toml
if [ -z "${BASE:-}" ]; then
  BASE="$(rg -n '^application_url\s*=' shopify.app.toml | head -n 1 | sed -E 's/.*"([^"]+)".*/\1/')"
fi
test -n "${BASE:-}" || { echo "❌ BASE not set and application_url not found in shopify.app.toml"; exit 1; }
'''

# Replace the first occurrence of a BASE assignment block with our new block.
# Covers common patterns: BASE=..., BASE="${BASE:-...}", etc.
s2 = re.sub(
    r'(?s)^.*?\n(?=echo\s+"🔗 Tunnel BASE:)',
    new_base_block + "\n",
    s,
    count=1
)

# If it didn't match (file structure different), just prepend the block.
if s2 == s:
    s2 = new_base_block + "\n\n" + s

p.write_text(s2)
print("✅ Patched verify_webhooks_over_tunnel.sh to use BASE env or shopify.app.toml application_url")
PY

echo "🔎 Confirm BASE logic:"
rg -n 'application_url|BASE=\$\(|BASE can be provided' "$FILE" || true

echo "✅ Done."

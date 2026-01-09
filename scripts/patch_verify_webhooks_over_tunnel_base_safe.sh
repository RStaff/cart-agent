#!/usr/bin/env bash
set -euo pipefail

FILE="scripts/verify_webhooks_over_tunnel.sh"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "📦 Backup: $FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path

file = Path("scripts/verify_webhooks_over_tunnel.sh")
s = file.read_text()

needle = 'echo "🔗 Tunnel BASE: $BASE"'
idx = s.find(needle)
if idx == -1:
    raise SystemExit('❌ Could not find: echo "🔗 Tunnel BASE: $BASE"')

# Find start of file up to the line BEFORE the echo
prefix = s[:idx]
suffix = s[idx:]

# Drop any existing BASE assignment lines in the prefix (simple line filter)
lines = prefix.splitlines(True)
filtered = []
for line in lines:
    # remove hardcoded BASE=... lines
    if line.strip().startswith("BASE="):
        continue
    # remove export BASE=... lines
    if line.strip().startswith("export BASE="):
        continue
    filtered.append(line)

base_block = """# BASE can be provided via env var:
#   BASE="https://xxxx.trycloudflare.com" bash scripts/verify_webhooks_over_tunnel.sh
# If not provided, read application_url from shopify.app.toml
if [ -z "${BASE:-}" ]; then
  BASE="$(rg -n '^application_url\\s*=' shopify.app.toml | head -n 1 | sed -E 's/.*"([^"]+)".*/\\1/')"
fi
test -n "${BASE:-}" || { echo "❌ BASE not set and application_url not found in shopify.app.toml"; exit 1; }

"""

out = "".join(filtered) + base_block + suffix
file.write_text(out)
print("✅ Patched verify_webhooks_over_tunnel.sh to honor BASE env var (or shopify.app.toml)")
PY

echo "🔎 Showing BASE lines now:"
rg -n '^BASE=|^export BASE=|application_url' "$FILE" || true
echo "✅ Done."

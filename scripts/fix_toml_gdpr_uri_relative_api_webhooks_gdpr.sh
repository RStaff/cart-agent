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

# Replace any uri line that references gdpr (absolute or relative) with the correct relative path
s2 = re.sub(r'(^\s*uri\s*=\s*")([^"]*gdpr[^"]*)(")', r'\1/api/webhooks/gdpr\3', s, flags=re.M)

p.write_text(s2)
print("✅ Set GDPR webhook uri to /api/webhooks/gdpr (relative)")
PY

echo
echo "🔎 Current uri lines:"
rg -n '^\s*uri\s*=' "$TOML" || true

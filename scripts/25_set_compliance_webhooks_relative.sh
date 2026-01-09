#!/usr/bin/env bash
set -euo pipefail

FILE="shopify.app.toml"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
BACKUP="${FILE}.bak.${TS}"
cp -a "$FILE" "$BACKUP"
echo "🧷 Backup: $BACKUP"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("shopify.app.toml")
s = p.read_text()

# If any compliance webhook uri is an absolute URL, force it to a relative path.
# We handle common patterns:
#  - /api/webhooks/gdpr
#  - /api/webhooks/privacy
#  - /api/webhooks/compliance
#
# If the file currently has only one subscription block, we keep it but normalize URI.
# If it has multiple subscription blocks, we normalize each uri line we find inside webhooks.subscriptions blocks.

lines = s.splitlines(True)
out = []
in_webhooks = False
in_sub = False

for line in lines:
    if re.match(r'^\s*\[webhooks\]\s*$', line):
        in_webhooks = True
        out.append(line)
        continue

    # leave webhooks section when a new top-level table begins (e.g. [access_scopes], [auth], etc.)
    if in_webhooks and re.match(r'^\s*\[([a-zA-Z0-9_.-]+)\]\s*$', line) and not re.match(r'^\s*\[webhooks\]\s*$', line):
        in_webhooks = False
        in_sub = False
        out.append(line)
        continue

    if in_webhooks and re.match(r'^\s*\[\[webhooks\.subscriptions\]\]\s*$', line):
        in_sub = True
        out.append(line)
        continue

    if in_webhooks and in_sub and re.match(r'^\s*uri\s*=\s*".*"\s*$', line):
        # Choose a stable default: gdpr endpoint.
        # (If your backend routes all compliance topics through one endpoint, this is correct.)
        out.append('  uri = "/api/webhooks/gdpr"\n')
        continue

    out.append(line)

new = ''.join(out)

# Safety check: must contain a relative compliance uri after rewrite
if '/api/webhooks/gdpr' not in new:
    raise SystemExit("❌ Rewrite failed: /api/webhooks/gdpr not present.")

p.write_text(new)
print("✅ Set ALL webhooks.subscriptions uris to /api/webhooks/gdpr (relative).")
PY

echo
echo "===== VERIFY ====="
rg -n "^\[webhooks\]|\[\[webhooks\.subscriptions\]\]|^\s*uri\s*=|compliance_topics" "$FILE" || true

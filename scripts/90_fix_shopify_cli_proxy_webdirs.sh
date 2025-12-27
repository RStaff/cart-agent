#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

FILE="shopify.app.toml"
test -f "$FILE" || { echo "❌ $FILE not found in repo root"; exit 1; }

echo "🔒 Backing up $FILE..."
cp "$FILE" "$FILE.bak_$(date +%Y%m%d_%H%M%S)"

# If web_directories exists, replace it. If not, add it near the top.
if grep -qE '^\s*web_directories\s*=' "$FILE"; then
  echo "🛠️ Updating existing web_directories → [\"web/\"]"
  perl -0777 -i -pe 's/^\s*web_directories\s*=\s*\[[^\]]*\]\s*/web_directories = ["web\/"]\n/m' "$FILE"
else
  echo "🛠️ Adding web_directories = [\"web/\"]"
  # Insert after "embedded = ..." if present, else append to end
  if grep -qE '^\s*embedded\s*=' "$FILE"; then
    perl -0777 -i -pe 's/(\nembedded\s*=\s*.*\n)/$1\nweb_directories = ["web\/"]\n/s' "$FILE"
  else
    printf '\nweb_directories = ["web/"]\n' >> "$FILE"
  fi
fi

echo "✅ Done. Current web_directories line:"
grep -nE '^\s*web_directories\s*=' "$FILE" || true

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
test -f "$ROOT/shopify.app.toml" || { echo "❌ Run from repo root (where shopify.app.toml lives)."; exit 1; }

ENV_FILE="$ROOT/.env"
mkdir -p "$ROOT/scripts"

# Try to extract the API secret from the Shopify app configuration.
# Shopify CLI typically stores it in .shopify/*.toml as "client_secret".
SECRET="$(grep -RhoE 'client_secret\s*=\s*"[A-Za-z0-9_]+"' "$ROOT/.shopify" 2>/dev/null \
  | head -n 1 \
  | sed -E 's/.*"([^"]+)".*/\1/' || true)"

if [[ -z "${SECRET:-}" ]]; then
  echo "❌ Could not locate client_secret in $ROOT/.shopify/"
  echo "   (It may not be stored locally.)"
  echo "   Quick fix: export it in the shell before running dev:"
  echo "     export SHOPIFY_API_SECRET='shpss_...'"
  exit 1
fi

touch "$ENV_FILE"
cp "$ENV_FILE" "$ENV_FILE.bak_$(date +%s)"

# Replace or append SHOPIFY_API_SECRET
if grep -qE '^\s*SHOPIFY_API_SECRET=' "$ENV_FILE"; then
  perl -0777 -i -pe 's/^\s*SHOPIFY_API_SECRET=.*$/SHOPIFY_API_SECRET="'"$SECRET"'"/m' "$ENV_FILE"
else
  echo "" >> "$ENV_FILE"
  echo "SHOPIFY_API_SECRET=\"$SECRET\"" >> "$ENV_FILE"
fi

# Confirm
if grep -qE '^\s*SHOPIFY_API_SECRET=".+?"\s*$' "$ENV_FILE"; then
  echo "✅ Wrote SHOPIFY_API_SECRET into $ENV_FILE"
  echo "🔍 Check (masked): $(grep -E '^\s*SHOPIFY_API_SECRET=' "$ENV_FILE" | sed -E 's/(SHOPIFY_API_SECRET=")(.{4}).*(\")/\1\2****\3/')"
else
  echo "❌ Failed to write SHOPIFY_API_SECRET into $ENV_FILE"
  exit 1
fi

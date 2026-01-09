#!/usr/bin/env bash
set -euo pipefail

toml="shopify.app.toml"
tmp="$(mktemp)"
bak="shopify.app.toml.bak.$(date +%s)"

cp "$toml" "$bak"

# Read application_url (required)
app_url="$(awk -F'= *' '/^application_url/ {gsub(/"/,"",$2); gsub(/ *$/,"",$2); print $2}' "$toml")"
if [ -z "${app_url:-}" ]; then
  echo "❌ application_url not found in $toml" >&2
  exit 1
fi

# Build the exact JSON array with commas
redirects_json='["'"$app_url"'/auth/callback","'"$app_url"'/auth/shopify/callback","'"$app_url"'/api/auth/callback"]'

# Rewrite: drop any existing redirect_urls lines anywhere, then
# insert a single canonical redirect_urls line immediately after application_url.
awk -v r="$redirects_json" '
  BEGIN{printed=0}
  /^[[:space:]]*redirect_urls[[:space:]]*=/ { next }     # drop all existing
  { print }
  /^application_url/ && !printed {
    print "redirect_urls = " r
    printed=1
  }
' "$toml" > "$tmp"

mv "$tmp" "$toml"

echo "✅ Normalized [auth].redirect_urls to:"
# Pretty print just the [auth] block
awk '
  show && /^\[/ { exit }
  show { print "   " $0 }
  /^\[auth\][[:space:]]*$/ { show=1; print "[auth]"; next }
' "$toml"

# Sanity: ensure exactly one redirect_urls appears
count_all="$(grep -c '^[[:space:]]*redirect_urls[[:space:]]*=' "$toml" || true)"
if [ "$count_all" != "1" ]; then
  echo "⚠️  Expected exactly one redirect_urls, found: $count_all" >&2
  exit 2
fi

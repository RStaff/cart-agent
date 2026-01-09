#!/usr/bin/env bash
set -euo pipefail

toml="shopify.app.toml"
cp "$toml" "$toml.bak.$(date +%s)"

APP_URL=$(awk -F'= *' '/^application_url[[:space:]]*=/{gsub(/"/,"",$2); gsub(/[[:space:]]+$/,"",$2); print $2}' "$toml")
if [ -z "${APP_URL:-}" ]; then
  echo "❌ application_url not found in $toml"
  exit 1
fi

REDIRECTS="[\"$APP_URL/auth/callback\",\"$APP_URL/auth/shopify/callback\",\"$APP_URL/api/auth/callback\"]"

# Keep the [auth] table, remove any existing redirect_urls within it, inject exactly one canonical line
awk -v rs="$REDIRECTS" '
  BEGIN{in_auth=0; inserted=0}
  /^\[auth\]$/      { print; in_auth=1; inserted=0; next }
  /^\[/ {
    if (in_auth && !inserted) { print "redirect_urls = " rs; inserted=1 }
    in_auth=0; print; next
  }
  {
    if (in_auth) {
      if ($0 ~ /^[[:space:]]*redirect_urls[[:space:]]*=/) next
    }
    print
  }
  END{
    if (in_auth && !inserted) print "redirect_urls = " rs
  }
' "$toml" > "$toml.tmp" && mv "$toml.tmp" "$toml"

echo "✔ auth.redirect_urls normalized to: $REDIRECTS"

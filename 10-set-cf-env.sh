#!/usr/bin/env bash
set -Eeuo pipefail

read -r -p "Cloudflare Zone domain (e.g. abando.ai): " AB_DOMAIN
read -r -p "Cloudflare API Token (paste, then Enter): " CF_API_TOKEN
read -r -p "Cloudflare ACCOUNT ID (leave blank to auto-resolve): " CF_ACCOUNT_ID
read -r -p "Cloudflare ZONE ID (leave blank to auto-resolve): " CF_ZONE_ID

# Trim whitespace
CF_API_TOKEN="$(printf %s "$CF_API_TOKEN" | tr -d '\r\n ')"
AB_DOMAIN="$(printf %s "$AB_DOMAIN" | tr -d '\r\n ')"

# Save to current shell
export AB_DOMAIN CF_API_TOKEN
[ -n "${CF_ACCOUNT_ID:-}" ] && export CF_ACCOUNT_ID
[ -n "${CF_ZONE_ID:-}" ] && export CF_ZONE_ID

# Persist to ~/.zshrc
{
  echo ""
  echo "# ===== Cloudflare creds ====="
  echo "export AB_DOMAIN=\"${AB_DOMAIN}\""
  echo "export CF_API_TOKEN=\"${CF_API_TOKEN}\""
  [ -n "${CF_ACCOUNT_ID:-}" ] && echo "export CF_ACCOUNT_ID=\"${CF_ACCOUNT_ID}\""
  [ -n "${CF_ZONE_ID:-}" ] && echo "export CF_ZONE_ID=\"${CF_ZONE_ID}\""
} >> "$HOME/.zshrc"

echo "✓ Saved to environment and appended to ~/.zshrc"

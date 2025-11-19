#!/usr/bin/env bash
set -euo pipefail

REQUIRED_VARS=(
  "SHOPIFY_API_KEY"
  "SHOPIFY_API_SECRET"
  "SHOPIFY_SCOPES"
  "SHOPIFY_APP_URL"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "DATABASE_URL"
  "SESSION_SECRET"
)

missing=0
echo "🔎 Checking required environment variables…"
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "   ❌ Missing: $var"
    missing=1
  else
    echo "   ✅ $var"
  fi
done

if [[ "$missing" -eq 1 ]]; then
  echo
  echo "🚫 One or more required env vars are missing."
  exit 1
else
  echo
  echo "🎉 All required env vars are present."
fi

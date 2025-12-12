#!/usr/bin/env bash
set -euo pipefail

echo "📦 Installing Shopify app + session storage deps into web workspace..."

cd web

# Core Shopify API + Express helper + SQLite session storage
npm install \
  @shopify/shopify-api \
  @shopify/shopify-app-express \
  @shopify/shopify-app-session-storage-sqlite

echo "✅ Shopify API, Express helper, and SQLite session storage installed."

#!/usr/bin/env bash
set -euo pipefail

echo "📦 Installing @shopify/shopify-api into web workspace..."

cd web
npm install @shopify/shopify-api

echo "✅ @shopify/shopify-api installed successfully."

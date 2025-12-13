#!/usr/bin/env bash
set -euo pipefail

echo "📦 Installing @shopify/shopify-app-express into web workspace..."

cd web
npm install @shopify/shopify-app-express

echo "✅ @shopify/shopify-app-express installed successfully."

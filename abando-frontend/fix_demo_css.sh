#!/usr/bin/env bash
set -euo pipefail

cd ~/projects/cart-agent/abando-frontend
echo "📁 Working dir: $(pwd)"

SRC_CSS="src/app/globals.css"
APP_CSS="app/globals.css"

if [ ! -f "$SRC_CSS" ]; then
  echo "❌ $SRC_CSS not found – aborting so we don't create an empty file."
  exit 1
fi

# Backup existing app globals (if any)
if [ -f "$APP_CSS" ]; then
  APP_BACKUP="app/globals.css.backup_$(date +%Y%m%d_%H%M%S)"
  cp "$APP_CSS" "$APP_BACKUP"
  echo "🛟 Backed up $APP_CSS -> $APP_BACKUP"
fi

# Copy Tailwind globals from src/ to app/
cp "$SRC_CSS" "$APP_CSS"
echo "✅ Copied $SRC_CSS -> $APP_CSS"

echo
echo "🏗  Running npm run build (production check)…"
npm run build
echo "✅ Build finished"

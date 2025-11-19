#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 VAR_NAME VAR_VALUE [environment]"
  echo "Example: $0 CART_AGENT_API_BASE https://api.abando.ai production"
  exit 1
fi

VAR_NAME="$1"
VAR_VALUE="$2"
ENVIRONMENT="${3:-production}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/abando-frontend"
ENV_FILE="$FRONTEND_DIR/.env.local"

echo "🔧 Setting $VAR_NAME for:"
echo "   • Local env file: $ENV_FILE"
echo "   • Vercel env:     $ENVIRONMENT"
echo

# --- 1) Update local .env.local ---

mkdir -p "$FRONTEND_DIR"

if [ -f "$ENV_FILE" ]; then
  if grep -q "^$VAR_NAME=" "$ENV_FILE"; then
    # Replace existing line
    sed -i '' "s|^$VAR_NAME=.*|$VAR_NAME=$VAR_VALUE|" "$ENV_FILE"
  else
    printf "%s=%s\n" "$VAR_NAME" "$VAR_VALUE" >> "$ENV_FILE"
  fi
else
  printf "%s=%s\n" "$VAR_NAME" "$VAR_VALUE" > "$ENV_FILE"
fi

echo "✅ Updated $ENV_FILE with:"
echo "   $VAR_NAME=$VAR_VALUE"
echo

# --- 2) Ensure Vercel has this variable (create if missing) ---

cd "$FRONTEND_DIR"

echo "🌐 Checking Vercel envs for $VAR_NAME ..."

# If this var exists in ANY environment, Vercel will reject re-adding it.
if vercel env ls 2>/dev/null | grep -E "^[[:space:]]*$VAR_NAME[[:space:]]" >/dev/null; then
  echo "ℹ️ $VAR_NAME already exists in Vercel (one or more environments)."
  echo "   CLI cannot update its value non-interactively."
  echo "   If you ever need to CHANGE it, use the Vercel dashboard"
  echo "   or 'vercel env rm $VAR_NAME' then re-run this script."
else
  echo "➕ Adding $VAR_NAME to Vercel ($ENVIRONMENT)..."
  if echo -n "$VAR_VALUE" | vercel env add "$VAR_NAME" "$ENVIRONMENT"; then
    echo "✅ Added $VAR_NAME to Vercel ($ENVIRONMENT)."
  else
    echo "❌ vercel env add failed. Check your Vercel project or login."
    exit 1
  fi
fi

echo
echo "🎯 Done (local + Vercel check complete)."

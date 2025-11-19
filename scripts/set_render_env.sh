#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 SERVICE_NAME VAR_NAME VAR_VALUE"
  echo "Example: $0 cart-agent-api CART_AGENT_API_BASE https://api.abando.ai"
  exit 1
fi

SERVICE_NAME="$1"
VAR_NAME="$2"
VAR_VALUE="$3"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/abando-frontend"
ENV_FILE="$FRONTEND_DIR/.env.local"

echo "🔧 Setting $VAR_NAME for:"
echo "   • Local env file: $ENV_FILE"
echo "   • Render service: $SERVICE_NAME (manual step)"
echo

# --- 1) Update local .env.local ---

mkdir -p "$FRONTEND_DIR"

if [ -f "$ENV_FILE" ]; then
  if grep -q "^$VAR_NAME=" "$ENV_FILE"; then
    sed -i '' "s|^$VAR_NAME=.*|$VAR_NAME=$VAR_VALUE|" "$ENV_FILE"
  else
    printf "%s=%s\n" "$VAR_NAME" "$VAR_VALUE" >> "$ENV_FILE"
  fi
else
  printf "%s=%s\n" "$VAR_NAME" "$VAR_VALUE" > "$ENV_FILE"
fi

echo "✅ Updated local $ENV_FILE with:"
echo "   $VAR_NAME=$VAR_VALUE"
echo

# --- 2) Manual Render step (no reliable CLI flag) ---

cat << MSG
🌐 Next, update this variable in Render:

  1. Open: https://dashboard.render.com
  2. Go to Projects → your '$SERVICE_NAME' service.
  3. Click **Environment** / **Environment Variables**.
  4. Add or edit this variable:

       $VAR_NAME=$VAR_VALUE

  5. Save & redeploy the service if Render prompts you.

⚠️ Note:
   The Render CLI's 'services update' command doesn't support a working
   '--env' flag in this environment, so env changes must be made via
   the dashboard for now.

🎯 Done locally. Just complete the dashboard step to finish syncing.
MSG

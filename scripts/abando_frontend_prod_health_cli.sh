#!/usr/bin/env bash
set -euo pipefail

# Abando frontend prod health checker
# Usage:
#   scripts/abando_frontend_prod_health_cli.sh
#   scripts/abando_frontend_prod_health_cli.sh "https://some-other-frontend"

# Default: your public frontend domain (change if needed)
DEFAULT_FRONTEND_URL="https://app.abando.ai"

# If you set ABANDO_FRONTEND_URL in the shell, it will override the default.
BASE_URL="${1:-${ABANDO_FRONTEND_URL:-$DEFAULT_FRONTEND_URL}}"
HEALTH_URL="${BASE_URL%/}/api/health"

echo "Checking frontend health at: ${HEALTH_URL}"
echo

curl -fsSL "${HEALTH_URL}" || {
  echo
  echo "❌ Frontend health check failed."
  exit 1
}

echo
echo "✅ Frontend health check request completed."

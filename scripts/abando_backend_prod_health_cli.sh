#!/usr/bin/env bash
set -euo pipefail

# Abando backend prod health checker
# Usage:
#   scripts/abando_backend_prod_health_cli.sh
#   scripts/abando_backend_prod_health_cli.sh "https://some-other-backend"

# Default: custom domain, can be overridden by ABANDO_BACKEND_URL or first arg
DEFAULT_BACKEND_URL="https://pay.abando.ai"

BASE_URL="${1:-${ABANDO_BACKEND_URL:-$DEFAULT_BACKEND_URL}}"
HEALTH_URL="${BASE_URL%/}/health"

echo "Checking backend health at: ${HEALTH_URL}"
echo

curl -fsSL "${HEALTH_URL}" || {
  echo
  echo "❌ Backend health check failed."
  exit 1
}

echo
echo "✅ Backend health check request completed."

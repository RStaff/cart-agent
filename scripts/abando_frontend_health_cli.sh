#!/usr/bin/env bash
set -euo pipefail

# Abando frontend health checker
# Usage:
#   scripts/abando_frontend_health_cli.sh
#   scripts/abando_frontend_health_cli.sh "https://some-other-url"

DEFAULT_URL="https://app.abando.ai"
BASE_URL="${1:-${ABANDO_FRONTEND_URL:-$DEFAULT_URL}}"
HEALTH_URL="${BASE_URL%/}/api/health"

echo "Checking frontend health at: ${HEALTH_URL}"
echo

curl -fsSL \
  -H "User-Agent: Mozilla/5.0 (AbandoHealthCheck/1.0; +https://abando.ai)" \
  "$HEALTH_URL"

echo
echo "✅ Health check request completed."

#!/usr/bin/env bash
set -euo pipefail

# Make sure this is your backend service ID
SERVICE_ID="${ABANDO_BACKEND_SERVICE:-srv-d47kiehr0fns73fh5vr0}"

echo "📜 Tailing logs for backend service: $SERVICE_ID"
render services logs "$SERVICE_ID" --tail=50

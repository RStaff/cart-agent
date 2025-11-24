#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo " Abando Phase 3 – Stack Smoke "
echo " (Backend ↔ Frontend Prod)    "
echo "=============================="
echo

# 1) Backend health (Render)
echo "1) Checking backend health..."
if scripts/backend_health_smoke.sh; then
  echo "✅ Backend health smoke: PASS"
else
  echo "❌ Backend health smoke: FAILED"
  echo "   Fix backend before continuing."
  exit 1
fi
echo

# 2) Frontend URL resolution
DEFAULT_FRONTEND_URL="https://app.abando.ai"
FRONTEND_URL="${ABANDO_FRONTEND_URL:-$DEFAULT_FRONTEND_URL}"
HEALTH_URL="${FRONTEND_URL%/}/api/health"

echo "2) Checking frontend prod health..."
echo "   Using FRONTEND_URL = ${FRONTEND_URL}"
echo "   Health endpoint     = ${HEALTH_URL}"
echo

if scripts/abando_frontend_health_cli.sh "${FRONTEND_URL}"; then
  echo "✅ Frontend health: PASS"
else
  echo "❌ Frontend health: FAILED"
  echo "   Investigate ${HEALTH_URL} manually."
  exit 1
fi
echo

echo "=============================="
echo " Phase 3 Stack Smoke:  PASS   "
echo " Backend + Frontend are OK.   "
echo "=============================="

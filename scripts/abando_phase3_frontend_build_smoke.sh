#!/usr/bin/env bash
set -euo pipefail

# Frontend build smoke for Abando
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/abando-frontend"
LOG_DIR="${ROOT_DIR}/logs"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${LOG_DIR}/frontend_build_${TIMESTAMP}.log"

mkdir -p "${LOG_DIR}"

echo "=============================="
echo " Abando – Frontend Build Smoke"
echo "=============================="
echo "→ Frontend dir: ${FRONTEND_DIR}"
echo "→ Log file:     ${LOG_FILE}"
echo

cd "${FRONTEND_DIR}"

echo "Running: npm run build"
echo "---------- npm run build (begin) ----------" | tee "${LOG_FILE}"
npm run build 2>&1 | tee -a "${LOG_FILE}"
echo "---------- npm run build (end) ------------" | tee -a "${LOG_FILE}"

echo
echo "✅ Frontend build finished. See log at:"
echo "   ${LOG_FILE}"

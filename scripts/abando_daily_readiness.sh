#!/usr/bin/env bash
set -euo pipefail

# Abando – Daily Readiness Check
# Runs:
#  1) Prod sanity (backend + frontend in Render)
#  2) Local frontend build smoke

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "============================"
echo " Abando – Daily Readiness"
echo "============================"
echo

if [ -x "scripts/abando_prod_sanity.sh" ]; then
  echo "→ 1) Prod sanity check"
  scripts/abando_prod_sanity.sh
else
  echo "⚠️ scripts/abando_prod_sanity.sh not found or not executable"
fi

echo
echo "→ 2) Local frontend build smoke"
if [ -x "scripts/abando_phase3_frontend_build_smoke.sh" ]; then
  scripts/abando_phase3_frontend_build_smoke.sh
else
  echo "⚠️ scripts/abando_phase3_frontend_build_smoke.sh not found or not executable"
fi

echo
echo "🏁 Daily readiness check complete."

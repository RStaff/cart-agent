#!/usr/bin/env bash
set -euo pipefail

echo "===================================="
echo " Abando Phase 2 – Full Smoke Suite "
echo "===================================="
echo

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "1️⃣ Checking overall stack status..."
if [ -x "scripts/abando_stack_status.sh" ]; then
  scripts/abando_stack_status.sh || true
else
  echo "⚠️ scripts/abando_stack_status.sh not found – skipping."
fi

echo
echo "2️⃣ Running API smoke..."
if [ -x "scripts/abando_phase2_frontend_api_smoke.sh" ]; then
  scripts/abando_phase2_frontend_api_smoke.sh
else
  echo "❌ scripts/abando_phase2_frontend_api_smoke.sh not found."
fi

echo
echo "3️⃣ Running pages smoke..."
if [ -x "scripts/abando_phase2_frontend_pages_smoke.sh" ]; then
  scripts/abando_phase2_frontend_pages_smoke.sh
else
  echo "❌ scripts/abando_phase2_frontend_pages_smoke.sh not found."
fi

echo
echo "===================================="
echo "  Abando Phase 2 – Full Smoke Done  "
echo "===================================="

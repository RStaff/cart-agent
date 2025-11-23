#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=============================="
echo "  Abando Phase 2 – Dev Cycle  "
echo "=============================="
echo

echo "1) Clearing dev ports (3000)…"
scripts/backend_port_kill_3000.sh || true
echo

echo "2) Booting full dev stack (backend + frontend)…"
scripts/abando_stack_boot.sh
echo

echo "3) Running full Phase 2 smoke…"
scripts/abando_phase2_full_smoke.sh

echo
echo "======================================="
echo "  Dev cycle complete – review results  "
echo "======================================="

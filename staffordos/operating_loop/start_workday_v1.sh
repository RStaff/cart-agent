#!/usr/bin/env bash
set -euo pipefail

cd ~/projects/cart-agent || exit 1

echo "=== STAFFORDOS START WORKDAY V1 ==="

mkdir -p staffordos/operating_loop/output

OUT="staffordos/operating_loop/output/start_workday_latest.txt"

{
  echo "=== DATE ==="
  date

  echo ""
  echo "=== GIT STATUS ==="
  git status --short

  echo ""
  echo "=== CURRENT BRANCH ==="
  git branch --show-current

  echo ""
  echo "=== RUNTIME CHECK ==="
  curl -s -o /tmp/health_check.txt -w "%{http_code}" http://localhost:8081/health || true
  echo ""
  cat /tmp/health_check.txt || true

  echo ""
  echo "=== PLAYGROUND CHECK ==="
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/demo/playground || true

  echo ""
  echo "=== EXISTING GOVERNANCE ARTIFACTS ==="
  ls -lh staffordos/system_inventory/output 2>/dev/null | tail -40 || true

} | tee "$OUT"

echo ""
echo "Start workday report written to: $OUT"

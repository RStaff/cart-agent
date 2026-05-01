#!/usr/bin/env bash
set -euo pipefail

cd ~/projects/cart-agent || exit 1

echo "=== STAFFORDOS STOP WORKDAY V1 ==="

TS=$(date +%Y%m%d_%H%M%S)
REMOTE_DIR="/home/ross/abando_checkpoints/cart-agent_stop_$TS"
LOCAL_OUT="staffordos/operating_loop/output/stop_workday_$TS"

mkdir -p "$LOCAL_OUT"

echo "=== CAPTURE STATUS ==="
git status --short | tee "$LOCAL_OUT/git_status.txt"
git diff > "$LOCAL_OUT/git_diff.patch"

echo "=== RUNTIME CHECK ==="
{
  echo "health:"
  curl -s -i http://localhost:8081/health | head -20 || true
  echo ""
  echo "playground:"
  curl -s -i http://localhost:8081/demo/playground | head -30 || true
} | tee "$LOCAL_OUT/runtime_check.txt"

echo "=== PACKAGE CRITICAL FILES ==="
tar -czf "$LOCAL_OUT/critical_files.tgz" \
  web/src/index.js \
  web/src/jobs/worker.js \
  web/src/routes/playground.esm.js \
  web/src/routes/recoveryLiveTest.esm.js \
  web/src/lib/recoveryLedger.js \
  web/src/routes/recoveryLedger.esm.js \
  staffordos/system_inventory/abando_canonical_proof_path_map_v1.mjs \
  staffordos/operating_loop/DAILY_LOOP_V1.md \
  2>/dev/null || true

echo "=== SEND CHECKPOINT TO HOME SERVER ==="
ssh ross@home-server "mkdir -p $REMOTE_DIR"
scp "$LOCAL_OUT/git_status.txt" ross@home-server:"$REMOTE_DIR/"
scp "$LOCAL_OUT/git_diff.patch" ross@home-server:"$REMOTE_DIR/"
scp "$LOCAL_OUT/runtime_check.txt" ross@home-server:"$REMOTE_DIR/"
scp "$LOCAL_OUT/critical_files.tgz" ross@home-server:"$REMOTE_DIR/"

echo "=== VERIFY REMOTE CHECKPOINT ==="
ssh ross@home-server "ls -lh $REMOTE_DIR"

echo ""
echo "Stop checkpoint saved at: home-server:$REMOTE_DIR"

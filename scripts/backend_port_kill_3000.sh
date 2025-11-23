#!/usr/bin/env bash
set -euo pipefail

echo "=== HARD KILL: freeing port 3000 ==="

# 1) Normal kill
PIDS1="$(lsof -ti tcp:3000 || true)"
if [ -n "$PIDS1" ]; then
  echo "→ lsof found PIDs: $PIDS1"
  kill -9 $PIDS1 || true
else
  echo "→ lsof sees no process on 3000"
fi

# 2) Kill any node process still holding sockets (zombie children)
PIDS2="$(pgrep -f 'node.*3000' || true)"
if [ -n "$PIDS2" ]; then
  echo "→ pgrep found zombie node processes: $PIDS2"
  kill -9 $PIDS2 || true
fi

# 3) Kill ALL node processes if still blocked (rare but necessary)
if lsof -i tcp:3000 >/dev/null 2>&1; then
  echo "⚠️ Port 3000 still blocked — killing ALL node processes"
  pkill -9 node || true
fi

# 4) Confirm
if lsof -i tcp:3000 >/dev/null 2>&1; then
  echo "❌ Port 3000 STILL blocked — macOS TIME_WAIT"
  echo "   Fix: run → sudo lsof -i :3000"
  echo "        then manually kill the parent PID shown"
else
  echo "✅ Port 3000 fully cleared"
fi

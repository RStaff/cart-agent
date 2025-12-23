#!/usr/bin/env bash
set -euo pipefail

echo "🧹 Forcing ports free (3000/3001) + restarting dev stack"
echo "Time: $(date)"
echo

for p in 3000 3001; do
  echo "🔎 Port $p listeners:"
  lsof -nP -iTCP:$p -sTCP:LISTEN || echo "  (none)"
  echo
done

echo "🛑 Killing anything listening on 3000/3001..."
for p in 3000 3001; do
  pids="$(lsof -ti tcp:$p 2>/dev/null || true)"
  if [ -n "${pids}" ]; then
    echo "  • port $p -> $pids"
    kill -9 $pids || true
  fi
done

echo
echo "✅ Confirm ports are free:"
for p in 3000 3001; do
  if lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then
    echo "❌ Still listening on $p:"
    lsof -nP -iTCP:$p -sTCP:LISTEN || true
    exit 1
  else
    echo "  • $p free"
  fi
done

echo
echo "🚀 Restarting dev stack..."
./scripts/dev.sh cart-agent-dev.myshopify.com

echo
echo "✅ Status:"
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:3001 -sTCP:LISTEN || true

echo
echo "🔎 Tail express log (last 80):"
tail -n 80 .dev_express.log || true

echo
echo "🔎 Tail next log (last 80):"
tail -n 80 .dev_next.log || true

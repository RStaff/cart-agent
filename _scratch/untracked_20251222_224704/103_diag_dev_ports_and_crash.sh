#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Abando dev stack diagnosis"
echo "============================"
echo "Time: $(date)"
echo "Repo: $(pwd)"
echo

echo "1) Ports bound right now?"
echo "-------------------------"
for p in 3000 3001; do
  echo "• tcp:$p"
  lsof -nP -iTCP:$p -sTCP:LISTEN || echo "  (none listening)"
done
echo

echo "2) Quick connect test (localhost:3000)"
echo "--------------------------------------"
# Use a short timeout so this never hangs
curl -fsS --max-time 2 -D- http://localhost:3000/ -o /dev/null && echo "✅ HTTP reachable" || echo "❌ Cannot connect to :3000"
echo

echo "3) Last 80 lines of .dev_express.log"
echo "------------------------------------"
if [ -f .dev_express.log ]; then
  tail -n 80 .dev_express.log || true
else
  echo "(missing .dev_express.log)"
fi
echo

echo "4) Crash signatures in .dev_express.log"
echo "---------------------------------------"
if [ -f .dev_express.log ]; then
  grep -nE "app crashed|uncaught|Unhandled|ERR_|SyntaxError|ReferenceError|TypeError|EADDRINUSE|MODULE_NOT_FOUND|Cannot find|stack trace" .dev_express.log | tail -n 80 || echo "(none found)"
fi
echo

echo "5) Sanity: node --check likely entrypoints"
echo "------------------------------------------"
# These checks do NOT execute code; only parse/syntax check.
if [ -f web/start.mjs ]; then
  node --check web/start.mjs && echo "✅ web/start.mjs parses" || echo "❌ web/start.mjs parse error"
else
  echo "(missing web/start.mjs)"
fi

if [ -f web/src/routes/webhooks.js ]; then
  node --check web/src/routes/webhooks.js && echo "✅ webhooks.js parses" || echo "❌ webhooks.js parse error"
else
  echo "(missing web/src/routes/webhooks.js)"
fi
echo

echo "6) If something is listening, show PID + command"
echo "------------------------------------------------"
for p in 3000 3001; do
  pid="$(lsof -ti tcp:$p 2>/dev/null | head -n 1 || true)"
  if [ -n "${pid:-}" ]; then
    echo "• tcp:$p pid=$pid"
    ps -p "$pid" -o pid,ppid,etime,command
  fi
done
echo

echo "✅ Diagnosis complete."

#!/bin/bash

echo "===== COMMIT GATE START ====="

FAIL=0

echo "→ Check 1: Resolver syntax"
node --check staffordos/operator_daemon/task_command_resolver_v1.mjs || FAIL=1

echo "→ Check 2: Last run success"
if grep -R "loop failure" staffordos/operator_daemon/output 2>/dev/null; then
  echo "❌ Loop failure detected"
  FAIL=1
else
  echo "✅ No loop failure"
fi

echo "→ Check 3: Required artifacts exist"

REQUIRED_FILES=(
  "staffordos/operator_daemon/output/operator_heartbeat_v1.json"
)

for f in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "❌ Missing $f"
    FAIL=1
  else
    echo "✅ Found $f"
  fi
done

echo "→ Check 4: No forbidden actions"

if grep -RinE '"sent": true|"sent_messages": true|"revenue_action": true' staffordos/operator_daemon/output 2>/dev/null; then
  echo "❌ Forbidden action detected"
  FAIL=1
else
  echo "✅ No send / revenue action"
fi

echo "===== DECISION ====="

if [ "$FAIL" -ne 0 ]; then
  echo "🚫 COMMIT BLOCKED"
  exit 1
else
  echo "✅ COMMIT ALLOWED"
fi

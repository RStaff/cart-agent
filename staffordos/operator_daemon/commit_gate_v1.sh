#!/bin/bash
set -euo pipefail

echo "===== COMMIT GATE START ====="

FAIL=0
EXPECTED_ARTIFACT="${EXPECTED_ARTIFACT:-}"

echo "→ Check 1: Resolver syntax"
node --check staffordos/operator_daemon/task_command_resolver_v1.mjs || FAIL=1

echo "→ Check 2: Last run success"
if grep -R "loop failure" staffordos/operator_daemon/output/last_daemon_run.log 2>/dev/null; then
  echo "❌ Loop failure detected"
  FAIL=1
else
  echo "✅ No loop failure"
fi

echo "→ Check 3: Required artifacts exist"
if [ ! -f "staffordos/operator_daemon/output/operator_heartbeat_v1.json" ]; then
  echo "❌ Missing operator heartbeat"
  FAIL=1
else
  echo "✅ Found operator heartbeat"
fi

if [ -z "$EXPECTED_ARTIFACT" ]; then
  echo "❌ EXPECTED_ARTIFACT not provided"
  FAIL=1
elif [ ! -f "$EXPECTED_ARTIFACT" ]; then
  echo "❌ Expected artifact missing: $EXPECTED_ARTIFACT"
  FAIL=1
else
  echo "✅ Expected artifact exists: $EXPECTED_ARTIFACT"
fi

echo "→ Check 4: No forbidden actions, except narrow real-send allowlist"

if [ "${TASK:-}" = "operator_confirmed_real_send" ] && [ "${STAFFORDOS_ALLOW_REAL_SEND:-}" = "true" ]; then
  echo "🟢 Narrow real-send allowlist active"

  node <<'NODE' || FAIL=1
const fs = require("fs");
const p = "staffordos/operator_daemon/output/operator_confirmed_real_send_v1.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));

if (j.status !== "real_send_executed") process.exit(1);
if (j.execution?.mode !== "single_lead_only") process.exit(1);
if (j.constraints?.max_leads !== 1) process.exit(1);
if (j.constraints?.operator_controlled_test_send !== true) process.exit(1);
if (j.constraints?.batch_send !== false) process.exit(1);
if (j.proof?.real_send !== true) process.exit(1);
if (j.proof?.sent_messages !== true) process.exit(1);
if (j.proof?.revenue_action === true) process.exit(1);
if (!j.ledger_path || !fs.existsSync(j.ledger_path)) process.exit(1);

console.log("✅ Narrow real-send proof passed");
NODE

else
  echo "🔒 Standard safety mode: checking current expected artifact only"

  if [ -n "$EXPECTED_ARTIFACT" ] && [ -f "$EXPECTED_ARTIFACT" ]; then
    if grep -inE '"sent": true|"sent_messages": true|"revenue_action": true|"external_lookup_performed": true' "$EXPECTED_ARTIFACT" 2>/dev/null; then
      echo "❌ Forbidden action detected in current artifact"
      FAIL=1
    else
      echo "✅ No forbidden action in current artifact"
    fi
  fi
fi

echo "===== DECISION ====="

if [ "$FAIL" -ne 0 ]; then
  echo "🚫 COMMIT BLOCKED"
  exit 1
else
  echo "✅ COMMIT ALLOWED"
fi

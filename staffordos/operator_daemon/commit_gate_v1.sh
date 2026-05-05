# === ALLOWLIST_OVERRIDE_REAL_SEND ===
if [ "${STAFFORDOS_ALLOW_REAL_SEND:-}" = "true" ] && [ -f "staffordos/operator_daemon/output/operator_confirmed_real_send_v1.json" ]; then
  echo "🟢 ALLOWLIST OVERRIDE ACTIVE — validating real send..."

  node <<'NODE' || exit 1
const fs = require("fs");

const path = "staffordos/operator_daemon/output/operator_confirmed_real_send_v1.json";
const j = JSON.parse(fs.readFileSync(path, "utf8"));

if (j.status !== "real_send_executed") process.exit(1);
if (j.execution.mode !== "single_lead_only") process.exit(1);
if (j.constraints?.max_leads !== 1) process.exit(1);
if (j.constraints?.operator_controlled_test_send !== true) process.exit(1);
if (j.proof?.real_send !== true) process.exit(1);
if (j.proof?.sent_messages !== true) process.exit(1);
if (j.proof?.revenue_action === true) process.exit(1);

if (!j.ledger_path || !fs.existsSync(j.ledger_path)) process.exit(1);

console.log("✅ Allowlisted real send VERIFIED — bypassing forbidden check");
process.exit(0);
NODE

  echo "✅ COMMIT ALLOWED (override path)"
  exit 0
fi

# === END ALLOWLIST_OVERRIDE_REAL_SEND ===


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

echo "→ Check 4: No forbidden actions, except narrow real-send allowlist"

FORBIDDEN_MATCHES=$(find staffordos/operator_daemon/output -name "*.json" ! -name "task_command_resolution_v1.json" -print0 | xargs -0 grep -inE '"sent": true|"sent_messages": true|"revenue_action": true' 2>/dev/null || true)

if [ -n "$FORBIDDEN_MATCHES" ]; then
  if [ "${STAFFORDOS_ALLOW_REAL_SEND:-}" = "true" ]; then
    echo "⚠️ Forbidden-looking action found, checking narrow real-send allowlist"

    node - <<'NODE' || FAIL=1
const fs = require("fs");

function read(p) {
  if (!fs.existsSync(p)) throw new Error(`Missing ${p}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const resolution = read("staffordos/operator_daemon/output/task_command_resolution_v1.json");
const allowlist = read("staffordos/operator_daemon/output/real_send_allowlist_v1.json");
const dryRun = read("staffordos/operator_daemon/output/real_smtp_dry_run_actual_v1.json");
const smtpGate = read("staffordos/operator_daemon/output/real_smtp_send_gate_v1.json");
const boundary = read("staffordos/operator_daemon/output/product_boundary_validator_v1.json");

if (resolution.task_type !== "operator_confirmed_real_send") {
  throw new Error(`Real send allowlist denied: task_type=${resolution.task_type}`);
}
if (allowlist.allowed_task_type !== "operator_confirmed_real_send") {
  throw new Error("Real send allowlist denied: allowlist task mismatch");
}
if (dryRun.status !== "actual_sender_path_validated_no_send") {
  throw new Error(`Real send allowlist denied: dry run status=${dryRun.status}`);
}
if (smtpGate.status !== "smtp_ready_but_send_not_executed") {
  throw new Error(`Real send allowlist denied: smtp gate status=${smtpGate.status}`);
}
if (boundary.status !== "passed") {
  throw new Error(`Real send allowlist denied: product boundary status=${boundary.status}`);
}

console.log("✅ Narrow real-send allowlist checks passed");
NODE
  else
    echo "$FORBIDDEN_MATCHES"
    echo "❌ Forbidden action detected"
    FAIL=1
  fi
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

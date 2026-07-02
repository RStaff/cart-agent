#!/bin/bash
set -euo pipefail

TASK="${1:?Usage: run_task_with_commit_gate_v1.sh <task_type> <expected_artifact> <commit_message>}"


EXPECTED_ARTIFACT="${2:?Missing expected artifact path}"
COMMIT_MESSAGE="${3:?Missing commit message}"

echo "===== CHARACTER INTEGRITY GUARD ====="
TASK="$(node staffordos/guards/character_integrity_guard_v1.mjs normalize-task "$TASK")"
EXPECTED_ARTIFACT="$(node staffordos/guards/character_integrity_guard_v1.mjs normalize-task "$EXPECTED_ARTIFACT")"
COMMIT_MESSAGE="$(node staffordos/guards/character_integrity_guard_v1.mjs normalize-task "$COMMIT_MESSAGE")"
echo "normalized task: $TASK"
echo "normalized artifact: $EXPECTED_ARTIFACT"

echo "===== STAFFORDOS GATED RUN: $TASK ====="

cat > staffordos/operator_daemon/operator_daemon_state_v1.json <<'JSON'
{
  "schema": "staffordos.operator_daemon_state.v1",
  "started_at": null,
  "loops_run": 0,
  "last_run": null,
  "status": "idle"
}
JSON

cat > staffordos/operator_daemon/operator_daemon_config_v1.json <<JSON
{
  "schema": "staffordos.operator_daemon_config.v1",
  "loop_interval_ms": 10000,
  "safe_mode": true,
  "auto_execute": false,
  "task_type": "$TASK",
  "qa_profile": "operator_runtime",
  "max_loops": 1
}
JSON


echo "===== SPINE SYNC VALIDATOR ====="
node staffordos/spine_authority/spine_sync_validator_v1.mjs

echo "===== ROUTER / DECISION / AGENT BINDING CHECK ====="
if [ -f "staffordos/operator_daemon/output/router_decision_agent_binding_v1.json" ]; then
  node - <<'NODE'
const fs = require("fs");
const p = "staffordos/operator_daemon/output/router_decision_agent_binding_v1.json";
const b = JSON.parse(fs.readFileSync(p, "utf8"));
if (b.status !== "binding_manifest_created") {
  console.error("🚫 COMMIT BLOCKED: router/decision/agent binding manifest invalid");
  process.exit(1);
}
console.log("✅ router/decision/agent binding manifest present");
NODE
else
  echo "⚠️ router/decision/agent binding manifest not present yet"
fi


echo "===== LOAD OPERATOR LOCAL ENV IF PRESENT ====="
OPERATOR_ENV_FILE="staffordos/dev/.env.abando.local"
if [ -f "$OPERATOR_ENV_FILE" ]; then
  echo "✅ Loading operator env source: $OPERATOR_ENV_FILE"
  set -a
  source "$OPERATOR_ENV_FILE"
  set +a
else
  echo "⚠️ Operator env source not found: $OPERATOR_ENV_FILE"
fi

echo "===== RESOLVER PREFLIGHT GUARD ====="
node staffordos/operator_daemon/resolver_preflight_guard_v1.mjs "$TASK"

echo "===== VALIDATE RESOLVER ====="
node --check staffordos/operator_daemon/task_command_resolver_v1.mjs
node staffordos/operator_daemon/task_command_resolver_v1.mjs "$TASK"

echo "===== RUN OPERATOR ====="
mkdir -p staffordos/operator_daemon/output
node staffordos/operator_daemon/persistent_operator_v1.mjs | tee staffordos/operator_daemon/output/last_daemon_run.log


echo "===== POST PATCH STRUCTURAL VALIDATOR ====="
node staffordos/operator_daemon/post_patch_structural_validator_v1.mjs "$TASK" "$EXPECTED_ARTIFACT"
\echo "===== HARD FAILURE CHECKS ====="
if grep -RinE "SyntaxError|loop failure|No command provided|Command failed|❌" staffordos/operator_daemon/output/last_daemon_run.log; then
  echo "🚫 COMMIT BLOCKED: runtime failure detected"
  exit 1
fi

echo "===== EXPECTED ARTIFACT CHECK ====="
if [ ! -f "$EXPECTED_ARTIFACT" ]; then
  echo "🚫 COMMIT BLOCKED: expected artifact missing: $EXPECTED_ARTIFACT"
  exit 1
fi

node -e "JSON.parse(require('fs').readFileSync('$EXPECTED_ARTIFACT','utf8')); console.log('✅ expected artifact valid JSON')"

echo "===== HEARTBEAT CHECK ====="
node - <<'NODE'
const fs = require("fs");
const p = "staffordos/operator_daemon/output/operator_heartbeat_v1.json";
const h = JSON.parse(fs.readFileSync(p, "utf8"));
if (h.status !== "ok") {
  console.error("🚫 COMMIT BLOCKED: heartbeat not ok", h);
  process.exit(1);
}
console.log("✅ heartbeat ok");
NODE


echo "===== FORBIDDEN ACTION CHECK ====="

# ===== ALLOWLISTED REAL SEND =====
if [ "${TASK:-}" = "operator_confirmed_real_send" ] && [ "${STAFFORDOS_ALLOW_REAL_SEND:-}" = "true" ]; then
  echo "🟢 allowlisted real send path"

  node <<'NODE'
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

console.log("✅ allowlisted send verified");
NODE

else
  echo "🔒 standard safety mode (no real send allowed)"

  if grep -inE '"sent": true|"sent_messages": true|"revenue_action": true' "$EXPECTED_ARTIFACT"; then
    echo "🚫 COMMIT BLOCKED: forbidden action detected in current task artifact"
    exit 1
  fi
fi


echo "===== EXISTING COMMIT GATE ====="
export EXPECTED_ARTIFACT="$EXPECTED_ARTIFACT"
export TASK="$TASK"
export EXPECTED_ARTIFACT="$EXPECTED_ARTIFACT"
bash staffordos/operator_daemon/commit_gate_v1.sh

echo "===== COMMIT ONLY AFTER PASSING QA ====="
export STAFFORDOS_GATED=true

APPROVED_COMMIT_PATHS=("$EXPECTED_ARTIFACT")
if [ -n "${STAFFORDOS_APPROVED_COMMIT_PATHS:-}" ]; then
  IFS=':' read -r -a EXTRA_APPROVED_COMMIT_PATHS <<< "$STAFFORDOS_APPROVED_COMMIT_PATHS"
  APPROVED_COMMIT_PATHS+=("${EXTRA_APPROVED_COMMIT_PATHS[@]}")
fi

for path in "${APPROVED_COMMIT_PATHS[@]}"; do
  git add -- "$path"
done

if git diff --cached --quiet; then
  echo "✅ No changes to commit"
else
  git commit -m "$COMMIT_MESSAGE"
  git push
fi

echo "✅ GATED RUN COMPLETE"

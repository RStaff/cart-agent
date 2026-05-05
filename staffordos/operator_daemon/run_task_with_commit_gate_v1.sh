#!/bin/bash
set -euo pipefail

TASK="${1:?Usage: run_task_with_commit_gate_v1.sh <task_type> <expected_artifact> <commit_message>}"
EXPECTED_ARTIFACT="${2:?Missing expected artifact path}"
COMMIT_MESSAGE="${3:?Missing commit message}"

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

echo "===== HARD FAILURE CHECKS ====="
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
if grep -RinE '"sent": true|"sent_messages": true|"revenue_action": true|"external_lookup_performed": true' staffordos/operator_daemon/output; then
  echo "🚫 COMMIT BLOCKED: forbidden action detected"
  exit 1
fi

echo "===== EXISTING COMMIT GATE ====="
bash staffordos/operator_daemon/commit_gate_v1.sh

echo "===== COMMIT ONLY AFTER PASSING QA ====="
export STAFFORDOS_GATED=true

git add staffordos
if git diff --cached --quiet; then
  echo "✅ No changes to commit"
else
  git commit -m "$COMMIT_MESSAGE"
  git push
fi

echo "✅ GATED RUN COMPLETE"

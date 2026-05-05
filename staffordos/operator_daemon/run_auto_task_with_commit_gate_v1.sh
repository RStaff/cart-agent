#!/bin/bash
set -euo pipefail


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

echo "===== STAFFORDOS AUTO TASK SELECTION ====="

node staffordos/operator_daemon/select_next_task_v1.mjs | tee staffordos/operator_daemon/output/next_task_selection_stdout_v1.json

TASK=$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync("staffordos/operator_daemon/output/next_task_selection_v1.json","utf8")); console.log(j.selected.task_type)')
ARTIFACT=$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync("staffordos/operator_daemon/output/next_task_selection_v1.json","utf8")); console.log(j.selected.expected_artifact)')
MESSAGE=$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync("staffordos/operator_daemon/output/next_task_selection_v1.json","utf8")); console.log(j.selected.commit_message)')

echo "===== SELECTED TASK ====="
echo "task: $TASK"
echo "artifact: $ARTIFACT"
echo "message: $MESSAGE"

if [ "$TASK" = "send_confirm" ] || [ "$TASK" = "send_execute" ]; then
  echo "🚫 AUTO TASK BLOCKED: confirm/execute cannot be auto-selected"
  exit 1
fi

bash staffordos/operator_daemon/run_task_with_commit_gate_v1.sh "$TASK" "$ARTIFACT" "$MESSAGE"

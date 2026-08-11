#!/bin/bash
set -euo pipefail

TASK="${1:?Usage: run_task_with_local_commit_gate_v1.sh <task_type> <expected_artifact> <commit_message>}"
EXPECTED_ARTIFACT="${2:?Missing expected artifact path}"
COMMIT_MESSAGE="${3:?Missing commit message}"

echo "===== CHARACTER INTEGRITY GUARD ====="
TASK="$(node staffordos/guards/character_integrity_guard_v1.mjs normalize-task "$TASK")"
EXPECTED_ARTIFACT="$(node staffordos/guards/character_integrity_guard_v1.mjs normalize-task "$EXPECTED_ARTIFACT")"
COMMIT_MESSAGE="$(node staffordos/guards/character_integrity_guard_v1.mjs normalize-task "$COMMIT_MESSAGE")"
echo "normalized task: $TASK"
echo "normalized artifact: $EXPECTED_ARTIFACT"

echo "===== STAFFORDOS LOCAL-ONLY GATED RUN: $TASK ====="

if [ -n "$(git diff --cached --name-only)" ]; then
  echo "LOCAL COMMIT BLOCKED: staging area must be empty before the local-only runner stages approved paths."
  git diff --cached --name-only
  exit 1
fi

echo "===== VALIDATOR MAP CHECK ====="
node -e "JSON.parse(require('fs').readFileSync('staffordos/qa/validator_map_v1.json','utf8')); console.log('validator map valid JSON')"

echo "===== RESOLVER SYNTAX CHECK ====="
node --check staffordos/operator_daemon/task_command_resolver_v1.mjs

echo "===== EXPECTED ARTIFACT CHECK ====="
if [ ! -f "$EXPECTED_ARTIFACT" ]; then
  echo "LOCAL COMMIT BLOCKED: expected artifact missing: $EXPECTED_ARTIFACT"
  exit 1
fi

case "$EXPECTED_ARTIFACT" in
  *.json)
    node -e "JSON.parse(require('fs').readFileSync('$EXPECTED_ARTIFACT','utf8')); console.log('expected artifact valid JSON')"
    ;;
  *)
    echo "expected artifact exists"
    ;;
esac

APPROVED_COMMIT_PATHS=("$EXPECTED_ARTIFACT")
if [ -n "${STAFFORDOS_APPROVED_COMMIT_PATHS:-}" ]; then
  IFS=':' read -r -a EXTRA_APPROVED_COMMIT_PATHS <<< "$STAFFORDOS_APPROVED_COMMIT_PATHS"
  APPROVED_COMMIT_PATHS+=("${EXTRA_APPROVED_COMMIT_PATHS[@]}")
fi

echo "===== STAGE APPROVED PATHS ONLY ====="
for approved_path in "${APPROVED_COMMIT_PATHS[@]}"; do
  if [ ! -e "$approved_path" ]; then
    echo "LOCAL COMMIT BLOCKED: approved path does not exist: $approved_path"
    exit 1
  fi
  git add -- "$approved_path"
done

echo "===== STAGED FILE CONTAINMENT ====="
STAGED_FILES="$(git diff --cached --name-only)"
if [ -z "$STAGED_FILES" ]; then
  echo "No staged changes to commit"
  exit 0
fi

echo "$STAGED_FILES"
while IFS= read -r staged_file; do
  [ -n "$staged_file" ] || continue
  approved=0
  for approved_path in "${APPROVED_COMMIT_PATHS[@]}"; do
    if [ "$staged_file" = "$approved_path" ]; then
      approved=1
      break
    fi
  done
  if [ "$approved" -ne 1 ]; then
    echo "LOCAL COMMIT BLOCKED: unexpected staged file: $staged_file"
    exit 1
  fi
done <<EOF
$STAGED_FILES
EOF

echo "===== DIFF CHECK ====="
git diff --cached --check

echo "===== EXISTING COMMIT GATE ====="
export EXPECTED_ARTIFACT="$EXPECTED_ARTIFACT"
export TASK="$TASK"
export STAFFORDOS_APPROVED_COMMIT_PATHS="${STAFFORDOS_APPROVED_COMMIT_PATHS:-}"
bash staffordos/operator_daemon/commit_gate_v1.sh

echo "===== LOCAL COMMIT ONLY ====="
export STAFFORDOS_GATED=true
git commit -m "$COMMIT_MESSAGE"

echo "===== STOP BEFORE REMOTE MUTATION ====="
echo "LOCAL-ONLY GATED RUN COMPLETE"
echo "No remote mutation command exists in this runner."

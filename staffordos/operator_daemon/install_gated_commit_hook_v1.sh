#!/bin/bash
set -euo pipefail

mkdir -p .git/hooks

cat > .git/hooks/pre-commit <<'HOOK'
#!/bin/bash
echo "===== PRE-COMMIT GATE ====="

if [ "${STAFFORDOS_GATED:-}" != "true" ]; then
  echo "🚫 BLOCKED: Direct git commit is not allowed."
  echo "👉 Use: bash staffordos/operator_daemon/run_task_with_commit_gate_v1.sh <task> <artifact> <message>"
  echo "👉 Or:  bash staffordos/operator_daemon/run_auto_task_with_commit_gate_v1.sh"
  exit 1
fi

echo "✅ Pre-commit gate passed"
HOOK

chmod +x .git/hooks/pre-commit
echo "✅ gated commit hook installed"

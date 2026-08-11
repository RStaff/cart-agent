import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const localRunnerPath = path.join(root, "staffordos/operator_daemon/run_task_with_local_commit_gate_v1.sh");
const pushRunnerPath = path.join(root, "staffordos/operator_daemon/run_task_with_commit_gate_v1.sh");
const commitGatePath = path.join(root, "staffordos/operator_daemon/commit_gate_v1.sh");
const hookInstallerPath = path.join(root, "staffordos/operator_daemon/install_gated_commit_hook_v1.sh");

const localRunner = readFileSync(localRunnerPath, "utf8");
const pushRunner = readFileSync(pushRunnerPath, "utf8");
const commitGate = readFileSync(commitGatePath, "utf8");
const hookInstaller = readFileSync(hookInstallerPath, "utf8");

test("local-only runner stages approved paths and calls the existing commit gate", () => {
  assert.match(localRunner, /STAFFORDOS LOCAL-ONLY GATED RUN/);
  assert.match(localRunner, /STAFFORDOS_APPROVED_COMMIT_PATHS/);
  assert.match(localRunner, /git add -- "\$approved_path"/);
  assert.match(localRunner, /git diff --cached --check/);
  assert.match(localRunner, /bash staffordos\/operator_daemon\/commit_gate_v1\.sh/);
});

test("local-only runner can create a local commit through the gated hook", () => {
  assert.match(localRunner, /export STAFFORDOS_GATED=true/);
  assert.match(localRunner, /git commit -m "\$COMMIT_MESSAGE"/);
  assert.match(localRunner, /LOCAL-ONLY GATED RUN COMPLETE/);
});

test("local-only runner contains no push, deploy, publish, or remote mutation command", () => {
  assert.doesNotMatch(localRunner, /\bgit\s+push\b/);
  assert.doesNotMatch(localRunner, /\bvercel\s+(deploy|alias)\b/);
  assert.doesNotMatch(localRunner, /\brender\s+(deploy|restart)\b/);
  assert.doesNotMatch(localRunner, /\bgh\s+release\b/);
  assert.doesNotMatch(localRunner, /\bnpm\s+publish\b/);
});

test("local-only runner preserves failure behavior for bad staging or failed gates", () => {
  assert.match(localRunner, /staging area must be empty/);
  assert.match(localRunner, /unexpected staged file/);
  assert.match(localRunner, /expected artifact missing/);
  assert.match(localRunner, /set -euo pipefail/);
  assert.match(commitGate, /COMMIT BLOCKED/);
});

test("existing push-capable runner is not silently weakened", () => {
  assert.match(pushRunner, /\bgit\s+push\b/);
  assert.match(pushRunner, /bash staffordos\/operator_daemon\/commit_gate_v1\.sh/);
  assert.match(pushRunner, /git commit -m "\$COMMIT_MESSAGE"/);
});

test("pre-commit hook guidance exposes both governed commit paths", () => {
  assert.match(hookInstaller, /run_task_with_commit_gate_v1\.sh/);
  assert.match(hookInstaller, /run_task_with_local_commit_gate_v1\.sh/);
  assert.match(hookInstaller, /STAFFORDOS_GATED/);
});

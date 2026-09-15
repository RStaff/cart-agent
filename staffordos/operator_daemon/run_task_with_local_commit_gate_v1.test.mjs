import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import os from "node:os";
import { once } from "node:events";
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
const guardPath = path.join(root, "staffordos/guards/character_integrity_guard_v1.mjs");
const trackedOutputPath = path.join(root, "staffordos/operator_daemon/output/character_integrity_guard_v1.json");

function snapshotOutputTree() {
  const outputDir = path.dirname(trackedOutputPath);
  return readdirSync(outputDir).sort().map((name) => {
    const filePath = path.join(outputDir, name);
    const stat = statSync(filePath);
    return `${name}:${stat.mode}:${stat.size}:${crypto.createHash("sha256").update(readFileSync(filePath)).digest("hex")}`;
  });
}

function runGuard(args, options = {}) {
  return spawnSync(process.execPath, [guardPath, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...options.env }
  });
}

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

test("character guard is stateless and emits deterministic normalized stdout", () => {
  const before = snapshotOutputTree();
  const input = "  task\u00a0with\u200bhidden chars  ";
  const first = runGuard(["normalize-task", input]);
  const second = runGuard(["normalize-task", input]);
  assert.equal(first.status, 0);
  assert.equal(second.status, 0);
  assert.equal(first.stdout, "task withhidden chars\n");
  assert.equal(second.stdout, first.stdout);
  assert.equal(first.stderr, "");
  assert.deepEqual(snapshotOutputTree(), before);
});

test("character guard rejects malformed mode and oversized input without output-path control", () => {
  const before = snapshotOutputTree();
  const rejectedMode = runGuard(["--output", "/tmp/hostile-output.json", "value"]);
  const rejectedSize = runGuard(["normalize-task", "x".repeat(4097)]);
  assert.equal(rejectedMode.status, 2);
  assert.equal(rejectedSize.status, 2);
  assert.equal(rejectedMode.stdout, "");
  assert.match(rejectedMode.stderr, /rejected input/);
  assert.equal(rejectedSize.stdout, "");
  assert.deepEqual(snapshotOutputTree(), before);
});

test("character guard remains isolated across concurrent and nested invocations", async () => {
  const before = snapshotOutputTree();
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "staffordos-guard-test-"));
  try {
    const children = Array.from({ length: 8 }, (_, index) => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [guardPath, "normalize-task", `nested-${index} * ; $(echo no)`], {
        cwd: tempRoot,
        env: { ...process.env, HOME: "/tmp/hostile-home", GUARD_OUTPUT_PATH: "/tmp/hostile-output" },
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("error", reject);
      child.on("close", (code, signal) => {
        try {
          assert.equal(code, 0);
          assert.equal(signal, null);
          assert.equal(stderr, "");
          assert.match(stdout, new RegExp(`^nested-${index} \\* ; \\$\\(echo no\\)\\n$`));
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }));
    await Promise.all(children);
    assert.deepEqual(readdirSync(tempRoot), []);
    assert.deepEqual(snapshotOutputTree(), before);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("signal delivery leaves no guard artifacts and preserves the tracked fixture", async () => {
  const before = snapshotOutputTree();
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "staffordos-guard-signal-"));
  try {
    for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
      const child = spawn(process.execPath, [guardPath, "normalize-task", "signal-safe"], {
        cwd: tempRoot,
        stdio: "ignore"
      });
      child.kill(signal);
      const [code, receivedSignal] = await once(child, "close");
      assert.ok(code === 0 || receivedSignal === signal);
    }
    assert.deepEqual(readdirSync(tempRoot), []);
    assert.deepEqual(snapshotOutputTree(), before);
    assert.equal(
      crypto.createHash("sha256").update(readFileSync(trackedOutputPath)).digest("hex"),
      "3b7197b9486a0c95700bccd106b32d5a9013bc01645acc3f39802826a5dd2940"
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

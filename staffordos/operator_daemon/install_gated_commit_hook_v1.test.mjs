import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const here = resolve("staffordos/operator_daemon");
const installer = resolve(here, "install_gated_commit_hook_v1.sh");
const adapter = resolve(here, "application_patch_commit_gate_v1.mjs");
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const temp = (name) => mkdtempSync(join(tmpdir(), `staffordos-${name}-`));
function repo() {
  const cwd = temp("hook");
  git(cwd, ["init", "-q"]); git(cwd, ["config", "user.email", "test@example.invalid"]); git(cwd, ["config", "user.name", "Test"]);
  git(cwd, ["remote", "add", "origin", "https://github.com/RStaff/cart-agent.git"]);
  writeFileSync(join(cwd, "base.txt"), "base\n"); git(cwd, ["add", "."]); git(cwd, ["commit", "-qm", "base"]);
  git(cwd, ["switch", "-c", "codex/step4b-followup-pr-v2"]);
  return cwd;
}
function install(cwd, extraEnv = {}) {
  return spawnSync("bash", [installer], { cwd, encoding: "utf8", env: { ...process.env, ...extraEnv } });
}
function intent(cwd) {
  const path = "change.txt";
  const diff = execFileSync("git", ["-c", "color.ui=false", "diff", "--cached", "--binary", "--full-index", "--no-ext-diff", "--no-textconv"], { cwd });
  return { repository: "RStaff/cart-agent", branch: git(cwd, ["symbolic-ref", "--short", "HEAD"]), base_head: git(cwd, ["rev-parse", "HEAD"]), paths: [path], staged_blobs: { [path]: git(cwd, ["rev-parse", `:${path}`]) }, staged_binary_diff_sha256: createHash("sha256").update(diff).digest("hex"), commit_message: "fixture commit" };
}

test("ordinary repository resolves hook and preserves existing hook with rollback", () => {
  const cwd = repo(); const hook = join(cwd, ".git/hooks/pre-commit");
  writeFileSync(hook, "#!/bin/sh\nexit 7\n");
  const result = install(cwd); assert.equal(result.status, 0, result.stderr);
  const installed = readFileSync(hook, "utf8");
  assert.match(installed, /application_patch_hook_validator_v1\.mjs/);
  const backups = execFileSync("find", [join(cwd, ".git/hooks"), "-name", "pre-commit.staffordos-backup.*"], { encoding: "utf8" }).trim().split("\n");
  assert.equal(readFileSync(backups[0], "utf8"), "#!/bin/sh\nexit 7\n");
  assert.match(result.stdout, /shared_hook=false/);
  assert.match(result.stdout, /rollback:/);
});

test("configured core.hooksPath is the effective install location", () => {
  const cwd = repo(); const hooks = join(cwd, "custom-hooks"); git(cwd, ["config", "core.hooksPath", hooks]);
  const result = install(cwd); assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(hooks, "pre-commit")), true);
  assert.equal(existsSync(join(cwd, ".git/hooks/pre-commit")), false);
});

test("linked worktree reports shared impact and requires explicit opt-in", () => {
  const main = repo(); const linked = temp("linked"); git(main, ["worktree", "add", "-q", "-b", "linked", linked]);
  let result = install(linked); assert.equal(result.status, 1); assert.match(result.stderr, /shared hook/);
  result = install(linked, { STAFFORDOS_ALLOW_SHARED_HOOK_INSTALL: "true" }); assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /shared_hook=true/);
});

test("linked worktree adapter-to-hook-to-commit path uses external validator", () => {
  const main = repo(); const linked = temp("complete"); git(main, ["worktree", "add", "-q", "-b", "complete", linked]);
  assert.equal(existsSync(join(linked, "staffordos/operator_daemon/application_patch_hook_validator_v1.mjs")), false);
  const installed = install(linked, { STAFFORDOS_ALLOW_SHARED_HOOK_INSTALL: "true" }); assert.equal(installed.status, 0, installed.stderr);
  writeFileSync(join(linked, "change.txt"), "fixture\n"); git(linked, ["add", "change.txt"]);
  const intentPath = join(linked, "intent.json"); writeFileSync(intentPath, JSON.stringify(intent(linked)));
  const result = spawnSync(process.execPath, [adapter, intentPath], { cwd: linked, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(git(linked, ["log", "-1", "--pretty=%s"]), "fixture commit");
  assert.equal(existsSync(join(git(linked, ["rev-parse", "--git-dir"]), "application-patch-auth")), true);
});

test("hook rejects a validator changed after installation", () => {
  const cwd = repo(); const result = install(cwd); assert.equal(result.status, 0, result.stderr);
  writeFileSync(join(cwd, "change.txt"), "fixture\n"); git(cwd, ["add", "change.txt"]);
  const intentPath = join(cwd, "intent.json"); writeFileSync(intentPath, JSON.stringify(intent(cwd)));
  const head = git(cwd, ["rev-parse", "HEAD"]);
  const original = readFileSync(join(here, "application_patch_hook_validator_v1.mjs"));
  writeFileSync(join(here, "application_patch_hook_validator_v1.mjs"), Buffer.concat([original, Buffer.from("\n")]))
  try {
    const blocked = spawnSync(process.execPath, [adapter, intentPath], { cwd, encoding: "utf8" });
    assert.notEqual(blocked.status, 0);
    assert.equal(git(cwd, ["rev-parse", "HEAD"]), head);
  } finally {
    writeFileSync(join(here, "application_patch_hook_validator_v1.mjs"), original);
  }
});

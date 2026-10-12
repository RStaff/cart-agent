import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const adapter = resolve("staffordos/operator_daemon/application_patch_commit_gate_v1.mjs");
const hookInstaller = resolve("staffordos/operator_daemon/install_gated_commit_hook_v1.sh");
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), "staffordos-application-gate-"));
  git(cwd, ["init", "-q"]); git(cwd, ["config", "user.email", "test@example.invalid"]); git(cwd, ["config", "user.name", "Test"]);
  git(cwd, ["remote", "add", "origin", "https://github.com/RStaff/cart-agent.git"]);
  writeFileSync(join(cwd, "tracked.txt"), "base\n"); git(cwd, ["add", "tracked.txt"]); git(cwd, ["commit", "-qm", "base"]);
  git(cwd, ["switch", "-c", "codex/step4b-followup-pr-v2"]);
  return cwd;
}
function intentFor(cwd, base, paths = ["tracked.txt"]) {
  const sorted = [...paths].sort();
  const blobs = Object.fromEntries(sorted.map(p => [p, git(cwd, ["rev-parse", `:${p}`])]));
  const diff = execFileSync("git", ["-c", "color.ui=false", "diff", "--cached", "--binary", "--full-index", "--no-ext-diff", "--no-textconv"], { cwd });
  return { repository: "RStaff/cart-agent", branch: "codex/step4b-followup-pr-v2", base_head: base, paths: sorted, staged_blobs: blobs, staged_binary_diff_sha256: createHash("sha256").update(diff).digest("hex"), commit_message: "test" };
}
function checkReject(cwd, intent) {
  const p = join(cwd, "intent.json"); writeFileSync(p, JSON.stringify(intent));
  return spawnSync(process.execPath, [adapter, p, "--validate-only"], { cwd, encoding: "utf8" }).status;
}

test("intent binds exact base, sorted paths, blobs, and diff digest", () => {
  const j = JSON.parse(readFileSync("staffordos/governance/application_patch_commit_intents/pr124_step4b_local_qa_blockers_v1.json", "utf8"));
  assert.equal(j.base_head, "0bafcc075a36fd0d5049d5388d533f5e24915500");
  assert.deepEqual(j.paths, [...j.paths].sort());
  assert.equal(j.paths.length, 5);
  assert.equal(Object.keys(j.staged_blobs).length, 5);
  assert.match(j.staged_binary_diff_sha256, /^[0-9a-f]{64}$/);
});

test("adapter is non-operational", () => {
  const s = readFileSync("staffordos/operator_daemon/application_patch_commit_gate_v1.mjs", "utf8");
  assert.doesNotMatch(s, /run_task_with_commit_gate|persistent_operator|select_next_task|push/);
});

test("rejects changed content, wrong base, unexpected paths, and failed checks", () => {
  const cwd = fixture(); writeFileSync(join(cwd, "tracked.txt"), "changed\n"); git(cwd, ["add", "tracked.txt"]);
  const base = git(cwd, ["rev-parse", "HEAD"]); const intent = intentFor(cwd, base);
  assert.equal(spawnSync(process.execPath, [adapter, join(cwd, "intent.json"), "--validate-only"], { cwd }).status, 1); // absent intent
  writeFileSync(join(cwd, "intent.json"), JSON.stringify(intent));
  writeFileSync(join(cwd, "tracked.txt"), "changed-again\n"); git(cwd, ["add", "tracked.txt"]); assert.equal(checkReject(cwd, intent), 1);
  writeFileSync(join(cwd, "tracked.txt"), "changed\n"); writeFileSync(join(cwd, "extra.txt"), "extra\n"); git(cwd, ["add", "tracked.txt", "extra.txt"]); assert.equal(checkReject(cwd, intent), 1);
  git(cwd, ["reset", "-q", "HEAD", "--", "extra.txt"]); writeFileSync(join(cwd, "tracked.txt"), "bad  \n"); git(cwd, ["add", "tracked.txt"]); const whitespace = intentFor(cwd, base); assert.equal(checkReject(cwd, { ...whitespace, base_head: "0".repeat(40) }), 1); assert.equal(checkReject(cwd, whitespace), 1);
});

test("hook rejects forged authorization and consumes valid authorization once", () => {
  const cwd = fixture(); execFileSync("bash", [hookInstaller], { cwd });
  const auth = join(cwd, "fake-auth.json"); writeFileSync(auth, "{}"); chmodSync(auth, 0o600);
  let r = spawnSync("git", ["commit", "-qm", "bad"], { cwd, env: { ...process.env, STAFFORDOS_PATCH_AUTH_FILE: auth, STAFFORDOS_PATCH_AUTH_NONCE: "wrong" } }); assert.equal(r.status, 1);
  writeFileSync(join(cwd, "tracked.txt"), "valid\n"); git(cwd, ["add", "tracked.txt"]);
  const digest = createHash("sha256").update(execFileSync("git", ["-c", "color.ui=false", "diff", "--cached", "--binary", "--full-index", "--no-ext-diff", "--no-textconv"], { cwd })).digest("hex");
  const nonce = "a".repeat(64); const valid = { schema: "staffordos.application_patch_authorization.v1", nonce, repository: "RStaff/cart-agent", branch: "codex/step4b-followup-pr-v2", root: git(cwd, ["rev-parse", "--show-toplevel"]), head: git(cwd, ["rev-parse", "HEAD"]), paths: ["tracked.txt"], staged_blobs: { "tracked.txt": git(cwd, ["rev-parse", ":tracked.txt"]) }, digest, expires_at: Date.now() + 60000 };
  writeFileSync(auth, JSON.stringify(valid)); r = spawnSync("git", ["commit", "-qm", "valid"], { cwd, env: { ...process.env, STAFFORDOS_PATCH_AUTH_FILE: auth, STAFFORDOS_PATCH_AUTH_NONCE: nonce } }); assert.equal(r.status, 0, r.stderr); assert.equal(existsSync(auth), false);
  r = spawnSync("git", ["commit", "-qm", "reuse"], { cwd, env: { ...process.env, STAFFORDOS_PATCH_AUTH_FILE: auth, STAFFORDOS_PATCH_AUTH_NONCE: nonce } }); assert.equal(r.status, 1);
});

test("full-index digest is stable across core.abbrev settings", () => {
  const cwd = fixture(); writeFileSync(join(cwd, "tracked.txt"), "stable\n"); git(cwd, ["add", "tracked.txt"]);
  const args = ["-c", "color.ui=false", "diff", "--cached", "--binary", "--full-index", "--no-ext-diff", "--no-textconv"];
  const seven = createHash("sha256").update(execFileSync("git", ["-c", "core.abbrev=7", ...args], { cwd })).digest("hex");
  const twelve = createHash("sha256").update(execFileSync("git", ["-c", "core.abbrev=12", ...args], { cwd })).digest("hex");
  assert.equal(seven, twelve);
});

test("hook rejects repository, branch, and staged-blob mismatches", () => {
  const cwd = fixture(); execFileSync("bash", [hookInstaller], { cwd });
  writeFileSync(join(cwd, "tracked.txt"), "valid\n"); git(cwd, ["add", "tracked.txt"]);
  const digest = createHash("sha256").update(execFileSync("git", ["-c", "color.ui=false", "diff", "--cached", "--binary", "--full-index", "--no-ext-diff", "--no-textconv"], { cwd })).digest("hex");
  const base = { schema: "staffordos.application_patch_authorization.v1", root: git(cwd, ["rev-parse", "--show-toplevel"]), head: git(cwd, ["rev-parse", "HEAD"]), paths: ["tracked.txt"], staged_blobs: { "tracked.txt": git(cwd, ["rev-parse", ":tracked.txt"]) }, digest, expires_at: Date.now() + 60000 };
  for (const [field, value] of [["repository", "other/repo"], ["branch", "other-branch"], ["staged_blobs", { "tracked.txt": "0".repeat(40) }]]) {
    const nonce = `${field}-nonce`; const auth = join(cwd, `${field}.json`); writeFileSync(auth, JSON.stringify({ ...base, field, [field]: value, nonce })); chmodSync(auth, 0o600);
    const r = spawnSync("git", ["commit", "-qm", `mismatch-${field}`], { cwd, env: { ...process.env, STAFFORDOS_PATCH_AUTH_FILE: auth, STAFFORDOS_PATCH_AUTH_NONCE: nonce } });
    assert.equal(r.status, 1, field); assert.equal(existsSync(auth), true, field);
  }
});

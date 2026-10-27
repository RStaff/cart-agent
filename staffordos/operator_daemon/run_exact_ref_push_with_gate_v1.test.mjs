import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const runner = resolve(new URL("./run_exact_ref_push_with_gate_v1.sh", import.meta.url).pathname);
const git = (cwd, args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();
const gitMaybe = (cwd, args) => { try { return git(cwd, args); } catch { return ""; } };
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pr133Authorization = () => ({
  canonicalRemoteIdentity: "https://github.com/RStaff/cart-agent.git",
  sourceCommitSha: "c902c6abadb5200b4892a6dd10420b5ab1b1e04e",
  sourceTreeSha: "e11150c96f3975293837b202080490c7d316ac29",
  expectedParentSha: "8998391cde4772f99eb11aa0e9c3845c0df301a9",
  destinationRef: "refs/heads/careos/migration-runner-v1",
  destinationPrecondition: "EXACT_SHA",
  expectedDestinationSha: "8998391cde4772f99eb11aa0e9c3845c0df301a9",
  authorizationRef: "pr133.owner-authorized-role-mapping-correction.2026-10-26",
  approvedFiles: [
    { path: "staffordos/ui/operator-frontend/careeros-beta/scripts/careeros-schema-adoption.test.mjs", mode: "100644", sha256: "808ab64dc0d2fd27d207aa2edb761f4876c590c20a749e2a59894a93954be602" },
    { path: "staffordos/ui/operator-frontend/careeros-beta/scripts/reconcile-careeros-story-status.mjs", mode: "100644", sha256: "7d324d11ab76f91528be72c4485f130b652f56a9d6978848d7dcdf52c81a63af" },
    { path: "staffordos/ui/operator-frontend/careeros-beta/scripts/reconcile-careeros-story-status.pg17.test.mjs", mode: "100644", sha256: "b7073a0f95054ac63d34d0646d4892937cc0ec3e8950c11259e426c029f01083" },
  ],
});
const scannerRepairAuthorization = () => ({
  canonicalRemoteIdentity: "https://github.com/RStaff/cart-agent.git",
  sourceCommitSha: "a0548f316630f99c5b69c80fd8861559743cad8d",
  sourceTreeSha: "d77993c72def9d590c1e5f3a0ae439c6f488f1a8",
  expectedParentSha: "17b07030ce0dc8289b6efbd92ef60de8151e2976",
  destinationRef: "refs/heads/careos/secret-scan-scope-20261027",
  destinationPrecondition: "ABSENT",
  expectedDestinationSha: null,
  authorizationRef: "scanner-repair.owner-authorized-publication.2026-10-27",
  approvedFiles: [
    { path: ".github/workflows/security-ci.yml", mode: "100644", sha256: "8315dcc5d636d641cd3a09ad3d33b5e7664fca91d82543315e5c4b7f2699aaec" },
    { path: ".gitleaksignore", mode: "100644", sha256: "999a1bbf7116925245e2c0d9a0ef5251c821665f379110af6ed221e85e364547" },
    { path: "scripts/ci/test-secret-scan-control.sh", mode: "100644", sha256: "462265464b38fd8383f951e7b6477aff72630d30a29f9f297136505191b3e9ac" },
    { path: "scripts/ci/verify-secret-scan-history.sh", mode: "100644", sha256: "2b6449cae7ac9a2fb83be23864f5b736702e593430ea856692bda2b9873cb7c7" },
  ],
});
const scannerRepairFollowupAuthorization = () => ({
  canonicalRemoteIdentity: "https://github.com/RStaff/cart-agent.git",
  sourceCommitSha: "7476d832041a3ef86cfcfea9fc38e83940e3b8cf",
  sourceTreeSha: "0f439cae226cb6bdacfa8e32eb88bd236d3c8bf1",
  expectedParentSha: "a0548f316630f99c5b69c80fd8861559743cad8d",
  destinationRef: "refs/heads/careos/secret-scan-scope-20261027",
  destinationPrecondition: "EXACT_SHA",
  expectedDestinationSha: "a0548f316630f99c5b69c80fd8861559743cad8d",
  authorizationRef: "scanner-repair.review-followup-publication.2026-10-27",
  approvedFiles: [
    { path: ".github/workflows/security-ci.yml", mode: "100644", sha256: "abc8aaba500355c5fe2e65e8ecd9fbf2be5aec0ba6a99147a606919ad411f0df" },
    { path: "scripts/ci/run-secret-scan.sh", mode: "100644", sha256: "8d502f6cf33c07ce806fcd7125c231f2edcd28d5dc828fa1261c63069d1edaf5" },
    { path: "scripts/ci/test-secret-scan-control.sh", mode: "100644", sha256: "3fd93a4ec54dc55f2f75c34c871c2041325eb20b749261670aca6db2d1aaccd4" },
  ],
});
const scannerRepairSecondFollowupAuthorization = () => ({
  canonicalRemoteIdentity: "https://github.com/RStaff/cart-agent.git",
  sourceCommitSha: "549164f5bfd346244c6e704709390d7c8b2bacf4",
  sourceTreeSha: "7ea5ed6549305ab51b3236d7014a49d24e984ff7",
  expectedParentSha: "7476d832041a3ef86cfcfea9fc38e83940e3b8cf",
  destinationRef: "refs/heads/careos/secret-scan-scope-20261027",
  destinationPrecondition: "EXACT_SHA",
  expectedDestinationSha: "7476d832041a3ef86cfcfea9fc38e83940e3b8cf",
  authorizationRef: "scanner-repair.second-review-followup-publication.2026-10-27",
  approvedFiles: [
    { path: "scripts/ci/run-secret-scan.sh", mode: "100644", sha256: "0a76efd67aec803c73fb7eeccfd916acde55132e0b80b4408f7a435edeac630e" },
    { path: "scripts/ci/test-secret-scan-control.sh", mode: "100644", sha256: "7440b3d6efc058fe8e7ae9ab97a62dfd3543be2f27e71abfc66066d69e337ad7" },
  ],
});
const scannerRepairThirdFollowupAuthorization = () => ({
  canonicalRemoteIdentity: "https://github.com/RStaff/cart-agent.git",
  sourceCommitSha: "7615ebbcc1e2b9a88865b561aae390987ce53ae5",
  sourceTreeSha: "d7051136d0bbf2e2cf50142e282e5360392bc70d",
  expectedParentSha: "549164f5bfd346244c6e704709390d7c8b2bacf4",
  destinationRef: "refs/heads/careos/secret-scan-scope-20261027",
  destinationPrecondition: "EXACT_SHA",
  expectedDestinationSha: "549164f5bfd346244c6e704709390d7c8b2bacf4",
  authorizationRef: "scanner-repair.third-review-followup-publication.2026-10-27",
  approvedFiles: [
    { path: ".github/workflows/security-ci.yml", mode: "100644", sha256: "b350e3bc0e87295e27ff2a5029bb5c949e76780fced5d6735011d4bebfef4e9c" },
    { path: "scripts/ci/run-secret-scan.sh", mode: "100644", sha256: "ce9326ac72742cd4322dda959c34785c0667a933848c12a40abb551901f83215" },
    { path: "scripts/ci/test-secret-scan-control.sh", mode: "100644", sha256: "19d9cde193d846da6f2ccf335a1ebfcaf11126bb4fd02e8b1713a5fbddbe5d16" },
  ],
});

function fixture({ mixed = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "staffordos-exact-ref-test-"));
  const remotePath = join(root, "remote.git");
  const repo = join(root, "repo");
  execFileSync("git", ["init", "--bare", remotePath]);
  const remote = realpathSync(remotePath);
  execFileSync("git", ["init", "-b", "main", repo]);
  git(repo, ["config", "user.name", "Synthetic Test"]);
  git(repo, ["config", "user.email", "synthetic@example.invalid"]);
  writeFileSync(join(repo, "approved.txt"), "synthetic approved content\n");
  if (mixed) {
    writeFileSync(join(repo, "executable.sh"), "#!/bin/sh\nprintf '%s\\n' synthetic\\n\n");
    chmodSync(join(repo, "executable.sh"), 0o755);
  }
  git(repo, ["add", "approved.txt"]);
  if (mixed) git(repo, ["add", "executable.sh"]);
  git(repo, ["commit", "-m", "synthetic base"]);
  const parent = git(repo, ["rev-parse", "HEAD"]);
  git(repo, ["remote", "add", "origin", remote]);
  git(repo, ["push", "origin", `HEAD:refs/heads/careeros/private-beta`]);
  writeFileSync(join(repo, "approved.txt"), "synthetic source content\n");
  if (mixed) writeFileSync(join(repo, "executable.sh"), "#!/bin/sh\nprintf '%s\\n' synthetic-source\\n\n");
  git(repo, ["commit", "-am", "synthetic source"]);
  const source = git(repo, ["rev-parse", "HEAD"]);
  const tree = git(repo, ["rev-parse", "HEAD^{tree}"]);
  const manifestPath = join(root, "authorization.json");
  const makeManifest = (overrides = {}) => {
    const manifest = {
      schemaVersion: "staffordos.exact_ref_push.v1",
      repositoryRoot: realpathSync(repo),
      remoteName: "origin",
      canonicalRemoteIdentity: remote,
      sourceCommitSha: source,
      sourceTreeSha: tree,
      expectedParentSha: parent,
      destinationRef: "refs/heads/careeros/synthetic-exact",
      destinationPrecondition: "ABSENT",
      expectedDestinationSha: null,
      approvedFiles: [
        { path: "approved.txt", mode: "100644", sha256: sha256(readFileSync(join(repo, "approved.txt"))) },
        ...(mixed ? [{ path: "executable.sh", mode: "100755", sha256: sha256(readFileSync(join(repo, "executable.sh"))) }] : []),
      ],
      authorizationRef: "synthetic.authorization.v1",
      noForce: true,
      ...overrides,
    };
    writeFileSync(manifestPath, JSON.stringify(manifest));
    return manifest;
  };
  const result = { root, remote, repo, parent, source, tree, manifestPath, makeManifest };
  installSyntheticGh(result);
  return result;
}

function invoke(fx, env = {}, synthetic = true) {
  return spawnSync(runner, synthetic ? [fx.manifestPath, "--synthetic-test-mode"] : [fx.manifestPath], {
    cwd: fx.repo,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function enableSyntheticControl(fx, lines) {
  writeFileSync(join(fx.repo, ".staffordos-exact-ref-test-control"), `${lines.join("\n")}\n`);
    writeFileSync(join(fx.repo, ".git", "info", "exclude"), ".staffordos-exact-ref-test-control*\n.staffordos-exact-ref-test-gh*\n.staffordos-exact-ref-test-cellar*\n", { flag: "a" });
}

async function waitFor(path) {
  for (let i = 0; i < 1200; i += 1) { if (existsSync(path)) return; await pause(5); }
  throw new Error(`synthetic synchronization timeout: ${path}`);
}

async function controlled(fx, lines, phase, action, signal = null) {
  enableSyntheticControl(fx, lines);
  const child = spawn(runner, [fx.manifestPath, "--synthetic-test-mode"], { cwd: fx.repo, encoding: "utf8" });
  let stdout = ""; let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; }); child.stderr.on("data", (chunk) => { stderr += chunk; });
  const closed = new Promise((resolve) => child.on("close", (code, actualSignal) => resolve({ code, signal: actualSignal, stdout, stderr })));
  await waitFor(join(fx.repo, `.staffordos-exact-ref-test-control.${phase}.started`));
  await action(child);
  if (signal) child.kill(signal);
  writeFileSync(join(fx.repo, `.staffordos-exact-ref-test-control.${phase}.release`), "release\n");
  return closed;
}

function installPostReceive(fx, body) {
  const hook = join(fx.remote, "hooks", "post-receive");
  writeFileSync(hook, `#!/bin/sh\n${body}\n`); chmodSync(hook, 0o700);
}

function installPreReceiveFailure(fx, output) {
  const hook = join(fx.remote, "hooks", "pre-receive");
  writeFileSync(hook, `#!/bin/sh\nprintf '%s\\n' '${output}'; exit 1\n`);
  chmodSync(hook, 0o700);
  writeFileSync(join(fx.repo, ".staffordos-exact-ref-test-control.output"), `${output}\n`);
  writeFileSync(join(fx.repo, ".staffordos-exact-ref-test-control"), "inject-push-result\n");
  writeFileSync(join(fx.repo, ".git", "info", "exclude"), ".staffordos-exact-ref-test-control*\n", { flag: "a" });
}

function installSyntheticGh(fx, { authStatus = 0, credentialStatus = 0, symlink = false, homebrewStyle = false } = {}) {
  const helper = join(fx.repo, ".staffordos-exact-ref-test-gh");
  const target = homebrewStyle
    ? join(fx.repo, ".staffordos-exact-ref-test-cellar", "gh", "2.82.0", "bin", "gh")
    : join(fx.repo, ".staffordos-exact-ref-test-gh-real");
  const marker = join(fx.repo, ".staffordos-exact-ref-test-gh-marker");
  rmSync(helper, { force: true });
  rmSync(homebrewStyle ? join(fx.repo, ".staffordos-exact-ref-test-cellar") : target, { force: true, recursive: homebrewStyle });
  mkdirSync(join(target, ".."), { recursive: true });
  writeFileSync(target, `#!/bin/sh
if [ "\${1:-}" = auth ] && [ "\${2:-}" = status ]; then
  printf '%s\\n' "\${GIT_TERMINAL_PROMPT:-}" > '${marker}'
  printf '%s\\n' "\${GIT_ASKPASS:-}" >> '${marker}'
  printf '%s\\n' "\${SSH_ASKPASS:-}" >> '${marker}'
  printf '%s\\n' "\${HOME:-}" >> '${marker}'
  printf '%s\\n' "\${GH_CONFIG_DIR:-}" >> '${marker}'
  stat -f '%Lp' "\${GIT_CONFIG_GLOBAL:-/nonexistent}" >> '${marker}' 2>/dev/null || true
  exit ${authStatus}
fi
if [ "\${1:-}" = auth ] && [ "\${2:-}" = git-credential ]; then
  stat -f '%Lp' "\${GIT_CONFIG_GLOBAL:-/nonexistent}" >> '${marker}' 2>/dev/null || true
  if [ ${credentialStatus} -ne 0 ]; then exit ${credentialStatus}; fi
  while IFS= read -r line; do [ -z "$line" ] && break; done
  printf '%s\\n' 'protocol=https'
  printf '%s\\n' 'host=github.com'
  printf '%s\\n' 'username=synthetic-user'
  printf '%s\\n' 'password=synthetic-secret'
  printf '\\n'
  exit 0
fi
exit 1
`);
  chmodSync(target, 0o555);
  if (symlink) symlinkSync(target, helper); else copyFileSync(target, helper);
  enableSyntheticControl(fx, ["credential-helper=synthetic"]);
  return marker;
}

test("actual runner handles deterministic interruption boundaries", async () => {
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    const fx = fixture();
    try { fx.makeManifest(); const result = await controlled(fx, ["wait:before-push"], "before-push", async () => {}, signal); assert.notEqual(result.code, 0); assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), ""); }
    finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    const fx = fixture();
    try { fx.makeManifest(); installPostReceive(fx, "touch \"$GIT_DIR/../push-hook-marker\"; while [ ! -e \"$GIT_DIR/../push-hook-release\" ]; do sleep 0.01; done"); const result = await controlled(fx, ["wait:before-push"], "before-push", async (child) => { writeFileSync(join(fx.repo, ".staffordos-exact-ref-test-control.before-push.release"), "release\n"); await waitFor(join(fx.root, "push-hook-marker")); child.kill(signal); writeFileSync(join(fx.root, "push-hook-release"), "release\n"); }); assert.notEqual(result.code, 0); }
    finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
  for (const mode of ["repeated", "sequential"]) {
    const fx = fixture();
    try { fx.makeManifest(); const result = await controlled(fx, ["wait:before-push"], "before-push", async (child) => { child.kill("SIGINT"); if (mode === "repeated") child.kill("SIGINT"); else child.kill("SIGTERM"); }); assert.notEqual(result.code, 0); assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), ""); }
    finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
  const accepted = fixture();
  try { accepted.makeManifest(); const result = await controlled(accepted, ["wait:after-push"], "after-push", async () => {}, "SIGTERM"); assert.notEqual(result.code, 0); assert.equal(git(accepted.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]).split(" ")[0], accepted.source); }
  finally { rmSync(accepted.root, { recursive: true, force: true }); }
  const cleanupFx = fixture();
  try { cleanupFx.makeManifest(); const result = await controlled(cleanupFx, ["wait:cleanup"], "cleanup", async (child) => { child.kill("SIGTERM"); }); assert.notEqual(result.code, 0); }
  finally { rmSync(cleanupFx.root, { recursive: true, force: true }); }
});

test("actual runner handles post-acceptance errors and unavailable verification", async () => {
  for (const output of ["", "malformed porcelain output", "truncated"]) {
    const fx = fixture();
    try { fx.makeManifest(); installPostReceive(fx, `printf '%s\\n' '${output}'; exit 1`); const result = invoke(fx); assert.equal(result.status, 0, `${result.stdout}${result.stderr}`); assert.equal(result.stdout.trim(), "PUSH_CONFIRMED"); assert.equal(git(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]).split(" ")[0], fx.source); }
    finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
  const unavailable = fixture();
  try { unavailable.makeManifest(); const result = await controlled(unavailable, ["wait:after-push", "unavailable:after-push"], "after-push", async () => {}); assert.notEqual(result.code, 0); assert.match(result.stdout, /PUSH_RESULT_UNKNOWN/); rmSync(`${unavailable.remote}.unavailable`, { recursive: true, force: true }); }
  finally { rmSync(unavailable.root, { recursive: true, force: true }); }
  const mismatch = fixture();
  try { mismatch.makeManifest(); installPostReceive(mismatch, `git --git-dir=\"$GIT_DIR\" update-ref refs/heads/careeros/synthetic-exact \"${mismatch.parent}\"; exit 0`); const result = invoke(mismatch); assert.notEqual(result.status, 0); assert.match(result.stdout, /PUSH_RESULT_UNKNOWN/); }
  finally { rmSync(mismatch.root, { recursive: true, force: true }); }
});

test("exact-ref runner performs a synthetic governed push and an idempotent retry", () => {
  const fx = fixture();
  try {
    fx.makeManifest();
    const first = invoke(fx);
    assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);
    assert.equal(first.stdout.trim(), "PUSH_CONFIRMED");
    assert.equal(git(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]).split(" ")[0], fx.source);
    assert.equal(gitMaybe(fx.remote, ["show-ref", "--tags"]), "");

    fx.makeManifest({ destinationPrecondition: "EXACT_SHA", expectedDestinationSha: fx.source });
    const retry = invoke(fx);
    assert.equal(retry.status, 0, `${retry.stdout}\n${retry.stderr}`);
    assert.equal(retry.stdout.trim(), "PUSH_CONFIRMED");
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("exact-ref runner rejects a configured push endpoint different from the authorized endpoint", () => {
  const fx = fixture();
  const alternate = join(fx.root, "alternate.git");
  try {
    execFileSync("git", ["init", "--bare", alternate]);
    fx.makeManifest();
    git(fx.repo, ["config", "remote.origin.pushurl", alternate]);
    const result = invoke(fx);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_REMOTE_IDENTITY/);
    assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "");
    assert.equal(gitMaybe(alternate, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "");
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("exact-ref runner rejects multiple push URLs, included rewrites, and credential-bearing authorization", () => {
  const fx = fixture();
  try {
    const alternate = join(fx.root, "alternate.git");
    execFileSync("git", ["init", "--bare", alternate]);
    fx.makeManifest();
    git(fx.repo, ["config", "--add", "remote.origin.pushurl", alternate]);
    git(fx.repo, ["config", "--add", "remote.origin.pushurl", fx.remote]);
    const multiple = invoke(fx);
    assert.match(`${multiple.stdout}${multiple.stderr}`, /PUSH_BLOCKED_REMOTE_IDENTITY/);
    git(fx.repo, ["config", "--unset-all", "remote.origin.pushurl"]);
    const included = join(fx.root, "included.gitconfig");
    writeFileSync(included, `[url "${alternate}"]\n  insteadOf = ${fx.remote}\n`);
    git(fx.repo, ["config", "include.path", included]);
    const rewrite = invoke(fx);
    assert.match(`${rewrite.stdout}${rewrite.stderr}`, /PUSH_BLOCKED_REMOTE_IDENTITY/);
    git(fx.repo, ["config", "--unset", "include.path"]);
    fx.makeManifest({ canonicalRemoteIdentity: "https://synthetic-user:synthetic-secret@example.invalid/repo.git" });
    const credential = invoke(fx);
    assert.match(`${credential.stdout}${credential.stderr}`, /PUSH_BLOCKED_(?:DESTINATION_REF|REMOTE_IDENTITY|SYNTHETIC_BOUNDARY)/);
    assert.doesNotMatch(`${credential.stdout}${credential.stderr}`, /synthetic-secret/);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("exact-ref runner rejects repository-local credential helper configuration", () => {
  for (const [name, values] of [
    ["helper", [["credential.https://github.com.helper", "!synthetic-helper"]]],
    ["empty reset followed by helper", [["credential.https://github.com.helper", ""], ["credential.https://github.com.helper", "!synthetic-helper"]]],
  ]) {
    const fx = fixture();
    try {
      fx.makeManifest();
      for (const [key, value] of values) git(fx.repo, ["config", "--add", key, value]);
      const result = invoke(fx);
      assert.notEqual(result.status, 0, name);
      assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_CREDENTIAL_CONFIG/, name);
      assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "", name);
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
});

test("exact-ref runner rejects repository-local HTTP transport configuration", () => {
  for (const [key, value] of [
    ["http.proxy", "http://127.0.0.1:9"],
    ["http.sslVerify", "false"],
    ["http.https://github.com/.proxy", "http://127.0.0.1:9"],
  ]) {
    const fx = fixture();
    try {
      fx.makeManifest();
      git(fx.repo, ["config", key, value]);
      const result = invoke(fx);
      assert.notEqual(result.status, 0, key);
      assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_TRANSPORT_CONFIG/, key);
      assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "", key);
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
});

test("exact-ref runner rejects dangerous per-worktree configuration", () => {
  for (const [key, value] of [
    ["url./synthetic/other.insteadOf", "file://synthetic"],
    ["credential.https://github.com.helper", "!synthetic-helper"],
    ["http.proxy", "http://127.0.0.1:9"],
  ]) {
    const fx = fixture();
    try {
      fx.makeManifest();
      git(fx.repo, ["config", "extensions.worktreeConfig", "true"]);
      git(fx.repo, ["config", "--worktree", key, value]);
      const result = invoke(fx);
      assert.notEqual(result.status, 0, key);
      assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_WORKTREE_CONFIG/, key);
      assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "", key);
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
});

test("exact-ref runner rejects local URL rewrites and malformed Git refs", () => {
  const cases = [
    ["insteadOf", ["url./synthetic/other.insteadOf", "file://synthetic"]],
    ["pushInsteadOf", ["url./synthetic/other.pushInsteadOf", "file://synthetic"]],
  ];
  for (const [name, config] of cases) {
    const fx = fixture();
    try {
      fx.makeManifest();
      git(fx.repo, ["config", config[0], config[1]]);
      const result = invoke(fx);
      assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_REMOTE_IDENTITY/, name);
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
  const fx = fixture();
  try {
    fx.makeManifest({ destinationRef: "refs/heads/careeros/name@{bad}" });
    const result = invoke(fx);
    assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_DESTINATION_REF/);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("exact-ref runner permits only the two owner-authorized destinations for RStaff/cart-agent", () => {
  const authorized = fixture();
  try {
    authorized.makeManifest(pr133Authorization());
    const result = invoke(authorized);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_(?:AUTHORIZATION|DESTINATION_REF)/);
  } finally { rmSync(authorized.root, { recursive: true, force: true }); }

  const confirmation = fixture();
  try {
    confirmation.makeManifest({ ...pr133Authorization(), expectedDestinationSha: "c902c6abadb5200b4892a6dd10420b5ab1b1e04e" });
    const result = invoke(confirmation);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_(?:AUTHORIZATION|DESTINATION_REF)/);
  } finally { rmSync(confirmation.root, { recursive: true, force: true }); }

  const exact = fixture();
  try {
    exact.makeManifest({ destinationRef: "refs/heads/careos/migration-runner-v1", canonicalRemoteIdentity: "https://github.com/RStaff/cart-agent.git" });
    const result = invoke(exact);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_DESTINATION_REF/);
    assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_AUTHORIZATION/);
  } finally { rmSync(exact.root, { recursive: true, force: true }); }

  const scanner = fixture();
  try {
    scanner.makeManifest(scannerRepairAuthorization());
    const result = invoke(scanner);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_(?:AUTHORIZATION|DESTINATION_REF)/);
  } finally { rmSync(scanner.root, { recursive: true, force: true }); }

  const scannerFollowup = fixture();
  try {
    scannerFollowup.makeManifest(scannerRepairFollowupAuthorization());
    const result = invoke(scannerFollowup);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_(?:AUTHORIZATION|DESTINATION_REF)/);
  } finally { rmSync(scannerFollowup.root, { recursive: true, force: true }); }

  const scannerSecondFollowup = fixture();
  try {
    scannerSecondFollowup.makeManifest(scannerRepairSecondFollowupAuthorization());
    const result = invoke(scannerSecondFollowup);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_(?:AUTHORIZATION|DESTINATION_REF)/);
  } finally { rmSync(scannerSecondFollowup.root, { recursive: true, force: true }); }

  const scannerThirdFollowup = fixture();
  try {
    scannerThirdFollowup.makeManifest(scannerRepairThirdFollowupAuthorization());
    const result = invoke(scannerThirdFollowup);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_(?:AUTHORIZATION|DESTINATION_REF)/);
  } finally { rmSync(scannerThirdFollowup.root, { recursive: true, force: true }); }

  for (const [name, overrides] of [
    ["other careos ref", { destinationRef: "refs/heads/careos/another-branch", canonicalRemoteIdentity: "https://github.com/RStaff/cart-agent.git" }],
    ["same ref in another repository", { destinationRef: "refs/heads/careos/migration-runner-v1", canonicalRemoteIdentity: "https://github.com/RStaff/another-repository.git" }],
    ["scanner ref in another repository", { destinationRef: "refs/heads/careos/secret-scan-scope-20261027", canonicalRemoteIdentity: "https://github.com/RStaff/another-repository.git" }],
    ["neighbor scanner ref", { destinationRef: "refs/heads/careos/secret-scan-scope-20261027-other", canonicalRemoteIdentity: "https://github.com/RStaff/cart-agent.git" }],
    ["existing governed namespace on official repository", { destinationRef: "refs/heads/staffordos/another-branch", canonicalRemoteIdentity: "https://github.com/RStaff/cart-agent.git" }],
  ]) {
    const rejected = fixture();
    try {
      rejected.makeManifest(overrides);
      const result = invoke(rejected);
      assert.notEqual(result.status, 0, name);
      assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_DESTINATION_REF/, name);
    } finally { rmSync(rejected.root, { recursive: true, force: true }); }
  }
});

test("normal invocation rejects non-official remotes even in governed namespaces", () => {
  const fx = fixture();
  try {
    fx.makeManifest();
    const result = invoke(fx, {}, false);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_DESTINATION_REF/);
    assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "");
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("synthetic mode rejects traversal and symlink remote identities", () => {
  const traversal = fixture();
  try {
    traversal.makeManifest({ canonicalRemoteIdentity: `${traversal.root}/nested/../remote.git` });
    const result = invoke(traversal);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_SYNTHETIC_BOUNDARY/);
  } finally { rmSync(traversal.root, { recursive: true, force: true }); }

  const linked = fixture();
  const outside = mkdtempSync(join(tmpdir(), "staffordos-exact-ref-outside-"));
  try {
    const outsideRemote = join(outside, "outside.git");
    execFileSync("git", ["init", "--bare", outsideRemote]);
    const link = join(linked.root, "linked.git");
    symlinkSync(outsideRemote, link);
    linked.makeManifest({ canonicalRemoteIdentity: link });
    const result = invoke(linked);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_SYNTHETIC_BOUNDARY/);
  } finally {
    rmSync(linked.root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("exact-ref runner rejects authority, scope, namespace, and injection violations", () => {
  const cases = [
    ["wrong remote identity", { canonicalRemoteIdentity: "/synthetic/wrong" }, "PUSH_BLOCKED_SYNTHETIC_BOUNDARY"],
    ["wrong source", { sourceCommitSha: "0000000000000000000000000000000000000000" }, "PUSH_BLOCKED_SOURCE"],
    ["short source", { sourceCommitSha: "0".repeat(39) }, "PUSH_BLOCKED_SOURCE_SHA"],
    ["long source", { sourceCommitSha: "0".repeat(64) }, "PUSH_BLOCKED_SOURCE_SHA"],
    ["wrong tree", { sourceTreeSha: "0000000000000000000000000000000000000000" }, "PUSH_BLOCKED_TREE"],
    ["wrong parent", { expectedParentSha: "0000000000000000000000000000000000000000" }, "PUSH_BLOCKED_PARENT"],
    ["disallowed destination", { destinationRef: "refs/tags/synthetic" }, "PUSH_BLOCKED_DESTINATION_REF"],
    ["force policy", { noForce: false }, "PUSH_BLOCKED_FORCE_POLICY"],
    ["unknown field", { unexpected: true }, "PUSH_BLOCKED_MANIFEST_SHAPE"],
    ["duplicate file", { approvedFiles: [{ path: "approved.txt", mode: "100644", sha256: "0".repeat(64) }, { path: "approved.txt", mode: "100644", sha256: "0".repeat(64) }] }, "PUSH_BLOCKED_FILE_DUPLICATE"],
  ];
  for (const [name, overrides, expected] of cases) {
    const fx = fixture();
    try {
      fx.makeManifest(overrides);
      const result = invoke(fx);
      assert.match(`${result.stdout}${result.stderr}`, new RegExp(expected), name);
      assert.notEqual(result.status, 0, name);
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
  const fx = fixture();
  try {
    fx.makeManifest();
    const raw = readFileSync(fx.manifestPath, "utf8");
    writeFileSync(fx.manifestPath, raw.replace("\"noForce\":true", "\"noForce\":true,\"noForce\":true"));
    const duplicate = invoke(fx);
    assert.match(`${duplicate.stdout}${duplicate.stderr}`, /PUSH_BLOCKED_MANIFEST_DUPLICATE_KEY/);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("exact-ref runner rejects dirty, divergent, and unsafe destination states", () => {
  const fx = fixture();
  try {
    fx.makeManifest();
    writeFileSync(join(fx.repo, "unapproved.txt"), "dirty\n");
    const dirty = invoke(fx);
    assert.match(`${dirty.stdout}${dirty.stderr}`, /PUSH_BLOCKED_DIRTY_WORKTREE/);
    rmSync(join(fx.repo, "unapproved.txt"));
    const first = invoke(fx);
    assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);

    fx.makeManifest();
    const divergent = git(fx.repo, ["commit-tree", fx.tree, "-m", "synthetic divergent"]);
    git(fx.repo, ["push", "origin", `${divergent}:refs/heads/careeros/synthetic-divergent`]);
    git(fx.remote, ["update-ref", "refs/heads/careeros/synthetic-exact", divergent]);
    const rejected = invoke(fx);
    assert.match(`${rejected.stdout}${rejected.stderr}`, /PUSH_BLOCKED_DESTINATION/);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("actual trusted Git client argv is captured through synthetic-only Trace2", async () => {
  const fx = fixture();
  try {
    fx.makeManifest();
    const observed = join(fx.root, "observed-trace.json");
    const result = await controlled(fx, ["wait:cleanup"], "cleanup", async () => {
      copyFileSync(readFileSync(join(fx.repo, ".staffordos-exact-ref-test-control.trace-path"), "utf8").trim(), observed);
    });
    assert.equal(result.code, 0, `${result.stdout}\n${result.stderr}`);
    const events = readFileSync(observed, "utf8").trim().split(/\n/u).filter(Boolean).map((line) => JSON.parse(line));
    const starts = events.filter((event) => event.event === "start" && Array.isArray(event.argv));
    const pushes = starts.filter((event) => event.argv.includes("push"));
    assert.equal(pushes.length, 1);
    const argv = pushes[0].argv;
    assert.match(argv[0], /^\/.+\/git$/u);
    assert.match(argv[2], /^\/tmp\/staffordos-exact-ref-push\.[A-Za-z0-9]+\/network\.git$/u);
    assert.deepEqual(argv.slice(1), ["-C", argv[2], "-c", "core.hooksPath=" + argv[4].split("=")[1], "push", "--porcelain", "--no-follow-tags", "--force-with-lease=refs/heads/careeros/synthetic-exact:", fx.remote, `${fx.source}:refs/heads/careeros/synthetic-exact`]);
    assert.equal(argv.filter((arg) => arg === "push").length, 1);
    assert.equal(argv.filter((arg) => arg.includes(":refs/heads/")).length, 1);
    assert.equal(argv.filter((arg) => arg.startsWith("--force-with-lease=")).length, 1);
    const prohibited = new Set(["--force", "--force-with-lease", "--tags", "--follow-tags", "--all", "--mirror", "--atomic", "--push-option", "-o"]);
    assert.equal(argv.some((arg) => prohibited.has(arg) || arg.startsWith("+") || arg.includes("*")), false);
    assert.equal(result.stdout.includes("trace2"), false);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("Trace2 evidence is synthetic-only, caller-independent, and fails closed when malformed", () => {
  const fx = fixture();
  try {
    const callerTrace = join(fx.root, "caller-trace.json");
    fx.makeManifest({ tracePath: callerTrace });
    const rejected = invoke(fx, { GIT_TRACE2_EVENT: callerTrace });
    assert.notEqual(rejected.status, 0);
    assert.equal(existsSync(callerTrace), false);
    assert.match(`${rejected.stdout}${rejected.stderr}`, /PUSH_BLOCKED_MANIFEST_SHAPE/);

    fx.makeManifest();
    const result = invoke(fx, { GIT_TRACE2_EVENT: callerTrace });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(existsSync(callerTrace), false);
    assert.throws(() => JSON.parse("not-json"));
    assert.throws(() => JSON.parse(""));
    const duplicatePushEvents = [{ event: "start", argv: ["/usr/bin/git", "push"] }, { event: "start", argv: ["/usr/bin/git", "push"] }];
    assert.notEqual(duplicatePushEvents.filter((event) => event.argv.includes("push")).length, 1);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("actual runner rejects the complete malformed destination-ref matrix", () => {
  const refs = [
    "refs/heads/careeros/", "refs/heads/careeros/a//b", "refs/heads/careeros/./b", "refs/heads/careeros/../b",
    "refs/heads/careeros/a/", "refs/heads/careeros/a.", "refs/heads/careeros/a.lock", "refs/heads/careeros/a@{b}",
    "refs/heads/careeros/a b", "refs/heads/careeros/a\tb", "refs/heads/careeros/a\nb", "refs/heads/careeros/a\u0001b",
    "refs/heads/careeros/a\\b", "refs/heads/careeros/a:b", "refs/heads/careeros/a~b", "refs/heads/careeros/a^b",
    "refs/heads/careeros/a?b", "refs/heads/careeros/a[b", "refs/heads/careeros/a*b", "refs/heads/careeros/-a",
    ":refs/heads/careeros/a", "refs/tags/synthetic", "HEAD", "refs/heads/careeros/é", "refs/heads/careeros/a refs/heads/staffordos/b",
  ];
  for (const destinationRef of refs) {
    const fx = fixture();
    try { fx.makeManifest({ destinationRef }); const result = invoke(fx); assert.notEqual(result.status, 0, destinationRef); assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_(DESTINATION|MANIFEST)/u, destinationRef); assert.equal(gitMaybe(fx.remote, ["show-ref", destinationRef]), "", destinationRef); }
    finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
});

test("actual runner rejects each authority race at the final validation boundary", async () => {
  const cases = [
    ["remote URL", (fx) => git(fx.repo, ["config", "remote.origin.url", join(fx.root, "other.git")]), /PUSH_BLOCKED_REMOTE_IDENTITY/],
    ["push URL", (fx) => git(fx.repo, ["config", "remote.origin.pushurl", join(fx.root, "other.git")]), /PUSH_BLOCKED_REMOTE_IDENTITY/],
    ["insteadOf", (fx) => git(fx.repo, ["config", "url." + join(fx.root, "other.git") + ".insteadOf", fx.remote]), /PUSH_BLOCKED_REMOTE_IDENTITY/],
    ["pushInsteadOf", (fx) => git(fx.repo, ["config", "url." + join(fx.root, "other.git") + ".pushInsteadOf", fx.remote]), /PUSH_BLOCKED_REMOTE_IDENTITY/],
    ["included config", (fx) => { const included = join(fx.root, "race.gitconfig"); writeFileSync(included, `[url "${join(fx.root, "other.git")}"]\n  insteadOf = ${fx.remote}\n`); git(fx.repo, ["config", "include.path", included]); }, /PUSH_BLOCKED_REMOTE_IDENTITY/],
    ["dirty worktree", (fx) => writeFileSync(join(fx.repo, "race-dirty.txt"), "synthetic\n"), /PUSH_BLOCKED_REPOSITORY_STATE/],
    ["index", (fx) => { writeFileSync(join(fx.repo, "race-index.txt"), "synthetic\n"); git(fx.repo, ["add", "race-index.txt"]); }, /PUSH_BLOCKED_REPOSITORY_STATE/],
    ["protected base", (fx) => { const changed = git(fx.repo, ["commit-tree", fx.tree, "-m", "synthetic protected-base race"]); git(fx.repo, ["push", "origin", `${changed}:refs/heads/careeros/race-base`]); git(fx.remote, ["update-ref", "refs/heads/careeros/private-beta", changed]); }, /PUSH_BLOCKED_BASE/],
    ["credential helper", (fx) => git(fx.repo, ["config", "credential.https://github.com.helper", "!synthetic-helper"]), /PUSH_BLOCKED_CREDENTIAL_CONFIG/],
    ["HTTP transport", (fx) => git(fx.repo, ["config", "http.proxy", "http://127.0.0.1:9"]), /PUSH_BLOCKED_TRANSPORT_CONFIG/],
    ["destination", (fx) => git(fx.remote, ["update-ref", "refs/heads/careeros/synthetic-exact", fx.parent]), /PUSH_BLOCKED_DESTINATION/],
    ["source ref movement", (fx) => git(fx.repo, ["update-ref", "refs/heads/mutable-source", fx.parent]), /^PUSH_CONFIRMED$/],
  ];
  for (const [name, mutate, expected] of cases) {
    const fx = fixture();
    try {
      fx.makeManifest();
      git(fx.repo, ["branch", "mutable-source", fx.source]);
      const result = await controlled(fx, ["wait:after-validation"], "after-validation", async () => { mutate(fx); });
      assert.match(result.stdout.trim(), expected, name);
      if (name === "source ref movement") assert.equal(git(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]).split(" ")[0], fx.source, name);
      else if (name === "destination") assert.equal(git(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]).split(" ")[0], fx.parent, name);
      else assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "", name);
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
});

test("network operations ignore source-repository config changes after isolation", async () => {
  const fx = fixture();
  try {
    fx.makeManifest();
    const result = await controlled(fx, ["wait:before-push"], "before-push", async () => {
      git(fx.repo, ["config", "url." + join(fx.root, "attacker.git") + ".insteadOf", fx.remote]);
      git(fx.repo, ["config", "http.proxy", "http://127.0.0.1:9"]);
    });
    assert.equal(result.code, 0, `${result.stdout}${result.stderr}`);
    assert.equal(git(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]).split(" ")[0], fx.source);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("source repository fsmonitor commands are disabled before status checks", () => {
  const fx = fixture();
  const marker = join(fx.root, "fsmonitor-marker");
  const monitor = join(fx.root, "fsmonitor.sh");
  try {
    writeFileSync(monitor, `#!/bin/sh\ntouch '${marker}'\nexit 1\n`);
    chmodSync(monitor, 0o755);
    git(fx.repo, ["config", "core.fsmonitor", monitor]);
    fx.makeManifest();
    const result = invoke(fx);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_REPOSITORY_CONFIG/);
    assert.equal(existsSync(marker), false);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("atomic leases reject destination changes after the final read", async () => {
  const absent = fixture();
  try {
    absent.makeManifest();
    const result = await controlled(absent, ["wait:before-push"], "before-push", async () => {
      git(absent.remote, ["update-ref", "refs/heads/careeros/synthetic-exact", absent.parent]);
    });
    assert.notEqual(result.code, 0);
    assert.equal(git(absent.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]).split(" ")[0], absent.parent);
  } finally { rmSync(absent.root, { recursive: true, force: true }); }

  const exact = fixture();
  try {
    git(exact.remote, ["update-ref", "refs/heads/careeros/synthetic-exact", exact.parent]);
    exact.makeManifest({ destinationPrecondition: "EXACT_SHA", expectedDestinationSha: exact.parent });
    const result = await controlled(exact, ["wait:before-push"], "before-push", async () => {
      git(exact.remote, ["update-ref", "-d", "refs/heads/careeros/synthetic-exact"]);
    });
    assert.notEqual(result.code, 0);
    assert.equal(gitMaybe(exact.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "");
  } finally { rmSync(exact.root, { recursive: true, force: true }); }
});

test("confirmation-only retries revalidate remote state before success", async () => {
  for (const [name, mutate] of [
    ["destination", (fx) => git(fx.remote, ["update-ref", "refs/heads/careeros/synthetic-exact", fx.parent])],
    ["protected base", (fx) => git(fx.remote, ["update-ref", "refs/heads/careeros/private-beta", fx.source])],
  ]) {
    const fx = fixture();
    try {
      fx.makeManifest();
      const first = invoke(fx);
      assert.equal(first.status, 0, `${name}: ${first.stdout}${first.stderr}`);
      fx.makeManifest({ destinationPrecondition: "EXACT_SHA", expectedDestinationSha: fx.source });
      const retry = await controlled(fx, ["wait:before-push"], "before-push", async () => mutate(fx));
      assert.notEqual(retry.code, 0, name);
      assert.match(retry.stdout, /PUSH_RESULT_UNKNOWN/, name);
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
});

test("replacement refs cannot substitute validated source content", () => {
  const fx = fixture();
  try {
    writeFileSync(join(fx.repo, "approved.txt"), "replacement content\n");
    git(fx.repo, ["add", "approved.txt"]);
    const replacementTree = git(fx.repo, ["write-tree"]);
    const replacement = git(fx.repo, ["commit-tree", replacementTree, "-p", fx.parent, "-m", "synthetic replacement"]);
    git(fx.repo, ["reset", "--hard", fx.source]);
    git(fx.repo, ["replace", fx.source, replacement]);
    fx.makeManifest({
      sourceTreeSha: replacementTree,
      approvedFiles: [{ path: "approved.txt", mode: "100644", sha256: sha256(Buffer.from("replacement content\n")) }],
    });
    const result = invoke(fx, { GIT_NO_REPLACE_OBJECTS: "0", GIT_REPLACE_REF_BASE: "refs/replace" });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_TREE/);
    assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "");
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("actual push publishes one exact ref and no tag or second ref", () => {
  const fx = fixture();
  try {
    fx.makeManifest();
    const received = join(fx.root, "received.txt");
    installPostReceive(fx, `cat > "${received}"`);
    const result = invoke(fx);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const lines = readFileSync(received, "utf8").trim().split(/\n/u);
    assert.equal(lines.length, 1);
    const [oldSha, newSha, ref] = lines[0].split(" ");
    assert.equal(oldSha, "0".repeat(40));
    assert.equal(newSha, fx.source);
    assert.equal(ref, "refs/heads/careeros/synthetic-exact");
    assert.equal(gitMaybe(fx.remote, ["show-ref", "--tags"]), "");
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("file binding accepts explicit mixed modes and rejects every unsafe mode", () => {
  const passing = fixture({ mixed: true });
  try {
    const manifest = passing.makeManifest();
    const result = invoke(passing);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /PUSH_CONFIRMED/);
    assert.equal(git(passing.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]).split(" ")[0], passing.source);
    assert.deepEqual(manifest.approvedFiles.map((file) => file.mode), ["100644", "100755"]);
  } finally { rmSync(passing.root, { recursive: true, force: true }); }

  const cases = [
    ["declared 100644 for actual 100755", (files) => files.map((file) => file.path === "executable.sh" ? { ...file, mode: "100644" } : file)],
    ["declared 100755 for actual 100644", (files) => files.map((file) => file.path === "approved.txt" ? { ...file, mode: "100755" } : file)],
    ["missing mode", (files) => files.map(({ mode, ...file }) => file)],
    ["malformed mode", (files) => files.map((file) => file.path === "executable.sh" ? { ...file, mode: "100755 " } : file)],
    ["symlink mode", (files) => files.map((file) => file.path === "executable.sh" ? { ...file, mode: "120000" } : file)],
    ["submodule mode", (files) => files.map((file) => file.path === "executable.sh" ? { ...file, mode: "160000" } : file)],
    ["unknown mode", (files) => files.map((file) => file.path === "executable.sh" ? { ...file, mode: "100700" } : file)],
  ];
  for (const [name, alter] of cases) {
    const fx = fixture({ mixed: true });
    try {
      const manifest = fx.makeManifest();
      writeFileSync(fx.manifestPath, JSON.stringify({ ...manifest, approvedFiles: alter(manifest.approvedFiles) }));
      const result = invoke(fx);
      assert.notEqual(result.status, 0, name);
      assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_FILE_(MODE|ENTRY|MANIFEST|BINDING)/u, name);
      assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "", name);
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
});

test("actual runner protects synthetic temporary state and cleanup boundaries", async () => {
  const cases = [
    ["neighbor preserved", async (fx) => { const neighbor = join(fx.root, "neighbor"); writeFileSync(neighbor, "keep\n"); const result = invoke(fx); assert.equal(result.status, 0); assert.equal(readFileSync(neighbor, "utf8"), "keep\n"); }],
    ["precreated temp candidate harmless", async (fx) => { const candidate = join(tmpdir(), "staffordos-exact-ref-push.AAAAAA"); writeFileSync(candidate, "keep\n"); try { const result = invoke(fx); assert.equal(result.status, 0); assert.equal(readFileSync(candidate, "utf8"), "keep\n"); } finally { rmSync(candidate, { force: true }); } }],
    ["temporary symlink substitution", async (fx) => { const neighbor = join(fx.root, "neighbor"); mkdirSync(neighbor, { mode: 0o700 }); const result = await controlled(fx, ["wait:after-validation"], "after-validation", async () => { const temp = readFileSync(join(fx.repo, ".staffordos-exact-ref-test-control.tmp-path"), "utf8").trim(); rmSync(temp, { recursive: true, force: true }); symlinkSync(neighbor, temp); }); assert.notEqual(result.code, 0); assert.equal(existsSync(join(neighbor, "hooks")), false); }],
    ["temporary regular-file substitution", async (fx) => { const result = await controlled(fx, ["wait:after-validation"], "after-validation", async () => { const temp = readFileSync(join(fx.repo, ".staffordos-exact-ref-test-control.tmp-path"), "utf8").trim(); rmSync(temp, { recursive: true, force: true }); writeFileSync(temp, "not a directory\n"); }); assert.notEqual(result.code, 0); }],
    ["control symlink rejected", async (fx) => { const control = join(fx.repo, ".staffordos-exact-ref-test-control"); const target = join(fx.root, "control-target"); rmSync(control, { force: true }); writeFileSync(target, "wait:before-push\n"); symlinkSync(target, control); const result = invoke(fx, {}, true); assert.notEqual(result.status, 0); assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_SYNTHETIC_BOUNDARY/); }],
    ["cleanup preserves neighbor on interruption", async (fx) => { const neighbor = join(fx.root, "neighbor"); writeFileSync(neighbor, "keep\n"); const result = await controlled(fx, ["wait:cleanup"], "cleanup", async (child) => { child.kill("SIGTERM"); }); assert.notEqual(result.code, 0); assert.equal(readFileSync(neighbor, "utf8"), "keep\n"); }],
    ["repeated cleanup signal", async (fx) => { const result = await controlled(fx, ["wait:before-push"], "before-push", async (child) => { child.kill("SIGTERM"); child.kill("SIGTERM"); }); assert.notEqual(result.code, 0); assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), ""); }],
    ["stale temporary residue ignored", async (fx) => { const residue = join(tmpdir(), "staffordos-exact-ref-push.ZZZZZZ"); mkdirSync(residue, { mode: 0o700 }); try { const result = invoke(fx); assert.equal(result.status, 0); assert.equal(existsSync(residue), true); } finally { rmSync(residue, { recursive: true, force: true }); } }],
    ["incomplete synthetic control residue ignored", async (fx) => { const residue = join(fx.repo, ".git", "runner-control.partial"); writeFileSync(residue, "incomplete\n"); const result = invoke(fx); assert.equal(result.status, 0); assert.equal(existsSync(residue), true); }],
  ];
  for (const [name, run] of cases) {
    const fx = fixture();
    try { fx.makeManifest(); await run(fx); } finally { rmSync(fx.root, { recursive: true, force: true }); }
    assert.ok(name);
  }
});

test("runner uses one exact refspec and refuses production invocation", () => {
  const source = readFileSync(runner, "utf8");
  assert.match(source, /push --porcelain/);
  assert.doesNotMatch(source, /push --all|push --mirror|(?:^|\s)--force(?:\s|$)/m);
  assert.match(source, /--force-with-lease=\$DEST:/u);
  assert.match(source, /PR133_LEGACY_DESTINATION/u);
});

test("actual runner classifies bounded synthetic push failures without disclosure or persistence", () => {
  const cases = [
    ["Could not resolve host: synthetic.invalid", "PUSH_FAILED_DNS"],
    ["fatal: Authentication failed for synthetic endpoint", "PUSH_FAILED_AUTHENTICATION"],
    ["ERROR: permission denied to synthetic repository", "PUSH_FAILED_AUTHORIZATION"],
    ["remote: Repository not found.", "PUSH_FAILED_REPOSITORY_NOT_FOUND_OR_UNDISCLOSED"],
    ["remote rejected synthetic ref (non-fast-forward)", "PUSH_FAILED_REF_CREATION_REJECTED"],
    ["pre-receive hook declined", "PUSH_FAILED_REMOTE_POLICY"],
    ["fatal: connection timed out", "PUSH_FAILED_TRANSPORT"],
    ["arbitrary synthetic server message", "PUSH_FAILED_UNKNOWN"],
    ["Could not resolve host: synthetic.invalid\npermission denied", "PUSH_FAILED_UNKNOWN"],
    ["credential=https://user:token@synthetic.invalid", "PUSH_FAILED_UNKNOWN"],
  ];
  for (const [output, expected] of cases) {
    const fx = fixture();
    try {
      fx.makeManifest();
      installPreReceiveFailure(fx, output);
      const result = invoke(fx, {}, true);
      assert.notEqual(result.status, 0);
      assert.equal(result.stdout.trim(), `${expected} exit_status=1 destination=ABSENT protected_base=UNCHANGED`);
      assert.doesNotMatch(`${result.stdout}${result.stderr}`, /synthetic\.invalid|token|credential|arbitrary synthetic/u);
      assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "");
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
  for (const output of ["", "truncated\u0000output", "x".repeat(65537), "first\\nsecond"]) {
    const fx = fixture();
    try {
      fx.makeManifest();
      installPreReceiveFailure(fx, output);
      const result = invoke(fx, {}, true);
      assert.notEqual(result.status, 0);
      assert.equal(result.stdout.trim(), "PUSH_FAILED_UNKNOWN exit_status=1 destination=ABSENT protected_base=UNCHANGED");
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
});

test("runner uses a trusted synthetic GitHub helper with a restrictive scoped config", () => {
  const fx = fixture();
  try {
    const marker = installSyntheticGh(fx);
    fx.makeManifest();
    const result = invoke(fx, { GIT_CONFIG_GLOBAL: join(fx.root, "caller-config"), GH_EXECUTABLE: join(fx.root, "caller-gh") }, true);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.equal(result.stdout.trim(), "PUSH_CONFIRMED");
    const observed = readFileSync(marker, "utf8").trimEnd().split("\n");
    assert.deepEqual(observed.slice(0, 3), ["0", "", ""]);
    assert.equal(observed.at(-1), "400");
    assert.equal(git(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]).split(" ")[0], fx.source);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("runner resolves the expected helper symlink and rejects missing or non-executable helpers", () => {
  const symlinkFx = fixture();
  try {
    installSyntheticGh(symlinkFx, { symlink: true });
    symlinkFx.makeManifest();
    const symlinkResult = invoke(symlinkFx, {}, true);
    assert.equal(symlinkResult.status, 0, `${symlinkResult.stdout}${symlinkResult.stderr}`);
  } finally { rmSync(symlinkFx.root, { recursive: true, force: true }); }

  for (const nonExecutable of [false, true]) {
    const fx = fixture();
    try {
      if (nonExecutable) {
        installSyntheticGh(fx);
        chmodSync(join(fx.repo, ".staffordos-exact-ref-test-gh"), 0o600);
      } else {
        rmSync(join(fx.repo, ".staffordos-exact-ref-test-gh"));
        rmSync(join(fx.repo, ".staffordos-exact-ref-test-gh-real"));
        enableSyntheticControl(fx, ["credential-helper=synthetic"]);
      }
      fx.makeManifest();
      const result = invoke(fx, { GH_EXECUTABLE: join(fx.root, "caller-gh") }, true);
      assert.notEqual(result.status, 0);
      assert.match(result.stdout, /PUSH_BLOCKED_CREDENTIAL_HELPER/);
      assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "");
    } finally { rmSync(fx.root, { recursive: true, force: true }); }
  }
});

test("runner accepts a Homebrew-style Cellar chain and rejects unsafe helper substitutions", () => {
  const homebrew = fixture();
  try {
    installSyntheticGh(homebrew, { symlink: true, homebrewStyle: true });
    homebrew.makeManifest();
    const result = invoke(homebrew, {}, true);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  } finally { rmSync(homebrew.root, { recursive: true, force: true }); }

  const unsafeParent = fixture();
  try {
    installSyntheticGh(unsafeParent);
    chmodSync(unsafeParent.repo, 0o777);
    unsafeParent.makeManifest();
    const result = invoke(unsafeParent, {}, true);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout.trim(), "PUSH_BLOCKED_CREDENTIAL_HELPER");
    assert.equal(result.stderr, "");
  } finally { rmSync(unsafeParent.root, { recursive: true, force: true }); }

  const writable = fixture();
  try {
    installSyntheticGh(writable);
    chmodSync(join(writable.repo, ".staffordos-exact-ref-test-gh-real"), 0o755);
    chmodSync(join(writable.repo, ".staffordos-exact-ref-test-gh"), 0o755);
    writable.makeManifest();
    const result = invoke(writable, {}, true);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout.trim(), "PUSH_BLOCKED_CREDENTIAL_HELPER");
    assert.equal(result.stderr, "");
  } finally { rmSync(writable.root, { recursive: true, force: true }); }

  const escaping = fixture();
  try {
    const outside = join(escaping.root, "outside-gh");
    writeFileSync(outside, "#!/bin/sh\nexit 0\n");
    chmodSync(outside, 0o555);
    installSyntheticGh(escaping);
    rmSync(join(escaping.repo, ".staffordos-exact-ref-test-gh"));
    symlinkSync(outside, join(escaping.repo, ".staffordos-exact-ref-test-gh"));
    escaping.makeManifest();
    const result = invoke(escaping, {}, true);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout.trim(), "PUSH_BLOCKED_CREDENTIAL_HELPER");
    assert.equal(result.stderr, "");
  } finally { rmSync(escaping.root, { recursive: true, force: true }); }
});

test("runner rejects invalid helper authentication before any synthetic push", () => {
  const fx = fixture();
  try {
    installSyntheticGh(fx, { authStatus: 1 });
    fx.makeManifest();
    const result = invoke(fx, {}, true);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout.trim(), "PUSH_BLOCKED_CREDENTIAL_HELPER");
    assert.equal(gitMaybe(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "");
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("runner ignores caller helper and credential environment overrides", () => {
  const fx = fixture();
  try {
    installSyntheticGh(fx);
    fx.makeManifest();
    const result = invoke(fx, {
      GH_AUTH_HELPER: join(fx.root, "caller-helper"),
      GIT_CREDENTIAL_HELPER: join(fx.root, "caller-helper"),
      GIT_ASKPASS: join(fx.root, "caller-askpass"),
      SSH_ASKPASS: join(fx.root, "caller-ssh-askpass"),
      GH_TOKEN: "caller-token",
      GITHUB_TOKEN: "caller-token",
      GH_CONFIG_DIR: join(fx.root, "caller-gh-config"),
      HOME: join(fx.root, "caller-home"),
      XDG_CONFIG_HOME: join(fx.root, "caller-xdg"),
      GH_HOST: "caller.invalid",
      GIT_EXEC_PATH: join(fx.root, "caller-git-exec"),
      GIT_NO_REPLACE_OBJECTS: "0",
      GIT_REPLACE_REF_BASE: "refs/synthetic-replacements",
      GIT_SSL_NO_VERIFY: "1",
      GIT_SSL_CAINFO: join(fx.root, "caller-ca.pem"),
      HTTPS_PROXY: "http://127.0.0.1:9",
      ALL_PROXY: "http://127.0.0.1:9",
      CURL_CA_BUNDLE: join(fx.root, "caller-ca-bundle.pem"),
      GIT_TRACE_CURL: join(fx.root, "caller-curl-trace.log"),
      GIT_TRACE_CURL_NO_DATA: "0",
      GIT_TRACE_REDACT: "0",
    }, true);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.equal(result.stdout.trim(), "PUSH_CONFIRMED");
    const marker = readFileSync(join(fx.repo, ".staffordos-exact-ref-test-gh-marker"), "utf8");
    assert.doesNotMatch(marker, /caller-home|caller-xdg|caller-gh-config/u);
    assert.match(marker, /\/\.config\/gh/u);
    assert.equal(existsSync(join(fx.root, "caller-curl-trace.log")), false);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("runner establishes a trusted utility path before its first external command", () => {
  const fx = fixture();
  const attacker = join(fx.root, "attacker-bin");
  const marker = join(fx.root, "attacker-marker");
  try {
    mkdirSync(attacker);
    for (const name of ["mktemp", "git", "stat", "grep", "awk", "sort"]) {
      const executable = join(attacker, name);
      writeFileSync(executable, `#!/bin/sh\ntouch '${marker}'\nexit 99\n`);
      chmodSync(executable, 0o755);
    }
    fx.makeManifest();
    const result = invoke(fx, { PATH: `${attacker}:/usr/bin:/bin:/usr/sbin:/sbin` });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.equal(existsSync(marker), false);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("network repository ignores caller-provided Git templates", () => {
  const fx = fixture();
  const attacker = join(fx.root, "attacker.git");
  const template = join(fx.root, "attacker-template");
  try {
    execFileSync("git", ["init", "--bare", attacker]);
    mkdirSync(template);
    writeFileSync(join(template, "config"), `[url "${attacker}"]\n  insteadOf = ${fx.remote}\n`);
    fx.makeManifest();
    const result = invoke(fx, { GIT_TEMPLATE_DIR: template });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.equal(git(fx.remote, ["show-ref", "refs/heads/careeros/synthetic-exact"]).split(" ")[0], fx.source);
    assert.equal(gitMaybe(attacker, ["show-ref", "refs/heads/careeros/synthetic-exact"]), "");
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("privileged shebang ignores Bash startup files and imported functions", () => {
  const fx = fixture();
  const marker = join(fx.root, "bash-startup-marker");
  const startup = join(fx.root, "bash-env.sh");
  try {
    writeFileSync(startup, `touch '${marker}'\n`);
    fx.makeManifest();
    const result = invoke(fx, {
      BASH_ENV: startup,
      "BASH_FUNC_synthetic%%": `() { touch '${marker}'; }`,
    });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.equal(existsSync(marker), false);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test("isolated Python ignores repository modules and caller Python paths", () => {
  const fx = fixture();
  const marker = join(fx.root, "python-import-marker");
  const module = `from pathlib import Path\nPath(${JSON.stringify(marker)}).touch()\nraise RuntimeError('untrusted import')\n`;
  try {
    writeFileSync(join(fx.repo, "json.py"), module);
    fx.makeManifest();
    const result = invoke(fx, { PYTHONPATH: fx.repo, PYTHONHOME: join(fx.root, "caller-python-home") });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /PUSH_BLOCKED_DIRTY_WORKTREE/);
    assert.equal(existsSync(marker), false);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

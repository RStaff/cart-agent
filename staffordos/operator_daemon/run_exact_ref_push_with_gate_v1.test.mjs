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

function fixture({ mixed = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "staffordos-exact-ref-test-"));
  const remote = join(root, "remote.git");
  const repo = join(root, "repo");
  execFileSync("git", ["init", "--bare", remote]);
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

function invoke(fx, env = {}, synthetic = false) {
  return spawnSync("bash", synthetic ? [runner, fx.manifestPath, "--synthetic-test-mode"] : [runner, fx.manifestPath], {
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
  const child = spawn("bash", [runner, fx.manifestPath, "--synthetic-test-mode"], { cwd: fx.repo, encoding: "utf8" });
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
    assert.match(`${credential.stdout}${credential.stderr}`, /PUSH_BLOCKED_REMOTE_IDENTITY/);
    assert.doesNotMatch(`${credential.stdout}${credential.stderr}`, /synthetic-secret/);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
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

test("exact-ref runner rejects authority, scope, namespace, and injection violations", () => {
  const cases = [
    ["wrong remote identity", { canonicalRemoteIdentity: "/synthetic/wrong" }, "PUSH_BLOCKED_REMOTE_IDENTITY"],
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
    assert.deepEqual(argv.slice(1), ["-C", realpathSync(fx.repo), "-c", "core.hooksPath=" + argv[4].split("=")[1], "push", "--porcelain", "--no-follow-tags", fx.remote, `${fx.source}:refs/heads/careeros/synthetic-exact`]);
    assert.equal(argv.filter((arg) => arg === "push").length, 1);
    assert.equal(argv.filter((arg) => arg.includes(":refs/heads/")).length, 1);
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
  assert.doesNotMatch(source, /push --all|push --mirror|--force(?:-with-lease)?/);
  const docs = readFileSync(resolve(new URL("../governance/STAFFORDOS_EXACT_REF_PUSH_PATH_V1.md", import.meta.url).pathname), "utf8");
  assert.match(docs, /first public publication[\s\S]*cannot be governed/u);
  assert.match(docs, /does not authorize a push[\s\S]*resume correction/u);
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
    assert.equal(observed.at(-1), "600");
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
    }, true);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.equal(result.stdout.trim(), "PUSH_CONFIRMED");
    const marker = readFileSync(join(fx.repo, ".staffordos-exact-ref-test-gh-marker"), "utf8");
    assert.doesNotMatch(marker, /caller-home|caller-xdg|caller-gh-config/u);
    assert.match(marker, /\/\.config\/gh/u);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

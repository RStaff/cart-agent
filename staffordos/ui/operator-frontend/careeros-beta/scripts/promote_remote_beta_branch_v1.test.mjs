import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);
const SCRIPT = path.join(import.meta.dirname, "promote_remote_beta_branch_v1.sh");
const REAL_GIT = "/usr/bin/git";
const REPOSITORY_ROOT = path.resolve(import.meta.dirname, "../../../../..");
const PRODUCTION_SHA = "97cca9a8127129ffd422035be755ae5d83ec5dc3";

async function makeRepo() {
  const root = await mkdtemp(path.join(os.tmpdir(), "careeros-promotion-test-"));
  await run(REAL_GIT, ["init", "-q", "-b", "main", root]);
  await run(REAL_GIT, ["-C", root, "config", "user.email", "test@example.com"]);
  await run(REAL_GIT, ["-C", root, "config", "user.name", "Promotion Test"]);
  return root;
}

async function commit(root, file, content = "approved\n") {
  const target = path.join(root, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
  await run(REAL_GIT, ["-C", root, "add", file]);
  await run(REAL_GIT, ["-C", root, "commit", "-q", "-m", file]);
  return (await run(REAL_GIT, ["-C", root, "rev-parse", "HEAD"])).stdout.trim();
}

async function fakeGit(root, { remoteSha, mainSha, pushSha, postPushSha, postMainSha, pushResult = "success" }) {
  const bin = await mkdtemp(path.join(os.tmpdir(), "careeros-fake-git-"));
  const log = path.join(bin, "push.log");
  const remote = path.join(bin, "remote.sha");
  const main = path.join(bin, "main.sha");
  const fake = path.join(bin, "git");
  await writeFile(remote, `${remoteSha}\n`);
  await writeFile(main, `${mainSha}\n`);
  const pushedSha = postPushSha ? `'${postPushSha}'` : '"$3"';
  const pushCommand = pushResult === "failure"
    ? "exit 1"
    : [
      `printf '%s\\n' ${pushedSha} | cut -d: -f1 > '${remote}'`,
      postMainSha ? `printf '%s\\n' '${postMainSha}' > '${main}'` : null,
      "exit 0",
    ].filter(Boolean).join("; ");
  const script = `#!/bin/bash
set -eu
real="${REAL_GIT}"
if [ "$1" = "ls-remote" ]; then
  ref="\${3:-}"
  if [ "$ref" = "refs/heads/main" ]; then
    printf '%s\\t%s\\n' "$(cat '${main}')" "$ref"
  else
    printf '%s\\t%s\\n' "$(cat '${remote}')" "$ref"
  fi
  exit 0
fi
if [ "$1" = "push" ]; then
  printf '%s\\n' "$*" >> '${log}'
  ${pushCommand}
fi
exec "$real" "$@"
`;
  await writeFile(fake, script);
  await chmod(fake, 0o755);
  return { bin, log, pushSha };
}

async function invoke(root, source, expected, options = {}) {
  const fake = await fakeGit(root, {
    remoteSha: expected,
    mainSha: "1111111111111111111111111111111111111111",
    ...options,
  });
  try {
    return await run(SCRIPT, [source, "careeros/private-beta", expected], {
      cwd: root,
      env: { ...process.env, PATH: `${fake.bin}:${process.env.PATH}` },
    });
  } catch (error) {
    return error;
  }
}

function assertSuccess(result) {
  assert.equal(result instanceof Error, false, result?.stderr);
}

async function assertFailure(command, args, options) {
  await assert.rejects(run(command, args, options));
}

async function linearFixture(files = ["staffordos/ui/operator-frontend/careeros-beta/index.txt"]) {
  const root = await makeRepo();
  const base = await commit(root, "README.md");
  let source = base;
  for (const file of files) source = await commit(root, file);
  return { root, base, source };
}

test("accepts original single-commit beta promotion", async () => {
  const fixture = await linearFixture();
  const result = await invoke(fixture.root, fixture.source, fixture.base);
  assertSuccess(result);
});

test("accepts the current cumulative release with reconciliation-only tip", async () => {
  const fixture = await linearFixture([
    "staffordos/ui/operator-frontend/app/operator/page.tsx",
    "staffordos/reconciliation/careeros_production_reconciliation_v1.mjs",
  ]);
  const result = await invoke(fixture.root, fixture.source, fixture.base);
  assertSuccess(result);
});

test("accepts a tip containing the governed script and focused test", async () => {
  const fixture = await linearFixture([
    "staffordos/ui/operator-frontend/careeros-beta/index.txt",
    "staffordos/ui/operator-frontend/careeros-beta/scripts/promote_remote_beta_branch_v1.sh",
    "staffordos/ui/operator-frontend/careeros-beta/scripts/promote_remote_beta_branch_v1.test.mjs",
  ]);
  const result = await invoke(fixture.root, fixture.source, fixture.base);
  assertSuccess(result);
});

test("accepts the exact release differential baseline authority artifact", async () => {
  const fixture = await linearFixture([
    "staffordos/ui/operator-frontend/careeros-beta/index.txt",
    "staffordos/governance/STAFFORDOS_V1_CAREEROS_PROMOTION_DIFFERENTIAL_BASELINE_AUTHORITY_V1.json",
  ]);
  const result = await invoke(fixture.root, fixture.source, fixture.base);
  assertSuccess(result);
});

const rejectedInputs = [
  ["missing expected remote SHA", (f) => [f.source, "careeros/private-beta"]],
  ["malformed expected remote SHA", (f) => [f.source, "careeros/private-beta", "bad"]],
  ["non-descendant candidate", async () => { const f = await linearFixture(); const other = await commit(f.root, "staffordos/reconciliation/other.mjs"); return [other, "careeros/private-beta", "1111111111111111111111111111111111111111"]; }],
  ["destination main", (f) => [f.source, "main", f.base]],
  ["destination master", (f) => [f.source, "master", f.base]],
];

for (const [name, argsFor] of rejectedInputs) {
  test(`rejects ${name}`, async () => {
    const fixture = await linearFixture();
    const args = await argsFor(fixture);
    await assertFailure(SCRIPT, args, { cwd: fixture.root });
  });
}

const rejectedPaths = [
  ["unexpected cumulative path", "web/src/index.js"],
  ["unexpected tip path", "staffordos/unknown/file.txt"],
  ["schema path", "web/prisma/schema.prisma"],
  ["migration path", "web/prisma/migrations/001/init.sql"],
  ["secret path", "staffordos/operator-issuer/private.key"],
  ["generated path", "staffordos/ui/operator-frontend/.next/cache.json"],
  ["ShopiFixer path", "shopifixer/source.js"],
  ["Abando path", "abando/source.js"],
  ["arbitrary governance path", "staffordos/governance/unrelated-review.json"],
  ["unversioned baseline exception", "staffordos/governance/STAFFORDOS_CAREEROS_BASELINE_EXCEPTION.json"],
];

for (const [name, file] of rejectedPaths) {
  test(`rejects ${name}`, async () => {
    const fixture = await linearFixture([file]);
    const result = await invoke(fixture.root, fixture.source, fixture.base);
    assert.equal(result instanceof Error, true);
  });
}

test("rejects a merge commit", async () => {
  const root = await makeRepo();
  const base = await commit(root, "README.md");
  await commit(root, "staffordos/ui/operator-frontend/careeros-beta/a.txt");
  const branch = "branch";
  await run(REAL_GIT, ["-C", root, "checkout", "-q", "-b", branch, base]);
  await commit(root, "staffordos/ui/operator-frontend/careeros-beta/b.txt");
  await run(REAL_GIT, ["-C", root, "checkout", "-q", "main"]);
  await run(REAL_GIT, ["-C", root, "merge", "--no-ff", "-q", branch, "-m", "merge"]);
  const source = (await run(REAL_GIT, ["-C", root, "rev-parse", "HEAD"])).stdout.trim();
  const result = await invoke(root, source, base);
  assert.equal(result instanceof Error, true);
});

test("rejects dirty index and tracked worktree", async () => {
  const fixture = await linearFixture();
  await writeFile(path.join(fixture.root, "README.md"), "dirty\n");
  const result = await invoke(fixture.root, fixture.source, fixture.base);
  assert.equal(result instanceof Error, true);
});

test("rejects a stale live remote", async () => {
  const fixture = await linearFixture();
  const fake = await fakeGit(fixture.root, { remoteSha: "2222222222222222222222222222222222222222", mainSha: "1111111111111111111111111111111111111111" });
  const result = await run(SCRIPT, [fixture.source, "careeros/private-beta", fixture.base], { cwd: fixture.root, env: { ...process.env, PATH: `${fake.bin}:${process.env.PATH}` } }).catch((error) => error);
  assert.equal(result instanceof Error, true);
});

test("rejects network failure before push", async () => {
  const fixture = await linearFixture();
  const fake = await fakeGit(fixture.root, { remoteSha: fixture.base, mainSha: "1111111111111111111111111111111111111111", pushResult: "failure" });
  const result = await run(SCRIPT, [fixture.source, "careeros/private-beta", fixture.base], { cwd: fixture.root, env: { ...process.env, PATH: `${fake.bin}:${process.env.PATH}` } }).catch((error) => error);
  assert.notEqual(result.code, 0);
});

test("constructs exactly one normal push for a valid candidate", async () => {
  const fixture = await linearFixture(["staffordos/reconciliation/report.mjs"]);
  const fake = await fakeGit(fixture.root, { remoteSha: fixture.base, mainSha: "1111111111111111111111111111111111111111" });
  const result = await run(SCRIPT, [fixture.source, "careeros/private-beta", fixture.base], { cwd: fixture.root, env: { ...process.env, PATH: `${fake.bin}:${process.env.PATH}` } });
  assert.equal(result.stderr, "");
  const pushes = (await import("node:fs/promises")).readFile(fake.log, "utf8");
  assert.match(await pushes, new RegExp(`push origin ${fixture.source}:refs/heads/careeros-private-beta|push origin ${fixture.source}:refs/heads/careeros/private-beta`));
});

test("rejects failed push and never constructs a force push", async () => {
  const fixture = await linearFixture(["staffordos/reconciliation/report.mjs"]);
  const fake = await fakeGit(fixture.root, { remoteSha: fixture.base, mainSha: "1111111111111111111111111111111111111111", pushResult: "failure" });
  const result = await run(SCRIPT, [fixture.source, "careeros/private-beta", fixture.base], { cwd: fixture.root, env: { ...process.env, PATH: `${fake.bin}:${process.env.PATH}` } }).catch((error) => error);
  assert.equal(result instanceof Error, true);
});

test("rejects malformed source SHA", async () => {
  const fixture = await linearFixture();
  await assertFailure(SCRIPT, ["bad", "careeros/private-beta", fixture.base], { cwd: fixture.root });
});

test("rejects an empty destination and equal source/remote", async () => {
  const fixture = await linearFixture();
  await assertFailure(SCRIPT, [fixture.source, "", fixture.base], { cwd: fixture.root });
  await assertFailure(SCRIPT, [fixture.base, "careeros/private-beta", fixture.base], { cwd: fixture.root });
});

test("rejects a post-push SHA mismatch", async () => {
  const fixture = await linearFixture(["staffordos/reconciliation/report.mjs"]);
  const fake = await fakeGit(fixture.root, {
    remoteSha: fixture.base,
    mainSha: "1111111111111111111111111111111111111111",
    postPushSha: "3333333333333333333333333333333333333333",
  });
  await assertFailure(SCRIPT, [fixture.source, "careeros/private-beta", fixture.base], {
    cwd: fixture.root,
    env: { ...process.env, PATH: `${fake.bin}:${process.env.PATH}` },
  });
});

test("rejects a changed origin/main after push verification", async () => {
  const fixture = await linearFixture(["staffordos/reconciliation/report.mjs"]);
  const fake = await fakeGit(fixture.root, {
    remoteSha: fixture.base,
    mainSha: "1111111111111111111111111111111111111111",
    postMainSha: "3333333333333333333333333333333333333333",
  });
  await assertFailure(SCRIPT, [fixture.source, "careeros/private-beta", fixture.base], {
    cwd: fixture.root,
    env: { ...process.env, PATH: `${fake.bin}:${process.env.PATH}` },
  });
});

test("accepts the real candidate through a controlled no-push boundary", async () => {
  const status = (await run(REAL_GIT, ["-C", REPOSITORY_ROOT, "status", "--porcelain"])).stdout.trim();
  if (status) return;
  const source = (await run(REAL_GIT, ["-C", REPOSITORY_ROOT, "rev-parse", "HEAD"])).stdout.trim();
  const fake = await fakeGit(REPOSITORY_ROOT, {
    remoteSha: PRODUCTION_SHA,
    mainSha: "1111111111111111111111111111111111111111",
  });
  const result = await run(SCRIPT, [source, "careeros/private-beta", PRODUCTION_SHA], {
    cwd: REPOSITORY_ROOT,
    env: { ...process.env, PATH: `${fake.bin}:${process.env.PATH}` },
  });
  assert.equal(result.stderr, "");
  const pushes = await (await import("node:fs/promises")).readFile(fake.log, "utf8");
  assert.equal(pushes.trim().split("\n").length, 1);
  assert.match(pushes, new RegExp(`push origin ${source}:refs/heads/careers/private-beta|push origin ${source}:refs/heads/careos/private-beta|push origin ${source}:refs/heads/careeros/private-beta`));
});

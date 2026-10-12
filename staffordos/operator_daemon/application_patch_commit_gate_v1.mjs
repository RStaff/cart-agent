#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { chmodSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const intentPath = process.argv[2];
const validateOnly = process.argv.includes("--validate-only");
if (!intentPath) throw new Error("Usage: application_patch_commit_gate_v1.mjs <intent.json> [--validate-only]");
const run = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const intent = JSON.parse(readFileSync(intentPath, "utf8"));
const root = run(["rev-parse", "--show-toplevel"]);
function validate() {
  const remote = run(["config", "--get", "remote.origin.url"]).replace(/\.git$/, "");
  if (remote !== `https://github.com/${intent.repository}`) throw new Error("repository mismatch");
  if (run(["symbolic-ref", "--short", "HEAD"]) !== intent.branch) throw new Error("branch mismatch");
  if (run(["rev-parse", "HEAD"]) !== intent.base_head) throw new Error("base HEAD mismatch");
  const paths = run(["diff", "--cached", "--name-only"]).split("\n").filter(Boolean).sort();
  const expected = [...intent.paths].sort();
  if (JSON.stringify(paths) !== JSON.stringify(expected)) throw new Error("staged path allowlist mismatch");
  for (const path of expected) if (run(["rev-parse", `:${path}`]) !== intent.staged_blobs[path]) throw new Error(`staged blob mismatch: ${path}`);
  const diff = execFileSync("git", ["-c", "color.ui=false", "diff", "--cached", "--binary", "--full-index", "--no-ext-diff", "--no-textconv"]);
  const digest = createHash("sha256").update(diff).digest("hex");
  if (digest !== intent.staged_binary_diff_sha256) throw new Error("staged binary diff digest mismatch");
  if (run(["diff", "--cached", "--check"]) !== "") throw new Error("staged whitespace error");
  return { paths, digest };
}
const initial = validate();
if (validateOnly) { console.log(JSON.stringify({ ok: true, root, ...initial })); process.exit(0); }

const final = validate();

const authDir = resolve(root, ".git", "application-patch-auth");
const nonce = randomBytes(32).toString("hex");
const authPath = resolve(authDir, `${nonce}.json`);
const repository = intent.repository;
const branch = intent.branch;
const staged_blobs = Object.fromEntries(final.paths.map((path) => [path, run(["rev-parse", `:${path}`])]));
const auth = { schema: "staffordos.application_patch_authorization.v1", nonce, repository, branch, root, head: intent.base_head, paths: final.paths, staged_blobs, digest: final.digest, expires_at: Date.now() + 60000 };
execFileSync("mkdir", ["-p", authDir]);
writeFileSync(authPath, JSON.stringify(auth)); chmodSync(authPath, 0o600);
const result = spawnSync("git", ["commit", "-m", intent.commit_message], { cwd: root, stdio: "inherit", env: { ...process.env, STAFFORDOS_PATCH_AUTH_FILE: authPath, STAFFORDOS_PATCH_AUTH_NONCE: nonce } });
try { unlinkSync(authPath); } catch {}
process.exit(result.status ?? 1);

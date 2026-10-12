#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";

const authPath = process.env.STAFFORDOS_PATCH_AUTH_FILE;
const nonce = process.env.STAFFORDOS_PATCH_AUTH_NONCE;
if (!authPath || !nonce) process.exit(1);
const run = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();
try {
  const j = JSON.parse(readFileSync(authPath, "utf8"));
  if (j.schema !== "staffordos.application_patch_authorization.v1" || j.nonce !== nonce) process.exit(1);
  const remote = run(["config", "--get", "remote.origin.url"]).replace(/\.git$/, "");
  if (Date.now() > j.expires_at || j.root !== run(["rev-parse", "--show-toplevel"]) || j.repository !== remote.replace("https://github.com/", "") || j.branch !== run(["symbolic-ref", "--short", "HEAD"]) || j.head !== run(["rev-parse", "HEAD"])) process.exit(1);
  const paths = run(["diff", "--cached", "--name-only"]).split("\n").filter(Boolean).sort();
  if (JSON.stringify(paths) !== JSON.stringify([...j.paths].sort())) process.exit(1);
  for (const path of paths) if (j.staged_blobs?.[path] !== run(["rev-parse", `:${path}`])) process.exit(1);
  const diff = execFileSync("git", ["-c", "color.ui=false", "diff", "--cached", "--binary", "--full-index", "--no-ext-diff", "--no-textconv"]);
  if (j.digest !== createHash("sha256").update(diff).digest("hex")) process.exit(1);
  unlinkSync(authPath);
} catch {
  process.exit(1);
}

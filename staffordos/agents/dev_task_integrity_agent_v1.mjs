import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const LOG = "staffordos/agents/dev_task_integrity_log_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function sh(cmd) {
  try { return execSync(cmd, { encoding: "utf8" }).trim(); } catch { return ""; }
}

const status = sh("git status --short");
const changedFiles = status
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.replace(/^..\s+/, ""));

const issues = [];

if (!changedFiles.length) issues.push("no_changed_files_detected");

const runtimeOutputs = changedFiles.filter((file) =>
  file.includes("_log_") ||
  file.endsWith("_log_v1.json") ||
  file.includes("/output/") ||
  file.endsWith("registry_reality_audit_v1.json") ||
  file.endsWith("capability_matrix_v1.json")
);

if (runtimeOutputs.length) {
  issues.push(`runtime_outputs_present:${runtimeOutputs.join(",")}`);
}

const broadPatch = changedFiles.length > 5;
if (broadPatch) issues.push(`too_many_files_changed:${changedFiles.length}`);

const touchesProtectedRuntime = changedFiles.some((file) =>
  file.startsWith("web/src/") ||
  file.startsWith("abando-frontend/")
);

if (touchesProtectedRuntime) {
  issues.push("product_runtime_or_frontend_touched_requires_explicit_packet");
}

const hasStatusClean = status.trim().length === 0;

const score = Math.max(0, 100 - issues.length * 25);
const integrityStatus = issues.length ? "fail" : "pass";

const report = {
  ok: integrityStatus === "pass",
  agent: "dev_task_integrity_agent_v1",
  mode: "inspect_only",
  integrity_status: integrityStatus,
  integrity_score: score,
  changed_files: changedFiles,
  issues,
  recommendation: integrityStatus === "pass"
    ? "Patch is narrow enough for review."
    : "Stop and inspect before commit/merge.",
  generated_at: new Date().toISOString()
};

const log = readJson(LOG, []);
log.push(report);
writeJson(LOG, log);

console.log(JSON.stringify(report, null, 2));

process.exit(integrityStatus === "pass" ? 0 : 1);

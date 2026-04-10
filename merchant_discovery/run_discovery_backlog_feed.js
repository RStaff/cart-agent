import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATUS_SCRIPT_PATH = join(__dirname, "get_discovery_pipeline_status.js");
const IMPORTER_SCRIPT_PATH = join(__dirname, "import_low_score_leads_to_shopifixer_backlog.js");

function fail(message) {
  throw new Error(message);
}

async function assertReadable(path, label) {
  try {
    await access(path, constants.R_OK);
  } catch {
    fail(`${label}:${path}`);
  }
}

async function runNodeScript(path) {
  const { stdout, stderr } = await execFile("node", [path], {
    cwd: __dirname,
    maxBuffer: 1024 * 1024,
  });

  if (stderr && stderr.trim()) {
    fail(`script_stderr:${path}:${stderr.trim()}`);
  }

  return stdout.trim();
}

async function readPipelineSnapshot() {
  const output = await runNodeScript(STATUS_SCRIPT_PATH);

  try {
    return JSON.parse(output);
  } catch {
    fail(`status_output_invalid_json:${STATUS_SCRIPT_PATH}`);
  }
}

function mapReason(status) {
  if (status === "stale") return "pipeline_stale";
  if (status === "healthy") return "pipeline_healthy";
  if (status === "empty") return "pipeline_empty";
  if (status === "blocked") return "pipeline_blocked";
  return "pipeline_unknown";
}

async function main() {
  await assertReadable(STATUS_SCRIPT_PATH, "status_script_missing");
  await assertReadable(IMPORTER_SCRIPT_PATH, "importer_script_missing");

  const before = await readPipelineSnapshot();

  let action = "skipped";
  let reason = mapReason(before?.pipeline?.status);

  if (before?.pipeline?.status === "stale") {
    await runNodeScript(IMPORTER_SCRIPT_PATH);
    action = "imported";
    reason = "pipeline_stale";
  }

  const after = await readPipelineSnapshot();

  console.log(JSON.stringify({ before, action, reason, after }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

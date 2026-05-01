import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function readEnvValue(filePath: string, key: string) {
  if (!fs.existsSync(filePath)) return "";
  const line = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${key}=`));
  if (!line) return "";
  return line
    .slice(key.length + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

function repoRootFromCwd() {
  return process.cwd().includes("staffordos/ui/operator-frontend")
    ? path.resolve(process.cwd(), "../../..")
    : process.cwd();
}

export async function POST() {
  const repoRoot = repoRootFromCwd();
  const webEnvPath = path.join(repoRoot, "web", ".env");
  const webDatabaseUrl = readEnvValue(webEnvPath, "DATABASE_URL");
  const outDir = path.join(repoRoot, "staffordos/system_inventory/output/proof_runs");
  fs.mkdirSync(outDir, { recursive: true });

  const runId = `abando_recovery_loop_${Date.now()}`;
  const createdAt = new Date().toISOString();

  const workerPath = path.join(repoRoot, "web/src/jobs/worker.js");

  const artifact: any = {
    proof_run_id: runId,
    proof_id: "proof_abando_recovery_loop",
    target: "Abando Recovery Loop",
    status: "REQUESTED_RUNTIME_WORKER_EXECUTED",
    created_at: createdAt,
    runtime_path: "web/src/jobs/worker.js",
    execution_mode: "JOB_WORKER_RUN_ONCE=1",
    database_url_source: webDatabaseUrl ? "web/.env" : "process.env",
    required_runtime_proof: [
      "queued recovery_email job exists",
      "worker claims job",
      "email send attempted through Resend mailer",
      "emailQueue updated",
      "job marked succeeded or failed",
      "return/conversion attribution checked separately"
    ],
    rule: "This route executes the existing Abando worker once and records evidence only. It does not mark proof as PROVEN.",
    worker: {
      attempted: true,
      stdout: "",
      stderr: "",
      exit_error: null
    },
    inferred_result: {
      worker_completed: false,
      worker_idle: false,
      email_send_attempted: false,
      job_succeeded: false,
      job_failed: false,
      remaining_gaps: [
        "confirm real message delivery",
        "confirm return tracking",
        "confirm conversion/revenue attribution"
      ]
    }
  };

  try {
    const result = await execFileAsync("node", [workerPath], {
      cwd: repoRoot,
      timeout: 30000,
      env: {
        ...process.env,
        DATABASE_URL: webDatabaseUrl || process.env.DATABASE_URL,
        JOB_WORKER_RUN_ONCE: "1",
        ABANDO_WORKER_TEST_MODE: "true"
      }
    });

    artifact.worker.stdout = result.stdout || "";
    artifact.worker.stderr = result.stderr || "";
  } catch (error: any) {
    artifact.status = "RUNTIME_WORKER_EXECUTION_ERROR";
    artifact.worker.stdout = error?.stdout || "";
    artifact.worker.stderr = error?.stderr || "";
    artifact.worker.exit_error = error instanceof Error ? error.message : String(error);
  }

  const combined = `${artifact.worker.stdout}\n${artifact.worker.stderr}`.toLowerCase();

  artifact.inferred_result.worker_completed = combined.includes("completed job");
  artifact.inferred_result.worker_idle = combined.includes("[job-worker] idle");
  artifact.inferred_result.email_send_attempted = combined.includes("sending recovery email");
  artifact.inferred_result.job_succeeded = combined.includes("job succeeded") || combined.includes("completed job");
  artifact.inferred_result.job_failed =
    combined.includes("job failed") ||
    combined.includes("fatal") ||
    artifact.status === "RUNTIME_WORKER_EXECUTION_ERROR";

  if (artifact.inferred_result.job_succeeded && artifact.inferred_result.email_send_attempted) {
    artifact.status = "RUNTIME_SEND_ATTEMPT_CONFIRMED_REQUIRES_DELIVERY_AND_RETURN_PROOF";
  } else if (artifact.inferred_result.worker_idle) {
    artifact.status = "NO_RUNNABLE_RECOVERY_EMAIL_JOB_FOUND";
  } else if (artifact.inferred_result.job_failed) {
    artifact.status = "RUNTIME_WORKER_FAILED_REVIEW_OUTPUT";
  }

  const file = path.join(outDir, `${runId}.json`);
  const latest = path.join(outDir, "latest_abando_recovery_loop_run.json");

  fs.writeFileSync(file, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(latest, JSON.stringify(artifact, null, 2));

  return NextResponse.json({
    ok: true,
    artifact,
    file
  });
}

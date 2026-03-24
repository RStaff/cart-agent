import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

type StartDayTask = {
  title: string;
  type: string;
  payload: Record<string, unknown>;
};

const START_DAY_TASKS: StartDayTask[] = [
  { title: "start day morning brief", type: "generate_daily_briefing", payload: {} },
  { title: "start day verify marketing", type: "verify_surface", payload: { surface: "marketing" } },
  { title: "start day verify embedded", type: "verify_surface", payload: { surface: "embedded" } },
  { title: "start day outreach", type: "generate_outreach", payload: {} },
  { title: "start day run experiment", type: "run_experiment", payload: { mode: "approved_only" } },
];

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "tasks", "enqueue_task.js"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function enqueueTask(rootDir: string, task: StartDayTask) {
  const timestamp = new Date().toISOString();
  const record = {
    task_id: `task-${Date.now()}-${slugify(task.type) || "runtime"}`,
    title: task.title,
    type: task.type,
    payload: task.payload,
    status: "queued",
    created_at: timestamp,
    started_at: null,
    finished_at: null,
    result: null,
    commit_on_success: false,
  };

  const tempDir = join(tmpdir(), "staffordos-director");
  mkdirSync(tempDir, { recursive: true });
  const tempFile = join(tempDir, `${record.task_id}.json`);
  writeFileSync(tempFile, JSON.stringify(record, null, 2) + "\n");

  const { stdout } = await execFileAsync("node", ["staffordos/tasks/enqueue_task.js", tempFile], {
    cwd: rootDir,
  });

  return JSON.parse(stdout || "{}");
}

function getQueuedCount(rootDir: string) {
  try {
    const parsed = JSON.parse(readFileSync(join(rootDir, "staffordos", "tasks", "queue.json"), "utf8"));
    const tasks = Array.isArray(parsed.tasks) ? (parsed.tasks as Array<{ status?: string }>) : [];
    return tasks.filter((task: { status?: string }) => task?.status === "queued").length;
  } catch {
    return 0;
  }
}

export async function POST(request: NextRequest) {
  const rootDir = findCanonicalRoot();
  const body = await request.json().catch(() => ({}));
  const autorun = body?.autorun !== false;

  try {
    const queuedBefore = getQueuedCount(rootDir);
    const enqueued = [];

    for (const task of START_DAY_TASKS) {
      enqueued.push(await enqueueTask(rootDir, task));
    }

    let batch = null;

    if (autorun) {
      const batchLimit = queuedBefore + START_DAY_TASKS.length;
      const { stdout, stderr } = await execFileAsync("node", ["staffordos/operator/run_batch.js", String(batchLimit)], {
        cwd: rootDir,
      });
      batch = {
        ...JSON.parse(stdout || "{}"),
        stderr,
      };
    }

    return NextResponse.json({ ok: true, enqueued, batch }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr || "") : String(error);
    return NextResponse.json({ error: stderr || "Failed to start day flow." }, { status: 500 });
  }
}

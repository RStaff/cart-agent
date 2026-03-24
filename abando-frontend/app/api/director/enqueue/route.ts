import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

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

export async function POST(request: NextRequest) {
  const rootDir = findCanonicalRoot();
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid enqueue payload." }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const type = String(body.type || "").trim();
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};

  if (!title || !type) {
    return NextResponse.json({ error: "title and type are required." }, { status: 400 });
  }

  const timestamp = new Date().toISOString();
  const task = {
    task_id: `task-${Date.now()}-${slugify(type) || "runtime"}`,
    title,
    type,
    payload,
    status: "queued",
    created_at: timestamp,
    started_at: null,
    finished_at: null,
    result: null,
    commit_on_success: false,
  };

  try {
    const tempDir = join(tmpdir(), "staffordos-director");
    mkdirSync(tempDir, { recursive: true });
    const tempFile = join(tempDir, `${task.task_id}.json`);
    writeFileSync(tempFile, JSON.stringify(task, null, 2) + "\n");

    const { stdout } = await execFileAsync("node", ["staffordos/tasks/enqueue_task.js", tempFile], {
      cwd: rootDir,
    });

    return NextResponse.json({
      ok: true,
      task: JSON.parse(stdout || "{}"),
    });
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr || "") : String(error);
    return NextResponse.json({ error: stderr || "Failed to enqueue task." }, { status: 500 });
  }
}

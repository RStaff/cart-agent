import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegistryTask = {
  task_id: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "registries", "task_registry.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function priorityRank(priority: string) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const registry = readJson<{ tasks?: RegistryTask[] }>(
    join(rootDir, "staffordos", "registries", "task_registry.json"),
    { tasks: [] },
  );
  const tasks = Array.isArray(registry.tasks) ? registry.tasks : [];
  const sortedTasks = [...tasks].sort((left, right) => {
    const priorityDelta = priorityRank(right.priority) - priorityRank(left.priority);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
    return leftTime - rightTime;
  });

  return NextResponse.json(
    {
      helperText: "Tasks represent system actions triggered by signals or approvals.",
      queuedCount: sortedTasks.filter((task) => task.status === "queued").length,
      tasks: sortedTasks,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

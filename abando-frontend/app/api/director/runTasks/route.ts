import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { runQueuedTasks } from "@/lib/director/taskRunner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "registries", "task_registry.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const taskRegistryPath = join(rootDir, "staffordos", "registries", "task_registry.json");
  const resultRegistryPath = join(rootDir, "staffordos", "registries", "result_registry.json");
  const execution = runQueuedTasks({
    taskRegistryPath,
    resultRegistryPath,
  });

  return NextResponse.json(
    {
      ok: true,
      executed: execution.executed,
      queuedBefore: execution.queuedBefore,
      results: execution.results,
      tasks: execution.tasks,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

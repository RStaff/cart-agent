import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "operator", "director_snapshot.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const snapshotPath = join(rootDir, "staffordos", "operator", "director_snapshot.json");

  try {
    return NextResponse.json(JSON.parse(readFileSync(snapshotPath, "utf8")), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      generated_at: "",
      queued_tasks: 0,
      completed_tasks_today: 0,
      failed_tasks_today: 0,
      last_task_type: "",
      last_task_status: "idle",
      top_blocker: "",
      operator_mode: "director",
    }, { headers: { "Cache-Control": "no-store" } });
  }
}

import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

type JsonValue = Record<string, unknown> | Array<unknown> | null;

function findCanonicalRoot() {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "../.."),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "agents", "status", "task_status.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function readJson(rootDir: string, relativePath: string, fallbackValue: JsonValue) {
  try {
    return JSON.parse(readFileSync(join(rootDir, relativePath), "utf8")) as JsonValue;
  } catch {
    return fallbackValue;
  }
}

function getLastEventMessage(feed: JsonValue) {
  const events = Array.isArray((feed as { events?: Array<{ timestamp?: string; message?: string }> })?.events)
    ? (feed as { events: Array<{ timestamp?: string; message?: string }> }).events
    : [];
  const lastEvent = [...events].sort((a, b) =>
    String(b?.timestamp || "").localeCompare(String(a?.timestamp || "")),
  )[0];

  return lastEvent ? String(lastEvent.message || "") : "";
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const taskStatus = readJson(rootDir, "staffordos/agents/status/task_status.json", {});
  const directorSnapshot =
    readJson(rootDir, "staffordos/director/director_snapshot.json", null) ||
    readJson(rootDir, "staffordos/director_snapshot.json", {});
  const intelligenceFeed = readJson(rootDir, "staffordos/intelligence/intelligence_feed.json", { events: [] });

  return NextResponse.json({
    active_agents: Number((directorSnapshot as { active_agents?: number })?.active_agents || 0),
    tasks_in_progress: Number((directorSnapshot as { open_tasks?: number })?.open_tasks || 0),
    qa_status: String(
      (directorSnapshot as { qa_status?: string })?.qa_status ||
        ((taskStatus as { qa_passed?: boolean })?.qa_passed === true ? "passed" : "unknown"),
    ),
    runtime_status: String(
      (directorSnapshot as { runtime_status?: string })?.runtime_status ||
        ((taskStatus as { runtime_passed?: boolean })?.runtime_passed === true ? "passed" : "unknown"),
    ),
    last_event: getLastEventMessage(intelligenceFeed),
  });
}

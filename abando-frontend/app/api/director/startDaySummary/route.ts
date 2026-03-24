import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RunRecord = {
  type?: string;
  started_at?: string;
  finished_at?: string;
  result?: {
    summary?: string;
  };
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "operator", "task_results.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return {
      ...fallback,
      ...JSON.parse(readFileSync(filePath, "utf8")),
    };
  } catch {
    return fallback;
  }
}

function findLatestRun(runs: RunRecord[], type: string) {
  for (let index = runs.length - 1; index >= 0; index -= 1) {
    if (runs[index]?.type === type) {
      return runs[index];
    }
  }

  return null;
}

function describeRun(run: RunRecord | null, fallback: string) {
  if (!run) {
    return fallback;
  }

  const summary = run.result?.summary || "completed";
  const timestamp = run.finished_at || run.started_at || "";
  return timestamp ? `${summary} at ${timestamp}` : summary;
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const briefing = readJson(join(rootDir, "staffordos", "briefing", "daily_briefing.json"), {
    headline: "Daily briefing unavailable",
    top_blocker: "",
    recommended_next_action: "",
  });
  const marketing = readJson(join(rootDir, "staffordos", "verify", "marketing_verification.json"), {
    final_status: "UNKNOWN",
    verified_at: "",
  });
  const embedded = readJson(join(rootDir, "staffordos", "verify", "embedded_verification.json"), {
    final_status: "UNKNOWN",
    verified_at: "",
  });
  const snapshot = readJson(join(rootDir, "staffordos", "operator", "director_snapshot.json"), {
    top_blocker: "",
  });
  const taskResults = readJson<{ runs?: RunRecord[] }>(join(rootDir, "staffordos", "operator", "task_results.json"), { runs: [] });
  const runs = Array.isArray(taskResults.runs) ? taskResults.runs : [];

  return NextResponse.json(
    {
      morning_brief_status: describeRun(findLatestRun(runs, "generate_daily_briefing"), "Waiting for morning brief."),
      marketing_verification_status: `${marketing.final_status || "UNKNOWN"}${marketing.verified_at ? ` at ${marketing.verified_at}` : ""}`,
      embedded_verification_status: `${embedded.final_status || "UNKNOWN"}${embedded.verified_at ? ` at ${embedded.verified_at}` : ""}`,
      outreach_status: describeRun(findLatestRun(runs, "generate_outreach"), "Waiting for outreach run."),
      experiment_status: describeRun(findLatestRun(runs, "run_experiment"), "Waiting for experiment run."),
      top_blocker: briefing.top_blocker || snapshot.top_blocker || "No blocker recorded.",
      recommended_next_action: briefing.recommended_next_action || "Generate the daily briefing to get the next action.",
      headline: briefing.headline || "Daily briefing unavailable",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

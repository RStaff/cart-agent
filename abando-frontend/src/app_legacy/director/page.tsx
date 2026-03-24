import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import DirectorDashboard from "@/components/director/DirectorDashboard";

export const metadata = {
  title: "StaffordOS Director Console",
  description: "Browser control surface for queue, operator runtime, and director status.",
};

export const dynamic = "force-dynamic";

type DirectorSnapshot = {
  generated_at: string;
  queued_tasks: number;
  completed_tasks_today: number;
  failed_tasks_today: number;
  last_task_type: string;
  last_task_status: string;
  top_blocker: string;
  operator_mode: string;
};

type QueueTask = {
  task_id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
};

type DailyBriefing = {
  generated_at: string;
  headline: string;
  summary: string;
  top_metrics: {
    audit_runs: number;
    install_clicks: number;
    installs: number;
  };
  top_opportunity: string;
  top_blocker: string;
  recommended_next_action: string;
};

type VerificationResult = {
  surface: string;
  verified_at: string;
  final_status: string;
};

type StartDaySummary = {
  morning_brief_status: string;
  marketing_verification_status: string;
  embedded_verification_status: string;
  outreach_status: string;
  experiment_status: string;
  top_blocker: string;
  recommended_next_action: string;
  headline: string;
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "operator", "director_snapshot.json"))) {
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

export default function DirectorPage() {
  const rootDir = findCanonicalRoot();
  const snapshot = readJson<DirectorSnapshot>(join(rootDir, "staffordos", "operator", "director_snapshot.json"), {
    generated_at: "",
    queued_tasks: 0,
    completed_tasks_today: 0,
    failed_tasks_today: 0,
    last_task_type: "",
    last_task_status: "idle",
    top_blocker: "",
    operator_mode: "director",
  });
  const queueData = readJson<{ tasks?: QueueTask[] }>(join(rootDir, "staffordos", "tasks", "queue.json"), { tasks: [] });
  const briefing = readJson<DailyBriefing>(join(rootDir, "staffordos", "briefing", "daily_briefing.json"), {
    generated_at: "",
    headline: "Daily briefing unavailable",
    summary: "Generate a fresh briefing from the director console.",
    top_metrics: {
      audit_runs: 0,
      install_clicks: 0,
      installs: 0,
    },
    top_opportunity: "",
    top_blocker: "",
    recommended_next_action: "",
  });
  const verification = {
    marketing: readJson<VerificationResult>(join(rootDir, "staffordos", "verify", "marketing_verification.json"), {
      surface: "marketing",
      verified_at: "",
      final_status: "UNKNOWN",
    }),
    embedded: readJson<VerificationResult>(join(rootDir, "staffordos", "verify", "embedded_verification.json"), {
      surface: "embedded",
      verified_at: "",
      final_status: "UNKNOWN",
    }),
  };
  const taskResults = readJson<{
    runs?: Array<{
      type?: string;
      started_at?: string;
      finished_at?: string;
      result?: { summary?: string };
    }>;
  }>(join(rootDir, "staffordos", "operator", "task_results.json"), { runs: [] });
  const runs = Array.isArray(taskResults.runs) ? taskResults.runs : [];

  function findLatest(type: string) {
    for (let index = runs.length - 1; index >= 0; index -= 1) {
      if (runs[index]?.type === type) {
        return runs[index];
      }
    }

    return null;
  }

  function describeRun(
    run: { started_at?: string; finished_at?: string; result?: { summary?: string } } | null,
    fallback: string,
  ) {
    if (!run) {
      return fallback;
    }

    const summary = run.result?.summary || "completed";
    const timestamp = run.finished_at || run.started_at || "";
    return timestamp ? `${summary} at ${timestamp}` : summary;
  }

  const startDaySummary: StartDaySummary = {
    morning_brief_status: describeRun(findLatest("generate_daily_briefing"), "Waiting for morning brief."),
    marketing_verification_status: `${verification.marketing.final_status || "UNKNOWN"}${
      verification.marketing.verified_at ? ` at ${verification.marketing.verified_at}` : ""
    }`,
    embedded_verification_status: `${verification.embedded.final_status || "UNKNOWN"}${
      verification.embedded.verified_at ? ` at ${verification.embedded.verified_at}` : ""
    }`,
    outreach_status: describeRun(findLatest("generate_outreach"), "Waiting for outreach run."),
    experiment_status: describeRun(findLatest("run_experiment"), "Waiting for experiment run."),
    top_blocker: briefing.top_blocker || snapshot.top_blocker || "No blocker recorded.",
    recommended_next_action: briefing.recommended_next_action || "Generate the daily briefing to get the next action.",
    headline: briefing.headline || "Daily briefing unavailable",
  };

  return (
    <div
      style={{
        background: "#020617",
        color: "#e2e8f0",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <DirectorDashboard
        initialSnapshot={snapshot}
        initialTasks={Array.isArray(queueData.tasks) ? queueData.tasks : []}
        initialBriefing={briefing}
        initialVerification={verification}
        initialStartDaySummary={startDaySummary}
      />
    </div>
  );
}

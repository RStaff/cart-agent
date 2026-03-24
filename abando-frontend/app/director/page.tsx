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

type RegistryTask = {
  task_id: string;
  type: string;
  title: string;
  requested_by: string;
  status: string;
  priority?: string;
  created_at: string;
  completed_at: string | null;
  result_ref: string | null;
  error_ref: string | null;
  payload: Record<string, unknown>;
};

type RegistryResult = {
  result_id: string;
  task_id: string;
  result_type: string;
  created_at: string;
  summary: string;
  artifact_path: string;
};

type ApprovalItem = {
  approval_id: string;
  type: string;
  title: string;
  status: string;
  created_at: string;
  requested_by: string;
  related_task_id: string;
  summary: string;
};

type Signal = {
  signal_id: string;
  signal_type: string;
  title: string;
  summary: string;
  status: string;
  score: number;
  priority: string;
  recommended_action: string;
  created_at: string;
  installBlocking?: boolean;
  isTopPriority?: boolean;
};

type ExperimentRecommendation = {
  experiment_id: string;
  title: string;
  signal_source: string;
  hypothesis: string;
  proposed_change: string;
  expected_metric: string;
  impact_score: number;
  priority_label?: string;
  status: string;
  created_at: string;
};

type RegistrySummary = {
  counts: {
    entities: number;
    tasks: number;
    results: number;
    approvals: number;
    signals: number;
  };
  pendingApprovals: number;
  topActiveSignal: Signal | null;
  mostRecentTask: RegistryTask | null;
  mostRecentResult: (RegistryResult & { status?: string }) | null;
};

type QueueRegistryTask = {
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

function sortByCreatedAt<T extends { created_at?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
    return rightTime - leftTime;
  });
}

function priorityRank(priority: string) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function isInstallBlocking(signal: Signal) {
  return signal.signal_type === "conversion_dropoff" || signal.signal_type === "top_blocker";
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
  const taskRegistry = readJson<{ tasks?: RegistryTask[] }>(join(rootDir, "staffordos", "tasks", "task_registry.json"), {
    tasks: [],
  });
  const signalRegistry = readJson<{ signals?: Signal[] }>(join(rootDir, "staffordos", "signals", "signal_registry.json"), {
    signals: [],
  });
  const experimentRegistry = readJson<{ experiments?: ExperimentRecommendation[] }>(
    join(rootDir, "staffordos", "experiments", "experiment_registry.json"),
    { experiments: [] },
  );
  const canonicalEntityRegistry = readJson<{ entities?: Array<unknown> }>(
    join(rootDir, "staffordos", "registries", "entity_registry.json"),
    { entities: [] },
  );
  const canonicalTaskRegistry = readJson<{ tasks?: RegistryTask[] }>(
    join(rootDir, "staffordos", "registries", "task_registry.json"),
    { tasks: [] },
  );
  const canonicalResultRegistry = readJson<{ results?: Array<RegistryResult & { status?: string }> }>(
    join(rootDir, "staffordos", "registries", "result_registry.json"),
    { results: [] },
  );
  const canonicalApprovalRegistry = readJson<{ approvals?: ApprovalItem[] }>(
    join(rootDir, "staffordos", "registries", "approval_registry.json"),
    { approvals: [] },
  );
  const canonicalSignalRegistry = readJson<{ signals?: Signal[] }>(
    join(rootDir, "staffordos", "registries", "signal_registry.json"),
    { signals: [] },
  );
  const resultRegistry = readJson<{ results?: RegistryResult[] }>(
    join(rootDir, "staffordos", "results", "result_registry.json"),
    { results: [] },
  );
  const approvalQueue = readJson<{ approvals?: ApprovalItem[] }>(
    join(rootDir, "staffordos", "approvals", "approval_queue.json"),
    { approvals: [] },
  );
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

  const canonicalEntities = Array.isArray(canonicalEntityRegistry.entities) ? canonicalEntityRegistry.entities : [];
  const canonicalTasks = Array.isArray(canonicalTaskRegistry.tasks) ? canonicalTaskRegistry.tasks : [];
  const canonicalResults = Array.isArray(canonicalResultRegistry.results) ? canonicalResultRegistry.results : [];
  const canonicalApprovals = Array.isArray(canonicalApprovalRegistry.approvals) ? canonicalApprovalRegistry.approvals : [];
  const canonicalSignals = Array.isArray(canonicalSignalRegistry.signals) ? canonicalSignalRegistry.signals : [];
  const activeSignals = canonicalSignals
    .filter((signal) => signal.status === "active")
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
  const initialRegistrySummary: RegistrySummary = {
    counts: {
      entities: canonicalEntities.length,
      tasks: canonicalTasks.length,
      results: canonicalResults.length,
      approvals: canonicalApprovals.length,
      signals: canonicalSignals.length,
    },
    pendingApprovals: canonicalApprovals.filter((approval) => approval.status === "pending").length,
    topActiveSignal: activeSignals[0] || null,
    mostRecentTask: sortByCreatedAt(canonicalTasks)[0] || null,
    mostRecentResult: sortByCreatedAt(canonicalResults)[0] || null,
  };
  const initialTasksQueue = {
    helperText: "Tasks represent system actions triggered by signals or approvals.",
    queuedCount: canonicalTasks.filter((task) => task.status === "queued").length,
    tasks: [...canonicalTasks]
      .sort((left, right) => {
        const priorityDelta = priorityRank(right.priority || "low") - priorityRank(left.priority || "low");
        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
        return leftTime - rightTime;
      })
      .map<QueueRegistryTask>((task) => ({
        task_id: task.task_id,
        type: task.type,
        title: task.title,
        status: task.status,
        priority: task.priority || "low",
        created_at: task.created_at,
      })),
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
        initialApprovals={Array.isArray(approvalQueue.approvals) ? approvalQueue.approvals : []}
        initialTaskRegistry={Array.isArray(taskRegistry.tasks) ? taskRegistry.tasks : []}
        initialResultRegistry={Array.isArray(resultRegistry.results) ? resultRegistry.results : []}
        initialSignals={
          Array.isArray(canonicalSignalRegistry.signals)
            ? [...canonicalSignalRegistry.signals]
                .filter((signal) => signal.status === "active")
                .sort((left, right) => {
                  const priorityDelta = priorityRank(right.priority) - priorityRank(left.priority);
                  if (priorityDelta !== 0) {
                    return priorityDelta;
                  }

                  return Number(right?.score || 0) - Number(left?.score || 0);
                })
                .map((signal, index) => ({
                  ...signal,
                  installBlocking: isInstallBlocking(signal),
                  isTopPriority: index === 0,
                }))
            : []
        }
        initialExperiments={
          Array.isArray(experimentRegistry.experiments)
            ? [...experimentRegistry.experiments]
                .sort((left, right) => Number(right?.impact_score || 0) - Number(left?.impact_score || 0))
                .slice(0, 6)
            : []
        }
        initialRegistrySummary={initialRegistrySummary}
        initialTasksQueue={initialTasksQueue}
      />
    </div>
  );
}

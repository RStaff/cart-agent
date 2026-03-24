"use client";

import * as React from "react";
import ApprovalCenter from "./ApprovalCenter";
import ApprovalSummaryCard from "./ApprovalSummaryCard";
import ConversationalDirector from "./ConversationalDirector";
import ExperimentPanel from "./ExperimentPanel";
import QueueView from "./QueueView";
import RecentActivityCard from "./RecentActivityCard";
import RegistrySummaryPanel from "./RegistrySummaryPanel";
import ResultRegistryPanel from "./ResultRegistryPanel";
import RunTasksButton from "./RunTasksButton";
import SignalSummaryCard from "./SignalSummaryCard";
import SignalsPanel from "./SignalsPanel";
import StartDayPanel from "./StartDayPanel";
import TaskQueuePanel from "./TaskQueuePanel";
import TaskRegistryPanel from "./TaskRegistryPanel";

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

type VerificationState = {
  marketing: VerificationResult;
  embedded: VerificationResult;
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
  created_at: string;
  completed_at: string | null;
  result_ref: string | null;
  error_ref: string | null;
  payload: Record<string, unknown>;
};

type QueueRegistryTask = {
  task_id: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
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

type InitialTasksQueue = {
  helperText: string;
  queuedCount: number;
  tasks: QueueRegistryTask[];
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

const DEFAULT_SNAPSHOT: DirectorSnapshot = {
  generated_at: "",
  queued_tasks: 0,
  completed_tasks_today: 0,
  failed_tasks_today: 0,
  last_task_type: "",
  last_task_status: "",
  top_blocker: "",
  operator_mode: "director",
};

const DEFAULT_BRIEFING: DailyBriefing = {
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
};

const DEFAULT_VERIFICATION: VerificationState = {
  marketing: {
    surface: "marketing",
    verified_at: "",
    final_status: "UNKNOWN",
  },
  embedded: {
    surface: "embedded",
    verified_at: "",
    final_status: "UNKNOWN",
  },
};

const DEFAULT_START_DAY_SUMMARY: StartDaySummary = {
  morning_brief_status: "Waiting for morning brief.",
  marketing_verification_status: "UNKNOWN",
  embedded_verification_status: "UNKNOWN",
  outreach_status: "Waiting for outreach run.",
  experiment_status: "Waiting for experiment run.",
  top_blocker: "No blocker recorded.",
  recommended_next_action: "Generate the daily briefing to get the next action.",
  headline: "Daily briefing unavailable",
};

const DEFAULT_APPROVALS: ApprovalItem[] = [];
const DEFAULT_TASK_REGISTRY: RegistryTask[] = [];
const DEFAULT_RESULT_REGISTRY: RegistryResult[] = [];
const DEFAULT_SIGNALS: Signal[] = [];
const DEFAULT_EXPERIMENTS: ExperimentRecommendation[] = [];
const DEFAULT_SIGNALS_HELPER = "The system should work on the biggest install bottleneck first.";
const DEFAULT_TASKS_HELPER = "Tasks represent system actions triggered by signals or approvals.";
const DEFAULT_TASKS_QUEUE: InitialTasksQueue = {
  helperText: DEFAULT_TASKS_HELPER,
  queuedCount: 0,
  tasks: [],
};
const DEFAULT_REGISTRY_SUMMARY: RegistrySummary = {
  counts: {
    entities: 0,
    tasks: 0,
    results: 0,
    approvals: 0,
    signals: 0,
  },
  pendingApprovals: 0,
  topActiveSignal: null,
  mostRecentTask: null,
  mostRecentResult: null,
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function postJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-100">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function RuntimeItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-100">{value || "Not available"}</p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}

function ControlButton({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-left transition"
      onClick={onClick}
      type="button"
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-2 text-sm leading-6 text-indigo-100">{description}</div>
    </button>
  );
}

export default function DirectorDashboard({
  initialSnapshot = DEFAULT_SNAPSHOT,
  initialTasks = [],
  initialBriefing = DEFAULT_BRIEFING,
  initialVerification = DEFAULT_VERIFICATION,
  initialStartDaySummary = DEFAULT_START_DAY_SUMMARY,
  initialApprovals = DEFAULT_APPROVALS,
  initialTaskRegistry = DEFAULT_TASK_REGISTRY,
  initialResultRegistry = DEFAULT_RESULT_REGISTRY,
  initialSignals = DEFAULT_SIGNALS,
  initialExperiments = DEFAULT_EXPERIMENTS,
  initialRegistrySummary = DEFAULT_REGISTRY_SUMMARY,
  initialTasksQueue = DEFAULT_TASKS_QUEUE,
}: {
  initialSnapshot?: DirectorSnapshot;
  initialTasks?: QueueTask[];
  initialBriefing?: DailyBriefing;
  initialVerification?: VerificationState;
  initialStartDaySummary?: StartDaySummary;
  initialApprovals?: ApprovalItem[];
  initialTaskRegistry?: RegistryTask[];
  initialResultRegistry?: RegistryResult[];
  initialSignals?: Signal[];
  initialExperiments?: ExperimentRecommendation[];
  initialRegistrySummary?: RegistrySummary;
  initialTasksQueue?: InitialTasksQueue;
}) {
  const [snapshot, setSnapshot] = React.useState<DirectorSnapshot>({ ...DEFAULT_SNAPSHOT, ...initialSnapshot });
  const [tasks, setTasks] = React.useState<QueueTask[]>(initialTasks);
  const [briefing, setBriefing] = React.useState<DailyBriefing>({ ...DEFAULT_BRIEFING, ...initialBriefing });
  const [verification, setVerification] = React.useState<VerificationState>({
    marketing: { ...DEFAULT_VERIFICATION.marketing, ...initialVerification.marketing },
    embedded: { ...DEFAULT_VERIFICATION.embedded, ...initialVerification.embedded },
  });
  const [startDaySummary, setStartDaySummary] = React.useState<StartDaySummary>({
    ...DEFAULT_START_DAY_SUMMARY,
    ...initialStartDaySummary,
  });
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>(initialApprovals);
  const [taskRegistry, setTaskRegistry] = React.useState<RegistryTask[]>(initialTaskRegistry);
  const [resultRegistry, setResultRegistry] = React.useState<RegistryResult[]>(initialResultRegistry);
  const [signals, setSignals] = React.useState<Signal[]>(initialSignals);
  const [experiments, setExperiments] = React.useState<ExperimentRecommendation[]>(initialExperiments);
  const [signalsHelperText, setSignalsHelperText] = React.useState(DEFAULT_SIGNALS_HELPER);
  const [queueRegistryTasks, setQueueRegistryTasks] = React.useState<QueueRegistryTask[]>(
    Array.isArray(initialTasksQueue.tasks) ? initialTasksQueue.tasks : [],
  );
  const [queuedRegistryCount, setQueuedRegistryCount] = React.useState(Number(initialTasksQueue.queuedCount || 0));
  const [tasksHelperText, setTasksHelperText] = React.useState(initialTasksQueue.helperText || DEFAULT_TASKS_HELPER);
  const [registrySummary, setRegistrySummary] = React.useState<RegistrySummary>({
    ...DEFAULT_REGISTRY_SUMMARY,
    ...initialRegistrySummary,
    counts: {
      ...DEFAULT_REGISTRY_SUMMARY.counts,
      ...(initialRegistrySummary?.counts || {}),
    },
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [controlMessage, setControlMessage] = React.useState("Mission controls ready.");

  const queuedTasks = snapshot.queued_tasks;
  const completedToday = snapshot.completed_tasks_today;
  const failedToday = snapshot.failed_tasks_today;
  const lastTaskType = snapshot.last_task_type || "none";
  const runtimeStatus = snapshot.last_task_status || "idle";
  const topBlocker = briefing.top_blocker || snapshot.top_blocker || "No blocker recorded.";

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [snapshotData, queueData, briefingData, verificationData, startDaySummaryData, taskRegistryData, resultRegistryData, signalData, experimentData, registrySummaryData, tasksQueueData] =
        await Promise.all([
        fetchJson<DirectorSnapshot>("/api/director/snapshot"),
        fetchJson<{ tasks: QueueTask[] }>("/api/director/queue"),
        fetchJson<DailyBriefing>("/api/director/briefing"),
        fetchJson<VerificationState>("/api/director/verification"),
        fetchJson<StartDaySummary>("/api/director/startDaySummary"),
        fetchJson<{ tasks: RegistryTask[] }>("/api/director/tasks"),
        fetchJson<{ results: RegistryResult[] }>("/api/director/results"),
        fetchJson<{ helperText: string; signals: Signal[] }>("/api/director/signals"),
        fetchJson<{ experiments: ExperimentRecommendation[] }>("/api/experiments/recommendations"),
        fetchJson<RegistrySummary>("/api/director/registrySummary"),
        fetchJson<{ helperText: string; queuedCount: number; tasks: QueueRegistryTask[] }>("/api/director/tasksQueue"),
        ]);
      const approvalsData = await fetchJson<{ approvals: ApprovalItem[] }>("/api/director/approvals");
      setSnapshot({ ...DEFAULT_SNAPSHOT, ...snapshotData });
      setTasks(Array.isArray(queueData.tasks) ? queueData.tasks : []);
      setBriefing({ ...DEFAULT_BRIEFING, ...briefingData });
      setVerification({
        marketing: { ...DEFAULT_VERIFICATION.marketing, ...verificationData.marketing },
        embedded: { ...DEFAULT_VERIFICATION.embedded, ...verificationData.embedded },
      });
      setStartDaySummary({ ...DEFAULT_START_DAY_SUMMARY, ...startDaySummaryData });
      setApprovals(Array.isArray(approvalsData.approvals) ? approvalsData.approvals : []);
      setTaskRegistry(Array.isArray(taskRegistryData.tasks) ? taskRegistryData.tasks : []);
      setResultRegistry(Array.isArray(resultRegistryData.results) ? resultRegistryData.results : []);
      setSignals(Array.isArray(signalData.signals) ? signalData.signals : []);
      setSignalsHelperText(signalData.helperText || DEFAULT_SIGNALS_HELPER);
      setExperiments(Array.isArray(experimentData.experiments) ? experimentData.experiments : []);
      setRegistrySummary({
        ...DEFAULT_REGISTRY_SUMMARY,
        ...registrySummaryData,
        counts: {
          ...DEFAULT_REGISTRY_SUMMARY.counts,
          ...(registrySummaryData?.counts || {}),
        },
      });
      setQueueRegistryTasks(Array.isArray(tasksQueueData.tasks) ? tasksQueueData.tasks : []);
      setQueuedRegistryCount(Number(tasksQueueData.queuedCount || 0));
      setTasksHelperText(tasksQueueData.helperText || DEFAULT_TASKS_HELPER);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load director data.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function queueTask(title: string, type: string, payload: Record<string, unknown>, runImmediately = false) {
    setControlMessage(`Queueing ${title}...`);

    try {
      const enqueueResult = await postJson<{ task: { task_id: string } }>("/api/director/enqueue", {
        title,
        type,
        payload,
      });

      if (runImmediately) {
        const batchResult = await postJson<{ completed_count: number; failed_count: number }>("/api/director/runBatch", {
          limit: 2,
        });
        setControlMessage(
          `${title} queued as ${enqueueResult.task.task_id}. Batch completed ${batchResult.completed_count}, failed ${batchResult.failed_count}.`,
        );
      } else {
        setControlMessage(`${title} queued as ${enqueueResult.task.task_id}.`);
      }

      await refresh();
    } catch (taskError) {
      setControlMessage(taskError instanceof Error ? taskError.message : "Failed to queue task.");
    }
  }

  async function runBatchNow() {
    setControlMessage("Running operator batch...");

    try {
      const batchResult = await postJson<{ completed_count: number; failed_count: number }>("/api/director/runBatch", {
        limit: 8,
      });
      setControlMessage(`Batch completed ${batchResult.completed_count}, failed ${batchResult.failed_count}.`);
      await refresh();
    } catch (batchError) {
      setControlMessage(batchError instanceof Error ? batchError.message : "Failed to run batch.");
    }
  }

  async function runSystemTasks() {
    setControlMessage("Running queued canonical tasks...");

    try {
      const runResult = await fetchJson<{
        ok: boolean;
        executed: number;
        results: Array<{ result_id: string }>;
      }>("/api/director/runTasks");
      const latestResultId = runResult.results.at(-1)?.result_id;
      setControlMessage(
        runResult.executed > 0
          ? `Execution engine completed ${runResult.executed} queued task(s). Latest result: ${latestResultId || "n/a"}.`
          : "Execution engine found no queued tasks to run.",
      );
      await refresh();
    } catch (runError) {
      setControlMessage(runError instanceof Error ? runError.message : "Failed to run canonical tasks.");
    }
  }

  async function verifySurfaces() {
    setControlMessage("Queueing surface verification...");

    try {
      await postJson("/api/director/enqueue", {
        title: "verify marketing",
        type: "verify_surface",
        payload: { surface: "marketing" },
      });
      await postJson("/api/director/enqueue", {
        title: "verify embedded",
        type: "verify_surface",
        payload: { surface: "embedded" },
      });
      const batchResult = await postJson<{ completed_count: number; failed_count: number }>("/api/director/runBatch", {
        limit: 2,
      });
      setControlMessage(`Surface verification finished. Completed ${batchResult.completed_count}, failed ${batchResult.failed_count}.`);
      await refresh();
    } catch (verifyError) {
      setControlMessage(verifyError instanceof Error ? verifyError.message : "Failed to verify surfaces.");
    }
  }

  async function updateApproval(approvalId: string, action: "approve" | "reject") {
    setControlMessage(`${action === "approve" ? "Approving" : "Rejecting"} ${approvalId}...`);

    try {
      const endpoint = action === "approve" ? "/api/director/approve" : "/api/director/reject";
      await postJson<{ ok: boolean }>(endpoint, { approval_id: approvalId });
      setControlMessage(`${approvalId} marked ${action}d.`);
      await refresh();
    } catch (approvalError) {
      setControlMessage(approvalError instanceof Error ? approvalError.message : "Failed to update approval.");
    }
  }

  async function updateExperiment(experimentId: string, action: "approve" | "reject") {
    setControlMessage(`${action === "approve" ? "Approving" : "Rejecting"} ${experimentId}...`);

    try {
      await postJson<{ ok: boolean }>("/api/experiments/recommendations", {
        experiment_id: experimentId,
        action,
      });
      setControlMessage(`${experimentId} marked ${action}d.`);
      await refresh();
    } catch (experimentError) {
      setControlMessage(experimentError instanceof Error ? experimentError.message : "Failed to update experiment.");
    }
  }

  const recentActivity = tasks.slice(-6).reverse();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
          <div>
            <h1 className="text-3xl font-semibold text-slate-100">StaffordOS Director Console</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
              Operate the agent system from one surface. Monitor queue health, execute agent tasks, and control automation flows.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <RuntimeItem label="Runtime status" value={runtimeStatus} />
            <RuntimeItem label="Queued tasks" value={queuedTasks} />
            <RuntimeItem label="Completed today" value={completedToday} />
            <RuntimeItem label="Failed today" value={failedToday} />
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">{error}</div>
        ) : null}

        <RegistrySummaryPanel counts={registrySummary.counts} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <SignalSummaryCard topActiveSignal={registrySummary.topActiveSignal} />
          <ApprovalSummaryCard pendingApprovals={registrySummary.pendingApprovals} />
          <RecentActivityCard
            mostRecentTask={registrySummary.mostRecentTask}
            mostRecentResult={registrySummary.mostRecentResult}
          />
        </div>

        <TaskQueuePanel tasks={queueRegistryTasks} helperText={tasksHelperText} queuedCount={queuedRegistryCount} />

        <SectionCard
          title="Operator Runtime"
          description="Director mode visibility into the agent runtime and system execution state."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <RuntimeItem label="Runtime Status" value={runtimeStatus} />
            <RuntimeItem label="Last Task Type" value={lastTaskType} />
            <RuntimeItem label="Top Blocker" value={topBlocker} />
          </div>
        </SectionCard>

        <SignalsPanel signals={signals} helperText={signalsHelperText} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <SectionCard
            title="Today"
            description="Current priorities, opportunities, and system-level direction for the operator."
          >
            <div className="grid gap-4">
              <InfoBlock label="Morning Brief" value={briefing.headline || "Generate the morning briefing."} />
              <InfoBlock label="Top Opportunity" value={briefing.top_opportunity || "No opportunity recorded."} />
              <InfoBlock label="Top Blocker" value={topBlocker} />
              <InfoBlock
                label="Recommended Action"
                value={briefing.recommended_next_action || "Generate the daily briefing to get a recommended action."}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Control"
            description="Manual commands that trigger automated agent workflows."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ControlButton
                title="Generate Daily Brief"
                description="Creates the morning briefing summarizing system state, opportunities, and priorities."
                onClick={() => {
                  void queueTask("generate morning brief", "generate_daily_briefing", {}, true);
                }}
              />
              <ControlButton
                title="Run Batch"
                description="Processes queued tasks immediately using the agent execution engine."
                onClick={() => {
                  void runBatchNow();
                }}
              />
              <ControlButton
                title="Verify Surface"
                description="Runs agents that confirm marketing pages, embedded apps, and system surfaces are functioning."
                onClick={() => {
                  void verifySurfaces();
                }}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <RunTasksButton
                onRun={() => {
                  void runSystemTasks();
                }}
                disabled={loading}
              />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
              {controlMessage}
            </div>
          </SectionCard>

          <SectionCard
            title="Growth"
            description="Growth actions that turn the current system state into distribution and experiment work."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ControlButton
                title="Run Outreach Campaign"
                description="Generates the next outreach batch for install growth using the current queue and agent workflow."
                onClick={() => {
                  void queueTask("run outreach campaign", "generate_outreach", {}, true);
                }}
              />
              <ControlButton
                title="Run Experiment"
                description="Executes approved experiments so the system can keep improving conversion performance."
                onClick={() => {
                  void queueTask("run experiment", "run_experiment", { mode: "approved_only" }, true);
                }}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <InfoBlock label="Audit Runs" value={String(briefing.top_metrics.audit_runs)} />
              <InfoBlock label="Install Clicks" value={String(briefing.top_metrics.install_clicks)} />
              <InfoBlock label="Installs" value={String(briefing.top_metrics.installs)} />
            </div>
          </SectionCard>

        <SectionCard
          title="System"
          description="Queue visibility, runtime state, and supporting operator modules."
        >
          <QueueView tasks={tasks} />
          <StartDayPanel summary={startDaySummary} onMutate={refresh} />
        </SectionCard>
        </div>

        <SectionCard
          title="Experiment Recommendations"
          description="Signals-driven experiments designed to improve installs and conversion."
        >
          <ExperimentPanel
            experiments={experiments}
            onApprove={(experimentId) => {
              void updateExperiment(experimentId, "approve");
            }}
            onReject={(experimentId) => {
              void updateExperiment(experimentId, "reject");
            }}
          />
        </SectionCard>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <SectionCard
            title="Approval Center"
            description="Review and approve high-impact agent outputs before execution or publishing."
          >
            <ApprovalCenter
              approvals={approvals}
              onApprove={(approvalId) => {
                void updateApproval(approvalId, "approve");
              }}
              onReject={(approvalId) => {
                void updateApproval(approvalId, "reject");
              }}
            />
          </SectionCard>

          <SectionCard
            title="Task Registry"
            description="Canonical record of all requested and executed agent tasks."
          >
            <TaskRegistryPanel tasks={taskRegistry} />
          </SectionCard>

          <SectionCard
            title="Result Registry"
            description="Durable record of outputs produced by the agent system."
          >
            <ResultRegistryPanel results={resultRegistry} />
          </SectionCard>
        </div>

        <SectionCard
          title="Command"
          description="Use the conversational command layer to translate simple operator requests into structured runtime work."
        >
          <ConversationalDirector onMutate={refresh} />
        </SectionCard>

        <SectionCard
          title="System Activity"
          description="Recent events from the director runtime and agent execution."
        >
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                No recent activity recorded.
              </div>
            ) : (
              recentActivity.map((task) => (
                <div key={task.task_id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{task.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{task.type}</p>
                    </div>
                    <div className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                      {task.status}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{task.created_at}</p>
                </div>
              ))
            )}
          </div>
          {loading ? <div className="text-sm text-slate-400">Refreshing director data...</div> : null}
        </SectionCard>
      </div>
    </div>
  );
}

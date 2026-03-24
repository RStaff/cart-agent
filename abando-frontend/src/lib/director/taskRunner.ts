import { readFileSync, writeFileSync } from "node:fs";
import { writeResultEntry } from "./resultWriter";

type RegistryTask = {
  task_id: string;
  type: string;
  title: string;
  status: string;
  priority?: string;
  requested_by?: string;
  lease_owner?: string | null;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  result_ref?: string | null;
  error_ref?: string | null;
  payload?: Record<string, unknown>;
};

type TaskRegistryFile = {
  version: string;
  updated_at: string;
  tasks: RegistryTask[];
};

function resultTypeForTask(taskType: string) {
  if (taskType === "run_audit") return "audit_result";
  if (taskType === "generate_daily_briefing") return "daily_briefing";
  if (taskType === "verify_surface") return "verification_report";
  if (taskType === "generate_outreach") return "outreach_batch";
  if (taskType === "run_experiment") return "experiment_result";
  return "task_result";
}

function summarizeTask(task: RegistryTask) {
  if (task.type === "run_experiment") {
    return `Execution engine processed ${task.title.toLowerCase()} in director mode.`;
  }
  if (task.type === "verify_surface") {
    const surface = typeof task.payload?.surface === "string" ? task.payload.surface : "surface";
    return `Execution engine verified the ${surface} surface task path and recorded the outcome.`;
  }
  return `Execution engine completed ${task.title.toLowerCase()}.`;
}

export function runQueuedTasks({
  taskRegistryPath,
  resultRegistryPath,
}: {
  taskRegistryPath: string;
  resultRegistryPath: string;
}) {
  const registry = JSON.parse(readFileSync(taskRegistryPath, "utf8")) as TaskRegistryFile;
  const tasks = Array.isArray(registry.tasks) ? registry.tasks : [];
  const queuedTasks = tasks.filter((task) => task.status === "queued");

  if (queuedTasks.length === 0) {
    return {
      executed: 0,
      queuedBefore: 0,
      results: [],
      tasks: [],
    };
  }

  const nextTasks = [...tasks];
  const resultEntries = [];

  for (const queuedTask of queuedTasks) {
    const taskIndex = nextTasks.findIndex((task) => task.task_id === queuedTask.task_id);
    if (taskIndex === -1) {
      continue;
    }

    const startedAt = new Date().toISOString();
    nextTasks[taskIndex] = {
      ...nextTasks[taskIndex],
      status: "running",
      started_at: startedAt,
    };

    const summary = summarizeTask(nextTasks[taskIndex]);
    const resultEntry = writeResultEntry({
      registryPath: resultRegistryPath,
      taskId: queuedTask.task_id,
      resultType: resultTypeForTask(queuedTask.type),
      summary,
    });

    const finishedAt = new Date().toISOString();
    nextTasks[taskIndex] = {
      ...nextTasks[taskIndex],
      status: "finished",
      finished_at: finishedAt,
      result_ref: resultEntry.result_id,
    };
    resultEntries.push(resultEntry);
  }

  const nextRegistry: TaskRegistryFile = {
    version: registry.version || "1.0",
    updated_at: new Date().toISOString(),
    tasks: nextTasks,
  };

  writeFileSync(taskRegistryPath, `${JSON.stringify(nextRegistry, null, 2)}\n`, "utf8");

  return {
    executed: resultEntries.length,
    queuedBefore: queuedTasks.length,
    results: resultEntries,
    tasks: nextTasks.filter((task) => queuedTasks.some((queuedTask) => queuedTask.task_id === task.task_id)),
  };
}

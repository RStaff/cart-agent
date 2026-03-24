"use client";

import * as React from "react";

type TaskType = "generate_daily_briefing" | "generate_outreach" | "verify_surface" | "run_experiment" | "noop";

type ComposerPayload = {
  title: string;
  type: TaskType;
  payload: Record<string, unknown>;
};

type TaskComposerProps = {
  onMutate: () => Promise<void>;
};

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

function buildTask(type: TaskType, surface: "marketing" | "embedded"): ComposerPayload {
  if (type === "generate_daily_briefing") {
    return { title: "generate daily briefing", type, payload: {} };
  }

  if (type === "generate_outreach") {
    return { title: "generate outreach", type, payload: {} };
  }

  if (type === "verify_surface") {
    return { title: `verify ${surface}`, type, payload: { surface } };
  }

  if (type === "run_experiment") {
    return { title: "run experiment", type, payload: { mode: "approved_only" } };
  }

  return { title: "noop task", type: "noop", payload: {} };
}

export default function TaskComposer({ onMutate }: TaskComposerProps) {
  const [taskType, setTaskType] = React.useState<TaskType>("generate_daily_briefing");
  const [surface, setSurface] = React.useState<"marketing" | "embedded">("marketing");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("Compose a safe structured task for the runtime.");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Creating task...");

    try {
      const task = buildTask(taskType, surface);
      const result = await postJson<{ task: { task_id: string; title: string } }>("/api/director/enqueue", task);
      setMessage(`Task created: ${result.task.task_id} (${result.task.title})`);
      await onMutate();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create task.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">Task Composer</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Create a runtime task without touching JSON</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Safe structured task creation for the operator runtime. No arbitrary commands, only approved task types.
      </p>

      <form className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Task Type</span>
          <select
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none ring-0"
            disabled={busy}
            onChange={(event) => setTaskType(event.target.value as TaskType)}
            value={taskType}
          >
            <option value="generate_daily_briefing">generate_daily_briefing</option>
            <option value="generate_outreach">generate_outreach</option>
            <option value="verify_surface">verify_surface</option>
            <option value="run_experiment">run_experiment</option>
            <option value="noop">noop</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Surface</span>
          <select
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none ring-0 disabled:opacity-50"
            disabled={busy || taskType !== "verify_surface"}
            onChange={(event) => setSurface(event.target.value as "marketing" | "embedded")}
            value={surface}
          >
            <option value="marketing">marketing</option>
            <option value="embedded">embedded</option>
          </select>
        </label>

        <div className="flex items-end">
          <button
            className="w-full rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-400 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy}
            type="submit"
          >
            Create Task
          </button>
        </div>
      </form>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">{message}</div>
    </section>
  );
}

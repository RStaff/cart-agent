"use client";

import * as React from "react";

type EnqueuePayload = {
  title: string;
  type: string;
  payload: Record<string, unknown>;
};

type AgentControlsProps = {
  onMutate: () => Promise<void>;
};

const CONTROL_TASKS: EnqueuePayload[] = [
  { title: "generate daily briefing", type: "generate_daily_briefing", payload: {} },
  { title: "generate outreach", type: "generate_outreach", payload: {} },
  { title: "verify marketing", type: "verify_surface", payload: { surface: "marketing" } },
  { title: "verify embedded", type: "verify_surface", payload: { surface: "embedded" } },
  { title: "run experiment", type: "run_experiment", payload: { mode: "approved_only" } },
];

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

export default function AgentControls({ onMutate }: AgentControlsProps) {
  const [busyKey, setBusyKey] = React.useState<string>("");
  const [message, setMessage] = React.useState<string>("Director controls ready.");

  async function enqueueTask(task: EnqueuePayload) {
    setBusyKey(task.type + task.title);
    setMessage(`Enqueuing ${task.title}...`);

    try {
      const result = await postJson<{ task: { task_id: string } }>("/api/director/enqueue", task);
      setMessage(`Queued ${task.title} as ${result.task.task_id}.`);
      await onMutate();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to enqueue task.");
    } finally {
      setBusyKey("");
    }
  }

  async function runBatch() {
    setBusyKey("run_batch");
    setMessage("Running operator batch...");

    try {
      const result = await postJson<{ completed_count: number; failed_count: number }>("/api/director/runBatch", {
        limit: 8,
      });
      setMessage(`Batch finished. Completed ${result.completed_count}, failed ${result.failed_count}.`);
      await onMutate();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to run batch.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">Agent Controls</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Enqueue real work and run the operator</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Queue tasks for the runtime, then run a batch to let StaffordOS execute them without terminal babysitting.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-left text-sm font-medium text-cyan-100 transition hover:border-cyan-400 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busyKey !== ""}
          onClick={runBatch}
          type="button"
        >
          Run Batch
        </button>

        {CONTROL_TASKS.map((task) => (
          <button
            key={task.type + task.title}
            className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-left text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busyKey !== ""}
            onClick={() => enqueueTask(task)}
            type="button"
          >
            {task.title
              .split(" ")
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ")}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">{message}</div>
    </section>
  );
}

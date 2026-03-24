"use client";

import * as React from "react";

type CommandTaskType =
  | "generate_daily_briefing"
  | "generate_outreach"
  | "verify_surface"
  | "run_experiment";

type CommandResult = {
  interpretedCommand: string;
  taskId: string;
  statusMessage: string;
};

type ConversationalDirectorProps = {
  onMutate: () => Promise<void>;
};

type EnqueueResponse = {
  task: {
    task_id: string;
    title: string;
    type: CommandTaskType;
    status: string;
  };
};

type RunBatchResponse = {
  completed_count?: number;
  failed_count?: number;
  skipped_count?: number;
};

type CommandMapping = {
  title: string;
  type: CommandTaskType;
  payload: Record<string, unknown>;
  interpretedCommand: string;
};

const COMMANDS: Record<string, CommandMapping> = {
  "give me the morning brief": {
    title: "generate morning brief from conversational director",
    type: "generate_daily_briefing",
    payload: {},
    interpretedCommand: "generate_daily_briefing",
  },
  "generate outreach": {
    title: "generate outreach from conversational director",
    type: "generate_outreach",
    payload: {},
    interpretedCommand: "generate_outreach",
  },
  "run outreach": {
    title: "generate outreach from conversational director",
    type: "generate_outreach",
    payload: {},
    interpretedCommand: "generate_outreach",
  },
  "verify marketing": {
    title: "verify marketing from conversational director",
    type: "verify_surface",
    payload: { surface: "marketing" },
    interpretedCommand: "verify_surface marketing",
  },
  "verify embedded": {
    title: "verify embedded from conversational director",
    type: "verify_surface",
    payload: { surface: "embedded" },
    interpretedCommand: "verify_surface embedded",
  },
  "verify the product surfaces": {
    title: "verify marketing from conversational director",
    type: "verify_surface",
    payload: { surface: "marketing" },
    interpretedCommand: "verify_surface marketing",
  },
  "run experiment": {
    title: "run approved experiments from conversational director",
    type: "run_experiment",
    payload: { mode: "approved_only" },
    interpretedCommand: "run_experiment approved_only",
  },
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

function normalizeCommand(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function ConversationalDirector({ onMutate }: ConversationalDirectorProps) {
  const [command, setCommand] = React.useState("");
  const [runNow, setRunNow] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<CommandResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);

    const normalized = normalizeCommand(command);
    const mapping = COMMANDS[normalized];

    if (!mapping) {
      setBusy(false);
      if (normalized === "what is blocked?") {
        setResult({
          interpretedCommand: "read director blocker state",
          taskId: "none",
          statusMessage: "No task created. Check the TODAY zone for Top Blocker and Recommended Action.",
        });
        return;
      }
      setError(
        "Unsupported command. Try: give me the morning brief, verify the product surfaces, run outreach, run experiment, or what is blocked?",
      );
      return;
    }

    try {
      const enqueueResult = await postJson<EnqueueResponse>("/api/director/enqueue", {
        title: mapping.title,
        type: mapping.type,
        payload: mapping.payload,
      });

      let statusMessage = `Queued task ${enqueueResult.task.task_id}.`;

      if (runNow) {
        const batchResult = await postJson<RunBatchResponse>("/api/director/runBatch", { limit: 1 });
        statusMessage = `Queued and ran task. Completed: ${batchResult.completed_count ?? 0}, failed: ${batchResult.failed_count ?? 0}, skipped: ${batchResult.skipped_count ?? 0}.`;
      }

      setResult({
        interpretedCommand: mapping.interpretedCommand,
        taskId: enqueueResult.task.task_id,
        statusMessage,
      });
      setCommand("");
      await onMutate();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to process command.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-slate-800/90 bg-slate-900/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">Command</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Command</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Rule-based command translation for common runtime actions. No arbitrary execution, only approved command patterns.
      </p>
      <div className="mt-4 rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 text-sm text-slate-400">
        <div className="font-medium text-slate-200">Example commands:</div>
        <div className="mt-2 grid gap-1 text-slate-500">
          <div>give me the morning brief</div>
          <div>verify the product surfaces</div>
          <div>run outreach</div>
          <div>run experiment</div>
          <div>what is blocked?</div>
        </div>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Director Command</span>
          <input
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500"
            disabled={busy}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="give me the morning brief"
            value={command}
          />
        </label>

        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            checked={runNow}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-cyan-400"
            disabled={busy}
            onChange={(event) => setRunNow(event.target.checked)}
            type="checkbox"
          />
          Run batch immediately after enqueue
        </label>

        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full border border-slate-700 px-3 py-1">give me the morning brief</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">verify the product surfaces</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">run outreach</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">run experiment</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">what is blocked?</span>
        </div>

        <button
          className="w-full rounded-2xl border border-cyan-500/40 bg-cyan-500/12 px-4 py-3 text-sm font-medium text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-cyan-400 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy || !command.trim()}
          type="submit"
        >
          {busy ? "Processing Command..." : "Submit Command"}
        </button>
      </form>

      <div className="mt-5 rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 text-sm text-slate-300">
        {error ? (
          <div className="text-rose-300">{error}</div>
        ) : result ? (
          <div className="grid gap-2">
            <div>
              <span className="text-slate-500">Interpreted command:</span> {result.interpretedCommand}
            </div>
            <div>
              <span className="text-slate-500">Created task_id:</span> {result.taskId}
            </div>
            <div>
              <span className="text-slate-500">Status message:</span> {result.statusMessage}
            </div>
          </div>
        ) : (
          <div>Enter one of the supported commands to enqueue real operator work.</div>
        )}
      </div>
    </section>
  );
}

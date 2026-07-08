"use client";

import { useState } from "react";

type WorkdayAction = "start" | "stop";

type WorkdayStatus =
  | { state: "idle" | "running" | "ok"; message: string }
  | { state: "error"; message: string };

const INITIAL_STATUS: WorkdayStatus = {
  state: "idle",
  message: "Use this panel to start or stop the StaffordOS workday without leaving the UI.",
};

export function WorkdayControlPanel() {
  const [status, setStatus] = useState<WorkdayStatus>(INITIAL_STATUS);
  const [busyAction, setBusyAction] = useState<WorkdayAction | null>(null);

  async function run(action: WorkdayAction) {
    setBusyAction(action);
    setStatus({ state: "running", message: action === "start" ? "Starting workday…" : "Stopping workday…" });

    try {
      const response = await fetch(`/api/operator/workday/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || json?.stderr || `Failed to ${action} workday.`);
      }

      setStatus({
        state: "ok",
        message: action === "start" ? "Workday started from StaffordOS." : "Workday stopped from StaffordOS.",
      });
    } catch (error: any) {
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="panel">
      <div className="panelInner">
        <p className="eyebrow">Workday control</p>
        <h2 className="sectionTitle" style={{ marginBottom: 10 }}>
          Start or stop the workday from StaffordOS
        </h2>
        <p className="subtitle" style={{ marginTop: 0 }}>
          This runs the governed StaffordOS workday loop through the operator UI instead of a terminal command.
          Coding agents are not invoked here; they only run through governed execution routes when explicitly requested.
        </p>
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button buttonPrimary"
            onClick={() => run("start")}
            disabled={busyAction !== null}
          >
            {busyAction === "start" ? "Starting…" : "Start Workday"}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => run("stop")}
            disabled={busyAction !== null}
          >
            {busyAction === "stop" ? "Stopping…" : "Stop Workday"}
          </button>
        </div>
        <div className="kv" style={{ marginTop: 16 }}>
          <div><strong>Status:</strong> {status.state}</div>
          <div><strong>Message:</strong> {status.message}</div>
          <div><strong>Launch path:</strong> /api/operator/workday/start · /api/operator/workday/stop</div>
        </div>
      </div>
    </section>
  );
}

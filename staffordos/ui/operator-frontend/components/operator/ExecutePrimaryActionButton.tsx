"use client";

import { useState } from "react";

type ExecuteState =
  | { status: "idle"; message: "" }
  | { status: "running"; message: "Executing..." }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function ExecutePrimaryActionButton() {
  const [state, setState] = useState<ExecuteState>({ status: "idle", message: "" });

  async function execute() {
    setState({ status: "running", message: "Executing..." });

    try {
      const res = await fetch("/api/operator/execute-primary-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.reason || json.error || "Execution blocked.");
      }

      setState({
        status: "success",
        message: `${json.status}. Loop D: ${json.loop_d_status}.`
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Execution failed."
      });
    }
  }

  return (
    <div className="operatorExecuteWrap">
      <button
        type="button"
        className="button buttonPrimary"
        onClick={execute}
        disabled={state.status === "running"}
      >
        {state.status === "running" ? "Executing..." : "Execute now"}
      </button>

      {state.message ? (
        <p className={`operatorExecuteStatus operatorExecuteStatus${state.status}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

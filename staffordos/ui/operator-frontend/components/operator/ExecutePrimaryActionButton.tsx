"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ExecuteState =
  | { status: "idle"; message: "" }
  | { status: "running"; message: "Executing..." }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type ExecutePrimaryActionButtonProps = {
  requireConfirmation?: boolean;
  confirmationLabel?: string;
  submitLabel?: string;
  refreshOnSuccess?: boolean;
};

export function ExecutePrimaryActionButton({
  requireConfirmation = false,
  confirmationLabel = "I confirm the displayed action only.",
  submitLabel = "Execute now",
  refreshOnSuccess = false
}: ExecutePrimaryActionButtonProps) {
  const [state, setState] = useState<ExecuteState>({ status: "idle", message: "" });
  const [confirmed, setConfirmed] = useState(!requireConfirmation);
  const router = useRouter();

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

      if (refreshOnSuccess) {
        setTimeout(() => {
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Execution failed."
      });
    }
  }

  return (
    <div className="operatorExecuteWrap">
      {requireConfirmation ? (
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span className="hint">{confirmationLabel}</span>
        </label>
      ) : null}

      <button
        type="button"
        className="button buttonPrimary"
        onClick={execute}
        disabled={state.status === "running" || (requireConfirmation && !confirmed)}
      >
        {state.status === "running" ? "Executing..." : submitLabel}
      </button>

      {state.message ? (
        <p className={`operatorExecuteStatus operatorExecuteStatus${state.status}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

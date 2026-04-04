"use client";

import { useEffect, useState } from "react";
import { OperatorNav } from "./OperatorNav";

type ArtifactStatusValue = "loaded" | "missing" | "empty" | "malformed";
type ArtifactReadinessValue = "ready" | "stale" | "missing" | "invalid";

type RossCommandCenterPayload = {
  ok?: boolean;
  activeDecision: {
    decision_id?: string;
    title?: string;
    recommended_option_label?: string;
    approval_state?: string;
  };
  currentTruth: {
    current_truth_summary?: string;
  };
  commandCenterPack: string;
  executionSessionPack: string;
  exactNextCommand: string;
  status: {
    activeDecision: ArtifactStatusValue;
    currentTruth: ArtifactStatusValue;
    commandCenterPack: ArtifactStatusValue;
    executionSessionPack: ArtifactStatusValue;
  };
  readiness: {
    activeDecision: ArtifactReadinessValue;
    currentTruth: ArtifactReadinessValue;
    commandCenterPack: ArtifactReadinessValue;
    executionSessionPack: ArtifactReadinessValue;
  };
  updatedAt: {
    activeDecision: string;
    currentTruth: string;
    commandCenterPack: string;
    executionSessionPack: string;
  };
  timestamp?: string;
  error?: string;
};

function renderCompactMarkdown(text: string) {
  return text
    .split("\n")
    .map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <div key={`spacer-${index}`} style={{ height: 8 }} />;
      }

      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={`h1-${index}`} className="sectionTitle" style={{ marginTop: 6, marginBottom: 10 }}>
            {trimmed.slice(2)}
          </h2>
        );
      }

      if (trimmed.startsWith("## ")) {
        return (
          <p
            key={`h2-${index}`}
            className="eyebrow"
            style={{ marginTop: 18, marginBottom: 8 }}
          >
            {trimmed.slice(3)}
          </p>
        );
      }

      if (trimmed.startsWith("- ")) {
        return (
          <p key={`bullet-${index}`} className="hint surfaceMarkdownLine" style={{ marginTop: 0, marginBottom: 8, color: "#cbd5e1" }}>
            {`\u2022 ${trimmed.slice(2)}`}
          </p>
        );
      }

      return (
        <p key={`line-${index}`} className="hint surfaceMarkdownLine" style={{ marginTop: 0, marginBottom: 8, color: "#cbd5e1" }}>
          {trimmed}
        </p>
      );
    });
}

export function RossCommandCenterSurface() {
  const [data, setData] = useState<RossCommandCenterPayload | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCommandCenter() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/operator/ross-command-center", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as RossCommandCenterPayload;

        if (!mounted) {
          return;
        }

        setData(payload);
        setError(payload.ok === false ? payload.error || "Could not load Ross command center." : "");
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Could not load Ross command center.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCommandCenter();
    return () => {
      mounted = false;
    };
  }, []);

  const status = data?.status || {
    activeDecision: "missing" as const,
    currentTruth: "missing" as const,
    commandCenterPack: "missing" as const,
    executionSessionPack: "missing" as const,
  };
  const readiness = data?.readiness || {
    activeDecision: "missing" as const,
    currentTruth: "missing" as const,
    commandCenterPack: "missing" as const,
    executionSessionPack: "missing" as const,
  };
  const updatedAt = data?.updatedAt || {
    activeDecision: "",
    currentTruth: "",
    commandCenterPack: "",
    executionSessionPack: "",
  };
  const activeDecision = data?.activeDecision || {};
  const currentTruth = data?.currentTruth || {};
  const commandCenterPack = data?.commandCenterPack || "";
  const executionSessionPack = data?.executionSessionPack || "";
  const exactNextCommand = data?.exactNextCommand || "No exact next command recorded.";
  const readyCount = Object.values(readiness).filter((value) => value === "ready").length;
  const systemStatusLabel = isLoading
    ? "loading"
    : error
      ? "degraded"
      : readyCount === 4
        ? "ready"
        : readyCount > 0 || Object.values(readiness).some((value) => value === "stale")
          ? "partial"
          : "missing";

  return (
    <main className="shell">
      <div className="container">
        <section className="panel dailyBriefPanel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS</p>
            <h1 className="title" style={{ marginBottom: 8 }}>Ross command center</h1>
            <p className="subtitle">
              Read-only hosted view over Ross Operator artifacts for the active build lane.
            </p>
            <OperatorNav activeHref="/operator/command-center" />
            <div className="row commandCenterStatusRow" style={{ marginTop: 16 }}>
              <span className={`statusPill statusPill${systemStatusLabel[0].toUpperCase()}${systemStatusLabel.slice(1)}`}>
                System {systemStatusLabel}
              </span>
              <span className={`statusPill statusPill${readiness.activeDecision[0].toUpperCase()}${readiness.activeDecision.slice(1)}`}>Decision {readiness.activeDecision}</span>
              <span className={`statusPill statusPill${readiness.currentTruth[0].toUpperCase()}${readiness.currentTruth.slice(1)}`}>Truth {readiness.currentTruth}</span>
              <span className={`statusPill statusPill${readiness.commandCenterPack[0].toUpperCase()}${readiness.commandCenterPack.slice(1)}`}>Center Pack {readiness.commandCenterPack}</span>
              <span className={`statusPill statusPill${readiness.executionSessionPack[0].toUpperCase()}${readiness.executionSessionPack.slice(1)}`}>Session Pack {readiness.executionSessionPack}</span>
            </div>
            {error ? (
              <p className="hint" style={{ marginTop: 12, color: "#fca5a5" }}>
                {error}
              </p>
            ) : null}
          </div>
        </section>

        <section className="grid gridTwo commandCenterGrid">
          <article className="panel commandCenterCard">
            <div className="panelInner">
              <p className="eyebrow">Active Decision</p>
              {isLoading ? <p className="emptyStateText">Loading active decision...</p> : null}
              <h2 className="sectionTitle commandCenterCardTitle" style={{ marginBottom: 10 }}>
                {activeDecision.title || "No active decision"}
              </h2>
              <div className="kv commandCenterKv">
                <div><strong>ID:</strong> {activeDecision.decision_id || "Unavailable"}</div>
                <div><strong>Recommendation:</strong> {activeDecision.recommended_option_label || "Unavailable"}</div>
                <div><strong>Approval:</strong> {activeDecision.approval_state || "Unavailable"}</div>
                <div><strong>Readiness:</strong> {readiness.activeDecision}</div>
                <div><strong>Updated:</strong> {updatedAt.activeDecision || "Unavailable"}</div>
              </div>
            </div>
          </article>

          <article className="panel secondaryPanel commandCenterCard">
            <div className="panelInner">
              <p className="eyebrow">Current Truth</p>
              {isLoading ? <p className="emptyStateText">Loading current truth...</p> : null}
              <p className="subtitle commandCenterTruthText" style={{ marginTop: 0, maxWidth: "unset" }}>
                {currentTruth.current_truth_summary || "No current truth summary available."}
              </p>
              <p className="hint" style={{ marginTop: 10 }}>
                Readiness: {readiness.currentTruth} {updatedAt.currentTruth ? `• ${updatedAt.currentTruth}` : ""}
              </p>
            </div>
          </article>

          <article className="panel secondaryPanel fullWidth commandCenterCard">
            <div className="panelInner">
              <p className="eyebrow">Exact Next Command</p>
              <div className="commandHero commandHeroMobile">
                {exactNextCommand}
              </div>
              <p className="hint" style={{ marginTop: 12 }}>
                {isLoading ? "Waiting for hosted artifact payload." : "Read-only command surfaced from Ross Operator artifacts."}
              </p>
            </div>
          </article>

          <article className="panel fullWidth commandCenterPanel">
            <div className="panelInner">
              <p className="eyebrow">Command Center Pack</p>
              <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
                Readiness: {readiness.commandCenterPack} {updatedAt.commandCenterPack ? `• ${updatedAt.commandCenterPack}` : ""}
              </p>
              <div className="surfaceMarkdown">
              {isLoading ? (
                <p className="emptyStateText">Loading command center pack...</p>
              ) : commandCenterPack
                ? renderCompactMarkdown(commandCenterPack)
                : <p className="emptyStateText">Command center pack unavailable.</p>}
              </div>
            </div>
          </article>

          <article className="panel secondaryPanel fullWidth commandCenterPanel">
            <div className="panelInner">
              <p className="eyebrow">Execution Session Pack</p>
              <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
                Readiness: {readiness.executionSessionPack} {updatedAt.executionSessionPack ? `• ${updatedAt.executionSessionPack}` : ""}
              </p>
              <div className="surfaceMarkdown">
              {isLoading ? (
                <p className="emptyStateText">Loading execution session pack...</p>
              ) : executionSessionPack
                ? renderCompactMarkdown(executionSessionPack)
                : <p className="emptyStateText">Execution session pack unavailable.</p>}
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

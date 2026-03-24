"use client";

import { useEffect, useMemo, useState } from "react";
import { queryOperatorApi } from "../../lib/operatorClient";
import { OperatorNav } from "./OperatorNav";

const EXAMPLE_PROMPTS = [
  "What should I know today?",
  "What does Grace have Wednesday?",
  "Show open Family tasks",
  "What do my Abando notes say about approval?",
  "Anything that needs more info?",
] as const;

const HISTORY_KEY = "staffordos-operator-history";
const HISTORY_LIMIT = 5;
type QueryResponse = {
  ok: boolean;
  query?: {
    text?: string;
    query_type?: string;
    confidence?: number;
    filters?: Record<string, unknown>;
  };
  route?: {
    target_view?: string;
    reason?: string;
  };
  result?: unknown;
  summary?: {
    message?: string;
    counts?: Record<string, number>;
  };
  debug?: {
    matched_terms?: string[];
    detection_path?: string;
    notes?: string[];
  };
  roadmap?: {
    phase?: string;
    next_steps?: Array<{
      step?: number;
      title?: string;
      details?: string[];
    }>;
  };
  error?: string;
};

function prettyJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function readHistory() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeHistory(history: string[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
}

export function OperatorConsole() {
  const [queryText, setQueryText] = useState("");
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  useEffect(() => {
    setRecentQueries(readHistory());
  }, []);

  async function runQuery(rawText: string) {
    const text = String(rawText || "").trim();
    if (!text) {
      setError("Enter a query before running the operator console.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = await queryOperatorApi(text);
      setResponse(payload);
      setRecentQueries((previous) => {
        const next = [text, ...previous.filter((item) => item !== text)].slice(0, HISTORY_LIMIT);
        writeHistory(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach the operator backend.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runQuery(queryText);
  }

  const summaryCounts = useMemo(() => prettyJson(response?.summary?.counts ?? {}), [response]);

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS</p>
            <h1 className="title">StaffordOS Operator Console</h1>
            <p className="subtitle">Query your schedule, tasks, docs, overview, and operator state.</p>

            <OperatorNav activeHref="/operator" />

            <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
              <label className="label" htmlFor="operator-query">
                Natural-language query
              </label>
              <textarea
                id="operator-query"
                className="textarea"
                placeholder={"What should I know today?\nWhat does Grace have Wednesday?\nShow open Family tasks"}
                value={queryText}
                onChange={(event) => {
                  setQueryText(event.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !isLoading) {
                    event.preventDefault();
                    void runQuery(queryText);
                  }
                }}
              />

              <div className="row" style={{ marginTop: 14 }}>
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setQueryText(prompt);
                      if (error) setError("");
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="row" style={{ marginTop: 16, alignItems: "center" }}>
                <button type="submit" className="button buttonPrimary" disabled={isLoading || !queryText.trim()}>
                  {isLoading ? "Running..." : "Run Query"}
                </button>
                <p className="hint">Cmd/Ctrl+Enter to submit.</p>
              </div>
            </form>
          </div>
        </section>

        {recentQueries.length > 0 ? (
          <section className="panel">
            <div className="panelInner">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 className="sectionTitle" style={{ marginBottom: 0 }}>Recent Queries</h2>
                <p className="hint">Current browser session</p>
              </div>
              <div className="row">
                {recentQueries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setQueryText(item);
                      if (error) setError("");
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {error ? (
          <section className="panel errorPanel">
            <div className="panelInner">
              <h2 className="sectionTitle">Errors</h2>
              <p className="subtitle" style={{ marginTop: 0 }}>{error}</p>
            </div>
          </section>
        ) : null}

        {response ? (
          <div className="grid gridTwo">
            <section className="panel">
              <div className="panelInner">
                <h2 className="sectionTitle">Summary</h2>
                <p className="subtitle" style={{ marginTop: 0 }}>{response.summary?.message || "No summary returned."}</p>
                <pre className="pre">{summaryCounts}</pre>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <h2 className="sectionTitle">Query Analysis</h2>
                <div className="kv">
                  <div><strong>Text:</strong> {response.query?.text || "-"}</div>
                  <div><strong>Query Type:</strong> {response.query?.query_type || "-"}</div>
                  <div><strong>Confidence:</strong> {response.query?.confidence ?? "-"}</div>
                </div>
                <pre className="pre">{prettyJson(response.query?.filters ?? {})}</pre>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <h2 className="sectionTitle">Route</h2>
                <div className="kv">
                  <div><strong>Target View:</strong> {response.route?.target_view || "-"}</div>
                  <div><strong>Reason:</strong> {response.route?.reason || "-"}</div>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <h2 className="sectionTitle">Debug</h2>
                <div className="kv">
                  <div><strong>Detection Path:</strong> {response.debug?.detection_path || "-"}</div>
                  <div>
                    <strong>Matched Terms:</strong>{" "}
                    {Array.isArray(response.debug?.matched_terms) && response.debug.matched_terms.length
                      ? response.debug.matched_terms.join(", ")
                      : "None"}
                  </div>
                  <div>
                    <strong>Notes:</strong>{" "}
                    {Array.isArray(response.debug?.notes) && response.debug.notes.length
                      ? response.debug.notes.join(" • ")
                      : "None"}
                  </div>
                </div>
              </div>
            </section>

            <section className="panel fullWidth">
              <div className="panelInner">
                <h2 className="sectionTitle">Roadmap</h2>
                <p className="subtitle" style={{ marginTop: 0 }}>
                  <strong>Phase:</strong> {response.roadmap?.phase || "-"}
                </p>
                <div className="roadmapGrid" style={{ marginTop: 16 }}>
                  {(response.roadmap?.next_steps || []).map((step) => (
                    <div className="roadmapCard" key={`${step.step}-${step.title}`}>
                      <p>
                        <strong>Step {step.step}:</strong> {step.title}
                      </p>
                      <ul>
                        {(step.details || []).map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel fullWidth">
              <div className="panelInner">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h2 className="sectionTitle" style={{ marginBottom: 0 }}>Result</h2>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        void navigator.clipboard.writeText(prettyJson(response.result ?? {}));
                      }
                    }}
                  >
                    Copy JSON
                  </button>
                </div>
                <pre className="pre" style={{ maxHeight: 520 }}>{prettyJson(response.result ?? {})}</pre>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

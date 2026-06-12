import { OperatorNav } from "../../../components/operator/OperatorNav";
import { loadExecutionLog } from "../../../lib/operator/loadExecutionLog";

function formatDate(value?: string) {
  if (!value) return "unknown";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getEvents(data: any) {
  return Array.isArray(data?.events) ? data.events : [];
}

export default function ExecutionLogPage() {
  const data = loadExecutionLog();
  const lastExecution = data.lastExecution as any;
  const lastOutcomeEvent = data.lastOutcomeEvent as any;

  const executions = getEvents(data.executionEvents || data.operatorActions).slice(0, 10);
  const outcomeEvents = getEvents(data.outcomeEvents || data.outcomeLog).slice(0, 10);
  const scores = data.outcomeScores.slice(-10).reverse();
  const agents = Array.isArray(data.agentPerformance?.agents)
    ? data.agentPerformance.agents
    : [];
  const suggestions = Array.isArray(data.ruleSuggestions?.suggestions)
    ? data.ruleSuggestions.suggestions
    : [];

  return (
    <main className="shell">
      <div className="container executionLogContainer">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS</p>
            <h1 className="title">Execution Log</h1>
            <p className="subtitle">
              What ran, which agents participated, what outcome was scored, and what the system suggests improving next.
            </p>

            <OperatorNav activeHref="/operator/execution-log" />

            <div className="executionMetricGrid">
              <div className="executionMetric">
                <span>Last execution</span>
                <strong>{lastExecution?.action_type || "—"}</strong>
              </div>
              <div className="executionMetric">
                <span>Last outcome event</span>
                <strong>{lastOutcomeEvent?.new_state || "—"}</strong>
              </div>
              <div className="executionMetric">
                <span>Outcome state changes today</span>
                <strong>{data.outcomeStateChangesToday ?? 0}</strong>
              </div>
              <div className="executionMetric">
                <span>Revenue impact</span>
                <strong>{data.executionSummary?.didCreateRevenue ?? "—"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gridTwo">
          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Last 10 executions</h2>
              {executions.length ? (
                <div className="executionList">
                  {executions.map((event: any) => (
                    <div key={event.execution_id || event.event_id || event.created_at} className="executionItem">
                      <strong>{event.action_type || event.action_label || "Unknown action"}</strong>
                      <p>{event.customer || "unknown customer"} · {event.product || "unknown product"}</p>
                      <small>{formatDate(event.timestamp || event.created_at)}</small>
                      <p>{event.outcome || event.status || "unknown"}</p>
                      <small>{event.revenue_impact || "unknown revenue impact"}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hint">No operator action executions logged yet.</p>
              )}
            </div>
          </article>

          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Outcome events</h2>
              {outcomeEvents.length ? (
                <div className="executionList">
                  {outcomeEvents.map((event: any) => (
                    <div key={event.event_id || event.execution_id || event.created_at} className="executionItem">
                      <strong>{event.new_state || event.event_type || "Outcome event"}</strong>
                      <p>{event.customer || "unknown customer"}</p>
                      <small>{formatDate(event.timestamp || event.created_at)}</small>
                      <p>{event.previous_state ? `${event.previous_state} → ${event.new_state}` : event.action_label || event.next_step || "No transition recorded"}</p>
                      <small>{event.trigger || event.event_type || "unknown trigger"} · confidence {event.confidence ?? "—"}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hint">No outcome events logged yet.</p>
              )}
            </div>
          </article>
        </section>

        <section className="grid gridTwo">
          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Outcome scores</h2>
              {scores.length ? (
                <div className="executionList">
                  {scores.map((score: any, index: number) => {
                    const firstScore = Array.isArray(score?.scores) ? score.scores[0] : score;
                    return (
                      <div key={firstScore?.outcome_id || index} className="executionItem">
                        <strong>{firstScore?.score ?? score?.outcome_score ?? "—"}</strong>
                        <p>{firstScore?.action_label || "Outcome score"}</p>
                        <small>{formatDate(score.generated_at || firstScore?.generated_at)}</small>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="hint">No outcome scores available.</p>
              )}
            </div>
          </article>

          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Agent usage</h2>
              {agents.length ? (
                <div className="executionList">
                  {agents.map((agent: any) => (
                    <div key={agent.agent_id} className="executionItem">
                      <strong>{agent.role || agent.agent_id}</strong>
                      <p>{agent.output_quality || "unknown"} · contribution {agent.contribution_score ?? "—"}</p>
                      <small>{agent.path}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hint">No agent performance data available.</p>
              )}
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Rule suggestions</h2>
            {suggestions.length ? (
              <div className="executionRuleGrid">
                {suggestions.map((rule: any) => (
                  <article key={rule.rule_id} className="executionRuleCard">
                    <p className="eyebrow">{rule.severity || "rule"}</p>
                    <strong>{rule.suggestion}</strong>
                    <p>{rule.reason || "No reason recorded."}</p>
                    <small>Status: {rule.status || "unknown"}</small>
                  </article>
                ))}
              </div>
            ) : (
              <p className="hint">No rule suggestions recorded yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

type PrimaryActionSnapshot = {
  generated_at: string;
  primary_action: {
    action_label: string;
    action_type: string;
    domain_id: string;
    product_id?: string | null;
    owner: string;
    priority_score: number;
    urgency: string;
    confidence: number;
    confidence_band: string;
    evidence: string[];
    risk: string[];
    next_step: string;
    expected_outcome: string;
  };
  alternatives_considered?: Array<{
    unit_id: string;
    action_type: string;
    domain_id: string;
    priority_score: number;
    next_action: string;
    why_not_primary: string;
  }>;
};

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="primaryActionPill">{children}</span>;
}

export function PrimaryActionPanel({ snapshot }: { snapshot: PrimaryActionSnapshot }) {
  const action = snapshot.primary_action;

  return (
    <main className="shell">
      <div className="container">
        <section className="primaryActionShell">
          <div className="primaryActionHeader">
            <p className="eyebrow">Canonical Primary Action</p>
            <h1>What Ross should do next</h1>
            <p>
              This is resolved by StaffordOS from unit work, revenue truth, confidence gates,
              client state, and UX integrity findings.
            </p>
          </div>

          <div className="primaryActionHero">
            <div className="primaryActionHeroTop">
              <Pill>{action.action_type}</Pill>
              <Pill>{action.domain_id}</Pill>
              <Pill>{action.urgency} urgency</Pill>
              <Pill>{Math.round(action.confidence * 100)}% confidence</Pill>
            </div>

            <h2>{action.action_label}</h2>

            <div className="primaryActionNext">
              <span>Next Step</span>
              <strong>{action.next_step}</strong>
            </div>

            <div className="primaryActionMeta">
              <div><span>Owner</span><strong>{action.owner}</strong></div>
              <div><span>Priority</span><strong>{action.priority_score}</strong></div>
              <div><span>Product</span><strong>{action.product_id || "—"}</strong></div>
              <div><span>Confidence Band</span><strong>{action.confidence_band}</strong></div>
            </div>

            <div className="primaryActionGrid">
              <div>
                <h3>Evidence</h3>
                <ul>
                  {(action.evidence || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>

              <div>
                <h3>Risk / Guardrails</h3>
                <ul>
                  {(action.risk || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>

            <p className="hint" style={{ marginTop: 16 }}>
              Expected outcome: {action.expected_outcome}
            </p>
            <p className="hint">
              Snapshot generated: {snapshot.generated_at}
            </p>
          </div>

          {snapshot.alternatives_considered?.length ? (
            <details className="primaryActionAlternatives">
              <summary>Alternatives considered</summary>
              <div className="primaryActionAltGrid">
                {snapshot.alternatives_considered.map((alt) => (
                  <article key={alt.unit_id}>
                    <strong>{alt.unit_id}</strong>
                    <p>{alt.next_action}</p>
                    <small>{alt.why_not_primary}</small>
                  </article>
                ))}
              </div>
            </details>
          ) : null}
        </section>
      </div>
    </main>
  );
}

type UnitWorkSnapshot = {
  schema: string;
  generated_at: string;
  summary: {
    domains: number;
    opportunities: number;
    issues: number;
    delivery_units: number;
    actions: number;
    memory_units: number;
    outcome_events: number;
  };
  open_work: Array<{
    unit_id: string;
    type: string;
    domain_id: string;
    status: string;
    stage?: string;
    owner: string;
    next_action: string;
  }>;
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex",
      border: "1px solid rgba(148,163,184,.35)",
      borderRadius: 999,
      padding: "4px 10px",
      fontSize: 12,
      color: "#cbd5e1"
    }}>
      {children}
    </span>
  );
}

export function UnitWorkSnapshotPanel({ snapshot }: { snapshot: UnitWorkSnapshot }) {
  return (
    <section className="panel">
      <div className="panelInner">
        <p className="eyebrow">StaffordOS Unit-of-Work Spine</p>
        <h2 className="sectionTitle" style={{ marginBottom: 8 }}>
          Domains → Units → Gates → Outcomes
        </h2>
        <p className="subtitle" style={{ marginTop: 0, maxWidth: "unset" }}>
          Non-destructive operating layer for business, client work, internal dev, personal domains, memory, and outcomes.
        </p>

        <div className="row" style={{ marginTop: 16, gap: 8, flexWrap: "wrap" }}>
          <Pill>Domains: {snapshot.summary.domains}</Pill>
          <Pill>Opportunities: {snapshot.summary.opportunities}</Pill>
          <Pill>Issues: {snapshot.summary.issues}</Pill>
          <Pill>Delivery: {snapshot.summary.delivery_units}</Pill>
          <Pill>Actions: {snapshot.summary.actions}</Pill>
          <Pill>Memory: {snapshot.summary.memory_units}</Pill>
          <Pill>Outcomes: {snapshot.summary.outcome_events}</Pill>
        </div>

        <div style={{ marginTop: 22 }}>
          <h3 className="sectionTitle" style={{ fontSize: 18, marginBottom: 10 }}>
            Open Work
          </h3>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Type</th>
                  <th>Domain</th>
                  <th>Status</th>
                  <th>Stage</th>
                  <th>Owner</th>
                  <th>Next Action</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.open_work.map((unit) => (
                  <tr key={unit.unit_id}>
                    <td style={{ fontWeight: 700 }}>{unit.unit_id}</td>
                    <td>{unit.type}</td>
                    <td>{unit.domain_id}</td>
                    <td>{unit.status}</td>
                    <td>{unit.stage || "—"}</td>
                    <td>{unit.owner}</td>
                    <td style={{ maxWidth: 420 }}>{unit.next_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {snapshot.open_work.length === 0 ? (
            <p className="emptyStateText">No open units of work.</p>
          ) : null}
        </div>

        <p className="hint" style={{ marginTop: 14 }}>
          Snapshot generated: {snapshot.generated_at}
        </p>
      </div>
    </section>
  );
}

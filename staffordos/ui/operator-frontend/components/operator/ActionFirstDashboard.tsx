type Snapshot = any;

function money(value: number | undefined) {
  return `$${Number(value || 0).toLocaleString()}`;
}

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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      border: "1px solid rgba(148,163,184,.22)",
      borderRadius: 20,
      padding: 20,
      background: "rgba(15,23,42,.82)"
    }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 14, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".12em" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ActionFirstDashboard({ snapshot }: { snapshot: Snapshot }) {
  const focus = snapshot.primary_focus;
  const metrics = snapshot.top_metrics;
  const revenue = snapshot.revenue_summary;
  const health = snapshot.system_health_summary;

  return (
    <main style={{ padding: 28, color: "#f8fafc", background: "#020617", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <Pill>StaffordOS Operator Dashboard</Pill>
          <h1 style={{ margin: "12px 0 8px", fontSize: 34, lineHeight: 1.1 }}>
            What should Ross do next?
          </h1>
          <p style={{ margin: 0, color: "#94a3b8" }}>
            Source: staffordos/clients/operator_dashboard_snapshot_v1.json
          </p>
        </div>

        <section style={{
          border: "1px solid rgba(250,204,21,.4)",
          borderRadius: 24,
          padding: 24,
          background: "linear-gradient(135deg, rgba(250,204,21,.16), rgba(15,23,42,.9))",
          marginBottom: 22
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div>
              <Pill>Primary Focus</Pill>
              <h2 style={{ fontSize: 28, margin: "14px 0 8px" }}>{focus?.merchant_shop || "No focus client"}</h2>
              <p style={{ color: "#e2e8f0", fontSize: 18, margin: "0 0 10px" }}>{focus?.reason}</p>
              <p style={{ color: "#facc15", fontSize: 20, fontWeight: 700, margin: 0 }}>{focus?.action}</p>
            </div>
            <div style={{ minWidth: 180 }}>
              <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }}>Priority</div>
              <div style={{ fontSize: 44, fontWeight: 800 }}>{focus?.priority_total || 0}</div>
              <Pill>{focus?.blocked ? "Blocked" : "Not blocked"}</Pill>
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 22 }}>
          <Card title="Clients"><div style={{ fontSize: 30, fontWeight: 800 }}>{metrics.total_clients}</div></Card>
          <Card title="Stafford Revenue"><div style={{ fontSize: 30, fontWeight: 800 }}>{money(revenue.stafford_revenue)}</div></Card>
          <Card title="Merchant Recovered"><div style={{ fontSize: 30, fontWeight: 800 }}>{money(revenue.merchant_revenue_recovered)}</div></Card>
          <Card title="MRR"><div style={{ fontSize: 30, fontWeight: 800 }}>{money(revenue.recurring_mrr)}</div></Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 18 }}>
          <Card title="Revenue Gaps">
            {snapshot.revenue_gaps.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No uncaptured revenue gaps.</p>
            ) : snapshot.revenue_gaps.map((gap: any) => (
              <div key={gap.client_id} style={{ padding: "14px 0", borderTop: "1px solid rgba(148,163,184,.16)" }}>
                <strong>{gap.merchant_shop}</strong>
                <div style={{ color: "#94a3b8", marginTop: 6 }}>
                  Merchant value: {money(gap.merchant_revenue)} · Stafford captured: {money(gap.stafford_revenue)} · Gap: {money(gap.gap)}
                </div>
                <div style={{ color: "#facc15", marginTop: 8 }}>{gap.action}</div>
              </div>
            ))}
          </Card>

          <Card title="Next Actions">
            {snapshot.next_actions.map((action: any) => (
              <div key={action.client_id} style={{ padding: "14px 0", borderTop: "1px solid rgba(148,163,184,.16)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong>{action.type}</strong>
                  <Pill>{action.owner}</Pill>
                </div>
                <p style={{ color: "#cbd5e1", margin: "8px 0 0" }}>{action.instructions}</p>
              </div>
            ))}
          </Card>

          <Card title="Priority Clients">
            {snapshot.priority_clients.map((client: any) => (
              <div key={client.client_id} style={{ padding: "14px 0", borderTop: "1px solid rgba(148,163,184,.16)" }}>
                <strong>{client.merchant_shop}</strong>
                <div style={{ color: "#94a3b8", marginTop: 6 }}>
                  Stage: {client.lifecycle_stage} · Priority: {client.priority_total} · Merchant recovered: {money(client.merchant_revenue_recovered)}
                </div>
              </div>
            ))}
          </Card>

          <Card title="System Health">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Pill>Green: {health.green}</Pill>
              <Pill>Red: {health.red}</Pill>
              <Pill>Unknown: {health.unknown}</Pill>
            </div>
            <div style={{ marginTop: 18 }}>
              {snapshot.blocked_clients.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No active blockers.</p>
              ) : (
                snapshot.blocked_clients.map((client: any) => (
                  <p key={client.client_id}>{client.client_id}: {client.blockers.length} blockers</p>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

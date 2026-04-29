import LeadActions from "./LeadActions";

type Lead = {
  id: string;
  name: string;
  domain: string;
  email: string | null;
  source: string;
  lifecycle_stage: string;
  next_action: string;
  score: number | null;
  outreach_ready: boolean;
  queued: boolean;
  sent: boolean;
  replied: boolean;
  last_event_at: string | null;
};

async function loadLeads() {
  const res = await fetch("http://localhost:3000/api/operator/lead-registry", {
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error("Failed to load operator leads");
  }

  return res.json();
}

export default async function OperatorLeadsPage() {
  const data = await loadLeads();
  const summary = data.summary || {};
  const leads: Lead[] = Array.isArray(data.leads) ? data.leads : [];

  return (
    <main style={{ padding: "32px", fontFamily: "system-ui, sans-serif" }}>
      <p style={{ color: "#666", marginBottom: 8 }}>StaffordOS / Operator Leads</p>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Lead Command</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        Real lead registry, queue, readiness, send ledger, and event counts. No placeholder lead data.
      </p>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 28
        }}
      >
        {[
          ["Total Leads", summary.total_leads],
          ["Contact Ready", summary.contact_ready],
          ["Outreach Ready", summary.outreach_ready],
          ["Queued", summary.queued],
          ["Sent", summary.sent],
          ["Engaged", summary.engaged],
          ["Blocked", summary.blocked],
          ["Events", summary.event_count]
        ].map(([label, value]) => (
          <div
            key={String(label)}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
              background: "#fff"
            }}
          >
            <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{String(value ?? 0)}</div>
          </div>
        ))}
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #ddd", background: "#fafafa" }}>
          <strong>Real Lead Pipeline</strong>
          <div style={{ color: "#666", fontSize: 13 }}>
            Source policy: {data.source_policy} · Registry + send queue + send ready + send console.
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
              {["Lead", "Domain", "Email", "Stage", "Next Action", "Score", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: 12, borderBottom: "1px solid #ddd" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: 600 }}>
                  {lead.name}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  {lead.domain || "—"}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  {lead.email || "Needs contact"}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  {lead.lifecycle_stage}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #eee", maxWidth: 280 }}>
                  {lead.next_action}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  {lead.score ?? "—"}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  {lead.sent ? "Sent" : lead.queued ? "Queued" : lead.outreach_ready ? "Ready" : "Blocked"}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  <LeadActions leadId={lead.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div style={{ padding: 24, color: "#666" }}>
            No real leads found in the current registry or queue files.
          </div>
        )}
      </section>
    </main>
  );
}

import { OperatorNav } from "../../../components/operator/OperatorNav";

type ApiResponse = {
  ok?: boolean;
  source?: string;
  registry?: any;
  lifecycle_counts?: any;
  product_routing?: Record<string, number>;
  priority_leads?: any[];
  bottleneck?: any;
};

type SendProofResponse = {
  ok?: boolean;
  source?: string;
  proof_count?: number;
  dry_run_proof_count?: number;
  live_send_attempted_count?: number;
  latest_proofs?: any[];
};

async function loadRevenueCommand() {
  const registryResponse = await fetch("http://localhost:3000/api/operator/lead-registry", {
    cache: "no-store",
  });

  const proofResponse = await fetch("http://localhost:3000/api/operator/send-proof", {
    cache: "no-store",
  });

  const data = (await registryResponse.json()) as ApiResponse;
  const sendProof = (await proofResponse.json()) as SendProofResponse;

  return { data, sendProof };
}

export default async function RevenueCommandPage() {
  const { data, sendProof } = await loadRevenueCommand();

  const registry = data.registry || {};
  const lifecycle = data.lifecycle_counts || {};
  const routing = data.product_routing || {};
  const priorityLeads = data.priority_leads || [];
  const bottleneck = data.bottleneck || {
    stage: "unknown",
    next_action: "Run lead registry sync and inspect lifecycle state.",
  };

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS Revenue</p>
            <h1 className="title">Lead Registry Command</h1>
            <p className="subtitle">
              Real operator dashboard powered by the canonical lead registry.
            </p>
            <OperatorNav activeHref="/operator/revenue-command" />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Current Bottleneck</h2>
            <p className="subtitle" style={{ marginTop: 0 }}>{bottleneck.stage}</p>
            <div className="kv">
              <div><strong>Next action:</strong> {bottleneck.next_action}</div>
              <div><strong>Total leads:</strong> {registry.items?.length || 0}</div>
              <div><strong>Registry version:</strong> {registry.version}</div>
              <div><strong>Schema:</strong> {registry.schema}</div>
              <div><strong>Read source:</strong> staffordos/leads/lead_registry_v1.json</div>
            </div>
          </div>
        </section>

        <div className="grid gridTwo">
          <section className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Lifecycle Counts</h2>
              <div className="kv">
                <div><strong>Contact needed:</strong> {lifecycle.contact_needed || 0}</div>
                <div><strong>Send initial outreach:</strong> {lifecycle.send_initial_outreach || 0}</div>
                <div><strong>Approved:</strong> {lifecycle.approved || 0}</div>
                <div><strong>Dry-run ready:</strong> {lifecycle.dry_run_ready || 0}</div>
                <div><strong>Sent:</strong> {lifecycle.sent || 0}</div>
                <div><strong>Engaged:</strong> {lifecycle.engaged || 0}</div>
                <div><strong>Recovered revenue:</strong> ${lifecycle.recovered_revenue || 0}</div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Product Routing</h2>
              <div className="kv">
                {Object.entries(routing).map(([product, count]) => (
                  <div key={product}>
                    <strong>{product}:</strong> {String(count)}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Send Proof</h2>
            <div className="kv">
              <div><strong>Total proof records:</strong> {sendProof.proof_count || 0}</div>
              <div><strong>Dry-run proofs:</strong> {sendProof.dry_run_proof_count || 0}</div>
              <div><strong>Live sends attempted:</strong> {sendProof.live_send_attempted_count || 0}</div>
              <div><strong>Read source:</strong> {sendProof.source}</div>
            </div>

            <div className="kv" style={{ marginTop: 16 }}>
              {(sendProof.latest_proofs || []).map((proof: any) => (
                <details key={proof.id} style={{ marginBottom: 10 }}>
                  <summary>
                    <strong>{proof.lead_name || proof.lead_id}</strong>
                    {" — "}
                    {proof.status}
                    {" / "}
                    {proof.proof_type}
                    {" / "}
                    {proof.id}
                    {" — View Proof"}
                  </summary>

                  <div style={{ marginTop: 8, padding: 8, border: "1px solid #333", borderRadius: 6, fontSize: 12, lineHeight: 1.4 }}>
                    <div><strong>Target:</strong> {proof.send_target || "n/a"}</div>
                    <div style={{ marginTop: 6 }}>
                      <strong>Message:</strong>
                      <pre style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
                        {proof.message || "No message recorded."}
                      </pre>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Priority Leads</h2>
            <div className="kv">
              {priorityLeads.map((lead: any) => (
                <div key={lead.id || lead.name || lead.domain}>
                  <strong>{lead.name || lead.domain || lead.id}</strong> —{" "}
                  {lead.product || "unknown"} / {lead.stage || "unknown"} /{" "}
                  {lead.next_action || "Review lead"}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

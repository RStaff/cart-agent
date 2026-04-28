import { OperatorNav } from "../../../components/operator/OperatorNav";

type ApiLead = {
  id?: string;
  name?: string;
  domain?: string;
  product?: string;
  stage?: string;
  next_action?: string;
};

async function getRegistryCommand() {
  const res = await fetch("http://localhost:3000/api/operator/lead-registry", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load lead registry command data");
  }

  return res.json();
}

export default async function RevenueCommandPage() {
  const data = await getRegistryCommand();

  const registry = data.registry || {};
  const lifecycle = data.lifecycle_counts || {};
  const routing = data.product_routing || {};
  const priorityLeads: ApiLead[] = data.priority_leads || [];
  const bottleneck = data.bottleneck || {};

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
            <p className="subtitle" style={{ marginTop: 0 }}>
              {bottleneck.stage || "none"}
            </p>
            <div className="kv">
              <div><strong>Next action:</strong> {bottleneck.next_action || "Review registry."}</div>
              <div><strong>Total leads:</strong> {registry.items?.length || 0}</div>
              <div><strong>Registry version:</strong> {registry.version || "unknown"}</div>
              <div><strong>Schema:</strong> {registry.schema || "unknown"}</div>
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
            <h2 className="sectionTitle">Priority Leads</h2>
            <div className="kv">
              {priorityLeads.map((lead) => (
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

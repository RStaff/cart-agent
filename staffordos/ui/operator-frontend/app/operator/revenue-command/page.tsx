import { OperatorNav } from "../../../components/operator/OperatorNav";

type LeadRegistryItem = {
  lead_id?: string;
  domain?: string;
  lead_state?: string;
  product_intent?: string;
  routing?: {
    primary_offer?: string;
    secondary_offer?: string;
    do_not_cross_sell_until?: string;
  };
  status?: {
    current_bottleneck?: string;
    next_action?: string;
  };
};

type LeadRegistryResponse = {
  ok?: boolean;
  source?: string;
  registry?: {
    version?: string;
    items?: LeadRegistryItem[];
  };
};

async function getLeadRegistry() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_OPERATOR_BASE_URL ||
      process.env.OPERATOR_BASE_URL ||
      "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/operator/lead-registry`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Lead registry API returned ${response.status}`);
    }

    return (await response.json()) as LeadRegistryResponse;
  } catch (error) {
    return {
      ok: false,
      source: "staffordos/leads/lead_registry_v1.json",
      registry: { version: "lead_registry_v1", items: [] }
    };
  }
}

function countBy(items: LeadRegistryItem[], fn: (item: LeadRegistryItem) => boolean) {
  return items.filter(fn).length;
}

function groupByValue(items: LeadRegistryItem[], getter: (item: LeadRegistryItem) => string | undefined) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getter(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(record: Record<string, number>) {
  return Object.entries(record).sort((a, b) => b[1] - a[1]);
}

export default async function OperatorRevenueCommandPage() {
  const payload = await getLeadRegistry();
  const leads = payload.registry?.items || [];

  const productCounts = groupByValue(leads, (lead) => lead.product_intent);
  const bottleneckCounts = groupByValue(leads, (lead) => lead.status?.current_bottleneck);

  const contactNeeded = countBy(leads, (lead) => lead.lead_state === "contact_needed");
  const pendingApproval = countBy(leads, (lead) => lead.lead_state === "pending_approval");
  const approved = countBy(leads, (lead) => lead.lead_state === "approved");
  const dryRunReady = countBy(leads, (lead) => lead.lead_state === "dry_run_ready");
  const sent = countBy(leads, (lead) => lead.lead_state === "sent");
  const engaged = countBy(leads, (lead) => lead.lead_state === "engaged");

  const primaryBottleneck = topEntries(bottleneckCounts)[0]?.[0] || "unknown";
  const nextAction =
    leads.find((lead) => lead.status?.current_bottleneck === primaryBottleneck)?.status?.next_action ||
    "Run lead registry sync and inspect lifecycle state.";

  const priorityOrder: Record<string, number> = {
    pending_approval: 1,
    approved: 2,
    ledgered: 3,
    dry_run_ready: 4,
    contact_needed: 5,
    message_ready: 6,
    cold: 7,
    engaged: 8,
    sent: 9
  };

  const priorityLeads = [...leads]
    .sort((a, b) => (priorityOrder[a.lead_state || ""] || 99) - (priorityOrder[b.lead_state || ""] || 99))
    .slice(0, 8);

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
            <p className="subtitle" style={{ marginTop: 0 }}>{primaryBottleneck}</p>
            <div className="kv">
              <div><strong>Next action:</strong> {nextAction}</div>
              <div><strong>Total leads:</strong> {leads.length}</div>
              <div><strong>Registry version:</strong> {payload.registry?.version || "unknown"}</div>
              <div><strong>Read source:</strong> {payload.source}</div>
            </div>
          </div>
        </section>

        <div className="grid gridTwo">
          <section className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Lifecycle Counts</h2>
              <div className="kv">
                <div><strong>Contact needed:</strong> {contactNeeded}</div>
                <div><strong>Pending approval:</strong> {pendingApproval}</div>
                <div><strong>Approved:</strong> {approved}</div>
                <div><strong>Dry-run ready:</strong> {dryRunReady}</div>
                <div><strong>Sent:</strong> {sent}</div>
                <div><strong>Engaged:</strong> {engaged}</div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Product Routing</h2>
              <div className="kv">
                {topEntries(productCounts).map(([product, count]) => (
                  <div key={product}><strong>{product}:</strong> {count}</div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Priority Leads</h2>
            <div className="kv">
              {priorityLeads.length === 0 ? (
                <div><strong>No leads:</strong> Run lead registry sync.</div>
              ) : (
                priorityLeads.map((lead) => (
                  <div key={lead.lead_id || lead.domain}>
                    <strong>{lead.domain || "unknown"}</strong>
                    {" — "}
                    {lead.product_intent || "unknown"}
                    {" / "}
                    {lead.lead_state || "unknown"}
                    {" / "}
                    {lead.status?.next_action || "No next action recorded."}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Product Boundary Control</h2>
            <div className="kv">
              {priorityLeads.slice(0, 5).map((lead) => (
                <div key={`${lead.lead_id || lead.domain}-routing`}>
                  <strong>{lead.domain || "unknown"}:</strong>{" "}
                  primary={lead.routing?.primary_offer || "unknown"}; secondary={lead.routing?.secondary_offer || "unknown"}; hold cross-sell until={lead.routing?.do_not_cross_sell_until || "unknown"}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

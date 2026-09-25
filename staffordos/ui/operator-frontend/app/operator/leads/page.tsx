import LeadActions from "./LeadActions";
import GovernedProspectTransaction from "./GovernedProspectTransaction";
import { loadOperatorLeads } from "../../../lib/leads/loadOperatorLeads";

type Lead = {
  id: string;
  name: string;
  domain: string;
  email: string | null;
  source: string;
  lifecycle_stage: string;
  next_action: string;
  score: number | null;
  temperature?: string;
  conversion_score?: number;
  outreach_ready: boolean;
  queued: boolean;
  sent: boolean;
  replied: boolean;
  last_event_at: string | null;
  product_scope: string;
  staffordmedia_eligible: boolean;
  governed_transaction: any;
};

export default async function OperatorLeadsPage() {
  const data = await loadOperatorLeads();
  const summary = data.summary || {};
  const leads: Lead[] = Array.isArray(data.leads) ? data.leads : [];
  const staffordMediaLeads = leads.filter((lead) => lead.staffordmedia_eligible);
  const revenueOperations = data.staffordmedia_revenue_operations;

  return (
    <main className="leadCommand">
      <p className="leadCommandEyebrow">StaffordOS / Operator Leads</p>
      <h1>Lead Command</h1>
      <p className="leadCommandIntro">
        Real lead registry, queue, readiness, send ledger, and event counts. No placeholder lead data.
      </p>

      <section className="leadSummary" aria-label="Lead summary">
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
          <div key={String(label)} className="leadSummaryItem">
            <span>{label}</span>
            <strong>{String(value ?? 0)}</strong>
          </div>
        ))}
      </section>

      <section className="staffordMediaOutreach" aria-labelledby="staffordmedia-outreach-heading">
        <div>
          <p className="leadCommandEyebrow">StaffordMedia revenue operations</p>
          <h2 id="staffordmedia-outreach-heading">Governed prospect transaction</h2>
          <p>
            The Automation Opportunity Assessment is {revenueOperations.offer_registered ? "registered at $750" : "not registered"}. Only leads explicitly bound to StaffordMedia, this offer, its campaign, and the Stafford Media tenant can appear here.
          </p>
        </div>
        <span className={`statusPill ${revenueOperations.real_send_enabled ? "statusPillPartial" : "statusPillReady"}`}>
          {revenueOperations.real_send_enabled ? "Real send enabled" : "Real send disabled"}
        </span>
        {staffordMediaLeads.length === 0 ? (
          <div className="staffordMediaEmpty">
            No validated StaffordMedia prospects are registered. Existing Shopify and unscoped lead records remain separate below.
          </div>
        ) : (
          <div className="staffordMediaProspectGrid">
            {staffordMediaLeads.map((lead) => (
              <article key={lead.id} className="staffordMediaProspect">
                <strong>{lead.name}</strong>
                <span>{lead.email}</span>
                <GovernedProspectTransaction leadId={lead.id} email={lead.email} transaction={lead.governed_transaction} />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="leadInventory">
        <div className="leadInventoryHeader">
          <strong>Canonical lead inventory</strong>
          <div>
            Source policy: {data.source_policy} · Registry + send queue + send ready + send console.
          </div>
        </div>

        <div className="leadInventoryTableWrap">
          <table className="leadInventoryTable">
          <thead>
            <tr>
              {["Lead", "Product Scope", "Domain", "Email", "Stage", "Next Action", "Score", "Temp", "Status", "Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className="leadName">
                  {lead.name}
                </td>
                <td><span className="leadScopeBadge">{lead.product_scope}</span></td>
                <td>
                  {lead.domain || "—"}
                </td>
                <td>
                  {lead.email || "Needs contact"}
                </td>
                <td>
                  {lead.lifecycle_stage}
                </td>
                <td className="leadNextAction">
                  {lead.next_action}
                </td>
                <td>
                  {lead.conversion_score ?? lead.score ?? "—"}
                </td>
                <td className="leadTemperature">
                  {(lead.temperature || "cold").toUpperCase()}
                </td>
                <td>
                  {lead.sent ? "Sent" : lead.queued ? "Queued" : lead.outreach_ready ? "Ready" : "Blocked"}
                </td>
                <td>
                  <LeadActions leadId={lead.id} />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        {leads.length === 0 && (
          <div className="leadInventoryEmpty">
            No real leads found in the current registry or queue files.
          </div>
        )}
      </section>
    </main>
  );
}

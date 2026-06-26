import Link from "next/link";

import { OperatorNav } from "../../../components/operator/OperatorNav";
import { getCampaignResolverReport } from "../../../lib/operator/campaignResolver";

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

function title(value: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return "Unknown";
  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function itemList(items: string[]) {
  return items.length ? items.join(", ") : "—";
}

export default function OperatorCampaignsPage() {
  const report = getCampaignResolverReport();
  const campaigns = Array.isArray(report.campaigns) ? report.campaigns : [];
  const activeCampaigns = campaigns.filter((campaign) => campaign.health === "healthy" || campaign.health === "warm");
  const blockedCampaigns = campaigns.filter((campaign) => campaign.health === "at_risk");
  const dormantCampaigns = campaigns.filter((campaign) => campaign.health === "dormant");

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS</p>
            <h1 className="title">Campaign Command</h1>
            <p className="subtitle">
              Live outreach and conversion campaigns resolved from current StaffordOS truth. This is the operator surface for
              deciding which merchant motion should move next.
            </p>
            <OperatorNav activeHref="/operator/campaigns" />
            <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
              <span className="chip">Campaigns: {report.total_campaigns}</span>
              <span className="chip">Healthy: {report.health_distribution.healthy}</span>
              <span className="chip">Warm: {report.health_distribution.warm}</span>
              <span className="chip">At risk: {report.health_distribution.at_risk}</span>
              <span className="chip">Dormant: {report.health_distribution.dormant}</span>
              <span className="chip">Revenue at stake: {money(report.revenue_at_stake_total)}</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Campaign summary</h2>
            <div className="grid gridTwo">
              <div className="kv">
                <div><strong>ShopiFixer outreach:</strong> {report.campaign_types.shopifixer_outreach}</div>
                <div><strong>Close engine:</strong> {report.campaign_types.shopifixer_close_engine}</div>
                <div><strong>Fulfillment delivery:</strong> {report.campaign_types.fulfillment_delivery}</div>
                <div><strong>Referral expansion:</strong> {report.campaign_types.referral_expansion}</div>
                <div><strong>Dormant reactivation:</strong> {report.campaign_types.dormant_reactivation}</div>
              </div>
              <div className="kv">
                <div><strong>Total relationships:</strong> {report.relationship_coverage.total_relationships}</div>
                <div><strong>Covered relationships:</strong> {report.relationship_coverage.covered_relationships}</div>
                <div><strong>Coverage:</strong> {pct(report.relationship_coverage.coverage_percent)}</div>
                <div><strong>Unresolved campaigns:</strong> {report.unresolved_campaign_count}</div>
                <div><strong>Conflicts:</strong> {report.conflict_count}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Campaign actions</h2>
            <p className="subtitle" style={{ marginTop: 0 }}>
              Each campaign links the operator back to the live lead and relationship surfaces already available in StaffordOS.
            </p>
            <div className="grid gridTwo">
              <div className="panel">
                <div className="panelInner">
                  <h3 className="sectionTitle">Active campaigns</h3>
                  {activeCampaigns.length ? (
                    <div className="executionList">
                      {activeCampaigns.slice(0, 4).map((campaign) => (
                        <div key={campaign.campaign_id} className="executionItem">
                          <strong>{title(campaign.campaign_type)}</strong>
                          <span className="hint">
                            {campaign.objective} · {campaign.health} · {money(campaign.revenue_at_stake)}
                          </span>
                          <span className="hint">Next best action: {campaign.next_best_action?.title || "No ready action"}</span>
                          <div className="row" style={{ marginTop: 8, flexWrap: "wrap" }}>
                            <Link href="/operator/leads" className="chip">Open Leads</Link>
                            <Link href="/operator/revenue-command" className="chip">Open Revenue Command</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="hint">No active campaigns resolved from current truth.</p>
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="panelInner">
                  <h3 className="sectionTitle">Campaign blockers</h3>
                  {blockedCampaigns.length ? (
                    <div className="executionList">
                      {blockedCampaigns.slice(0, 4).map((campaign) => (
                        <div key={campaign.campaign_id} className="executionItem">
                          <strong>{title(campaign.campaign_type)}</strong>
                          <span className="hint">
                            {campaign.health} · {campaign.provenance.conflict_types.length ? `conflict: ${campaign.provenance.conflict_types.join(", ")}` : "no explicit conflict"}
                          </span>
                          <span className="hint">Relationships: {itemList(campaign.relationships)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="hint">No at-risk campaigns currently resolved.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Campaign registry</h2>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Type</th>
                    <th>Health</th>
                    <th>Relationships</th>
                    <th>Active</th>
                    <th>Blocked</th>
                    <th>Completed</th>
                    <th>Revenue</th>
                    <th>Next best action</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.campaign_id}>
                      <td style={{ fontWeight: 600 }}>{campaign.campaign_id}</td>
                      <td>{title(campaign.campaign_type)}</td>
                      <td>{campaign.health}</td>
                      <td>{campaign.relationships.length}</td>
                      <td>{campaign.active_actions.length}</td>
                      <td>{campaign.blocked_actions.length}</td>
                      <td>{campaign.completed_actions.length}</td>
                      <td>{money(campaign.revenue_at_stake)}</td>
                      <td>{campaign.next_best_action?.title || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Evidence and provenance</h2>
            <div className="kv">
              <div><strong>Source files:</strong> {itemList(report.campaigns[0]?.provenance.source_files || [])}</div>
              <div><strong>Decision engine valid:</strong> {report.campaigns[0]?.provenance.decision_engine.validation_ok ? "Yes" : "No"}</div>
              <div><strong>Validation:</strong> {report.validation.ok ? "Pass" : "Needs attention"}</div>
              <div><strong>Latest relationship coverage:</strong> {pct(report.relationship_coverage.coverage_percent)}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

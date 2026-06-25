import Link from "next/link";
import { OperatorNav } from "../../../components/operator/OperatorNav";
import { getCampaignResolverReport } from "../../../lib/operator/campaignResolver";

function money(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "$0";
  return `$${numberValue.toLocaleString()}`;
}

function text(value: unknown, fallback = "—") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function list(values: unknown[], fallback = "None") {
  const items = values.map((value) => text(value, "")).filter(Boolean);
  return items.length ? items : [fallback];
}

function formatCount(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toLocaleString() : "0";
}

function percentage(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "0%";
  return `${Math.round(numberValue * 100)}%`;
}

function summarizeAction(action: any) {
  if (!action) return "Unavailable";
  const parts = [
    text(action.title || action.action_type, "Unavailable"),
    `(${text(action.action_type)})`,
    `· ${text(action.status)}`,
  ];
  if (action.blocker) parts.push(`· blocker: ${text(action.blocker)}`);
  if (typeof action.confidence === "number") parts.push(`· confidence ${Math.round(action.confidence * 100)}%`);
  return parts.join(" ");
}

function CampaignCard({ campaign }: { campaign: any }) {
  const relationshipCount = Array.isArray(campaign.relationships) ? campaign.relationships.length : 0;
  const activeCount = Array.isArray(campaign.active_actions) ? campaign.active_actions.length : 0;
  const blockedCount = Array.isArray(campaign.blocked_actions) ? campaign.blocked_actions.length : 0;
  const completedCount = Array.isArray(campaign.completed_actions) ? campaign.completed_actions.length : 0;
  const unresolvedCount = Array.isArray(campaign.provenance?.unresolved_relationship_ids)
    ? campaign.provenance.unresolved_relationship_ids.length
    : 0;
  const conflictTypes = Array.isArray(campaign.provenance?.conflict_types) ? campaign.provenance.conflict_types : [];
  const conflictNotes = Array.isArray(campaign.provenance?.conflict_notes) ? campaign.provenance.conflict_notes : [];
  const relationships = Array.isArray(campaign.relationships) ? campaign.relationships : [];

  return (
    <article className="panel">
      <div className="panelInner">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p className="eyebrow">{campaign.campaign_type}</p>
            <h2 className="sectionTitle" style={{ marginBottom: 8 }}>
              {campaign.campaign_id}
            </h2>
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className="chip">Health: {campaign.health}</span>
            <span className="chip">Confidence: {percentage(campaign.confidence)}</span>
            <span className="chip">Revenue at stake: {money(campaign.revenue_at_stake)}</span>
          </div>
        </div>

        <p className="subtitle" style={{ marginTop: 8 }}>
          {campaign.objective}
        </p>

        <div className="executionMetricGrid" style={{ marginTop: 16 }}>
          <div className="executionMetric">
            <span>Relationships</span>
            <strong>{formatCount(relationshipCount)}</strong>
          </div>
          <div className="executionMetric">
            <span>Active actions</span>
            <strong>{formatCount(activeCount)}</strong>
          </div>
          <div className="executionMetric">
            <span>Blocked actions</span>
            <strong>{formatCount(blockedCount)}</strong>
          </div>
          <div className="executionMetric">
            <span>Completed actions</span>
            <strong>{formatCount(completedCount)}</strong>
          </div>
          <div className="executionMetric">
            <span>Unresolved relationships</span>
            <strong>{formatCount(unresolvedCount)}</strong>
          </div>
          <div className="executionMetric">
            <span>Decision Engine</span>
            <strong>{campaign.provenance?.decision_engine?.validation_ok ? "Pass" : "Fail"}</strong>
          </div>
        </div>

        <div className="kv" style={{ marginTop: 16 }}>
          <div><strong>Next best action:</strong> {summarizeAction(campaign.next_best_action)}</div>
          <div><strong>Conflict count:</strong> {formatCount(conflictTypes.length)}</div>
          <div><strong>Conflict types:</strong> {list(conflictTypes, "None").join(" · ")}</div>
          <div><strong>Conflict notes:</strong> {list(conflictNotes, "None").join(" · ")}</div>
        </div>

        <div className="grid gridTwo" style={{ marginTop: 16 }}>
          <section className="panel" style={{ margin: 0 }}>
            <div className="panelInner">
              <h3 className="sectionTitle">Relationships</h3>
              <div className="row" style={{ flexWrap: "wrap" }}>
                {relationships.length ? (
                  relationships.map((relationshipId: string) => (
                    <Link key={relationshipId} href={`/operator/relationship/${relationshipId.replace(/^rel_/, "")}`} className="chip">
                      {relationshipId}
                    </Link>
                  ))
                ) : (
                  <span className="hint">No relationships linked.</span>
                )}
              </div>
            </div>
          </section>

          <section className="panel" style={{ margin: 0 }}>
            <div className="panelInner">
              <h3 className="sectionTitle">Conflicts</h3>
              <div className="kv">
                <div><strong>Validation:</strong> {campaign.provenance?.decision_engine?.validation_ok ? "Pass" : "Fail"}</div>
                <div><strong>Unresolved relationship IDs:</strong> {list(campaign.provenance?.unresolved_relationship_ids || [], "None").join(" · ")}</div>
                <div><strong>Decision engine top action:</strong> {text(campaign.provenance?.decision_engine?.top_action_id, "None")}</div>
                <div><strong>Decision engine top blocker:</strong> {text(campaign.provenance?.decision_engine?.top_blocker_id, "None")}</div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gridTwo" style={{ marginTop: 16 }}>
          <section className="panel" style={{ margin: 0 }}>
            <div className="panelInner">
              <h3 className="sectionTitle">Active actions</h3>
              {campaign.active_actions.length ? (
                <div className="executionList">
                  {campaign.active_actions.map((actionId: string) => (
                    <div key={actionId} className="executionItem">
                      <strong>{actionId}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hint">No active actions.</p>
              )}
            </div>
          </section>

          <section className="panel" style={{ margin: 0 }}>
            <div className="panelInner">
              <h3 className="sectionTitle">Blocked actions</h3>
              {campaign.blocked_actions.length ? (
                <div className="executionList">
                  {campaign.blocked_actions.map((actionId: string) => (
                    <div key={actionId} className="executionItem">
                      <strong>{actionId}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hint">No blocked actions.</p>
              )}
            </div>
          </section>
        </div>

        <div className="grid gridTwo" style={{ marginTop: 16 }}>
          <section className="panel" style={{ margin: 0 }}>
            <div className="panelInner">
              <h3 className="sectionTitle">Completed actions</h3>
              {campaign.completed_actions.length ? (
                <div className="executionList">
                  {campaign.completed_actions.map((actionId: string) => (
                    <div key={actionId} className="executionItem">
                      <strong>{actionId}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hint">No completed actions.</p>
              )}
            </div>
          </section>

          <section className="panel" style={{ margin: 0 }}>
            <div className="panelInner">
              <h3 className="sectionTitle">Provenance</h3>
              <div className="kv">
                <div><strong>Source files:</strong> {list(campaign.provenance?.source_files || [], "None").join(" · ")}</div>
                <div><strong>Relationship reasons:</strong> {text(Object.keys(campaign.provenance?.relationship_reasons || {}).length, "0")} relationships</div>
                <div><strong>Action reasons:</strong> {text(Object.keys(campaign.provenance?.action_reasons || {}).length, "0")} actions</div>
                <div><strong>Decision engine validation:</strong> {campaign.provenance?.decision_engine?.validation_ok ? "Pass" : "Fail"}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}

export default function CampaignsPage() {
  const report = getCampaignResolverReport();
  const campaigns = Array.isArray(report.campaigns) ? report.campaigns : [];

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS</p>
            <h1 className="title">Campaign Dashboard</h1>
            <p className="subtitle">
              Read-only campaign motions derived from relationship, action, decision, revenue, fulfillment, execution, and outcome truth.
            </p>

            <OperatorNav activeHref="/operator/campaigns" />

            <div className="executionMetricGrid" style={{ marginTop: 16 }}>
              <div className="executionMetric">
                <span>Campaigns</span>
                <strong>{report.total_campaigns}</strong>
              </div>
              <div className="executionMetric">
                <span>Unresolved campaigns</span>
                <strong>{report.unresolved_campaign_count}</strong>
              </div>
              <div className="executionMetric">
                <span>Conflicts</span>
                <strong>{report.conflict_count}</strong>
              </div>
              <div className="executionMetric">
                <span>Revenue at stake</span>
                <strong>{money(report.revenue_at_stake_total)}</strong>
              </div>
              <div className="executionMetric">
                <span>Relationship coverage</span>
                <strong>{percentage(report.relationship_coverage.coverage_percent / 100)}</strong>
              </div>
              <div className="executionMetric">
                <span>Validation</span>
                <strong>{report.validation.ok ? "Pass" : "Fail"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Campaign inventory</h2>
            <div className="grid" style={{ gap: 20 }}>
              {campaigns.length ? (
                campaigns.map((campaign: any) => <CampaignCard key={campaign.campaign_id} campaign={campaign} />)
              ) : (
                <p className="hint">No campaigns resolved yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gridTwo">
          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Campaign types</h2>
              <div className="kv">
                {Object.entries(report.campaign_types).map(([type, count]) => (
                  <div key={type}><strong>{type}:</strong> {count}</div>
                ))}
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Health distribution</h2>
              <div className="kv">
                {Object.entries(report.health_distribution).map(([health, count]) => (
                  <div key={health}><strong>{health}:</strong> {count}</div>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Relationship coverage</h2>
            <div className="kv">
              <div><strong>Total relationships:</strong> {report.relationship_coverage.total_relationships}</div>
              <div><strong>Covered relationships:</strong> {report.relationship_coverage.covered_relationships}</div>
              <div><strong>Coverage percent:</strong> {report.relationship_coverage.coverage_percent}%</div>
              <div><strong>Uncovered relationship IDs:</strong> {list(report.relationship_coverage.uncovered_relationship_ids, "None").join(" · ")}</div>
            </div>
          </div>
        </section>

        <section className="grid gridTwo">
          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Conflicts</h2>
              {report.conflicts.length ? (
                <div className="executionList">
                  {report.conflicts.map((conflict: any) => (
                    <div key={conflict.campaign_id} className="executionItem">
                      <strong>{conflict.campaign_id}</strong>
                      <p>{conflict.campaign_type}</p>
                      <small>{list(conflict.conflict_types, "None").join(" · ")}</small>
                      <p>{list(conflict.conflict_notes, "None").join(" · ")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hint">No campaign conflicts recorded.</p>
              )}
            </div>
          </article>

          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Validation</h2>
              <div className="kv">
                <div><strong>Status:</strong> {report.validation.ok ? "Pass" : "Fail"}</div>
                <div><strong>Errors:</strong> {report.validation.errors.length ? report.validation.errors.join(" · ") : "None"}</div>
                <div><strong>Source inventory:</strong> {report.inventory.source_inventory.relationship_count} relationships, {report.inventory.source_inventory.action_count} actions, {report.inventory.source_inventory.execution_event_count} executions, {report.inventory.source_inventory.outcome_event_count} outcomes</div>
                <div><strong>Revenue bottleneck:</strong> {text(report.inventory.source_inventory.revenue_bottleneck, "None")}</div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

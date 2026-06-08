"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExecutePrimaryActionButton } from "../../../components/operator/ExecutePrimaryActionButton";

type CeoTruthSnapshot = {
  metadata?: {
    schema?: string;
    generated_at?: string;
    source_files?: Array<{
      file?: string;
      exists?: boolean;
      status?: string;
      updated_at?: string;
    }>;
    confidence?: string;
  };
  revenue?: {
    stafford_revenue?: number | null;
    recurring_revenue?: number | null;
    merchant_revenue_recovered?: number | null;
    active_revenue_clients?: number | null;
  };
  shopifixer_pipeline?: {
    leads?: number | null;
    audits_requested?: number | null;
    proposals_sent?: number | null;
    paid_clients?: number | null;
    clients_waiting_for_fulfillment?: number | null;
  };
  fulfillment?: {
    fix_in_progress?: number | null;
    fix_completed?: number | null;
    proof_needed?: number | null;
    review_needed?: number | null;
    referral_needed?: number | null;
  };
  abando?: {
    installs?: number | null;
    recovery_revenue?: number | null;
    active_recovery_clients?: number | null;
  };
  system_health?: {
    blockers?: string[];
    stale_truth?: {
      status?: string;
      reason?: string;
      daemon?: {
        status?: string;
        last_run?: string;
        loops_run?: number;
      };
    };
    missing_sources?: string[];
    warnings?: string[];
  };
  operator_actions?: {
    primary_action?: {
      action_label?: string;
      action_type?: string;
      domain_id?: string;
      product_id?: string;
      owner?: string;
      priority_score?: number | null;
      urgency?: string;
      confidence?: number | null;
      confidence_band?: string;
      next_step?: string;
      expected_outcome?: string;
      evidence?: string[];
      risk?: string[];
    };
    top_5_actions?: {
      status?: string;
      items?: Array<{
        rank?: number;
        action_label?: string;
        owner?: string;
        confidence?: number | null;
        authority?: string;
        source_file?: string;
        source_field?: string;
        evidence?: string[];
      }>;
      note?: string;
    };
    action_source?: {
      primary?: string;
      supporting?: string[];
      status?: string;
    };
    confidence?: {
      level?: string;
      primary_action?: string;
      top_5_actions?: string;
      note?: string;
    };
  };
};

function displayNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "unavailable";
}

function displayText(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized || "unavailable";
}

function displayConfidence(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "unavailable";
}

function displayList(values?: string[]) {
  if (!Array.isArray(values) || values.length === 0) return ["unavailable"];
  return values;
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <article className="panel">
      <div className="panelInner">
        <p className="hint" style={{ marginTop: 0, marginBottom: 8 }}>{label}</p>
        <h2 className="title" style={{ margin: 0 }}>{value}</h2>
        {note ? <p className="subtitle" style={{ marginTop: 8, marginBottom: 0 }}>{note}</p> : null}
      </div>
    </article>
  );
}

export default function OperatorCockpitPage() {
  const [snapshot, setSnapshot] = useState<CeoTruthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSnapshot() {
      try {
        const response = await fetch("/api/operator/ceo-truth-snapshot", {
          cache: "no-store",
        });

        const json = (await response.json()) as CeoTruthSnapshot & { error?: string; detail?: string };
        if (!response.ok) {
          throw new Error(json.detail || json.error || "Failed to load CEO truth snapshot.");
        }

        if (active) {
          setSnapshot(json);
          setError(null);
        }
      } catch (loadError: any) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
          setSnapshot(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSnapshot();
    return () => {
      active = false;
    };
  }, []);

  const primaryAction = snapshot?.operator_actions?.primary_action;
  const top5Actions = snapshot?.operator_actions?.top_5_actions?.items || [];
  const sourceFiles = snapshot?.metadata?.source_files || [];
  const systemBlockers = displayList(snapshot?.system_health?.blockers);
  const systemWarnings = displayList(snapshot?.system_health?.warnings);
  const missingSources = displayList(snapshot?.system_health?.missing_sources);
  const primaryActionExecutable = Boolean(
    primaryAction?.action_label &&
      primaryAction?.action_type &&
      primaryAction?.domain_id &&
      primaryAction?.owner &&
      primaryAction?.next_step
  );

  const revenue = useMemo(
    () => snapshot?.revenue || {},
    [snapshot]
  );
  const pipeline = useMemo(
    () => snapshot?.shopifixer_pipeline || {},
    [snapshot]
  );
  const fulfillment = useMemo(
    () => snapshot?.fulfillment || {},
    [snapshot]
  );
  const abando = useMemo(
    () => snapshot?.abando || {},
    [snapshot]
  );

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS CEO Truth Snapshot</p>
            <h1 className="title">Business truth at a glance</h1>
            <p className="subtitle">
              Read-only cockpit driven directly from <code>staffordos/cockpit/ceo_truth_snapshot_v1.json</code>.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
              <Link className="button buttonPrimary" href="/operator/command-center">
                Command Center
              </Link>
              <Link className="button" href="/operator">
                Operator Console
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="panel">
            <div className="panelInner">
              <p className="subtitle" style={{ marginTop: 0 }}>Loading CEO truth snapshot…</p>
            </div>
          </section>
        ) : null}

        {error ? (
          <section className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Snapshot load failed</h2>
              <p className="subtitle" style={{ marginTop: 0 }}>{error}</p>
            </div>
          </section>
        ) : null}

        {snapshot ? (
          <>
            <section className="grid gridTwo">
              <MetricCard
                label="Revenue"
                value={`$${displayNumber(revenue.stafford_revenue)}`}
                note={`Recovered merchant value: $${displayNumber(revenue.merchant_revenue_recovered)} · Recurring revenue: $${displayNumber(revenue.recurring_revenue)}`}
              />
              <MetricCard
                label="ShopiFixer Pipeline"
                value={`${displayNumber(pipeline.paid_clients)} paid clients`}
                note={`Leads: ${displayNumber(pipeline.leads)} · Audits requested: ${displayNumber(pipeline.audits_requested)} · Proposals sent: ${displayNumber(pipeline.proposals_sent)}`}
              />
              <MetricCard
                label="Fulfillment"
                value={`${displayNumber(fulfillment.fix_in_progress)} in progress`}
                note={`Fix completed: ${displayNumber(fulfillment.fix_completed)} · Proof needed: ${displayNumber(fulfillment.proof_needed)} · Review needed: ${displayNumber(fulfillment.review_needed)}`}
              />
              <MetricCard
                label="Abando"
                value={`${displayNumber(abando.installs)} installs`}
                note={`Recovery revenue: $${displayNumber(abando.recovery_revenue)} · Active recovery clients: ${displayNumber(abando.active_recovery_clients)}`}
              />
            </section>

            <section className="grid gridTwo">
              <article className="panel">
                <div className="panelInner">
                  <h2 className="sectionTitle">System Health</h2>
                  <p className="subtitle" style={{ marginTop: 0 }}>
                    Snapshot confidence: {displayText(snapshot.metadata?.confidence)} · Generated: {displayText(snapshot.metadata?.generated_at)}
                  </p>
                  <div className="grid gridTwo">
                    <div>
                      <p className="hint" style={{ marginTop: 0 }}>Blockers</p>
                      <ul>
                        {systemBlockers.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="hint" style={{ marginTop: 0 }}>Warnings</p>
                      <ul>
                        {systemWarnings.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                  <p className="hint">Missing sources: {missingSources.join(" · ")}</p>
                  <p className="hint">
                    Stale truth: {displayText(snapshot.system_health?.stale_truth?.status)} · {displayText(snapshot.system_health?.stale_truth?.reason)}
                  </p>
                </div>
              </article>

              <article className="panel">
                <div className="panelInner">
                  <h2 className="sectionTitle">Primary Action</h2>
                  <p className="subtitle" style={{ marginTop: 0 }}>
                    {displayText(primaryAction?.action_label)}
                  </p>
                  <p className="hint" style={{ marginTop: 0 }}>
                    Owner: {displayText(primaryAction?.owner)} · Domain: {displayText(primaryAction?.domain_id)} · Confidence: {displayConfidence(primaryAction?.confidence)}
                  </p>
                  <p className="hint">{displayText(primaryAction?.next_step)}</p>
                  <p className="hint">{displayText(primaryAction?.expected_outcome)}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    <span className="badge success">Source: {displayText(snapshot.operator_actions?.action_source?.primary)}</span>
                    <span className="badge success">Top-5: {displayText(snapshot.operator_actions?.confidence?.top_5_actions)}</span>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {primaryActionExecutable ? (
                      <ExecutePrimaryActionButton />
                    ) : (
                      <button className="button buttonPrimary" type="button" disabled>
                        Execution unavailable
                      </button>
                    )}
                    <p className="hint" style={{ marginTop: 12 }}>
                      Launch path: /api/operator/execute-primary-action
                    </p>
                  </div>
                </div>
              </article>
            </section>

            <section className="panel">
              <div className="panelInner">
                <h2 className="sectionTitle">Top 5 Actions</h2>
                <p className="subtitle" style={{ marginTop: 0 }}>
                  {displayText(snapshot.operator_actions?.top_5_actions?.status)} · {displayText(snapshot.operator_actions?.top_5_actions?.note)}
                </p>
                <div className="grid gridTwo">
                  {top5Actions.map((action) => (
                    <article key={`${action.rank}-${action.action_label}`} className="panel">
                      <div className="panelInner">
                        <p className="hint" style={{ marginTop: 0 }}>Rank {action.rank}</p>
                        <h3 style={{ marginTop: 0 }}>{displayText(action.action_label)}</h3>
                        <p className="subtitle" style={{ marginTop: 0 }}>
                          Owner: {displayText(action.owner)} · Confidence: {displayConfidence(action.confidence)} · Authority: {displayText(action.authority)}
                        </p>
                        <p className="hint">
                          Source: {displayText(action.source_file)} · {displayText(action.source_field)}
                        </p>
                        {Array.isArray(action.evidence) && action.evidence.length ? (
                          <ul>
                            {action.evidence.map((evidence) => (
                              <li key={evidence}>{evidence}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <h2 className="sectionTitle">Source Files</h2>
                <ul>
                  {sourceFiles.map((source) => (
                    <li key={source.file}>
                      {source.file} · {displayText(source.status)} · updated {displayText(source.updated_at)}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

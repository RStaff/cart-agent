import Link from "next/link";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { WorkdayControlPanel } from "../../components/operator/WorkdayControlPanel";
import { loadCommandCenterQaReport } from "../../lib/operator/loadCommandCenterQaReport";
import { loadPreflightReport } from "../../lib/operator/loadPreflightReport";
import { loadPrimaryActionSnapshot } from "../../lib/operator/loadPrimaryActionSnapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AnyRecord = Record<string, any>;

const PATHS = {
  campaignRegistry: "staffordos/campaigns/campaign_registry_v1.json",
  campaignAttributionReport: "staffordos/qa/output/campaign_attribution_report_v1.json",
  ceoTruth: "staffordos/cockpit/ceo_truth_snapshot_v1.json",
  leadRegistry: "staffordos/leads/lead_registry_v1.json",
  operatorDaemonState: "staffordos/operator_daemon/operator_daemon_state_v1.json",
  operatorHeartbeat: "staffordos/operator_daemon/output/operator_heartbeat_v1.json",
  operatorDashboard: "staffordos/clients/operator_dashboard_snapshot_v1.json",
} as const;

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, PATHS.campaignRegistry))) return cwd;

  const fromFrontend = path.resolve(cwd, "../../..");
  if (existsSync(path.join(fromFrontend, PATHS.campaignRegistry))) return fromFrontend;

  return fromFrontend;
}

function readJson<T>(repoRoot: string, relativePath: string, fallback: T): T {
  const filePath = path.join(repoRoot, relativePath);
  if (!existsSync(filePath)) return fallback;

  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function text(value: unknown, fallback = "Not Yet Implemented") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function money(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "$0";
  return `$${numberValue.toLocaleString()}`;
}

function count(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toLocaleString() : "0";
}

function classForStatus(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("not yet")) return "statusPillMissing";
  if (normalized.includes("implemented") || normalized.includes("pass") || normalized.includes("go")) {
    return "statusPillReady";
  }
  if (normalized.includes("partial") || normalized.includes("pending") || normalized.includes("stale")) {
    return "statusPillPartial";
  }
  if (normalized.includes("critical") || normalized.includes("failed") || normalized.includes("missing")) {
    return "statusPillDegraded";
  }
  return "statusPill";
}

function statusBadge(label: string, value: string) {
  return (
    <div className={`operatorHomeProofBadge ${classForStatus(value)}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function asRecordList(value: unknown) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export default async function OperatorPage() {
  const repoRoot = resolveRepoRoot();

  const primaryActionSnapshot = await loadPrimaryActionSnapshot();
  const preflightReport = loadPreflightReport();
  const qaReport = loadCommandCenterQaReport();
  const campaignRegistry = readJson<AnyRecord>(repoRoot, PATHS.campaignRegistry, {});
  const campaignAttributionReport = readJson<AnyRecord>(repoRoot, PATHS.campaignAttributionReport, {});
  const leadRegistry = readJson<AnyRecord>(repoRoot, PATHS.leadRegistry, {});
  const ceoTruth = readJson<AnyRecord>(repoRoot, PATHS.ceoTruth, {});
  const operatorDaemonState = readJson<AnyRecord>(repoRoot, PATHS.operatorDaemonState, {});
  const operatorHeartbeat = readJson<AnyRecord>(repoRoot, PATHS.operatorHeartbeat, {});
  const operatorDashboard = readJson<AnyRecord>(repoRoot, PATHS.operatorDashboard, {});

  const campaignRecords = asRecordList(campaignRegistry.records);
  const leadRecords = asRecordList(leadRegistry.items);
  const attributionTotals = campaignAttributionReport.totals || {};
  const systemHealth = ceoTruth.system_health || {};
  const systemHealthSummary = ceoTruth.system_health_summary || {};
  const revenue = ceoTruth.revenue || {};
  const primaryAction = primaryActionSnapshot.primary_action || {};
  const blockers = unique([
    ...(Array.isArray(systemHealth.blockers) ? systemHealth.blockers.map((item: unknown) => String(item ?? "").trim()) : []),
    ...(Array.isArray(primaryAction.risk) ? primaryAction.risk.map((item: unknown) => String(item ?? "").trim()) : []),
  ]).filter(Boolean);

  const validationStatus = [String(preflightReport?.status || "").trim(), String(qaReport?.verdict || "").trim()]
    .filter(Boolean)
    .join(" / ") || "Not Yet Implemented";
  const campaignRegistryStatus = campaignRecords.length
    ? `Implemented · ${campaignRecords.length} records`
    : "Not Yet Implemented";
  const campaignAttributionStatus = Number.isFinite(Number(attributionTotals.leads))
    ? `Implemented · ${count(attributionTotals.attributed_leads)}/${count(attributionTotals.leads)} attributed`
    : "Not Yet Implemented";
  const systemHealthStatus =
    Number.isFinite(Number(systemHealthSummary.green)) || Number.isFinite(Number(systemHealthSummary.red))
      ? `${count(systemHealthSummary.green)} green / ${count(systemHealthSummary.red)} red / ${count(systemHealthSummary.unknown)} unknown`
      : "Not Yet Implemented";
  const capturedRevenue =
    revenue.stafford_revenue !== undefined
      ? money(revenue.stafford_revenue)
      : text(operatorDashboard?.revenue_summary?.stafford_revenue, "Not Yet Implemented");
  const revenueSummary = revenue.stafford_revenue !== undefined
    ? `Captured Stafford Revenue: ${capturedRevenue}`
    : "Not Yet Implemented";
  const workdayStatus = text(operatorDaemonState.status, "Not Yet Implemented");
  const workdayLoops = Number.isFinite(Number(operatorDaemonState.loops_run))
    ? `${count(operatorDaemonState.loops_run)} loop(s)`
    : "Not Yet Implemented";
  const workdayHeartbeat = text(operatorHeartbeat.status, "Not Yet Implemented");
  const workdaySafeMode = operatorHeartbeat.safe_mode === undefined ? "Not Yet Implemented" : String(Boolean(operatorHeartbeat.safe_mode));
  const activeActionTitle = text(primaryAction.action_label || primaryAction.action_type);
  const activeActionStep = text(primaryAction.next_step || primaryAction.expected_outcome);
  const activeActionWhy = text(primaryAction.why_now || primaryAction.expected_outcome);
  const activeActionConfidence = Number.isFinite(Number(primaryAction.confidence))
    ? `${Math.round(Number(primaryAction.confidence))}/100`
    : "Not Yet Implemented";
  const activeActionProduct = text(primaryAction.product, "Not Yet Implemented");
  const activeActionMerchant = text(primaryAction.merchant, "Not Yet Implemented");
  const sourceLabels = [
    { label: "Primary action", value: "staffordos/snapshots/primary_action_snapshot_v1.json" },
    { label: "Campaign registry", value: "staffordos/campaigns/campaign_registry_v1.json" },
    { label: "Campaign attribution", value: "staffordos/qa/output/campaign_attribution_report_v1.json" },
    { label: "Lead registry", value: "staffordos/leads/lead_registry_v1.json" },
    { label: "CEO truth", value: "staffordos/cockpit/ceo_truth_snapshot_v1.json" },
    { label: "Operator dashboard", value: "staffordos/clients/operator_dashboard_snapshot_v1.json" },
    { label: "Validation", value: "preflight/output/preflight_report_v1.json · qa/output/command_center_primary_action_qa_v1.json" },
  ];

  return (
    <div className="container operatorHomeContainer">
      <section className="panel operatorHomeHero">
        <div className="panelInner">
          <p className="eyebrow">StaffordOS</p>
          <div className="operatorHomeTitleRow">
            <div>
              <h1 className="title">Morning surface</h1>
              <p className="subtitle">
                Start here. This screen shows the governed action, system truth, revenue truth, campaign coverage,
                and the blockers Ross needs to clear first.
              </p>
            </div>
            <div className="row" style={{ alignItems: "flex-start", justifyContent: "flex-end" }}>
              <Link href="/operator/command-center" className="chip">Open Executive</Link>
              <Link href="/operator/campaigns" className="chip">Open Campaigns</Link>
              <Link href="/operator/leads" className="chip">Open Leads</Link>
            </div>
          </div>

          <div className="operatorHomeProofRow">
            {statusBadge("Today’s primary action", activeActionTitle)}
            {statusBadge("System health", systemHealthStatus)}
            {statusBadge("Validation status", validationStatus)}
            {statusBadge("Campaign registry", campaignRegistryStatus)}
            {statusBadge("Campaign attribution", campaignAttributionStatus)}
            {statusBadge("Lead count", count(leadRecords.length))}
            {statusBadge("Revenue snapshot", revenueSummary)}
          </div>

          <article className="operatorHomeActionCard">
            <div className="operatorHomeActionMeta">
              <span>{activeActionMerchant}</span>
              <span>{activeActionProduct}</span>
              <span>{text(primaryAction.action_type || "action")}</span>
            </div>

            <h2>{activeActionTitle}</h2>

            <div className="operatorHomeNextStep">
              <span>Recommended next action</span>
              <strong>{activeActionStep}</strong>
            </div>

            <div className="operatorHomeActionFooter">
              <div>
                <small>Why now</small>
                <strong>{activeActionWhy}</strong>
              </div>
              <div>
                <small>Confidence</small>
                <strong>{activeActionConfidence}</strong>
              </div>
              <div>
                <small>Revenue source</small>
                <strong>{money(revenue.stafford_revenue ?? operatorDashboard?.revenue_summary?.stafford_revenue ?? 0)}</strong>
              </div>
            </div>

            <div className="operatorHomeCTAGroup">
              <Link href="/operator/command-center" className="chip">Open Executive Command Center</Link>
              <Link href="/operator/revenue-command" className="chip">Open Revenue Command</Link>
              <Link href="/operator/system-map" className="chip">Open System Map</Link>
            </div>
          </article>
        </div>
      </section>

      <section className="grid gridTwo" style={{ marginTop: 18 }}>
        <article className="panel operatorHomeDetails">
          <div className="panelInner">
            <h2 className="sectionTitle" style={{ marginTop: 0 }}>Open risks / blockers</h2>
            {blockers.length ? (
              <div className="executionList">
                {blockers.map((blocker) => (
                  <div key={blocker} className="executionItem">
                    <strong>{blocker}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="hint">Not Yet Implemented</p>
            )}
          </div>
        </article>

        <article className="panel operatorHomeDetails">
          <div className="panelInner">
            <h2 className="sectionTitle" style={{ marginTop: 0 }}>Workday control</h2>
            <div className="operatorHomeSummaryPills">
              <span>Status: {workdayStatus}</span>
              <span>Loops run: {workdayLoops}</span>
              <span>Heartbeat: {workdayHeartbeat}</span>
              <span>Safe mode: {workdaySafeMode}</span>
            </div>
            <p className="subtitle" style={{ marginTop: 14 }}>
              Start and stop the governed workday with the existing operator routes. The current daemon state is
              surfaced from repository truth when available.
            </p>
            <div style={{ marginTop: 12 }}>
              <WorkdayControlPanel />
            </div>
          </div>
        </article>

        <article className="panel operatorHomeDetails">
          <div className="panelInner">
            <h2 className="sectionTitle" style={{ marginTop: 0 }}>Evidence sources</h2>
            <div className="operatorHomeSupportGrid">
              {sourceLabels.map((source) => (
                <article key={source.label} className="operatorHomeSupportCard">
                  <strong>{source.label}</strong>
                  <p>{source.value}</p>
                </article>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gridTwo" style={{ marginTop: 18 }}>
        <article className="panel operatorHomeDetails">
          <div className="panelInner">
            <h2 className="sectionTitle" style={{ marginTop: 0 }}>Campaign coverage</h2>
            <div className="operatorHomeSummaryPills">
              <span>Campaign records: {count(campaignRecords.length)}</span>
              <span>Attributed leads: {count(attributionTotals.attributed_leads)}</span>
              <span>Unattributed leads: {count(attributionTotals.unattributed_leads)}</span>
              <span>Coverage: {Number.isFinite(Number(attributionTotals.attribution_coverage_percent)) ? `${count(attributionTotals.attribution_coverage_percent)}%` : "Not Yet Implemented"}</span>
            </div>
            <p className="subtitle" style={{ marginTop: 14 }}>
              Attribution is governed, but the live lead registry still has zero attributed leads.
            </p>
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <Link href="/operator/campaigns" className="chip">Open Campaigns</Link>
              <Link href="/operator/leads" className="chip">Open Leads</Link>
            </div>
          </div>
        </article>

        <article className="panel operatorHomeDetails">
          <div className="panelInner">
            <h2 className="sectionTitle" style={{ marginTop: 0 }}>Validation and health</h2>
            <div className="operatorHomeSupportGrid">
              <article className="operatorHomeSupportCard">
                <strong>Validation</strong>
                <p>{validationStatus}</p>
              </article>
              <article className="operatorHomeSupportCard">
                <strong>System health</strong>
                <p>{systemHealthStatus}</p>
              </article>
              <article className="operatorHomeSupportCard">
                <strong>Lead count</strong>
                <p>{count(leadRecords.length)} leads in the canonical registry</p>
              </article>
              <article className="operatorHomeSupportCard">
                <strong>Revenue snapshot</strong>
                <p>{capturedRevenue} captured Stafford Revenue</p>
              </article>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

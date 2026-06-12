import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { OperatorNav } from "../../components/operator/OperatorNav";

const PATHS = {
  primaryAction: "staffordos/snapshots/primary_action_snapshot_v1.json",
  revenueTruth: "staffordos/revenue/revenue_truth_v1.json",
  dashboardSnapshot: "staffordos/clients/operator_dashboard_snapshot_v1.json",
  unitWorkSnapshot: "staffordos/snapshots/unit_work_snapshot_v1.json",
  fulfillmentTruth: "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json",
  ceoTruth: "staffordos/cockpit/ceo_truth_snapshot_v1.json",
} as const;

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, PATHS.primaryAction))) return cwd;

  const fromFrontend = path.resolve(cwd, "../../..");
  if (existsSync(path.join(fromFrontend, PATHS.primaryAction))) return fromFrontend;

  return fromFrontend;
}

function readJson<T>(repoRoot: string, relativePath: string, fallback: T): T {
  const filePath = path.join(repoRoot, relativePath);

  if (!existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

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
  const items = values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  return items.length ? items : [fallback];
}

function loadExecutiveHome() {
  const repoRoot = resolveRepoRoot();

  const primaryAction = readJson<any>(repoRoot, PATHS.primaryAction, {});
  const revenueTruth = readJson<any>(repoRoot, PATHS.revenueTruth, {});
  const dashboardSnapshot = readJson<any>(repoRoot, PATHS.dashboardSnapshot, {});
  const unitWorkSnapshot = readJson<any>(repoRoot, PATHS.unitWorkSnapshot, {});
  const fulfillmentTruth = readJson<any>(repoRoot, PATHS.fulfillmentTruth, {});
  const ceoTruth = readJson<any>(repoRoot, PATHS.ceoTruth, {});

  const primary = primaryAction.primary_action || {};
  const openWork = Array.isArray(unitWorkSnapshot.open_work) ? unitWorkSnapshot.open_work : [];
  const deliveryWork = openWork.filter((unit: any) => unit.type === "delivery");
  const internalWork = openWork.filter((unit: any) => unit.domain_id === "internal_dev");
  const paidFulfillment = Array.isArray(fulfillmentTruth.items)
    ? fulfillmentTruth.items.filter((item: any) => {
        const status = String(item.payment_status || "").toLowerCase();
        return status === "paid" || status === "payment_received";
      })
    : [];
  const waitingFulfillment = Array.isArray(fulfillmentTruth.items)
    ? fulfillmentTruth.items.filter((item: any) => String(item.payment_status || "").toLowerCase() === "waiting_for_payment")
    : [];
  const priorityClient = Array.isArray(dashboardSnapshot.priority_clients) ? dashboardSnapshot.priority_clients[0] : null;
  const revenueGap = Array.isArray(dashboardSnapshot.revenue_gaps) ? dashboardSnapshot.revenue_gaps[0] : null;
  const blockers = [
    ...(Array.isArray(ceoTruth?.system_health?.blockers) ? ceoTruth.system_health.blockers : []),
    ...(Array.isArray(primary.risk) ? primary.risk : []),
  ];

  return {
    primaryAction: primary,
    revenueTruth,
    dashboardSnapshot,
    unitWorkSnapshot,
    fulfillmentTruth,
    ceoTruth,
    deliveryWork,
    internalWork,
    paidFulfillment,
    waitingFulfillment,
    priorityClient,
    revenueGap,
    blockers,
  };
}

export default function OperatorPage() {
  const data = loadExecutiveHome();
  const primary = data.primaryAction;
  const topRevenueAction =
    data.revenueTruth?.next_actions?.[0]?.action ||
    data.revenueGap?.action ||
    primary?.next_step ||
    "Review the highest-priority revenue motion.";
  const revenueSummary =
    data.revenueGap
      ? `${money(data.revenueGap.merchant_revenue)} merchant value has been proven; ${money(data.revenueGap.stafford_revenue)} Stafford revenue has been captured.`
      : text(data.revenueTruth?.current_bottleneck, "No revenue bottleneck recorded.");
  const paidWorkCount = data.paidFulfillment.length;
  const waitingForPaymentCount = data.waitingFulfillment.length || data.deliveryWork.length;
  const relationshipName = data.priorityClient?.merchant_shop || "No priority relationship";
  const relationshipNext =
    data.priorityClient?.next_action?.instructions ||
    data.priorityClient?.next_action?.action ||
    "Review the next customer relationship.";
  const trustUpdatedAt = data.ceoTruth?.metadata?.generated_at || data.primaryAction?.generated_at || "Unknown";
  const sourceStatuses = Array.isArray(data.ceoTruth?.metadata?.source_files)
    ? data.ceoTruth.metadata.source_files.slice(0, 4).map((source: any) => `${source.file.split("/").pop()}: ${source.status}`)
    : [];

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS</p>
            <h1 className="title">Executive Home</h1>
            <p className="subtitle">
              Daily business control surface for revenue, fulfillment, relationships, products, and trust.
            </p>

            <OperatorNav activeHref="/operator" />

            <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
              <span className="chip">Revenue bottleneck: {text(data.revenueTruth?.current_bottleneck, "unknown")}</span>
              <span className="chip">Paid work: {paidWorkCount}</span>
              <span className="chip">Attention: {relationshipName}</span>
              <span className="chip">Blocked: {data.blockers.length}</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">What should Ross do today?</p>
            <h2 className="sectionTitle" style={{ marginBottom: 10 }}>
              {text(primary.action_label, "Follow the highest-priority business action.")}
            </h2>
            <div className="kv">
              <div><strong>Next step:</strong> {text(primary.next_step, topRevenueAction)}</div>
              <div><strong>Expected outcome:</strong> {text(primary.expected_outcome, "Move the business forward.")}</div>
              <div><strong>Owner:</strong> {text(primary.owner, "ross")}</div>
              <div><strong>Priority:</strong> {text(primary.priority_score, "0")}</div>
              <div><strong>Domain:</strong> {text(primary.domain_id, "unknown")}</div>
              <div><strong>Confidence:</strong> {text(primary.confidence, "unknown")}</div>
            </div>
          </div>
        </section>

        <div className="grid gridTwo">
          <section className="panel">
            <div className="panelInner">
              <p className="eyebrow">What creates revenue today?</p>
              <h2 className="sectionTitle" style={{ marginBottom: 10 }}>{text(data.revenueTruth?.current_bottleneck, "Unknown")}</h2>
              <p className="subtitle" style={{ marginTop: 0 }}>{revenueSummary}</p>
              <div className="kv">
                <div><strong>Top move:</strong> {topRevenueAction}</div>
                <div><strong>Campaigns / outreach:</strong> {text(data.revenueTruth?.funnel?.outreach_queue, "0")}</div>
                <div><strong>Offers sent:</strong> {text(data.revenueTruth?.stages?.sent, "0")}</div>
                <div><strong>Replies:</strong> {text(data.revenueTruth?.stages?.replies, "0")}</div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelInner">
              <p className="eyebrow">What is blocked?</p>
              <h2 className="sectionTitle" style={{ marginBottom: 10 }}>Current blockers</h2>
              <div className="kv">
                {data.blockers.length > 0 ? (
                  data.blockers.map((blocker: string) => <div key={blocker}><strong>•</strong> {blocker}</div>)
                ) : (
                  <div><strong>None:</strong> No explicit blocker recorded.</div>
                )}
                <div><strong>Revenue gap:</strong> {money(data.dashboardSnapshot?.revenue_gaps?.[0]?.gap || 0)}</div>
                <div><strong>Primary risk:</strong> {list(primary.risk || ["None"])[0]}</div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelInner">
              <p className="eyebrow">What paid work exists?</p>
              <h2 className="sectionTitle" style={{ marginBottom: 10 }}>
                {paidWorkCount > 0 ? `${paidWorkCount} paid work item(s)` : "No paid work active yet"}
              </h2>
              <div className="kv">
                <div><strong>Paid fulfillment items:</strong> {paidWorkCount}</div>
                <div><strong>Waiting for payment:</strong> {waitingForPaymentCount}</div>
                <div><strong>ShopiFixer delivery stage:</strong> {text(data.deliveryWork[0]?.stage, "pre_delivery")}</div>
                <div><strong>Next action:</strong> {text(data.deliveryWork[0]?.next_action, "Wait for payment or follow up before starting fix delivery.")}</div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelInner">
              <p className="eyebrow">What relationship needs attention?</p>
              <h2 className="sectionTitle" style={{ marginBottom: 10 }}>{relationshipName}</h2>
              <p className="subtitle" style={{ marginTop: 0 }}>
                {text(data.priorityClient?.next_action?.instructions, relationshipNext)}
              </p>
              <div className="kv">
                <div><strong>Reason:</strong> {text(data.priorityClient?.close_engine?.suggested_message, "Review the highest-priority customer relationship.")}</div>
                <div><strong>Priority:</strong> {text(data.priorityClient?.priority_total, "0")}</div>
                <div><strong>Stage:</strong> {text(data.priorityClient?.lifecycle_stage, "unknown")}</div>
                <div><strong>Next touch:</strong> {text(data.priorityClient?.next_action?.type, "followup")}</div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelInner">
              <p className="eyebrow">What should happen next?</p>
              <h2 className="sectionTitle" style={{ marginBottom: 10 }}>
                {text(primary.next_step, topRevenueAction)}
              </h2>
              <div className="kv">
                <div><strong>Action:</strong> {text(primary.action_label, "Follow up on revenue close.")}</div>
                <div><strong>Outcome:</strong> {text(primary.expected_outcome, "Move active ShopiFixer proposal toward paid client status.")}</div>
                <div><strong>Alternatives:</strong> {text(data.primaryAction?.alternatives_considered?.length, "0")}</div>
                <div><strong>Focus:</strong> ShopiFixer payment close</div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelInner">
              <p className="eyebrow">What can be ignored?</p>
              <h2 className="sectionTitle" style={{ marginBottom: 10 }}>
                Low-priority or non-revenue work
              </h2>
              <div className="kv">
                <div><strong>Internal dev:</strong> {data.internalWork.length > 0 ? data.internalWork[0].unit_id : "None"}</div>
                <div><strong>Ignore diagnostics unless blocked:</strong> Yes</div>
                <div><strong>Ignore technical maps unless blocked:</strong> Yes</div>
                <div><strong>Ignore placeholder analytics:</strong> Yes</div>
              </div>
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">Trust / freshness</p>
            <div className="kv">
              <div><strong>Snapshot generated:</strong> {trustUpdatedAt}</div>
              <div><strong>Source confidence:</strong> {text(data.ceoTruth?.metadata?.confidence, "unknown")}</div>
              <div><strong>Revenue truth bottleneck:</strong> {text(data.revenueTruth?.current_bottleneck, "unknown")}</div>
              <div><strong>Source files:</strong> {sourceStatuses.join(" · ") || "Unavailable"}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

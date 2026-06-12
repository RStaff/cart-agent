import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { OperatorNav } from "../../components/operator/OperatorNav";
import { deriveCustomerOutcome } from "../../lib/operator/loadShopifixerCommandCenter";
import { loadExecutionLog } from "../../lib/operator/loadExecutionLog";

const PATHS = {
  primaryAction: "staffordos/snapshots/primary_action_snapshot_v1.json",
  revenueTruth: "staffordos/revenue/revenue_truth_v1.json",
  dashboardSnapshot: "staffordos/clients/operator_dashboard_snapshot_v1.json",
  clientRegistry: "staffordos/clients/client_registry_v1.json",
  merchantLifecycle: "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json",
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

function toStringValue(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function translateBottleneck(value: unknown) {
  const normalized = String(value ?? "").trim();
  if (normalized === "lead_supply_or_contact_quality") {
    return "Not enough good leads or reachable contacts";
  }
  return normalized || "No revenue blocker recorded";
}

function translateStage(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    proposal_sent: "Offer sent, waiting on payment",
    pre_delivery: "Waiting for customer payment",
    waiting_for_payment: "Waiting for customer payment",
    fix_in_progress: "Work in progress",
    qa: "Quality check",
    proof_ready: "Ready for proof package",
    active: "Active",
    open: "Open",
    internal_dev: "Internal system work",
    followup: "Follow-up",
    revenue_close: "Close payment",
    revenue_followup: "Follow up to close payment",
  };

  return map[normalized] || (String(value ?? "").trim() || "Unknown");
}

function translateConfidence(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "Unknown";
  if (numberValue >= 0.9) return "Very strong";
  if (numberValue >= 0.75) return "Strong";
  if (numberValue >= 0.5) return "Moderate";
  return "Low";
}

function translateOwner(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "ross") return "You (Ross)";
  if (normalized === "system") return "System";
  return String(value ?? "").trim() || "Unknown";
}

function translateDomain(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "shopifixer") return "ShopiFixer";
  if (normalized === "internal_dev") return "Internal work";
  return String(value ?? "").trim() || "Unknown";
}

function translateRisk(value: string) {
  const normalized = String(value ?? "").trim();
  if (normalized.includes("Do not start delivery work before payment is captured.")) {
    return "Do not start the fix until the customer has paid.";
  }
  if (normalized.includes("Do not treat merchant recovered value as Stafford revenue.")) {
    return "Recovered merchant value is not Stafford revenue until payment lands.";
  }
  if (normalized.includes("Human judgment required before executing irreversible actions.")) {
    return "Confirm before making irreversible changes.";
  }
  return normalized;
}

function loadExecutiveHome() {
  const repoRoot = resolveRepoRoot();

  const primaryAction = readJson<any>(repoRoot, PATHS.primaryAction, {});
  const revenueTruth = readJson<any>(repoRoot, PATHS.revenueTruth, {});
  const dashboardSnapshot = readJson<any>(repoRoot, PATHS.dashboardSnapshot, {});
  const clientRegistry = readJson<any>(repoRoot, PATHS.clientRegistry, {});
  const merchantLifecycle = readJson<any>(repoRoot, PATHS.merchantLifecycle, {});
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
  const activeMerchantRecord = Array.isArray(merchantLifecycle.records)
    ? merchantLifecycle.records.find((record: any) => {
        const selected = merchantLifecycle.active_record_selection?.merchant_id;
        return selected && toStringValue(record.merchant_id).toLowerCase() === toStringValue(selected).toLowerCase();
      }) || merchantLifecycle.records[0] || null
    : null;
  const clientRecord = Array.isArray(clientRegistry.clients)
    ? clientRegistry.clients.find((client: any) => {
        const keys = [
          activeMerchantRecord?.client_id,
          activeMerchantRecord?.merchant_id,
          activeMerchantRecord?.merchant_shop,
          activeMerchantRecord?.store_domain,
          priorityClient?.client_id,
          priorityClient?.merchant_shop
        ]
          .map((value) => toStringValue(value).toLowerCase())
          .filter(Boolean);
        return keys.includes(toStringValue(client.client_id).toLowerCase()) || keys.includes(toStringValue(client.merchant_shop).toLowerCase());
      }) || clientRegistry.clients[0] || null
    : null;
  const fulfillmentItem = Array.isArray(fulfillmentTruth.items)
    ? fulfillmentTruth.items.find((item: any) => {
        const keys = [
          activeMerchantRecord?.client_id,
          activeMerchantRecord?.merchant_id,
          activeMerchantRecord?.merchant_shop,
          activeMerchantRecord?.store_domain,
          priorityClient?.client_id,
          priorityClient?.merchant_shop
        ]
          .map((value) => toStringValue(value).toLowerCase())
          .filter(Boolean);
        return keys.includes(toStringValue(item.client_id).toLowerCase()) || keys.includes(toStringValue(item.store_domain).toLowerCase());
      }) || fulfillmentTruth.items[0] || null
    : null;
  const outcomeRow = deriveCustomerOutcome({
    customer:
      toStringValue(priorityClient?.merchant_shop) ||
      toStringValue(activeMerchantRecord?.merchant_shop) ||
      "No completed customer yet",
    lifecycle: activeMerchantRecord,
    client: clientRecord,
    fulfillment: fulfillmentItem,
  });
  const executionLog = loadExecutionLog();
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
    executionLog,
    deliveryWork,
    internalWork,
    paidFulfillment,
    waitingFulfillment,
    priorityClient,
    revenueGap,
    outcomeRow,
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
      : translateBottleneck(data.revenueTruth?.current_bottleneck);
  const paidWorkCount = data.paidFulfillment.length;
  const waitingForPaymentCount = data.waitingFulfillment.length || data.deliveryWork.length;
  const relationshipName = data.priorityClient?.merchant_shop || "No priority relationship";
  const relationshipNext =
    data.priorityClient?.next_action?.instructions ||
    data.priorityClient?.next_action?.action ||
    "Review the next customer relationship.";
  const trustUpdatedAt = data.ceoTruth?.metadata?.generated_at || data.primaryAction?.generated_at || "Unknown";
  const sourceStatuses = Array.isArray(data.ceoTruth?.metadata?.source_files)
    ? data.ceoTruth.metadata.source_files
    : [];
  const coreRecordsState =
    sourceStatuses.length > 0
      ? sourceStatuses.every((source: any) => source.status === "loaded")
        ? "Current"
        : "Partially current"
      : "Unavailable";
  const outcomeVisible = data.outcomeRow.outcome_state !== "Awaiting Outcome Review" || Boolean(data.outcomeRow.completed);
  const lastExecution = data.executionLog?.lastExecution as any;
  const lastOutcomeEvent = data.executionLog?.lastOutcomeEvent as any;
  const outcomeStateChangesToday = data.executionLog?.outcomeStateChangesToday ?? 0;

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
              <span className="chip">Revenue block: {translateBottleneck(data.revenueTruth?.current_bottleneck)}</span>
              <span className="chip">Paid work: {paidWorkCount}</span>
              <span className="chip">Customer needing attention: {relationshipName}</span>
              <span className="chip">Open blockers: {data.blockers.length}</span>
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
              <div><strong>Owner:</strong> {translateOwner(primary.owner)}</div>
              <div><strong>Priority:</strong> {Number(primary.priority_score || 0) >= 90 ? "Top priority" : text(primary.priority_score, "0")}</div>
              <div><strong>Product:</strong> {translateDomain(primary.domain_id)}</div>
              <div><strong>Signal strength:</strong> {translateConfidence(primary.confidence)}</div>
            </div>
          </div>
        </section>

        <div className="grid gridTwo">
          <section className="panel">
            <div className="panelInner">
              <p className="eyebrow">What creates revenue today?</p>
              <h2 className="sectionTitle" style={{ marginBottom: 10 }}>{translateBottleneck(data.revenueTruth?.current_bottleneck)}</h2>
              <p className="subtitle" style={{ marginTop: 0 }}>{revenueSummary}</p>
              <div className="kv">
                <div><strong>Top move:</strong> {topRevenueAction}</div>
                <div><strong>Open outreach:</strong> {text(data.revenueTruth?.funnel?.outreach_queue, "0")}</div>
                <div><strong>Offers out:</strong> {text(data.revenueTruth?.stages?.sent, "0")}</div>
                <div><strong>Replies waiting:</strong> {text(data.revenueTruth?.stages?.replies, "0")}</div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelInner">
              <p className="eyebrow">What is blocked?</p>
              <h2 className="sectionTitle" style={{ marginBottom: 10 }}>Current blockers</h2>
              <div className="kv">
                {data.blockers.length > 0 ? (
                  data.blockers.map((blocker: string) => <div key={blocker}><strong>•</strong> {translateRisk(blocker)}</div>)
                ) : (
                  <div><strong>None:</strong> No explicit blocker recorded.</div>
                )}
                <div><strong>Revenue gap:</strong> {money(data.dashboardSnapshot?.revenue_gaps?.[0]?.gap || 0)}</div>
                <div><strong>Primary risk:</strong> {translateRisk(list(primary.risk || ["None"])[0])}</div>
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
                <div><strong>ShopiFixer stage:</strong> {translateStage(data.deliveryWork[0]?.stage)}</div>
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
                <div><strong>Stage:</strong> {translateStage(data.priorityClient?.lifecycle_stage)}</div>
                <div><strong>Next touch:</strong> {translateStage(data.priorityClient?.next_action?.type)}</div>
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
                <div><strong>Other options considered:</strong> {text(data.primaryAction?.alternatives_considered?.length, "0")}</div>
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
                <div><strong>Internal system work:</strong> {data.internalWork.length > 0 ? "Present" : "None"}</div>
                <div><strong>Ignore diagnostics unless blocked:</strong> Yes</div>
                <div><strong>Ignore technical maps unless blocked:</strong> Yes</div>
                <div><strong>Ignore placeholder analytics:</strong> Yes</div>
              </div>
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">Outcome</p>
            <h2 className="sectionTitle" style={{ marginBottom: 10 }}>What happened after completion?</h2>
            <div className="kv">
              <div><strong>Customer:</strong> {data.outcomeRow.customer}</div>
              <div><strong>Outcome state:</strong> {data.outcomeRow.outcome_state}</div>
              <div><strong>Why:</strong> {data.outcomeRow.why}</div>
              <div><strong>Suggested next action:</strong> {data.outcomeRow.suggested_next_action}</div>
              <div><strong>Revenue impact:</strong> {data.outcomeRow.revenue_impact}</div>
            </div>
            {!outcomeVisible ? (
              <p className="hint" style={{ marginTop: 12 }}>
                This customer has not completed fulfillment yet, so the post-completion outcome is still awaiting review.
              </p>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">Execution</p>
            <h2 className="sectionTitle" style={{ marginBottom: 10 }}>Last action, last outcome, and today</h2>
            <div className="kv">
              <div><strong>Last Execution:</strong> {lastExecution ? `${lastExecution.action_type} · ${lastExecution.customer}` : "No execution logged yet."}</div>
              <div><strong>Last Outcome Event:</strong> {lastOutcomeEvent ? `${lastOutcomeEvent.previous_state} → ${lastOutcomeEvent.new_state}` : "No outcome event logged yet."}</div>
              <div><strong>Outcome State Changes Today:</strong> {outcomeStateChangesToday}</div>
              <div><strong>Did it create revenue?</strong> {data.executionLog?.executionSummary?.didCreateRevenue || "Unknown"}</div>
              <div><strong>Did it improve the customer relationship?</strong> {data.executionLog?.executionSummary?.didImproveCustomerRelationship || "Unknown"}</div>
              <div><strong>Should StaffordOS recommend doing that again?</strong> {data.executionLog?.executionSummary?.shouldRecommendAgain || "Unknown"}</div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">Trust / freshness</p>
            <div className="kv">
              <div><strong>Last refreshed:</strong> {trustUpdatedAt}</div>
              <div><strong>Trust status:</strong> {text(data.ceoTruth?.metadata?.confidence, "unknown")}</div>
              <div><strong>Current revenue block:</strong> {translateBottleneck(data.revenueTruth?.current_bottleneck)}</div>
              <div><strong>Core records:</strong> {coreRecordsState}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

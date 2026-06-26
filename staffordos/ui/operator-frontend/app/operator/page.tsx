import Link from "next/link";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { OperatorNav } from "../../components/operator/OperatorNav";
import { WorkdayControlPanel } from "../../components/operator/WorkdayControlPanel";
import { deriveCustomerOutcome } from "../../lib/operator/loadShopifixerCommandCenter";
import { loadExecutionLog } from "../../lib/operator/loadExecutionLog";
import { getDecisionEngineReport } from "../../lib/operator/decisionEngineResolver";
import { resolveRelationshipById } from "../../lib/operator/relationshipResolver";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

type PacketRecord = {
  packet_id?: string;
  reservation_id?: string | null;
  store_domain?: string | null;
  payment_reference?: string | null;
  status?: string | null;
  execution_status?: string | null;
  proof_status?: string | null;
  completion_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PacketListResponse = {
  ok?: boolean;
  packets?: PacketRecord[];
};

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

function sameDay(value: string | undefined, reference = new Date()) {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toDateString() === reference.toDateString();
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

function summarizeDecisionAction(action: any) {
  if (!action) return "Unavailable";
  const label = text(action.title || action.action_type || action.action_label, "Unavailable");
  const relationship = text(action.relationship_id, "unknown relationship");
  const status = text(action.status, "unknown");
  const blocker = action.blocker ? ` · blocker: ${text(action.blocker)}` : "";
  return `${label} (${relationship}) · ${status}${blocker}`;
}

function comparePrimaryActionWithDecisionEngine(primary: any, decisionTopAction: any, decisionTopBlocker: any) {
  const reasons: string[] = [];
  const primaryLabel = text(primary?.action_label || primary?.action_type, "");
  const primaryStep = text(primary?.next_step, "");
  const decisionLabel = text(decisionTopAction?.title || decisionTopAction?.action_type, "");
  const decisionRelationship = text(decisionTopAction?.relationship_id, "");

  if (!decisionTopAction) {
    reasons.push("Decision Engine did not resolve a top action.");
    return reasons;
  }

  if (decisionTopAction.status && decisionTopAction.status !== "ready") {
    reasons.push(`Decision Engine top action is ${decisionTopAction.status}, not ready.`);
  }

  if (primaryLabel && decisionLabel && normalizeComparison(primaryLabel) !== normalizeComparison(decisionLabel)) {
    reasons.push(`Title mismatch: current action is "${primaryLabel}" but Decision Engine selected "${decisionLabel}".`);
  }

  if (primaryStep && decisionLabel && normalizeComparison(primaryStep) !== normalizeComparison(decisionLabel)) {
    reasons.push(`Step mismatch: current next step is "${primaryStep}" while Decision Engine selected "${decisionLabel}".`);
  }

  if (primary?.domain_id && decisionRelationship && normalizeComparison(primary.domain_id) !== normalizeComparison(decisionRelationship)) {
    reasons.push(`Relationship mismatch: current domain is "${text(primary.domain_id)}" but Decision Engine selected "${decisionRelationship}".`);
  }

  if (decisionTopBlocker?.action_id && decisionTopAction.action_id === decisionTopBlocker.action_id) {
    reasons.push("Decision Engine top action is also the top blocker, which means the selection is blocked.");
  }

  if (!reasons.length) {
    reasons.push("Current Executive Home action and Decision Engine top action are aligned.");
  }

  return reasons;
}

function normalizeComparison(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

function normalizeStore(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function resolvePacketApiBases() {
  const rawBases = [
    process.env.PACKET_AUTHORITY_URL,
    process.env.NEXT_PUBLIC_PACKET_AUTHORITY_URL,
    process.env.CART_AGENT_API_URL,
    process.env.NEXT_PUBLIC_CART_AGENT_API_URL,
    process.env.NEXT_PUBLIC_ABANDO_API_BASE,
    process.env.NEXT_PUBLIC_API_BASE,
    process.env.NEXT_PUBLIC_ABANDO_BACKEND_ORIGIN,
    process.env.ABANDO_BACKEND_ORIGIN,
    process.env.ABANDO_API_BASE,
    process.env.CART_AGENT_API_BASE,
    "https://pay.abando.ai",
    "https://cart-agent-api.onrender.com",
  ];

  return Array.from(
    new Set(
      rawBases
        .map((base) => String(base ?? "").trim().replace(/\/$/, ""))
        .filter(Boolean),
    ),
  );
}

function isPaidPacket(packet: PacketRecord | null | undefined) {
  const status = String(packet?.status ?? "").trim().toLowerCase();
  return status === "payment_received" || status === "paid";
}

function comparePacketRecency(left: PacketRecord, right: PacketRecord) {
  const leftTime = Date.parse(String(left.updated_at || left.created_at || ""));
  const rightTime = Date.parse(String(right.updated_at || right.created_at || ""));
  return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
}

async function readPacket(packetId: string): Promise<PacketRecord | null> {
  const normalized = String(packetId ?? "").trim();
  if (!normalized) return null;

  for (const base of resolvePacketApiBases()) {
    try {
      const response = await fetch(`${base}/api/packets/${encodeURIComponent(normalized)}`, { cache: "no-store" });
      if (!response.ok) continue;

      const payload = (await response.json()) as { ok?: boolean; packet?: PacketRecord };
      return payload?.packet || null;
    } catch {
      continue;
    }
  }

  return null;
}

async function readPackets(): Promise<PacketRecord[]> {
  for (const base of resolvePacketApiBases()) {
    try {
      const response = await fetch(`${base}/api/operator/packets`, { cache: "no-store" });
      if (!response.ok) continue;

      const payload = (await response.json()) as PacketListResponse;
      if (Array.isArray(payload?.packets)) {
        return payload.packets;
      }
    } catch {
      continue;
    }
  }

  return [];
}

function relationshipRouteId(value: unknown) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const relationship = resolveRelationshipById(normalized) || resolveRelationshipById(normalized.replace(/^rel_/, ""));
  return relationship?.relationship_id ? relationship.relationship_id.replace(/^rel_/, "") : null;
}

async function loadExecutiveHome() {
  const repoRoot = resolveRepoRoot();

  const primaryAction = readJson<any>(repoRoot, PATHS.primaryAction, {});
  const revenueTruth = readJson<any>(repoRoot, PATHS.revenueTruth, {});
  const dashboardSnapshot = readJson<any>(repoRoot, PATHS.dashboardSnapshot, {});
  const clientRegistry = readJson<any>(repoRoot, PATHS.clientRegistry, {});
  const merchantLifecycle = readJson<any>(repoRoot, PATHS.merchantLifecycle, {});
  const unitWorkSnapshot = readJson<any>(repoRoot, PATHS.unitWorkSnapshot, {});
  const fulfillmentTruth = readJson<any>(repoRoot, PATHS.fulfillmentTruth, {});
  const ceoTruth = readJson<any>(repoRoot, PATHS.ceoTruth, {});
  const decisionEngine = getDecisionEngineReport();

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
  const activeWorkspaceItem = paidFulfillment[0] || (Array.isArray(fulfillmentTruth.items) ? fulfillmentTruth.items[0] || null : null);
  const packetAuthorityPackets = await readPackets();
  const livePacketFromAuthorityList =
    packetAuthorityPackets
      .filter(isPaidPacket)
      .sort(comparePacketRecency)[0] || null;
  const livePacket = livePacketFromAuthorityList || (activeWorkspaceItem?.packet_id ? await readPacket(activeWorkspaceItem.packet_id) : null);
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
  const decisionMismatchReasons = comparePrimaryActionWithDecisionEngine(
    primary,
    decisionEngine?.top_action || null,
    decisionEngine?.top_blocker || null
  );

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
    activeWorkspaceItem,
    livePacket,
    priorityClient,
    revenueGap,
    outcomeRow,
    blockers,
    decisionEngine,
    decisionMismatchReasons,
  };
}

export default async function OperatorPage() {
  const data = await loadExecutiveHome();
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
  const decisionTopAction = data.decisionEngine?.top_action || null;
  const decisionTopRevenueAction = data.decisionEngine?.top_revenue_action || null;
  const decisionTopRelationshipAction = data.decisionEngine?.top_relationship_action || null;
  const decisionTopBlocker = data.decisionEngine?.top_blocker || null;
  const decisionValidation = data.decisionEngine?.validation || { ok: false, errors: [] };
  const decisionMismatchReasons = Array.isArray(data.decisionMismatchReasons) ? data.decisionMismatchReasons : [];
  const currentPrimaryActionLabel = text(primary.action_label || primary.action_type, "Unavailable");
  const currentPrimaryActionStep = text(primary.next_step, "Unavailable");
  const decisionTopActionLabel = text(decisionTopAction?.title || decisionTopAction?.action_type, "Unavailable");
  const currentActionMatchesDecision =
    normalizeComparison(currentPrimaryActionLabel) === normalizeComparison(decisionTopActionLabel) &&
    normalizeComparison(currentPrimaryActionStep) === normalizeComparison(text(decisionTopAction?.title || decisionTopAction?.action_type, ""));
  const relationshipId =
    relationshipRouteId(data.decisionEngine?.top_action?.relationship_id) ||
    relationshipRouteId(data.decisionEngine?.top_relationship_action?.relationship_id) ||
    relationshipRouteId(data.priorityClient?.merchant_shop) ||
    relationshipRouteId(data.priorityClient?.client_id) ||
    relationshipRouteId(data.revenueGap?.merchant_shop) ||
    relationshipRouteId(data.revenueGap?.client_id) ||
    relationshipRouteId(data.executionLog?.lastExecution?.customer) ||
    relationshipRouteId(data.priorityClient?.merchant_shop ? `rel_${data.priorityClient.merchant_shop}` : "");
  const livePacket = data.livePacket;
  const activePacketId = text(livePacket?.packet_id || data.activeWorkspaceItem?.packet_id, "No live packet selected");
  const packetStatus = text(livePacket?.status || data.activeWorkspaceItem?.payment_status || "unavailable", "unavailable");
  const packetReservationId = text(livePacket?.reservation_id || data.activeWorkspaceItem?.reservation_id || "unavailable", "unavailable");
  const packetStore = text(livePacket?.store_domain || data.activeWorkspaceItem?.store_domain || data.priorityClient?.merchant_shop || "unavailable", "unavailable");
  const packetPaymentReference = text(
    livePacket?.payment_reference || data.activeWorkspaceItem?.payment_reference || "unavailable",
    "unavailable"
  );
  const packetContinuityStatus = packetStatus === "payment_received" ? "Paid packet ready" : "Waiting for packet";
  const packetWorkspaceUrl = (() => {
    const url = new URL("/fix-status", "https://staffordmedia.ai");
    const packetId = livePacket?.packet_id || data.activeWorkspaceItem?.packet_id;
    if (packetId) url.searchParams.set("packet_id", packetId);
    if (packetPaymentReference !== "unavailable") url.searchParams.set("session_id", packetPaymentReference);
    if (packetStore !== "unavailable") url.searchParams.set("store", normalizeStore(packetStore));
    if (packetReservationId !== "unavailable") url.searchParams.set("reservation_id", packetReservationId);
    return `${url.pathname}?${url.searchParams.toString()}`;
  })();
  const completedWorkToday = (data.executionLog?.executionEvents || [])
    .filter((event: any) => sameDay(event.timestamp))
    .filter((event: any) => {
      const outcome = normalizeComparison(event.outcome);
      const stage = normalizeComparison(event.stage);
      return ["complete", "completed", "done", "success", "succeeded", "paid packet ready"].some((term) =>
        outcome.includes(term) || stage.includes(term)
      );
    });
  const openMerchantItems = [
    {
      label: "Active merchant",
      value: relationshipName,
      detail: relationshipNext,
    },
    {
      label: "Live packet",
      value: activePacketId,
      detail: `${packetStatus} · ${packetContinuityStatus}`,
    },
    {
      label: "Awaiting payment",
      value: waitingForPaymentCount.toLocaleString(),
      detail: "Open work still tied to payment close.",
    },
  ];
  const nextDayPriorities = [
    {
      label: "Top revenue action",
      value: topRevenueAction,
    },
    {
      label: "Next relationship action",
      value: relationshipNext,
    },
    {
      label: "Decision Engine top action",
      value: decisionTopActionLabel,
    },
  ];

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

        <WorkdayControlPanel />

        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">Merchant Workspace</p>
            <h2 className="sectionTitle" style={{ marginBottom: 10 }}>
              Live paid packet
            </h2>
            <div className="kv">
              <div><strong>Packet ID:</strong> {activePacketId}</div>
              <div><strong>Reservation ID:</strong> {packetReservationId}</div>
              <div><strong>Store:</strong> {packetStore}</div>
              <div><strong>Packet status:</strong> {packetStatus}</div>
              <div><strong>Payment reference:</strong> {packetPaymentReference}</div>
              <div><strong>Continuity status:</strong> {packetContinuityStatus}</div>
              <div>
                <strong>Next action:</strong>{" "}
                {packetStatus === "payment_received"
                  ? "Open merchant workspace"
                  : text(data.priorityClient?.next_action?.instructions, "Review the highest-priority merchant action.")}
              </div>
            </div>
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <Link href={packetWorkspaceUrl} className="chip">Open Merchant Workspace</Link>
              {livePacket?.packet_id ? <Link href={`/api/packets/${encodeURIComponent(livePacket.packet_id)}`} className="chip">Open Packet Authority</Link> : null}
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
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <Link href="/operator/campaigns" className="chip">Open Campaigns</Link>
              {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship</Link> : null}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">Decision Engine Audit</p>
            <h2 className="sectionTitle" style={{ marginBottom: 10 }}>
              Shadow comparison against the current Executive Home action
            </h2>
            <div className="kv">
              <div><strong>Top Action:</strong> {summarizeDecisionAction(decisionTopAction)}</div>
              <div><strong>Top Revenue Action:</strong> {summarizeDecisionAction(decisionTopRevenueAction)}</div>
              <div><strong>Top Relationship Action:</strong> {summarizeDecisionAction(decisionTopRelationshipAction)}</div>
              <div><strong>Top Blocker:</strong> {summarizeDecisionAction(decisionTopBlocker)}</div>
              <div><strong>Validation Status:</strong> {decisionValidation.ok ? "Pass" : "Fail"}</div>
              <div><strong>Current Executive Home action:</strong> {currentPrimaryActionLabel}</div>
              <div><strong>Decision Engine top_action:</strong> {decisionTopActionLabel}</div>
              <div><strong>Current action matches Decision Engine:</strong> {currentActionMatchesDecision ? "Yes" : "No"}</div>
            </div>
            {decisionMismatchReasons.length > 0 ? (
              <div className="kv" style={{ marginTop: 12 }}>
                <div><strong>Mismatch reasons:</strong></div>
                {decisionMismatchReasons.map((reason: string) => (
                  <div key={reason}>• {reason}</div>
                ))}
              </div>
            ) : (
              <p className="hint" style={{ marginTop: 12 }}>
                No mismatch reasons recorded.
              </p>
            )}
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <Link href="/operator/campaigns" className="chip">Open Campaigns</Link>
              {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship</Link> : null}
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
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <Link href="/operator/campaigns" className="chip">Open Campaigns</Link>
              {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship</Link> : null}
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
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <Link href="/operator/campaigns" className="chip">Open Campaigns</Link>
              {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship</Link> : null}
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
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <Link href="/operator/campaigns" className="chip">Open Campaigns</Link>
              {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship</Link> : null}
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
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <Link href="/operator/campaigns" className="chip">Open Campaigns</Link>
              {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship</Link> : null}
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
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <Link href="/operator/campaigns" className="chip">Open Campaigns</Link>
              {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship</Link> : null}
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

        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">End-of-day consolidation</p>
            <h2 className="sectionTitle" style={{ marginBottom: 10 }}>
              What closed, what stays open, and what to do first tomorrow
            </h2>
            <div className="operatorHomeSummaryPills" style={{ marginBottom: 16 }}>
              <span>Completed today: {completedWorkToday.length}</span>
              <span>Open merchants: {openMerchantItems.length}</span>
              <span>Next-day priorities: {nextDayPriorities.length}</span>
              <span>Evidence trail: {data.executionLog?.outcomeStateChangesToday || 0} changes</span>
            </div>

            <div className="grid gridTwo">
              <section className="panel" style={{ margin: 0 }}>
                <div className="panelInner">
                  <h3 className="sectionTitle">Completed work</h3>
                  {completedWorkToday.length ? (
                    <div className="executionList">
                      {completedWorkToday.slice(0, 4).map((event: any) => (
                        <div key={`${event.execution_id || event.event_id || event.timestamp}`} className="executionItem">
                          <strong>{text(event.action_type, "Completed action")}</strong>
                          <span className="hint">
                            {text(event.customer, "unknown customer")} · {text(event.outcome, "unknown outcome")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="hint">No completed actions recorded today.</p>
                  )}
                </div>
              </section>

              <section className="panel" style={{ margin: 0 }}>
                <div className="panelInner">
                  <h3 className="sectionTitle">Open merchants</h3>
                  <div className="executionList">
                    {openMerchantItems.map((item) => (
                      <div key={item.label} className="executionItem">
                        <strong>{item.label}</strong>
                        <span className="hint">
                          {item.value}
                          {item.detail ? ` · ${item.detail}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="panel" style={{ margin: 0 }}>
                <div className="panelInner">
                  <h3 className="sectionTitle">Tomorrow’s priorities</h3>
                  <div className="executionList">
                    {nextDayPriorities.map((item) => (
                      <div key={item.label} className="executionItem">
                        <strong>{item.label}</strong>
                        <span className="hint">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                    <Link href="/operator/command-center" className="chip">Open Command Center</Link>
                    <Link href="/operator/revenue-command" className="chip">Open Revenue Command</Link>
                    {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship</Link> : null}
                  </div>
                </div>
              </section>
            </div>

            <div className="kv" style={{ marginTop: 16 }}>
              <div><strong>Completion indicators:</strong> Paid packet ready, execution log current, evidence trail visible</div>
              <div><strong>Closeout state:</strong> {paidWorkCount > 0 ? "Ready for end-of-day review" : "No paid work to close"}</div>
              <div><strong>Next checkpoint:</strong> {text(primary.next_step, "Review the next-day priority stack.")}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

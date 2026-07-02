import Link from "next/link";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { OperatorNav } from "../../components/operator/OperatorNav";
import { WorkdayControlPanel } from "../../components/operator/WorkdayControlPanel";
import { deriveCustomerOutcome } from "../../lib/operator/loadShopifixerCommandCenter";
import { getCampaignResolverReport } from "../../lib/operator/campaignResolver";
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
  const campaignReport = getCampaignResolverReport();

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
    campaignReport,
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
  const campaignReport = data.campaignReport;
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
  const campaignInventory = Array.isArray(campaignReport?.campaigns) ? campaignReport.campaigns : [];
  const activeCampaigns = campaignInventory.filter((campaign: any) => campaign.health === "healthy" || campaign.health === "warm");
  const reviewCampaigns = campaignInventory.filter((campaign: any) => campaign.health === "at_risk");
  const inactiveCampaigns = campaignInventory.filter((campaign: any) => campaign.health === "dormant");
  const workQueueFollowUps = [
    data.priorityClient?.next_action?.instructions || relationshipNext,
    topRevenueAction,
    decisionTopActionLabel,
  ].map((value) => text(value, "")).filter((value) => Boolean(value));
  const operatorActions = [
    { href: "/operator/command-center", label: "Open Command Center" },
    { href: "/operator/campaigns", label: "Open Campaigns" },
    { href: packetWorkspaceUrl, label: "Open Merchant Workspace" },
    ...(livePacket?.packet_id || data.activeWorkspaceItem?.packet_id
      ? [{ href: `/api/packets/${encodeURIComponent(livePacket?.packet_id || data.activeWorkspaceItem?.packet_id || "")}`, label: "Open Packet Authority" }]
      : []),
    ...(relationshipId ? [{ href: `/operator/relationship/${relationshipId}`, label: "Open Relationship Workspace" }] : []),
    { href: "/operator/revenue-command", label: "Open Revenue Command" },
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
              <span className="chip">Paid work: {paidWorkCount}</span>
              <span className="chip">Active merchants: {Math.max(campaignReport?.relationship_coverage?.covered_relationships || 0, openMerchantItems.length)}</span>
              <span className="chip">Revenue at stake: {money(campaignReport?.revenue_at_stake_total || 0)}</span>
              <span className="chip">Open blockers: {data.blockers.length}</span>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panelInner">
              <p className="eyebrow">System Health</p>
              <h2 className="sectionTitle" style={{ marginBottom: 8 }}>Live operating status</h2>
              <p className="subtitle" style={{ marginTop: 0 }}>
                StaffordOS is now the working surface for packet authority, workday controls, and merchant readiness.
              </p>
            </div>
          </div>
          <div className="grid gridTwo">
            <WorkdayControlPanel />
            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Live packet summary</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>Paid packet authority</h3>
                <div className="kv">
                  <div><strong>Packet ID:</strong> {activePacketId}</div>
                  <div><strong>Reservation ID:</strong> {packetReservationId}</div>
                  <div><strong>Store:</strong> {packetStore}</div>
                  <div><strong>Status:</strong> {packetStatus}</div>
                  <div><strong>Payment reference:</strong> {packetPaymentReference}</div>
                  <div><strong>Continuity:</strong> {packetContinuityStatus}</div>
                </div>
                <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                  <Link href={packetWorkspaceUrl} className="chip">Open Merchant Workspace</Link>
                  {livePacket?.packet_id ? (
                    <Link href={`/api/packets/${encodeURIComponent(livePacket.packet_id)}`} className="chip">
                      Open Packet Authority
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Active merchants</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>{relationshipName}</h3>
                <div className="kv">
                  <div><strong>Open merchant rows:</strong> {openMerchantItems.length}</div>
                  <div><strong>Covered relationships:</strong> {campaignReport?.relationship_coverage?.covered_relationships || 0}</div>
                  <div><strong>Total relationships:</strong> {campaignReport?.relationship_coverage?.total_relationships || 0}</div>
                  <div><strong>Priority client:</strong> {text(data.priorityClient?.merchant_shop, "None")}</div>
                </div>
                <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                  {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship Workspace</Link> : null}
                </div>
              </div>
            </section>
            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Revenue at stake</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>{money(campaignReport?.revenue_at_stake_total || 0)}</h3>
                <div className="kv">
                  <div><strong>Revenue block:</strong> {translateBottleneck(data.revenueTruth?.current_bottleneck)}</div>
                  <div><strong>Merchant value proven:</strong> {money(data.revenueGap?.merchant_revenue || 0)}</div>
                  <div><strong>Stafford revenue captured:</strong> {money(data.revenueGap?.stafford_revenue || 0)}</div>
                  <div><strong>Open outreach queue:</strong> {text(data.revenueTruth?.funnel?.outreach_queue, "0")}</div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panelInner">
              <p className="eyebrow">Today's Work Queue</p>
              <h2 className="sectionTitle" style={{ marginBottom: 8 }}>What Ross should process next</h2>
              <p className="subtitle" style={{ marginTop: 0 }}>
                Intake, campaigns, follow-ups, and immediate operator actions are now surfaced together.
              </p>
            </div>
          </div>
          <div className="grid gridTwo">
            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Merchants awaiting intake</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>{waitingForPaymentCount > 0 ? `${waitingForPaymentCount} open item(s)` : "No intake waiting"}</h3>
                <div className="executionList">
                  {data.waitingFulfillment.slice(0, 4).map((item: any) => (
                    <div key={`${item.packet_id || item.client_id || item.store_domain || item.id}`} className="executionItem">
                      <strong>{text(item.store_domain || item.client_id || item.packet_id, "Unknown merchant")}</strong>
                      <span className="hint">
                        {text(item.payment_status || item.status, "waiting_for_payment")} · {text(item.next_action || item.stage, "Awaiting payment")}
                      </span>
                    </div>
                  ))}
                  {!data.waitingFulfillment.length ? <p className="hint">No merchants are currently waiting on intake.</p> : null}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Campaigns needing review</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>{reviewCampaigns.length > 0 ? `${reviewCampaigns.length} campaign(s)` : "No at-risk campaigns"}</h3>
                <div className="executionList">
                  {reviewCampaigns.slice(0, 4).map((campaign: any) => (
                    <div key={campaign.campaign_id} className="executionItem">
                      <strong>{campaign.campaign_id}</strong>
                      <span className="hint">
                        {campaign.objective} · {campaign.health} · {money(campaign.revenue_at_stake || 0)}
                      </span>
                    </div>
                  ))}
                  {!reviewCampaigns.length ? <p className="hint">No campaigns currently need review.</p> : null}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Follow-ups</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>{workQueueFollowUps.length ? `${workQueueFollowUps.length} queued` : "No follow-ups queued"}</h3>
                <div className="executionList">
                  {workQueueFollowUps.slice(0, 4).map((item) => (
                    <div key={item} className="executionItem">
                      <strong>{item}</strong>
                    </div>
                  ))}
                  {!workQueueFollowUps.length ? <p className="hint">No explicit follow-ups were resolved from current truth.</p> : null}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Operator actions</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>Execute work directly from StaffordOS</h3>
                <div className="row" style={{ flexWrap: "wrap" }}>
                  {operatorActions.map((action) => (
                    <Link key={`${action.href}-${action.label}`} href={action.href} className="chip">
                      {action.label}
                    </Link>
                  ))}
                </div>
                <p className="hint" style={{ marginTop: 12 }}>
                  Command Center, Campaign Command, Relationship Workspace, Merchant Workspace, Packet Authority, and Revenue Command stay reachable from the same operator surface.
                </p>
              </div>
            </section>
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panelInner">
              <p className="eyebrow">Merchant Operations</p>
              <h2 className="sectionTitle" style={{ marginBottom: 8 }}>Work the merchant lifecycle from one workspace</h2>
              <p className="subtitle" style={{ marginTop: 0 }}>
                Relationship, merchant, packet, and campaign surfaces now live together on the operator home.
              </p>
            </div>
          </div>
          <div className="grid gridTwo">
            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Relationship workspace</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>{relationshipName}</h3>
                <div className="kv">
                  <div><strong>Reason:</strong> {text(data.priorityClient?.close_engine?.suggested_message, "Review the highest-priority customer relationship.")}</div>
                  <div><strong>Priority:</strong> {text(data.priorityClient?.priority_total, "0")}</div>
                  <div><strong>Stage:</strong> {translateStage(data.priorityClient?.lifecycle_stage)}</div>
                  <div><strong>Next touch:</strong> {translateStage(data.priorityClient?.next_action?.type)}</div>
                </div>
                <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                  {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship Workspace</Link> : null}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Merchant workspace</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>{packetStatus === "payment_received" ? "Fix request open" : "Merchant workspace"}</h3>
                <div className="kv">
                  <div><strong>Next action:</strong> {packetStatus === "payment_received" ? "Open merchant workspace" : text(data.priorityClient?.next_action?.instructions, "Review the highest-priority merchant action.")}</div>
                  <div><strong>Continuity:</strong> {packetContinuityStatus}</div>
                  <div><strong>Merchant link:</strong> {packetWorkspaceUrl}</div>
                </div>
                <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                  <Link href={packetWorkspaceUrl} className="chip">Open Merchant Workspace</Link>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Packet authority</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>{activePacketId}</h3>
                <div className="kv">
                  <div><strong>Packet status:</strong> {packetStatus}</div>
                  <div><strong>Reservation:</strong> {packetReservationId}</div>
                  <div><strong>Payment reference:</strong> {packetPaymentReference}</div>
                  <div><strong>Store:</strong> {packetStore}</div>
                </div>
                <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                  {livePacket?.packet_id ? <Link href={`/api/packets/${encodeURIComponent(livePacket.packet_id)}`} className="chip">Open Packet Authority</Link> : null}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Campaign Command</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>
                  {campaignInventory.length > 0 ? `${campaignInventory.length} campaign(s)` : "Campaign Command"}
                </h3>
                <div className="kv">
                  <div><strong>At risk:</strong> {reviewCampaigns.length}</div>
                  <div><strong>Healthy/warm:</strong> {activeCampaigns.length}</div>
                  <div><strong>Dormant:</strong> {inactiveCampaigns.length}</div>
                  <div><strong>Revenue at stake:</strong> {money(campaignReport?.revenue_at_stake_total || 0)}</div>
                </div>
                <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                  <Link href="/operator/campaigns" className="chip">Open Campaign Command</Link>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panelInner">
              <p className="eyebrow">Business Intelligence</p>
              <h2 className="sectionTitle" style={{ marginBottom: 8 }}>Review the day and set up tomorrow</h2>
              <p className="subtitle" style={{ marginTop: 0 }}>
                End-of-day consolidation, evidence, revenue pipeline, and next-day priorities are now in the same home surface.
              </p>
            </div>
          </div>
          <div className="grid gridTwo">
            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">End-of-day summary</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>
                  Completed today: {completedWorkToday.length}
                </h3>
                <div className="kv">
                  <div><strong>Open merchants:</strong> {openMerchantItems.length}</div>
                  <div><strong>Next-day priorities:</strong> {nextDayPriorities.length}</div>
                  <div><strong>Evidence trail:</strong> {data.executionLog?.outcomeStateChangesToday || 0} changes</div>
                  <div><strong>Closeout state:</strong> {paidWorkCount > 0 ? "Ready for end-of-day review" : "No paid work to close"}</div>
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
                <p className="eyebrow">Evidence generated today</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>
                  {completedWorkToday.length ? `${completedWorkToday.length} completed action(s)` : "No completed actions recorded"}
                </h3>
                <div className="executionList">
                  {completedWorkToday.slice(0, 4).map((event: any) => (
                    <div key={`${event.execution_id || event.event_id || event.timestamp}`} className="executionItem">
                      <strong>{text(event.action_type, "Completed action")}</strong>
                      <span className="hint">
                        {text(event.customer, "unknown customer")} · {text(event.outcome, "unknown outcome")}
                      </span>
                    </div>
                  ))}
                  {!completedWorkToday.length ? <p className="hint">No execution evidence recorded today.</p> : null}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelInner">
                <p className="eyebrow">Revenue pipeline</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>{translateBottleneck(data.revenueTruth?.current_bottleneck)}</h3>
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
                <p className="eyebrow">Tomorrow’s priorities</p>
                <h3 className="sectionTitle" style={{ marginBottom: 10 }}>What Ross should do first</h3>
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
                  {relationshipId ? <Link href={`/operator/relationship/${relationshipId}`} className="chip">Open Relationship Workspace</Link> : null}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

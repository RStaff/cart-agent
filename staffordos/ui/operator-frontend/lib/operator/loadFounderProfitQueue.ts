import fs from "node:fs";
import path from "node:path";
import { resolveRelationshipById } from "./relationshipResolver";

type AnyRecord = Record<string, any>;

export type FounderProfitMission = {
  mission_id: string;
  merchant_id: string;
  merchant: string;
  client_id: string | null;
  lead_id: string | null;
  current_stage: string;
  expected_revenue: number;
  roi_score: number;
  readiness: number;
  urgency: number;
  mission_status: "READY" | "APPROVAL_REQUIRED" | "WAITING" | "BLOCKED" | "IN_PROGRESS" | "COMPLETE";
  delegated_to: "Ross" | "StaffordOS" | "Waiting";
  recommended_action: string;
  why_now: string;
  blocking_dependency: string | null;
  required_human_decision: string | null;
  target_route: string;
  confidence_band: "high" | "medium" | "low";
  source_evidence: string[];
  mission_category: "Ross approval" | "Ross call" | "Agent research" | "Agent draft" | "Agent follow-up" | "Merchant execution" | "Evidence review" | "Revenue collection";
};

export type FounderProfitQueue = {
  generated_at: string;
  current_bottleneck: string;
  missions: FounderProfitMission[];
  summary: {
    total: number;
    ready: number;
    approval_required: number;
    waiting: number;
    blocked: number;
    in_progress: number;
    complete: number;
    ross_required: number;
    staffordos: number;
  };
  sources: {
    merchant_lifecycle: string;
    lead_registry: string;
    client_registry: string;
    revenue_truth: string;
    execution_log: string;
    send_ledger: string;
    follow_up_queue: string;
  };
};

type MissionEntity = {
  keys: Set<string>;
  lifecycle: AnyRecord | null;
  lead: AnyRecord | null;
  client: AnyRecord | null;
  sendLedgerItems: AnyRecord[];
  followUpItems: AnyRecord[];
  executionEvents: AnyRecord[];
};

const SOURCE_FILES = {
  merchantLifecycle: "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json",
  leadRegistry: "staffordos/leads/lead_registry_v1.json",
  clientRegistry: "staffordos/clients/client_registry_v1.json",
  revenueTruth: "staffordos/revenue/revenue_truth_v1.json",
  executionLog: "staffordos/execution/execution_log_v1.json",
  sendLedger: "staffordos/leads/send_ledger_v1.json",
  followUpQueue: "staffordos/leads/follow_up_queue_v1.json",
} as const;

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, SOURCE_FILES.merchantLifecycle))) return cwd;

  const fromFrontend = path.resolve(cwd, "../../..");
  if (fs.existsSync(path.join(fromFrontend, SOURCE_FILES.merchantLifecycle))) return fromFrontend;

  return fromFrontend;
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function text(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeKey(value: unknown) {
  return text(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0]
    .replace(/[^a-z0-9.@_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isObjectRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecords(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? value.filter(isObjectRecord) : [];
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => text(value)).filter(Boolean)));
}

function parseNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function confidenceBand(value: number): "high" | "medium" | "low" {
  if (value >= 75) return "high";
  if (value >= 45) return "medium";
  return "low";
}

function evidenceRef(file: string, key: string, value: unknown) {
  const normalized = text(value);
  return normalized ? `${file}#${key}=${normalized}` : file;
}

function keysForRecord(record: AnyRecord) {
  return unique([
    record.merchant_id,
    record.client_id,
    record.merchant_shop,
    record.store_domain,
    record.domain,
    record.lead_id,
    record.id,
    record.name,
    record.customer,
    record.lead_name,
    record.domain_id,
  ]);
}

function resolveEntity(entity: MissionEntity[], record: AnyRecord) {
  const keys = keysForRecord(record);
  let match = entity.find((candidate) => keys.some((key) => candidate.keys.has(key)));
  if (!match) {
    match = {
      keys: new Set(keys),
      lifecycle: null,
      lead: null,
      client: null,
      sendLedgerItems: [],
      followUpItems: [],
      executionEvents: [],
    };
    entity.push(match);
  } else {
    for (const key of keys) match.keys.add(key);
  }
  return match;
}

function chooseLatest(records: AnyRecord[]) {
  return [...records].sort((left, right) => {
    const leftTime = Date.parse(String(left.updated_at || left.created_at || left.timestamp || 0));
    const rightTime = Date.parse(String(right.updated_at || right.created_at || right.timestamp || 0));
    return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
  })[0] || null;
}

function merchantLabel(entity: MissionEntity) {
  const record = entity.lifecycle || entity.client || entity.lead || entity.sendLedgerItems[0] || entity.followUpItems[0] || entity.executionEvents[0] || {};
  return text(
    record.merchant_shop ||
      record.client_id ||
      record.store_domain ||
      record.domain ||
      record.name ||
      record.merchant_id ||
      record.customer ||
      record.lead_name ||
      "Unknown merchant"
  );
}

function merchantId(entity: MissionEntity) {
  const record = entity.lifecycle || entity.client || entity.lead || entity.sendLedgerItems[0] || entity.followUpItems[0] || entity.executionEvents[0] || {};
  return text(record.merchant_id || record.client_id || record.lead_id || record.domain || record.name || record.customer || merchantLabel(entity));
}

function leadId(entity: MissionEntity) {
  const record = entity.lifecycle || entity.lead || entity.client || entity.sendLedgerItems[0] || entity.followUpItems[0] || entity.executionEvents[0] || {};
  return text(record.lead_id || record.id || record.domain || record.name || "");
}

function clientId(entity: MissionEntity) {
  const record = entity.lifecycle || entity.client || entity.lead || entity.sendLedgerItems[0] || entity.followUpItems[0] || entity.executionEvents[0] || {};
  return text(record.client_id || record.merchant_id || record.domain || record.name || "");
}

function currentStage(entity: MissionEntity) {
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  const lead = entity.lead || {};
  return text(lifecycle.current_stage || client.lifecycle?.stage || lead.lifecycle_stage || lead.status?.current_stage || "unknown");
}

function readiness(entity: MissionEntity) {
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  const lead = entity.lead || {};
  return clamp(
    parseNumber(
      lifecycle.readiness_score ??
        client.priority_score?.total ??
        lead.score ??
        0
    )
  );
}

function expectedRevenue(entity: MissionEntity) {
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  return clamp(
    parseNumber(
      lifecycle.offer_price ??
        client.deal?.value ??
        client.revenue?.shopifixer_one_time ??
        client.revenue?.total_lifetime_value ??
        0
    ),
    0,
    Number.MAX_SAFE_INTEGER
  );
}

function followUpStatus(entity: MissionEntity) {
  const item = chooseLatest(entity.followUpItems);
  return text(item?.status || "");
}

function sendStatus(entity: MissionEntity) {
  const item = chooseLatest(entity.sendLedgerItems);
  return text(item?.status || "");
}

function latestExecution(entity: MissionEntity) {
  return chooseLatest(entity.executionEvents);
}

function missionCategoryFor(entity: MissionEntity, currentBottleneck: string) {
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  const lead = entity.lead || {};
  const stage = currentStage(entity).toLowerCase();
  const paymentStatus = text(lifecycle.payment_status || client.deal?.payment_status || lead.payment?.status || "").toLowerCase();
  const proofStatus = text(lifecycle.proof_package_status || "").toLowerCase();
  const reviewStatus = text(lifecycle.review_status || "").toLowerCase();
  const sendState = sendStatus(entity).toLowerCase();
  const followUpState = followUpStatus(entity).toLowerCase();
  const autoExecutable = Boolean(client.next_action?.auto_executable);
  const qualified = text(lifecycle.qualification_status || client.qualification_status || lead.qualification_status || "").toLowerCase() === "qualified";

  if (stage === "complete" || proofStatus === "complete" || reviewStatus === "complete") {
    return "Evidence review";
  }

  if (paymentStatus === "waiting_for_payment" || stage === "offer_sent" || stage === "revenue_close") {
    return "Revenue collection";
  }

  if (proofStatus === "not_started" && paymentStatus === "payment_received") {
    return "Evidence review";
  }

  if (stage === "audit_requested" || stage === "fix_in_progress" || stage === "qa" || stage === "proof_ready") {
    return "Merchant execution";
  }

  if (followUpState === "sent" || sendState === "dry_run_proof_recorded") {
    return "Agent follow-up";
  }

  if (lead.status?.current_stage === "pending_approval" || lead.status?.current_stage === "message_ready" || lead.status?.current_stage === "approved") {
    return "Ross approval";
  }

  if (qualified && autoExecutable) {
    return currentBottleneck === "lead_supply_or_contact_quality" ? "Agent research" : "Agent draft";
  }

  if (qualified) {
    return "Agent draft";
  }

  return "Agent research";
}

function missionStatusFor(category: FounderProfitMission["mission_category"], entity: MissionEntity) {
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  const lead = entity.lead || {};
  const paymentStatus = text(lifecycle.payment_status || client.deal?.payment_status || lead.payment?.status || "").toLowerCase();
  const proofStatus = text(lifecycle.proof_package_status || "").toLowerCase();
  const reviewStatus = text(lifecycle.review_status || "").toLowerCase();
  const blocked = Boolean(client.blocker_detection?.blocked || client.lifecycle?.blocked || lead.status?.current_bottleneck === "blocked");
  const complete = text(lifecycle.current_stage || client.lifecycle?.stage || "").toLowerCase() === "complete" || proofStatus === "complete" || reviewStatus === "complete";

  if (complete) return "COMPLETE";
  if (blocked) return "BLOCKED";
  if (category === "Ross approval") return "APPROVAL_REQUIRED";
  if (category === "Evidence review") return "APPROVAL_REQUIRED";
  if (category === "Revenue collection") return paymentStatus === "waiting_for_payment" ? "READY" : "IN_PROGRESS";
  if (category === "Merchant execution") return "IN_PROGRESS";
  if (category === "Agent follow-up") return "WAITING";
  return "READY";
}

function delegatedToFor(category: FounderProfitMission["mission_category"], status: FounderProfitMission["mission_status"]) {
  if (status === "WAITING") return "Waiting";
  if (category === "Merchant execution" || category === "Agent research" || category === "Agent draft" || category === "Agent follow-up") {
    return "StaffordOS";
  }
  return "Ross";
}

function routeFor(entity: MissionEntity, category: FounderProfitMission["mission_category"], status: FounderProfitMission["mission_status"]) {
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  const lead = entity.lead || {};

  const relationship = resolveRelationshipById(
    lifecycle.merchant_id ||
      lifecycle.client_id ||
      lifecycle.merchant_shop ||
      client.client_id ||
      client.merchant_shop ||
      lead.lead_id ||
      lead.domain ||
      lead.name
  );

  const relationshipRoute = relationship?.relationship_id ? `/operator/relationship/${relationship.relationship_id.replace(/^rel_/, "")}` : null;

  if (status === "BLOCKED") {
    return relationshipRoute || "/operator/leads";
  }

  if (category === "Revenue collection" || category === "Ross approval") {
    return relationshipRoute || "/operator/revenue-command";
  }

  if (category === "Evidence review") {
    return "/operator/execution-log";
  }

  if (category === "Merchant execution") {
    return "/operator/command-center";
  }

  if (category === "Agent follow-up" || category === "Agent draft" || category === "Agent research") {
    return "/operator/leads";
  }

  return relationshipRoute || "/operator/leads";
}

function whyNowFor(entity: MissionEntity, category: FounderProfitMission["mission_category"], expectedRevenueValue: number, readinessValue: number, currentBottleneck: string) {
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  const lead = entity.lead || {};
  const stage = currentStage(entity);
  const nextRequiredAction = text(lifecycle.next_required_action || client.next_action?.instructions || lead.status?.next_action || "Review the next step.");
  const revenueText = expectedRevenueValue > 0 ? `$${expectedRevenueValue.toLocaleString()}` : "no direct revenue amount";
  const readinessText = `${readinessValue}/100`;

  if (category === "Revenue collection") {
    return `${revenueText} is still pending and the merchant is at ${stage}. Readiness is ${readinessText}; payment is the remaining close step.`;
  }

  if (category === "Merchant execution") {
    return `${nextRequiredAction} The execution path is active and readiness is ${readinessText}.`;
  }

  if (category === "Evidence review") {
    return `${nextRequiredAction} Evidence/proof is the next control point before the merchant can close cleanly.`;
  }

  if (category === "Ross approval") {
    return `${nextRequiredAction} Ross approval is required before StaffordOS can continue the outbound motion.`;
  }

  if (category === "Agent follow-up") {
    return `${nextRequiredAction} The queue is waiting on merchant response and follow-up motion.`;
  }

  if (category === "Agent draft" || category === "Agent research") {
    return `${nextRequiredAction} Revenue bottleneck is ${currentBottleneck || "unknown"}, so StaffordOS can continue the prospect motion now.`;
  }

  return `${nextRequiredAction} The mission is the current highest-value step for this merchant.`;
}

function blockingDependencyFor(category: FounderProfitMission["mission_category"], entity: MissionEntity) {
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  const lead = entity.lead || {};
  const paymentStatus = text(lifecycle.payment_status || client.deal?.payment_status || lead.payment?.status || "");
  const blocked = Boolean(client.blocker_detection?.blocked || client.lifecycle?.blocked || lead.status?.current_bottleneck === "blocked");

  if (blocked) return "Merchant or lifecycle blocker";
  if (category === "Revenue collection") return paymentStatus || "Merchant payment";
  if (category === "Ross approval") return "Ross approval";
  if (category === "Evidence review") return "Proof / evidence review";
  if (category === "Merchant execution") return "Execution readiness";
  if (category === "Agent follow-up") return "Merchant reply";
  return null;
}

function requiredDecisionFor(category: FounderProfitMission["mission_category"], status: FounderProfitMission["mission_status"]) {
  if (status === "COMPLETE") return "None";
  if (status === "WAITING") return "None; waiting on merchant response";
  if (category === "Revenue collection") return "Call merchant and close payment";
  if (category === "Ross approval") return "Approve outreach or execution";
  if (category === "Evidence review") return "Approve proof package";
  if (category === "Merchant execution") return "Approve execution scope";
  if (category === "Agent follow-up") return "None; StaffordOS can keep the follow-up motion queued";
  return "Approve the next automated step if needed";
}

function sourceEvidenceFor(entity: MissionEntity, currentBottleneck: string) {
  const evidence = new Set<string>();
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  const lead = entity.lead || {};
  const sendLedger = chooseLatest(entity.sendLedgerItems);
  const followUp = chooseLatest(entity.followUpItems);
  const execution = latestExecution(entity);

  if (Object.keys(lifecycle).length) evidence.add(evidenceRef(SOURCE_FILES.merchantLifecycle, "merchant_id", lifecycle.merchant_id || lifecycle.client_id || lifecycle.merchant_shop));
  if (Object.keys(client).length) evidence.add(evidenceRef(SOURCE_FILES.clientRegistry, "client_id", client.client_id || client.merchant_shop));
  if (Object.keys(lead).length) evidence.add(evidenceRef(SOURCE_FILES.leadRegistry, "lead_id", lead.lead_id || lead.id || lead.domain));
  if (sendLedger) evidence.add(evidenceRef(SOURCE_FILES.sendLedger, "lead_id", sendLedger.lead_id || sendLedger.lead_name || sendLedger.id));
  if (followUp) evidence.add(evidenceRef(SOURCE_FILES.followUpQueue, "lead_id", followUp.lead_id || followUp.domain || followUp.lead_name || followUp.id));
  if (execution) evidence.add(evidenceRef(SOURCE_FILES.executionLog, "customer", execution.customer || execution.execution_id));
  if (currentBottleneck) evidence.add(evidenceRef(SOURCE_FILES.revenueTruth, "current_bottleneck", currentBottleneck));

  return Array.from(evidence);
}

function scoreMission(expectedRevenueValue: number, readinessValue: number, urgencyValue: number, delegatedTo: FounderProfitMission["delegated_to"], currentBottleneck: string, category: FounderProfitMission["mission_category"]) {
  const revenueComponent = Math.min(100, expectedRevenueValue / 10);
  const delegatedBoost = delegatedTo === "Ross" ? 12 : delegatedTo === "StaffordOS" ? 6 : 0;
  const bottleneckBoost = currentBottleneck === "lead_supply_or_contact_quality" && (category === "Agent research" || category === "Agent draft") ? 10 : 0;
  return Math.round(
    clamp(revenueComponent * 0.28 + readinessValue * 0.4 + urgencyValue * 0.22 + delegatedBoost + bottleneckBoost)
  );
}

function urgencyFor(category: FounderProfitMission["mission_category"], entity: MissionEntity, currentBottleneck: string) {
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  const lead = entity.lead || {};
  const paymentStatus = text(lifecycle.payment_status || client.deal?.payment_status || lead.payment?.status || "").toLowerCase();
  const followUpState = followUpStatus(entity).toLowerCase();
  const blocked = Boolean(client.blocker_detection?.blocked || client.lifecycle?.blocked || lead.status?.current_bottleneck === "blocked");

  if (blocked) return 95;
  if (category === "Revenue collection" && paymentStatus === "waiting_for_payment") return 95;
  if (category === "Ross approval") return 90;
  if (category === "Evidence review") return 85;
  if (followUpState === "sent") return 80;
  if (category === "Merchant execution") return 75;
  if (category === "Agent follow-up") return 72;
  if (currentBottleneck === "lead_supply_or_contact_quality" && (category === "Agent research" || category === "Agent draft")) return 70;
  if (text(lifecycle.current_stage || client.lifecycle?.stage || lead.lifecycle_stage || "").toLowerCase() === "lead") return 60;
  return 50;
}

function buildMission(entity: MissionEntity, currentBottleneck: string): FounderProfitMission {
  const lifecycle = entity.lifecycle || {};
  const client = entity.client || {};
  const lead = entity.lead || {};
  const merchant = merchantLabel(entity);
  const merchantIdValue = merchantId(entity);
  const clientIdValue = clientId(entity) || null;
  const leadIdValue = leadId(entity) || null;
  const stage = currentStage(entity);
  const expectedRevenueValue = expectedRevenue(entity);
  const readinessValue = readiness(entity);
  const category = missionCategoryFor(entity, currentBottleneck);
  const status = missionStatusFor(category, entity);
  const delegatedTo = delegatedToFor(category, status);
  const urgencyValue = urgencyFor(category, entity, currentBottleneck);
  const targetRoute = routeFor(entity, category, status);
  const whyNow = whyNowFor(entity, category, expectedRevenueValue, readinessValue, currentBottleneck);
  const recommendedAction = text(lifecycle.next_required_action || client.next_action?.instructions || lead.status?.next_action || "Review the next mission.");
  const blockingDependency = blockingDependencyFor(category, entity);
  const requiredHumanDecision = requiredDecisionFor(category, status);
  const missionId = `mission_${normalizeKey(merchantIdValue || merchant)}_${normalizeKey(category) || "mission"}`;
  const delegatedOwner = delegatedTo;
  const roiScore = scoreMission(expectedRevenueValue, readinessValue, urgencyValue, delegatedOwner, currentBottleneck, category);
  const sourceEvidence = sourceEvidenceFor(entity, currentBottleneck);

  return {
    mission_id: missionId,
    merchant_id: merchantIdValue,
    merchant,
    client_id: clientIdValue,
    lead_id: leadIdValue,
    current_stage: stage,
    expected_revenue: expectedRevenueValue,
    roi_score: roiScore,
    readiness: readinessValue,
    urgency: urgencyValue,
    mission_status: status,
    delegated_to: delegatedOwner,
    recommended_action: recommendedAction,
    why_now: whyNow,
    blocking_dependency: blockingDependency,
    required_human_decision: requiredHumanDecision,
    target_route: targetRoute,
    confidence_band: confidenceBand(readinessValue),
    source_evidence: sourceEvidence,
    mission_category: category,
  };
}

export function loadFounderProfitQueue(): FounderProfitQueue {
  const repoRoot = resolveRepoRoot();
  const merchantLifecycleDoc = readJson<any>(path.join(repoRoot, SOURCE_FILES.merchantLifecycle), { records: [] });
  const leadRegistryDoc = readJson<any>(path.join(repoRoot, SOURCE_FILES.leadRegistry), { items: [] });
  const clientRegistryDoc = readJson<any>(path.join(repoRoot, SOURCE_FILES.clientRegistry), { clients: [] });
  const revenueTruth = readJson<any>(path.join(repoRoot, SOURCE_FILES.revenueTruth), {});
  const executionLog = readJson<any>(path.join(repoRoot, SOURCE_FILES.executionLog), { events: [] });
  const sendLedgerDoc = readJson<any>(path.join(repoRoot, SOURCE_FILES.sendLedger), { items: [] });
  const followUpQueueDoc = readJson<any>(path.join(repoRoot, SOURCE_FILES.followUpQueue), { items: [] });

  const lifecycleRecords = asRecords(merchantLifecycleDoc.records);
  const leadRecords = asRecords(leadRegistryDoc.items);
  const clientRecords = asRecords(clientRegistryDoc.clients);
  const executionEvents = asRecords(executionLog.events);
  const sendLedgerItems = asRecords(sendLedgerDoc.items);
  const followUpItems = asRecords(followUpQueueDoc.items);
  const currentBottleneck = text(revenueTruth.current_bottleneck || "");

  const entities: MissionEntity[] = [];

  for (const record of lifecycleRecords) resolveEntity(entities, record).lifecycle = record;
  for (const record of clientRecords) resolveEntity(entities, record).client = record;
  for (const record of leadRecords) resolveEntity(entities, record).lead = record;
  for (const record of sendLedgerItems) resolveEntity(entities, record).sendLedgerItems.push(record);
  for (const record of followUpItems) resolveEntity(entities, record).followUpItems.push(record);
  for (const record of executionEvents) resolveEntity(entities, record).executionEvents.push(record);

  const missions = entities
    .map((entity) => buildMission(entity, currentBottleneck))
    .filter((mission) => Boolean(mission.merchant))
    .sort((left, right) => {
      if (right.expected_revenue !== left.expected_revenue) return right.expected_revenue - left.expected_revenue;
      if (right.urgency !== left.urgency) return right.urgency - left.urgency;
      if (right.readiness !== left.readiness) return right.readiness - left.readiness;
      if (right.roi_score !== left.roi_score) return right.roi_score - left.roi_score;
      return left.merchant.localeCompare(right.merchant);
    });

  return {
    generated_at: new Date().toISOString(),
    current_bottleneck: currentBottleneck,
    missions,
    summary: {
      total: missions.length,
      ready: missions.filter((mission) => mission.mission_status === "READY").length,
      approval_required: missions.filter((mission) => mission.mission_status === "APPROVAL_REQUIRED").length,
      waiting: missions.filter((mission) => mission.mission_status === "WAITING").length,
      blocked: missions.filter((mission) => mission.mission_status === "BLOCKED").length,
      in_progress: missions.filter((mission) => mission.mission_status === "IN_PROGRESS").length,
      complete: missions.filter((mission) => mission.mission_status === "COMPLETE").length,
      ross_required: missions.filter((mission) => mission.delegated_to === "Ross").length,
      staffordos: missions.filter((mission) => mission.delegated_to === "StaffordOS").length,
    },
    sources: {
      merchant_lifecycle: SOURCE_FILES.merchantLifecycle,
      lead_registry: SOURCE_FILES.leadRegistry,
      client_registry: SOURCE_FILES.clientRegistry,
      revenue_truth: SOURCE_FILES.revenueTruth,
      execution_log: SOURCE_FILES.executionLog,
      send_ledger: SOURCE_FILES.sendLedger,
      follow_up_queue: SOURCE_FILES.followUpQueue,
    },
  };
}

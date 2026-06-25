import fs from "node:fs";
import path from "node:path";

type MerchantLifecycleRecord = {
  merchant_id?: string;
  client_id?: string;
  merchant_shop?: string;
  store_domain?: string;
  current_stage?: string;
  next_required_action?: string;
  readiness_score?: number;
  offer_status?: string;
  offer_price?: number;
  payment_status?: string;
  fulfillment_status?: string;
  proof_package_status?: string;
  case_study_status?: string;
  review_status?: string;
  referral_status?: string;
  revenue_status?: string;
  audit?: {
    score?: number;
    top_issue?: string;
    recommendation?: string;
  };
  offer?: {
    send_allowed?: boolean;
  };
  payment?: {
    readiness?: string;
  };
  fulfillment?: {
    execution_status?: string;
    proof_status?: string;
  };
  lifecycle_lane?: {
    offer_generated?: boolean;
    audit_complete?: boolean;
    conversion_brief_generated?: boolean;
    offer_sent?: boolean;
    payment_received?: boolean;
    fulfillment_started?: boolean;
    proof_complete?: boolean;
    completed?: boolean;
  };
  lifecycle?: {
    offer_generated?: boolean;
    audit_complete?: boolean;
    conversion_brief_generated?: boolean;
    offer_sent?: boolean;
    payment_received?: boolean;
    fulfillment_started?: boolean;
    proof_complete?: boolean;
    completed?: boolean;
  };
  field_sources?: Record<string, unknown>;
  source_files?: string[];
};

type MerchantLifecycleRegistry = {
  schema?: string;
  generated_at?: string;
  active_record_selection?: {
    merchant_id?: string | null;
  };
  records?: MerchantLifecycleRecord[];
  source_files?: string[];
};

type ClientRegistry = {
  clients?: Array<Record<string, any>>;
};

type FulfillmentTruth = {
  items?: Array<Record<string, any>>;
  summary_counts?: Record<string, number>;
};

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

export type CustomerOutcomeRow = {
  customer: string;
  outcome_state: string;
  why: string;
  suggested_next_action: string;
  revenue_impact: string;
  visible_on_fulfillment: boolean;
  completed: boolean;
  completed_at: string | null;
};

function fallbackCommandCenter() {
  return {
    schema: "staffordos.shopifixer_command_center.v1",
    generated_at: "",
    merchant: {
      store: "unavailable",
      client_id: "unavailable",
    },
    audit: {
      score: 0,
      top_issue: "unavailable",
      recommendation: "unavailable",
    },
    offer: {
      offer_status: "unavailable",
      offer_price: 0,
      send_allowed: false,
    },
    payment: {
      payment_status: "unavailable",
      readiness: "unavailable",
    },
    fulfillment: {
      fulfillment_status: "unavailable",
      execution_status: "unavailable",
      proof_status: "unavailable",
    },
    lifecycle_lane: {
      offer_generated: false,
      audit_complete: false,
      conversion_brief_generated: false,
      offer_sent: false,
      payment_received: false,
      fulfillment_started: false,
      proof_complete: false,
      completed: false,
    },
    lifecycle: {
      offer_generated: false,
      offer_sent: false,
      payment_received: false,
      fulfillment_started: false,
      proof_complete: false,
      completed: false,
    },
    overall: {
      current_stage: "unavailable",
      next_required_action: "unavailable",
      readiness_score: 0,
    },
    checkout_linkage: {
      packet_id: null,
      reservation_id: null,
      store_domain: null,
      payment_reference: null,
      status: "unavailable",
      continuity_status: "unavailable",
      shopifixer_url: null,
      pricing_url: null,
      merchant_workspace_url: null,
      packet_authority_url: null,
    },
  };
}

function normalizeKey(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function selectPrecomputedRecord(registry: MerchantLifecycleRegistry) {
  const records = Array.isArray(registry.records) ? registry.records : [];
  if (!records.length) return null;

  const selectedMerchantId = normalizeKey(registry.active_record_selection?.merchant_id);
  if (selectedMerchantId) {
    return (
      records.find((record) => normalizeKey(record.merchant_id) === selectedMerchantId) ||
      records.find((record) => normalizeKey(record.client_id) === selectedMerchantId) ||
      records[0] ||
      null
    );
  }

  return records[0] || null;
}

function buildCommandCenterFromRecord(registry: MerchantLifecycleRegistry, record: MerchantLifecycleRecord) {
  const merchantStore = record.merchant_shop || record.store_domain || record.client_id || record.merchant_id || "unavailable";
  const clientId = record.client_id || record.merchant_id || merchantStore;
  const audit = record.audit || {};
  const offer = record.offer || {};
  const payment = record.payment || {};
  const fulfillment = record.fulfillment || {};
  const lifecycleLane = record.lifecycle_lane || {};

  return {
    schema: "staffordos.shopifixer_command_center.v1",
    generated_at: registry.generated_at || "",
    merchant: {
      store: merchantStore,
      client_id: clientId,
    },
    audit: {
      score: audit.score ?? 0,
      top_issue: audit.top_issue || "unavailable",
      recommendation: audit.recommendation || "unavailable",
    },
    offer: {
      offer_status: record.offer_status || "unavailable",
      offer_price: record.offer_price ?? 0,
      send_allowed: Boolean(offer.send_allowed),
    },
    payment: {
      payment_status: record.payment_status || "unavailable",
      readiness: payment.readiness || "unavailable",
    },
    fulfillment: {
      fulfillment_status: record.fulfillment_status || "unavailable",
      execution_status: fulfillment.execution_status || "unavailable",
      proof_status: fulfillment.proof_status || record.proof_package_status || "unavailable",
    },
    lifecycle_lane: {
      offer_generated: Boolean(lifecycleLane.offer_generated),
      audit_complete: Boolean(lifecycleLane.audit_complete),
      conversion_brief_generated: Boolean(lifecycleLane.conversion_brief_generated),
      offer_sent: Boolean(lifecycleLane.offer_sent),
      payment_received: Boolean(lifecycleLane.payment_received),
      fulfillment_started: Boolean(lifecycleLane.fulfillment_started),
      proof_complete: Boolean(lifecycleLane.proof_complete),
      completed: Boolean(lifecycleLane.completed),
    },
    lifecycle: {
      offer_generated: Boolean(lifecycleLane.offer_generated),
      offer_sent: Boolean(lifecycleLane.offer_sent),
      payment_received: Boolean(lifecycleLane.payment_received),
      fulfillment_started: Boolean(lifecycleLane.fulfillment_started),
      proof_complete: Boolean(lifecycleLane.proof_complete),
      completed: Boolean(lifecycleLane.completed),
    },
    overall: {
      current_stage: record.current_stage || "unavailable",
      next_required_action: record.next_required_action || "unavailable",
      readiness_score: record.readiness_score ?? 0,
    },
    source_files: [
      "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json",
    ],
    field_sources: record.field_sources || {},
    registry_source: {
      file: "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json",
      selected_merchant_id: record.merchant_id || clientId,
      selection_source: registry.active_record_selection?.merchant_id ? "precomputed_in_builder" : "first_record_fallback",
    },
  };
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function selectClientRecord(registry: ClientRegistry, record: MerchantLifecycleRecord) {
  const clients = Array.isArray(registry.clients) ? registry.clients : [];
  const merchantKeys = [record.client_id, record.merchant_id, record.merchant_shop, record.store_domain]
    .map(normalizeKey)
    .filter(Boolean);

  return (
    clients.find((client) => merchantKeys.includes(normalizeKey(client.client_id))) ||
    clients.find((client) => merchantKeys.includes(normalizeKey(client.merchant_shop))) ||
    clients[0] ||
    null
  );
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

function selectFulfillmentItem(truth: FulfillmentTruth, record: MerchantLifecycleRecord) {
  const items = Array.isArray(truth.items) ? truth.items : [];
  const merchantKeys = [record.client_id, record.merchant_id, record.merchant_shop, record.store_domain]
    .map(normalizeKey)
    .filter(Boolean);

  return (
    items.find((item) => merchantKeys.includes(normalizeKey(item.client_id))) ||
    items.find((item) => merchantKeys.includes(normalizeKey(item.store_domain))) ||
    items[0] ||
    null
  );
}

function selectPacketRecord(packets: PacketRecord[], record: MerchantLifecycleRecord) {
  const merchantKeys = [record.client_id, record.merchant_id, record.merchant_shop, record.store_domain]
    .map(normalizeStore)
    .filter(Boolean);
  const paidPackets = packets.filter(isPaidPacket);

  return (
    paidPackets.find(
      (packet) =>
        merchantKeys.includes(normalizeStore(packet.store_domain)) || merchantKeys.includes(normalizeStore(packet.packet_id))
    ) ||
    paidPackets.sort(comparePacketRecency)[0] ||
    null
  );
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "yes", "yes."].includes(normalized);
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function hasSignal(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return !["not_started", "unknown", "unavailable", "none", "false", "0", "null"].includes(normalized);
}

function daysSince(isoDate?: string | null) {
  const value = String(isoDate ?? "").trim();
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
}

export function deriveCustomerOutcome(input: {
  customer: string;
  lifecycle?: MerchantLifecycleRecord | null;
  client?: Record<string, any> | null;
  fulfillment?: Record<string, any> | null;
}): CustomerOutcomeRow {
  const lifecycle = input.lifecycle || {};
  const client = input.client || {};
  const fulfillment = input.fulfillment || {};

  const completed = Boolean(
    toBoolean(fulfillment.completion_complete) ||
    toBoolean(lifecycle.lifecycle_lane?.completed) ||
    toBoolean(lifecycle.lifecycle?.completed)
  );
  const proofComplete = Boolean(
    toBoolean(fulfillment.proof_complete) ||
    toBoolean(lifecycle.lifecycle_lane?.proof_complete) ||
    toBoolean(lifecycle.lifecycle?.proof_complete)
  );
  const completionDate = String(fulfillment.completed_at || "").trim() || null;
  const riskNotes = [
    String(fulfillment.risk_or_limitation || "").trim(),
    String(fulfillment.remaining_limitations || "").trim(),
    String(client?.blocker_detection?.highest_severity || "").trim(),
    String(client?.blocker_detection?.blockers?.[0] || "").trim()
  ].filter(Boolean);
  const referralSignals = [
    fulfillment.referral_requested,
    fulfillment.referral_received,
    fulfillment.review_requested,
    fulfillment.review_received,
    lifecycle.referral_status,
    fulfillment.case_study_authorized,
    lifecycle.case_study_status
  ].some(hasSignal);
  const expansionSignals = [
    client?.close_engine?.followup_ready,
    client?.business?.stafford_revenue_earned,
    client?.business?.stafford_recurring_revenue,
    client?.abando?.merchant_revenue_recovered,
    client?.business?.next_action,
    lifecycle.revenue_status
  ].some((value) => toBoolean(value) || toNumber(value) > 0 || hasSignal(value));
  const completedAge = daysSince(completionDate);
  const dormant = Boolean(completed && completedAge !== null && completedAge >= 14 && !referralSignals && !expansionSignals);

  if (!completed) {
    return {
      customer: input.customer,
      outcome_state: "Awaiting Outcome Review",
      why: "Fulfillment is not complete yet.",
      suggested_next_action: "Complete fulfillment before deciding the customer outcome.",
      revenue_impact: "Low",
      visible_on_fulfillment: false,
      completed: false,
      completed_at: null,
    };
  }

  if (!proofComplete || riskNotes.length > 0) {
    return {
      customer: input.customer,
      outcome_state: "At Risk",
      why: riskNotes.length > 0 ? `Open risk or limitation: ${riskNotes[0]}` : "Completion is not backed by proof yet.",
      suggested_next_action: "Repair trust or finish proof before moving on.",
      revenue_impact: "High",
      visible_on_fulfillment: true,
      completed: true,
      completed_at: completionDate,
    };
  }

  if (referralSignals) {
    return {
      customer: input.customer,
      outcome_state: "Referral Candidate",
      why: "The customer is complete and has referral or review signals.",
      suggested_next_action: "Ask for a referral, testimonial, or case-study permission.",
      revenue_impact: "High",
      visible_on_fulfillment: true,
      completed: true,
      completed_at: completionDate,
    };
  }

  if (expansionSignals) {
    return {
      customer: input.customer,
      outcome_state: "Expansion Candidate",
      why: "The customer is complete and shows follow-on revenue potential.",
      suggested_next_action: "Offer the next relevant product or follow-up plan.",
      revenue_impact: "High",
      visible_on_fulfillment: true,
      completed: true,
      completed_at: completionDate,
    };
  }

  if (dormant) {
    return {
      customer: input.customer,
      outcome_state: "Dormant",
      why: "The customer is complete, quiet, and has no immediate follow-on motion.",
      suggested_next_action: "Archive for now and revisit later only if a new signal appears.",
      revenue_impact: "Low",
      visible_on_fulfillment: true,
      completed: true,
      completed_at: completionDate,
    };
  }

  return {
    customer: input.customer,
    outcome_state: "Satisfied",
    why: "Fulfillment is complete and there are no risk, referral, or expansion signals yet.",
    suggested_next_action: "Keep the customer warm and look for a future referral or expansion signal.",
    revenue_impact: "Medium",
    visible_on_fulfillment: true,
    completed: true,
    completed_at: completionDate,
  };
}

export async function loadShopifixerCommandCenter() {
  const filePath = path.join(process.cwd(), "../../merchant_registry/merchant_lifecycle_registry_v1.json");
  const clientRegistryPath = path.join(process.cwd(), "../../clients/client_registry_v1.json");
  const fulfillmentTruthPath = path.join(process.cwd(), "../../fulfillment/shopifixer_fulfillment_truth_v1.json");

  try {
    const registry = JSON.parse(fs.readFileSync(filePath, "utf8")) as MerchantLifecycleRegistry;
    const activeRecord = selectPrecomputedRecord(registry);

    if (!activeRecord) {
      return fallbackCommandCenter();
    }

    const clientRegistry = readJsonFile<ClientRegistry>(clientRegistryPath, {});
    const fulfillmentTruth = readJsonFile<FulfillmentTruth>(fulfillmentTruthPath, {});
    const clientRecord = selectClientRecord(clientRegistry, activeRecord);
    const fulfillmentItem = selectFulfillmentItem(fulfillmentTruth, activeRecord);
    const packetRecords = await readPackets();
    const livePacket = selectPacketRecord(packetRecords, activeRecord);
    const merchantStore = activeRecord.merchant_shop || activeRecord.store_domain || activeRecord.client_id || activeRecord.merchant_id || "unavailable";
    const packetStore = livePacket?.store_domain || merchantStore;
    const packetId = livePacket?.packet_id || null;
    const reservationId = livePacket?.reservation_id || null;
    const paymentReference = livePacket?.payment_reference || null;
    const normalizedStore = normalizeStore(packetStore);
    const merchantWorkspaceUrl = packetId
      ? `/fix-status?packet_id=${encodeURIComponent(packetId)}${paymentReference ? `&session_id=${encodeURIComponent(paymentReference)}` : ""}${normalizedStore ? `&store=${encodeURIComponent(normalizedStore)}` : ""}${reservationId ? `&reservation_id=${encodeURIComponent(reservationId)}` : ""}`
      : null;
    const customerOutcome = deriveCustomerOutcome({
      customer: merchantStore,
      lifecycle: activeRecord,
      client: clientRecord,
      fulfillment: fulfillmentItem,
    });

    return {
      ...buildCommandCenterFromRecord(registry, activeRecord),
      checkout_linkage: {
        packet_id: packetId,
        reservation_id: reservationId,
        store_domain: packetStore,
        payment_reference: paymentReference,
        status: livePacket?.status || activeRecord.payment_status || "unavailable",
        continuity_status:
          livePacket?.status === "payment_received" ? "Paid packet ready" : livePacket ? "Waiting for packet" : "unavailable",
        shopifixer_url: normalizedStore ? `/shopifixer?store=${encodeURIComponent(normalizedStore)}` : null,
        pricing_url: normalizedStore ? `/pricing?store=${encodeURIComponent(normalizedStore)}` : null,
        merchant_workspace_url: merchantWorkspaceUrl,
        packet_authority_url: packetId ? `/api/packets/${encodeURIComponent(packetId)}` : null,
      },
      customer_outcomes: [customerOutcome],
    };
  } catch {
    return fallbackCommandCenter();
  }
}

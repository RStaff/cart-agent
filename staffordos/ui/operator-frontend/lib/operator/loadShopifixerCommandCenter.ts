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

export function loadShopifixerCommandCenter() {
  const filePath = path.join(process.cwd(), "../../../merchant_registry/merchant_lifecycle_registry_v1.json");

  try {
    const registry = JSON.parse(fs.readFileSync(filePath, "utf8")) as MerchantLifecycleRegistry;
    const activeRecord = selectPrecomputedRecord(registry);

    if (!activeRecord) {
      return fallbackCommandCenter();
    }

    return buildCommandCenterFromRecord(registry, activeRecord);
  } catch {
    return fallbackCommandCenter();
  }
}

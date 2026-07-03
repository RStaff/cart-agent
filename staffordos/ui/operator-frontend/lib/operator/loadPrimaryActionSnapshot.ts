import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  canonicalClientLifecycleStage,
  canonicalLeadLifecycleStage,
  humanizeOperatorReason,
} from "./lifecycleTerminology";

type AnyRecord = Record<string, any>;

type RossFacingPrimaryActionSnapshot = {
  schema: string;
  generated_at: string;
  primary_action: {
    action_id: string;
    action_label: string;
    action_type: string;
    merchant: string;
    product: string;
    why_now: string;
    next_step: string;
    confidence: number;
    confidence_band: string;
    supporting_context: string[];
    evidence: string[];
    risk: string[];
    expected_outcome: string;
  };
};

const CEOSNAPSHOT_URL = "http://localhost:3000/api/operator/ceo-snapshot";

function text(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "";
}

function percentToBand(value: number) {
  if (value >= 85) return "high";
  if (value >= 60) return "medium";
  return "low";
}

function toConfidence(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.min(100, numberValue)) : 0;
}

function readJson(filePath: string, fallback: AnyRecord) {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, "staffordos/clients/client_registry_v1.json"))) return cwd;

  const fromOperatorFrontend = path.resolve(cwd, "../../..");
  if (existsSync(path.join(fromOperatorFrontend, "staffordos/clients/client_registry_v1.json"))) {
    return fromOperatorFrontend;
  }

  return fromOperatorFrontend;
}

function deriveProduct(client: AnyRecord, lead: AnyRecord, actionLabel: string) {
  return (
    text(client.selected_product) ||
    text(lead.product) ||
    text(lead.routing?.primary_offer) ||
    (text(actionLabel).toLowerCase().includes("shopifixer") ? "shopifixer" : "") ||
    "shopifixer"
  );
}

function findLifecycleRecord(
  records: AnyRecord[],
  primaryFocus: AnyRecord,
  focusClient: AnyRecord,
  lead: AnyRecord
) {
  const merchantId = text(primaryFocus.merchant_id || primaryFocus.client_id || primaryFocus.merchant_shop);
  const clientId = text(primaryFocus.client_id || focusClient.client_id || focusClient.merchant_shop);
  const merchantShop = text(primaryFocus.merchant_shop || focusClient.merchant_shop || lead.domain);
  const leadId = text(primaryFocus.lead_id || lead.lead_id || lead.id);
  const leadDomain = text(lead.domain);

  return (
    records.find((record: AnyRecord) => {
      const recordMerchantId = text(record.merchant_id || record.client_id || record.merchant_shop);
      const recordClientId = text(record.client_id || record.merchant_shop);
      const recordMerchantShop = text(record.merchant_shop || record.store_domain || record.client_id);
      const recordLeadId = text(record.lead_id);

      return Boolean(
        (merchantId && recordMerchantId === merchantId) ||
        (clientId && recordClientId === clientId) ||
        (merchantShop && recordMerchantShop === merchantShop) ||
        (leadId && recordLeadId === leadId) ||
        (leadDomain && recordMerchantShop === leadDomain)
      );
    }) || null
  );
}

function buildLifecycleSnapshot(
  record: AnyRecord,
  fallback: RossFacingPrimaryActionSnapshot,
  dashboard: AnyRecord,
  primaryFocus: AnyRecord,
  lead: AnyRecord,
  focusClient: AnyRecord
): RossFacingPrimaryActionSnapshot {
  const merchant = text(record.merchant_shop || record.client_id || focusClient.merchant_shop || lead.domain || fallback.primary_action.merchant);
  const actionLabel = text(record.next_required_action || primaryFocus.action || fallback.primary_action.action_label || "Review merchant lifecycle");
  const nextStep = text(record.next_required_action || primaryFocus.next_action?.instructions || primaryFocus.next_action || fallback.primary_action.next_step);
  const confidence = toConfidence(record.readiness_score ?? primaryFocus.priority_total ?? focusClient.priority_score?.total ?? lead.score ?? fallback.primary_action.confidence);
  const whyNowSource = text(
    record.next_required_action ||
    record.current_stage ||
    primaryFocus.reason ||
    fallback.primary_action.why_now ||
    "Work the canonical merchant lifecycle next."
  );
  const support = [
    merchant ? `Merchant Lifecycle merchant: ${merchant}` : null,
    record.merchant_id ? `Merchant ID: ${text(record.merchant_id)}` : null,
    record.lead_id ? `Lead ID: ${text(record.lead_id)}` : null,
    record.current_stage ? `Lifecycle stage: ${text(record.current_stage)}` : null,
    record.next_required_action ? `Next required action: ${text(record.next_required_action)}` : null,
    Number.isFinite(Number(record.readiness_score)) ? `Readiness score: ${text(record.readiness_score)}` : null,
    record.qualification_status ? `Qualification: ${text(record.qualification_status)}` : null,
    dashboard.revenue_gaps?.length
      ? `Revenue gap on deck: ${dashboard.revenue_gaps[0].merchant_shop} has a $${dashboard.revenue_gaps[0].gap} gap.`
      : null,
    primaryFocus.blocked ? "Merchant is blocked and needs attention before moving forward." : null
  ].filter(Boolean) as string[];

  return {
    schema: "staffordos.operator_primary_action.v1",
    generated_at: text(dashboard.generated_at || new Date().toISOString()),
    primary_action: {
      action_id: text(record.action_id || record.merchant_id || record.client_id || fallback.primary_action.action_id),
      action_label: actionLabel,
      action_type: text(primaryFocus.canonical_area || primaryFocus.area || fallback.primary_action.action_type || "merchant_followup"),
      merchant,
      product: text(focusClient.selected_product || lead.product || lead.routing?.primary_offer || fallback.primary_action.product || "shopifixer"),
      why_now: humanizeOperatorReason(whyNowSource),
      next_step: nextStep,
      confidence,
      confidence_band: percentToBand(confidence),
      supporting_context: support.length ? support : fallback.primary_action.supporting_context,
      evidence: [
        text(record.merchant_id || record.client_id || record.lead_id),
        text(record.current_stage || ""),
        text(record.next_required_action || "")
      ].filter(Boolean),
      risk: primaryFocus.blocked ? ["Merchant is currently blocked."] : [],
      expected_outcome: `Advance ${merchant} using the canonical merchant lifecycle projection.`
    }
  };
}

function synthesizeFromLocalFiles(): RossFacingPrimaryActionSnapshot {
  const repoRoot = resolveRepoRoot();
  const dashboard = readJson(path.join(repoRoot, "staffordos/clients/operator_dashboard_snapshot_v1.json"), {});
  const merchantLifecycle = readJson(path.join(repoRoot, "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json"), { records: [] });
  const clientRegistry = readJson(path.join(repoRoot, "staffordos/clients/client_registry_v1.json"), { clients: [] });
  const leadRegistry = readJson(path.join(repoRoot, "staffordos/leads/lead_registry_v1.json"), { items: [] });

  const lifecycleRecords = Array.isArray(merchantLifecycle.records) ? merchantLifecycle.records : [];
  const clients = Array.isArray(clientRegistry.clients) ? clientRegistry.clients : [];
  const leads = Array.isArray(leadRegistry.items) ? leadRegistry.items : [];

  const primaryFocus = dashboard.primary_focus || {};
  const focusClient = clients.find((client: AnyRecord) => {
    const id = text(client.client_id);
    const shop = text(client.merchant_shop);
    return id && (id === text(primaryFocus.client_id) || shop === text(primaryFocus.merchant_shop));
  }) || {};

  const lead = leads.find((item: AnyRecord) => {
    const id = text(item.lead_id || item.id);
    const domain = text(item.domain);
    return id === text(primaryFocus.client_id) || domain === text(primaryFocus.merchant_shop);
  }) || {};

  const lifecycleRecord = findLifecycleRecord(lifecycleRecords, primaryFocus, focusClient, lead);
  if (lifecycleRecord) {
    return buildLifecycleSnapshot(lifecycleRecord, {
      schema: "staffordos.operator_primary_action.v1",
      generated_at: text(dashboard.generated_at || new Date().toISOString()),
      primary_action: {
        action_id: text(primaryFocus.client_id || focusClient.client_id || lead.lead_id || "ross_primary_action"),
        action_label: text(primaryFocus.action || "Review merchant"),
        action_type: text(primaryFocus.canonical_area || primaryFocus.area || "merchant_followup"),
        merchant: text(primaryFocus.merchant_shop || focusClient.merchant_shop || lead.domain || focusClient.client_id || "unknown merchant"),
        product: deriveProduct(focusClient, lead, text(primaryFocus.action || "Review merchant")),
        why_now: humanizeOperatorReason(text(primaryFocus.reason || "Ross should work the highest-priority merchant action.")),
        next_step: text(primaryFocus.next_action?.instructions || primaryFocus.next_action || focusClient.next_action?.instructions || "Review merchant and take the next step."),
        confidence: toConfidence(primaryFocus.priority_total || focusClient.priority_score?.total || lead.score || 0),
        confidence_band: percentToBand(toConfidence(primaryFocus.priority_total || focusClient.priority_score?.total || lead.score || 0)),
        supporting_context: [],
        evidence: [],
        risk: [],
        expected_outcome: primaryFocus.reason
          ? `Move ${text(primaryFocus.merchant_shop || focusClient.merchant_shop || lead.domain || "the merchant")} forward on ${deriveProduct(focusClient, lead, text(primaryFocus.action || "Review merchant"))}.`
          : "Advance the highest-priority merchant action."
      }
    }, dashboard, primaryFocus, lead, focusClient);
  }

  const actionLabel = text(primaryFocus.action) || "Review merchant";
  const merchant = text(primaryFocus.merchant_shop || focusClient.merchant_shop || lead.domain || focusClient.client_id || "unknown merchant");
  const product = deriveProduct(focusClient, lead, actionLabel);
  const whyNow = text(primaryFocus.reason) || "Ross should work the highest-priority merchant action.";
  const nextStep = text(primaryFocus.next_action?.instructions || primaryFocus.next_action || focusClient.next_action?.instructions || "Review merchant and take the next step.");
  const confidence = toConfidence(primaryFocus.priority_total || focusClient.priority_score?.total || lead.score || 0);

  const support = [
    merchant ? `Merchant: ${merchant}` : null,
    product ? `Product: ${product}` : null,
    dashboard.revenue_gaps?.length
      ? `Revenue gap on deck: ${dashboard.revenue_gaps[0].merchant_shop} has a $${dashboard.revenue_gaps[0].gap} gap.`
      : null,
    primaryFocus.blocked ? "Merchant is blocked and needs attention before moving forward." : null,
    lead.canonical_lifecycle_stage || lead.status?.current_stage
      ? `Lead stage: ${text(lead.canonical_lifecycle_stage || canonicalLeadLifecycleStage(lead))}`
      : null,
    focusClient.canonical_lifecycle_stage || focusClient.lifecycle?.stage
      ? `Client stage: ${text(focusClient.canonical_lifecycle_stage || canonicalClientLifecycleStage(focusClient))}`
      : null
  ].filter(Boolean) as string[];

  return {
    schema: "staffordos.operator_primary_action.v1",
    generated_at: text(dashboard.generated_at || new Date().toISOString()),
    primary_action: {
      action_id: text(primaryFocus.client_id || focusClient.client_id || lead.lead_id || "ross_primary_action"),
      action_label: actionLabel,
      action_type: text(primaryFocus.canonical_area || primaryFocus.area || "merchant_followup"),
      merchant,
      product,
      why_now: humanizeOperatorReason(whyNow),
      next_step: nextStep,
      confidence,
      confidence_band: percentToBand(confidence),
      supporting_context: support,
      evidence: [
        text(primaryFocus.client_id || focusClient.client_id || lead.lead_id),
        text(primaryFocus.reason || ""),
        text(primaryFocus.action || "")
      ].filter(Boolean),
      risk: primaryFocus.blocked ? ["Merchant is currently blocked."] : [],
      expected_outcome: primaryFocus.reason
        ? `Move ${merchant} forward on ${product}.`
        : "Advance the highest-priority merchant action."
    }
  };
}

export async function loadPrimaryActionSnapshot(): Promise<RossFacingPrimaryActionSnapshot> {
  try {
    const response = await fetch(CEOSNAPSHOT_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`ceo_snapshot_http_${response.status}`);
    }

    const snapshot = (await response.json()) as AnyRecord;
    if (!snapshot?.next_best_action) {
      throw new Error("ceo_snapshot_missing_expected_fields");
    }

    const fallback = synthesizeFromLocalFiles();
    const primaryActionSource = snapshot.next_best_action || {};
    const generatedAt = text(snapshot.generated_at || fallback.generated_at);
    const merchant = text(primaryActionSource.merchant_shop || fallback.primary_action.merchant);
    const product = text(
      fallback.primary_action.product ||
      (snapshot.acquisition?.product_routing
        ? Object.entries(snapshot.acquisition.product_routing).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0]
        : "") ||
      primaryActionSource.product ||
      "shopifixer"
    );
    const actionLabel = text(primaryActionSource.action || fallback.primary_action.action_label);
    const whyNow = text(primaryActionSource.reason || fallback.primary_action.why_now);
    const nextStep = text(primaryActionSource.action || fallback.primary_action.next_step);
    const confidence = toConfidence(
      fallback.primary_action.confidence ||
      snapshot.revenue?.total_clients ||
      snapshot.conversion?.proposal_sent_clients ||
      0
    );
    const supportingContext = [
      merchant ? `Merchant: ${merchant}` : null,
      product ? `Product: ${product}` : null,
      snapshot.revenue?.revenue_gaps?.[0]
        ? `Revenue gap: ${snapshot.revenue.revenue_gaps[0].merchant_shop} is $${snapshot.revenue.revenue_gaps[0].gap} short.`
        : null,
      snapshot.conversion?.audits_needed
        ? `Audits needed: ${snapshot.conversion.audits_needed} clients.`
        : null,
      snapshot.merchant_success?.proof_or_revenue_gaps
        ? `Proof or revenue gaps: ${snapshot.merchant_success.proof_or_revenue_gaps}.`
        : null,
      primaryActionSource.canonical_area || primaryActionSource.area
        ? `Canonical area: ${text(primaryActionSource.canonical_area || primaryActionSource.area)}`
        : null,
      whyNow ? `Why now: ${humanizeOperatorReason(whyNow)}` : null
    ].filter(Boolean) as string[];

    return {
      schema: "staffordos.operator_primary_action.v1",
      generated_at: generatedAt,
      primary_action: {
        action_id: text(
          primaryActionSource.client_id ||
          fallback.primary_action.action_id
        ),
        action_label: actionLabel,
        action_type: text(primaryActionSource.canonical_area || primaryActionSource.area || "merchant_followup"),
        merchant: merchant || fallback.primary_action.merchant,
        product: product || fallback.primary_action.product,
        why_now: humanizeOperatorReason(whyNow || fallback.primary_action.why_now),
        next_step: nextStep || fallback.primary_action.next_step,
        confidence,
        confidence_band: percentToBand(confidence),
        supporting_context: supportingContext.length ? supportingContext : fallback.primary_action.supporting_context,
        evidence: [
          text(primaryActionSource.reason || ""),
          text(snapshot.conversion?.status || ""),
          text(primaryActionSource.action || "")
        ].filter(Boolean),
        risk: Array.isArray(primaryActionSource.risk) ? primaryActionSource.risk : [],
        expected_outcome: whyNow
          ? `Move ${merchant || "the merchant"} forward on ${product || "the offer"}.`
          : fallback.primary_action.expected_outcome
      }
    };
  } catch {
    return synthesizeFromLocalFiles();
  }
}

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

function synthesizeFromLocalFiles(): RossFacingPrimaryActionSnapshot {
  const repoRoot = resolveRepoRoot();
  const dashboard = readJson(path.join(repoRoot, "staffordos/clients/operator_dashboard_snapshot_v1.json"), {});
  const clientRegistry = readJson(path.join(repoRoot, "staffordos/clients/client_registry_v1.json"), { clients: [] });
  const leadRegistry = readJson(path.join(repoRoot, "staffordos/leads/lead_registry_v1.json"), { items: [] });

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

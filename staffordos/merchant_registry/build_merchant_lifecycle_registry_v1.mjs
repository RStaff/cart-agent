import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(REPO_ROOT, "staffordos", "merchant_registry");
const OUT_JSON = path.join(OUT_DIR, "merchant_lifecycle_registry_v1.json");
const OUT_MD = path.join(OUT_DIR, "merchant_lifecycle_registry_v1.md");

const INPUT_FILES = [
  "staffordos/clients/client_registry_v1.json",
  "staffordos/leads/lead_registry_v1.json",
  "staffordos/units/opportunity_units_v1.json",
  "staffordos/units/delivery_units_v1.json",
  "staffordos/units/action_units_v1.json",
  "staffordos/revenue/revenue_truth_v1.json",
  "staffordos/audit/audit_result_surface.json",
  "staffordos/shopifixer/shopifixer_send_authority_v1.json",
  "staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json",
  "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json",
  "staffordos/shopifixer/shopifixer_command_center_v1.json",
];

function abs(relPath) {
  return path.join(REPO_ROOT, relPath);
}

function readJson(relPath, fallback) {
  const filePath = abs(relPath);
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function text(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sourceNote(status, sourceFile, sourceField, note = null) {
  return {
    status,
    source_file: sourceFile,
    source_field: sourceField,
    note,
  };
}

function unavailable(field, reason, sourceFile = null, sourceField = null) {
  return {
    field,
    status: "unavailable",
    reason,
    source_file: sourceFile,
    source_field: sourceField,
  };
}

function stageReadinessScore(stage) {
  const normalized = String(stage || "").toLowerCase();
  if (normalized === "offer_sent") return 70;
  if (normalized === "payment_received") return 85;
  if (normalized === "completed") return 100;
  if (normalized === "followup_sent") return 35;
  if (normalized === "engaged") return 25;
  if (normalized === "contact_needed") return 10;
  if (normalized === "audit_requested") return 45;
  if (normalized === "proposal_sent") return 60;
  if (normalized === "lead") return 15;
  if (normalized === "qualified") return 20;
  if (normalized === "pre_delivery") return 80;
  if (normalized === "in_progress") return 85;
  if (normalized === "active") return 85;
  if (normalized === "proof_ready") return 90;
  if (normalized === "deal_won") return 82;
  return 0;
}

function stageFromLead(lead) {
  return text(lead?.status?.current_stage || lead?.lifecycle_stage || lead?.status?.next_action) || null;
}

function stageFromClient(client) {
  return text(client?.lifecycle?.stage) || null;
}

function matchLead(client, leads) {
  const keys = [
    client.client_id,
    client.merchant_shop,
  ].map(normalizeKey).filter(Boolean);

  return leads.find((lead) => {
    const candidates = [
      lead.lead_id,
      lead.id,
      lead.domain,
      lead.name,
    ].map(normalizeKey).filter(Boolean);

    return candidates.some((candidate) => keys.includes(candidate));
  }) || null;
}

function matchOpportunity(client, opportunities) {
  const keys = [client.client_id, client.merchant_shop].map(normalizeKey).filter(Boolean);
  return opportunities.find((opp) => keys.includes(normalizeKey(opp.client_id)) || keys.includes(normalizeKey(opp.unit_id))) || null;
}

function matchDelivery(client, deliveries) {
  const keys = [client.client_id, client.merchant_shop].map(normalizeKey).filter(Boolean);
  return deliveries.find((delivery) => keys.includes(normalizeKey(delivery.client_id)) || keys.includes(normalizeKey(delivery.unit_id))) || null;
}

function matchAction(client, actions, opportunity, delivery) {
  const keys = [
    client.client_id,
    client.merchant_shop,
    opportunity?.unit_id,
    delivery?.unit_id,
  ].map(normalizeKey).filter(Boolean);

  return actions.find((action) => {
    const actionKeys = [
      action.unit_id,
      ...(Array.isArray(action.linked_units) ? action.linked_units : []),
    ].map(normalizeKey).filter(Boolean);
    return actionKeys.some((candidate) => keys.includes(candidate));
  }) || null;
}

function matchShopifixerCommandCenter(client, commandCenter) {
  const clientKey = normalizeKey(client.client_id || client.merchant_shop);
  const ccMerchant = commandCenter?.merchant || {};
  const ccKey = normalizeKey(ccMerchant.client_id || ccMerchant.store || "");
  return ccKey && ccKey === clientKey ? commandCenter : null;
}

function matchAuditSurface(client, auditSurface) {
  const clientKey = normalizeKey(client.client_id || client.merchant_shop);
  const auditKey = normalizeKey(auditSurface?.client_id || auditSurface?.store_domain || "");
  return auditKey && auditKey === clientKey ? auditSurface : null;
}

function matchSendAuthority(client, sendAuthority) {
  const clientKey = normalizeKey(client.client_id || client.merchant_shop);
  const merchant = sendAuthority?.merchant_identity || {};
  const authKey = normalizeKey(merchant.client_id || merchant.merchant_shop || merchant.store_domain || "");
  return authKey && authKey === clientKey ? sendAuthority : null;
}

function normalizePaymentStatus(value) {
  const normalized = text(value);
  if (!normalized) return null;
  return normalized.toLowerCase();
}

function normalizeStage(stage) {
  return String(stage || "").trim().toLowerCase();
}

function scoreRecord(record) {
  const readiness = num(record?.readiness_score) ?? 0;
  const stage = normalizeStage(record?.current_stage);
  const stageBonus =
    stage === "offer_sent" ? 1000 :
    stage === "payment_received" ? 900 :
    stage === "completed" ? 800 :
    stage === "followup_sent" ? 700 :
    stage === "engaged" ? 600 :
    0;

  return stageBonus + readiness;
}

function selectActiveRecord(records) {
  if (!Array.isArray(records) || !records.length) return null;
  const ranked = records.slice().sort((a, b) => scoreRecord(b) - scoreRecord(a));
  return ranked[0] || null;
}

function deriveAuditStatus(client, lead, auditSurfaceMatch, commandCenterMatch) {
  if (auditSurfaceMatch || commandCenterMatch) return "complete";
  if (lead?.engagement?.audit_viewed || lead?.engagement?.experience_viewed) return "viewed";
  return text(client?.shopifixer?.audit_status) || "not_started";
}

function deriveOfferStatus(client, lead, commandCenterMatch) {
  if (commandCenterMatch) return "offer_sent";
  const sentByLead = lead?.engagement?.sent === true || (Array.isArray(client?.notes) && client.notes.some((note) => note?.type === "offer_sent"));
  return sentByLead ? "offer_sent" : "not_started";
}

function derivePaymentStatus(client, commandCenterMatch) {
  if (commandCenterMatch) return text(commandCenterMatch?.payment?.payment_status) || "waiting_for_payment";
  return normalizePaymentStatus(client?.deal?.payment_status) || "unavailable";
}

function deriveFulfillmentStatus(client, delivery, commandCenterMatch) {
  if (commandCenterMatch) return text(commandCenterMatch?.fulfillment?.fulfillment_status) || "waiting_for_payment";
  if (delivery) return text(delivery.status) || "not_started";
  return "not_started";
}

function deriveProofPackageStatus(delivery, commandCenterMatch) {
  if (commandCenterMatch) return text(commandCenterMatch?.fulfillment?.proof_status) || "not_started";
  if (delivery) return text(delivery.proof_status) || "not_started";
  return "not_started";
}

function deriveRevenueStatus(client) {
  if (client?.revenue?.shopifixer_collected === true) return "shopifixer_collected";
  if (normalizePaymentStatus(client?.deal?.payment_status) === "paid") return "shopifixer_collected";
  if (num(client?.abando?.merchant_revenue_recovered) > 0) return "abando_recovered_only";
  return "not_captured";
}

function deriveCaseStudyStatus(client, delivery) {
  if (client?.lifecycle?.stage === "case_study") return "candidate";
  if (delivery?.case_study_authorized === true) return "candidate";
  return "not_started";
}

function deriveBeforeAfterStatus(delivery, field) {
  if (!delivery) return "not_started";
  return text(delivery[field]) || "not_started";
}

function deriveReviewReferralStatus(delivery, field) {
  if (!delivery) return "not_started";
  if (delivery[field] === true) return "requested";
  return "not_started";
}

function deriveCurrentStage(client, lead, opportunity, delivery, commandCenterMatch) {
  if (commandCenterMatch) {
    return text(commandCenterMatch?.overall?.current_stage) || "unavailable";
  }

  return (
    stageFromClient(client) ||
    text(opportunity?.stage) ||
    text(delivery?.stage) ||
    "unavailable"
  );
}

function deriveNextAction(client, lead, opportunity, delivery, action, commandCenterMatch) {
  if (commandCenterMatch) {
    return text(commandCenterMatch?.overall?.next_required_action) || "unavailable";
  }

  return (
    text(client?.next_action?.instructions) ||
    text(opportunity?.next_action?.instructions) ||
    text(delivery?.next_action) ||
    text(action?.instructions) ||
    "unavailable"
  );
}

function deriveReadinessScore(client, lead, commandCenterMatch, currentStage) {
  if (commandCenterMatch) {
    return num(commandCenterMatch?.overall?.readiness_score) ?? 0;
  }

  const stageScore = stageReadinessScore(currentStage);
  const clientPriority = num(client?.priority_score?.total) ?? 0;
  return Math.max(stageScore, clientPriority);
}

function deriveLifecycleLane(record) {
  const auditComplete = text(record.audit_status) === "complete" || num(record?.audit?.score) !== null;
  const offerGenerated = auditComplete || ["offer_sent", "payment_received", "fulfillment_started", "proof_complete", "completed"].includes(normalizeStage(record.current_stage)) || text(record.offer_status) === "offer_sent";
  const conversionBriefGenerated = auditComplete || offerGenerated;
  const offerSent = text(record.offer_status) === "offer_sent" || ["offer_sent", "followup_sent", "payment_received", "fulfillment_started", "proof_complete", "completed"].includes(normalizeStage(record.current_stage));
  const paymentReceived = ["paid", "payment_received"].includes(normalizePaymentStatus(record.payment_status));
  const fulfillmentStarted = !["unavailable", "not_started", "waiting_for_payment", "unpaid"].includes(normalizeStage(record.fulfillment_status));
  const proofComplete = !["unavailable", "not_started", "pending"].includes(normalizeStage(record.proof_package_status));
  const completed = normalizeStage(record.current_stage) === "completed" || normalizeStage(record.case_study_status) === "completed";

  return {
    offer_generated: offerGenerated,
    audit_complete: auditComplete,
    conversion_brief_generated: conversionBriefGenerated,
    offer_sent: offerSent,
    payment_received: paymentReceived,
    fulfillment_started: fulfillmentStarted,
    proof_complete: proofComplete,
    completed,
  };
}

function buildFieldSources(client, lead, opportunity, delivery, action, commandCenterMatch, activeShopifixerMatch, currentStage) {
  const sources = {};

  sources.merchant_id = sourceNote("derived", "staffordos/clients/client_registry_v1.json", "client_id", "Client ID is the stable merchant identifier in the current merchant lifecycle read model.");
  sources.client_id = sourceNote("source", "staffordos/clients/client_registry_v1.json", "client_id");
  sources.merchant_shop = sourceNote("source", "staffordos/clients/client_registry_v1.json", "merchant_shop");
  sources.store_domain = sourceNote("source", "staffordos/clients/client_registry_v1.json", "merchant_shop", "Store domain is derived from the canonical client merchant shop.");
  sources.lead_id = lead
    ? sourceNote("source", "staffordos/leads/lead_registry_v1.json", "lead_id")
    : sourceNote("unavailable", "No lead matched by client_id / merchant_shop / store_domain.", null, null);
  sources.opportunity_id = opportunity
    ? sourceNote("source", "staffordos/units/opportunity_units_v1.json", "unit_id")
    : sourceNote("unavailable", "No matching opportunity unit found for this merchant.", null, null);
  sources.delivery_id = delivery
    ? sourceNote("source", "staffordos/units/delivery_units_v1.json", "unit_id")
    : sourceNote("unavailable", "No matching delivery unit found for this merchant.", null, null);
  sources.action_id = action
    ? sourceNote("source", "staffordos/units/action_units_v1.json", "unit_id")
    : sourceNote("unavailable", "No matching action unit found for this merchant.", null, null);
  sources.current_stage = commandCenterMatch
    ? sourceNote("source", "staffordos/shopifixer/shopifixer_command_center_v1.json", "overall.current_stage", "Active ShopiFixer command-center stage takes precedence for the current merchant.")
    : sourceNote("derived", "staffordos/clients/client_registry_v1.json", "lifecycle.stage + opportunity.stage + delivery.stage", "Current stage is projected from the canonical client registry with opportunity and delivery overlays.");
  sources.next_required_action = commandCenterMatch
    ? sourceNote("source", "staffordos/shopifixer/shopifixer_command_center_v1.json", "overall.next_required_action", "Active ShopiFixer command-center next action takes precedence.")
    : sourceNote("derived", "staffordos/clients/client_registry_v1.json", "next_action.instructions + opportunity.next_action.instructions + delivery.next_action + action.instructions", "Next action is projected from the canonical client registry with opportunity, delivery, and action overlays.");
  sources.readiness_score = commandCenterMatch
    ? sourceNote("source", "staffordos/shopifixer/shopifixer_command_center_v1.json", "overall.readiness_score", "Runtime readiness from the active ShopiFixer command center.")
    : sourceNote("derived", "staffordos/clients/client_registry_v1.json", "priority_score.total + lifecycle.stage", "Readiness is derived from canonical client priority and lifecycle truth.");
  sources.lead_status = lead
    ? sourceNote("source", "staffordos/leads/lead_registry_v1.json", "status.current_stage / lifecycle_stage")
    : sourceNote("unavailable", "No lead truth exists for this merchant.", null, null);
  sources.qualification_status = client?.qualification_status
    ? sourceNote("source", "staffordos/clients/client_registry_v1.json", "qualification_status")
    : lead?.qualification_status
      ? sourceNote("source", "staffordos/leads/lead_registry_v1.json", "qualification_status", "Qualification provenance falls back to lead truth when client provenance is absent.")
      : sourceNote("unavailable", "No qualification truth exists for this merchant.", null, null);
  sources.qualification_reason = client?.qualification_reason
    ? sourceNote("source", "staffordos/clients/client_registry_v1.json", "qualification_reason")
    : lead?.qualification_reason
      ? sourceNote("source", "staffordos/leads/lead_registry_v1.json", "qualification_reason", "Qualification reason falls back to lead truth when client provenance is absent.")
      : sourceNote("unavailable", "No qualification reason exists for this merchant.", null, null);
  sources.qualification_source = client?.qualification_source
    ? sourceNote("source", "staffordos/clients/client_registry_v1.json", "qualification_source")
    : lead?.qualification_source
      ? sourceNote("source", "staffordos/leads/lead_registry_v1.json", "qualification_source", "Qualification source falls back to lead truth when client provenance is absent.")
      : sourceNote("unavailable", "No qualification source exists for this merchant.", null, null);
  sources.qualification_updated_at = client?.qualification_updated_at
    ? sourceNote("source", "staffordos/clients/client_registry_v1.json", "qualification_updated_at")
    : lead?.qualification_updated_at
      ? sourceNote("source", "staffordos/leads/lead_registry_v1.json", "qualification_updated_at", "Qualification timestamp falls back to lead truth when client provenance is absent.")
      : sourceNote("unavailable", "No qualification timestamp exists for this merchant.", null, null);
  sources.audit_status = commandCenterMatch
    ? sourceNote("source", "staffordos/shopifixer/shopifixer_command_center_v1.json", "audit.score", "Active ShopiFixer command center implies audit completion.")
    : sourceNote("derived", "staffordos/leads/lead_registry_v1.json", "engagement.audit_viewed / engagement.experience_viewed", "Audit state is derived from lead engagement flags when present.");
  sources.offer_status = commandCenterMatch
    ? sourceNote("source", "staffordos/shopifixer/shopifixer_command_center_v1.json", "offer.offer_status", "Active ShopiFixer command center carries the current offer state for the current merchant.")
    : sourceNote("derived", "staffordos/leads/lead_registry_v1.json", "engagement.sent / notes[].type", "Offer state is derived from lead engagement and proof notes.");
  sources.payment_status = commandCenterMatch
    ? sourceNote("source", "staffordos/shopifixer/shopifixer_command_center_v1.json", "payment.payment_status", "Active ShopiFixer command center carries the current payment state for the current merchant.")
    : sourceNote("source", "staffordos/clients/client_registry_v1.json", "deal.payment_status");
  sources.fulfillment_status = delivery
    ? sourceNote("source", "staffordos/units/delivery_units_v1.json", "status / stage")
    : commandCenterMatch
      ? sourceNote("source", "staffordos/shopifixer/shopifixer_command_center_v1.json", "fulfillment.fulfillment_status")
      : sourceNote("derived", "staffordos/clients/client_registry_v1.json", "shopifixer.fix_status", "No delivery unit exists, so fulfillment is not started.");
  sources.proof_package_status = delivery
    ? sourceNote("source", "staffordos/units/delivery_units_v1.json", "proof_status")
    : commandCenterMatch
      ? sourceNote("source", "staffordos/shopifixer/shopifixer_command_center_v1.json", "fulfillment.proof_status")
      : sourceNote("derived", "staffordos/clients/client_registry_v1.json", "shopifixer.fix_status", "No proof package has been produced yet.");
  sources.revenue_status = sourceNote("derived", "staffordos/clients/client_registry_v1.json", "revenue + deal.payment_status + abando.merchant_revenue_recovered", "Revenue state is derived from client revenue and payment truth.");
  sources.case_study_status = sourceNote("derived", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].case_study_status / review_status / referral_status", "Case-study readiness is not yet proven.");
  sources.before_evidence_status = delivery
    ? sourceNote("source", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].before_evidence_status")
    : sourceNote("derived", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].before_evidence_status", "No delivery has started, so before evidence is not started.");
  sources.after_evidence_status = delivery
    ? sourceNote("source", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].after_evidence_status")
    : sourceNote("derived", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].after_evidence_status", "No delivery has started, so after evidence is not started.");
  sources.review_status = delivery
    ? sourceNote("source", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].review_status")
    : sourceNote("derived", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].review_status", "No review request is currently proven.");
  sources.referral_status = delivery
    ? sourceNote("source", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].referral_status")
    : sourceNote("derived", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].referral_status", "No referral request is currently proven.");
  sources.offer_price = sourceNote("source", "staffordos/units/opportunity_units_v1.json", "value.one_time", "ShopiFixer canonical price is $950 for the current product path.");
  sources.payment_amount = commandCenterMatch
    ? sourceNote("unavailable", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].amount", "No verified payment amount exists yet for the active merchant.", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].amount")
    : sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "deal.value", "No verified paid amount exists yet for this merchant.");
  sources.payment_currency = sourceNote("source", "staffordos/clients/client_registry_v1.json", "deal.currency");
  sources.lifetime_value = sourceNote("source", "staffordos/clients/client_registry_v1.json", "business.lifetime_value");
  sources.reservation_id = sourceNote("source", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].reservation_id", "Reservation lineage is materialized from the fulfillment truth.");
  sources["audit.score"] = activeShopifixerMatch
    ? sourceNote("source", "staffordos/audit/audit_result_surface.json", "audit_score", "ShopiFixer audit score is materialized from the audit result surface.")
    : sourceNote("unavailable", "staffordos/audit/audit_result_surface.json", "audit_score", "No ShopiFixer audit surface is available for this merchant.");
  sources["audit.top_issue"] = activeShopifixerMatch
    ? sourceNote("source", "staffordos/audit/audit_result_surface.json", "top_issue", "ShopiFixer top issue is materialized from the audit result surface.")
    : sourceNote("unavailable", "staffordos/audit/audit_result_surface.json", "top_issue", "No ShopiFixer audit surface is available for this merchant.");
  sources["audit.recommendation"] = activeShopifixerMatch
    ? sourceNote("source", "staffordos/audit/audit_result_surface.json", "fix_recommendation", "ShopiFixer fix recommendation is materialized from the audit result surface.")
    : sourceNote("unavailable", "staffordos/audit/audit_result_surface.json", "fix_recommendation", "No ShopiFixer audit surface is available for this merchant.");
  sources["offer.send_allowed"] = activeShopifixerMatch
    ? sourceNote("source", "staffordos/shopifixer/shopifixer_send_authority_v1.json", "send_allowed", "ShopiFixer send eligibility is materialized from the send authority.")
    : sourceNote("unavailable", "staffordos/shopifixer/shopifixer_send_authority_v1.json", "send_allowed", "No send authority applies to this merchant.");
  sources["payment.readiness"] = activeShopifixerMatch
    ? sourceNote("derivable", "staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json", "final_verdict", "Runtime payment readiness is derived from the verified payment path verdict.")
    : sourceNote("unavailable", "staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json", "final_verdict", "No runtime payment readiness verdict applies to this merchant.");
  sources["fulfillment.execution_status"] = activeShopifixerMatch
    ? sourceNote("source", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].execution_status", "Fulfillment execution status is materialized from the fulfillment truth.")
    : sourceNote("unavailable", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].execution_status", "No fulfillment truth applies to this merchant.");
  sources["fulfillment.proof_status"] = activeShopifixerMatch
    ? sourceNote("source", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].proof_status", "Proof status is materialized from the fulfillment truth.")
    : sourceNote("unavailable", "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", "items[0].proof_status", "No fulfillment proof status applies to this merchant.");
  sources["lifecycle_lane.offer_generated"] = sourceNote("derived", "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json", "audit_status + offer_status + current_stage", "Offer generation is derived in the registry materialization.");
  sources["lifecycle_lane.audit_complete"] = sourceNote("derived", "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json", "audit_status + audit.score", "Audit lane state is derived in the registry materialization.");
  sources["lifecycle_lane.conversion_brief_generated"] = sourceNote("derived", "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json", "audit_status + audit.score", "Conversion brief lane state is derived in the registry materialization.");
  sources["lifecycle_lane.offer_sent"] = sourceNote("derived", "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json", "offer_status + current_stage", "Offer lane state is derived in the registry materialization.");
  sources["lifecycle_lane.payment_received"] = sourceNote("derived", "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json", "payment_status", "Payment lane state is derived in the registry materialization.");
  sources["lifecycle_lane.fulfillment_started"] = sourceNote("derived", "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json", "fulfillment_status", "Fulfillment lane state is derived in the registry materialization.");
  sources["lifecycle_lane.proof_complete"] = sourceNote("derived", "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json", "proof_package_status", "Proof lane state is derived in the registry materialization.");
  sources["lifecycle_lane.completed"] = sourceNote("derived", "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json", "current_stage + case_study_status", "Completion lane state is derived in the registry materialization.");

  return sources;
}

function buildMerchantRecord(client, leadRegistry, opportunities, deliveries, actions, revenueTruth, commandCenter) {
  const lead = matchLead(client, leadRegistry);
  const opportunity = matchOpportunity(client, opportunities);
  const delivery = matchDelivery(client, deliveries);
  const action = matchAction(client, actions, opportunity, delivery);
  const commandCenterMatch = matchShopifixerCommandCenter(client, commandCenter);
  const auditSurface = readJson("staffordos/audit/audit_result_surface.json", {});
  const sendAuthority = readJson("staffordos/shopifixer/shopifixer_send_authority_v1.json", {});
  const runtimePaymentVerification = readJson("staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json", {});
  const fulfillmentTruth = readJson("staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", { items: [] });
  const auditSurfaceMatch = matchAuditSurface(client, auditSurface);
  const sendAuthorityMatch = matchSendAuthority(client, sendAuthority);
  const activeShopifixerMatch = commandCenterMatch || auditSurfaceMatch || sendAuthorityMatch;

  const currentStage = deriveCurrentStage(client, lead, opportunity, delivery, commandCenterMatch);
  const nextRequiredAction = deriveNextAction(client, lead, opportunity, delivery, action, commandCenterMatch);
  const readinessScore = deriveReadinessScore(client, lead, commandCenterMatch, currentStage);

  const merchantId = text(client.client_id || client.merchant_shop);
  const clientId = text(client.client_id || client.merchant_shop);
  const merchantShop = text(client.merchant_shop || client.client_id);
  const storeDomain = merchantShop;
  const leadId = lead ? text(lead.lead_id || lead.id) : null;
  const opportunityId = opportunity ? text(opportunity.unit_id) : null;
  const deliveryId = delivery ? text(delivery.unit_id) : null;
  const actionId = action ? text(action.unit_id) : null;
  const qualificationStatus = text(client?.qualification_status) || text(lead?.qualification_status) || null;
  const qualificationReason = text(client?.qualification_reason) || text(lead?.qualification_reason) || null;
  const qualificationSource = text(client?.qualification_source) || text(lead?.qualification_source) || null;
  const qualificationUpdatedAt = text(client?.qualification_updated_at) || text(lead?.qualification_updated_at) || null;

  const leadStatus = lead ? stageFromLead(lead) : null;
  const auditStatus = deriveAuditStatus(client, lead, auditSurfaceMatch, commandCenterMatch);
  const offerStatus = deriveOfferStatus(client, lead, commandCenterMatch);
  const paymentStatus = derivePaymentStatus(client, commandCenterMatch);
  const fulfillmentStatus = deriveFulfillmentStatus(client, delivery, commandCenterMatch);
  const proofPackageStatus = deriveProofPackageStatus(delivery, commandCenterMatch);
  const revenueStatus = deriveRevenueStatus(client);
  const caseStudyStatus = deriveCaseStudyStatus(client, delivery);
  const beforeEvidenceStatus = deriveBeforeAfterStatus(delivery, "before_evidence_status");
  const afterEvidenceStatus = deriveBeforeAfterStatus(delivery, "after_evidence_status");
  const reviewStatus = delivery ? text(delivery.review_status) || (delivery.review_requested ? "requested" : "not_started") : "not_started";
  const referralStatus = delivery ? text(delivery.referral_status) || (delivery.referral_requested ? "requested" : "not_started") : "not_started";
  const offerPrice = 950;
  const paymentAmount = paymentStatus === "paid" || paymentStatus === "payment_received"
    ? num(client.deal?.value) || num(opportunity?.value?.one_time) || null
    : null;
  const paymentCurrency = text(client.deal?.currency || opportunity?.value?.currency || "USD") || "USD";
  const lifetimeValue = num(client.business?.lifetime_value ?? client.revenue?.total_lifetime_value) ?? 0;
  const auditScore = activeShopifixerMatch ? num(auditSurface?.audit_score) : null;
  const auditTopIssue = activeShopifixerMatch ? text(auditSurface?.top_issue) : null;
  const auditRecommendation = activeShopifixerMatch ? text(auditSurface?.fix_recommendation) : null;
  const sendAllowed = activeShopifixerMatch ? Boolean(sendAuthority?.send_allowed) : null;
  const paymentReadiness = activeShopifixerMatch ? text(runtimePaymentVerification?.final_verdict) || null : null;
  const fulfillmentExecutionStatus = activeShopifixerMatch ? text(fulfillmentTruth?.items?.[0]?.execution_status) || null : null;
  const fulfillmentProofStatus = activeShopifixerMatch ? text(fulfillmentTruth?.items?.[0]?.proof_status) || null : null;
  const reservationId = text(fulfillmentTruth?.items?.[0]?.reservation_id) || null;
  const lifecycleLane = deriveLifecycleLane({
    audit_status: auditStatus,
    audit: {
      score: auditScore,
    },
    offer_status: offerStatus,
    payment_status: paymentStatus,
    fulfillment_status: fulfillmentStatus,
    proof_package_status: proofPackageStatus,
    current_stage: currentStage,
    case_study_status: caseStudyStatus,
  });

  const record = {
    merchant_id: merchantId,
    client_id: clientId,
    merchant_shop: merchantShop,
    store_domain: storeDomain,
    lead_id: leadId,
    opportunity_id: opportunityId,
    delivery_id: deliveryId,
    action_id: actionId,
    current_stage: currentStage,
    next_required_action: nextRequiredAction,
    readiness_score: readinessScore,
    reservation_id: reservationId,
    lead_status: leadStatus,
    qualification_status: qualificationStatus,
    qualification_reason: qualificationReason,
    qualification_source: qualificationSource,
    qualification_updated_at: qualificationUpdatedAt,
    audit_status: auditStatus,
    offer_status: offerStatus,
    payment_status: paymentStatus,
    fulfillment_status: fulfillmentStatus,
    proof_package_status: proofPackageStatus,
    revenue_status: revenueStatus,
    case_study_status: caseStudyStatus,
    before_evidence_status: beforeEvidenceStatus,
    after_evidence_status: afterEvidenceStatus,
    review_status: reviewStatus,
    referral_status: referralStatus,
    offer_price: offerPrice,
    payment_amount: paymentAmount,
    payment_currency: paymentCurrency,
    lifetime_value: lifetimeValue,
    audit: {
      score: auditScore,
      top_issue: auditTopIssue,
      recommendation: auditRecommendation,
    },
    offer: {
      send_allowed: sendAllowed,
    },
    payment: {
      readiness: paymentReadiness,
    },
    fulfillment: {
      execution_status: fulfillmentExecutionStatus,
      proof_status: fulfillmentProofStatus,
    },
    lifecycle_lane: lifecycleLane,
    source_files: INPUT_FILES.slice(),
    field_sources: {},
    unavailable_fields: [],
  };

  const fieldSources = buildFieldSources(client, lead, opportunity, delivery, action, commandCenterMatch, activeShopifixerMatch, currentStage);
  record.field_sources = fieldSources;

  const unavailableFields = [];

  function maybeUnavailable(field, value, reason, sourceFile = null, sourceField = null) {
    if (value !== null && value !== undefined && value !== "") return;
    unavailableFields.push(unavailable(field, reason, sourceFile, sourceField));
  }

  maybeUnavailable("lead_id", leadId, "No matching lead could be proven for this merchant.");
  maybeUnavailable("opportunity_id", opportunityId, "No matching opportunity unit could be proven for this merchant.");
  maybeUnavailable("delivery_id", deliveryId, "No matching delivery unit could be proven for this merchant.");
  maybeUnavailable("action_id", actionId, "No matching action unit could be proven for this merchant.");
  maybeUnavailable("audit.score", auditScore, "No ShopiFixer audit score is available for this merchant.");
  maybeUnavailable("audit.top_issue", auditTopIssue, "No ShopiFixer audit issue statement is available for this merchant.");
  maybeUnavailable("audit.recommendation", auditRecommendation, "No ShopiFixer audit recommendation is available for this merchant.");
  maybeUnavailable("offer.send_allowed", sendAllowed, "No ShopiFixer send authority is available for this merchant.");
  maybeUnavailable("payment.readiness", paymentReadiness, "No runtime payment readiness verdict is available for this merchant.");
  maybeUnavailable("fulfillment.execution_status", fulfillmentExecutionStatus, "No fulfillment execution status is available for this merchant.");
  maybeUnavailable("fulfillment.proof_status", fulfillmentProofStatus, "No fulfillment proof status is available for this merchant.");

  if (!leadId) {
    maybeUnavailable("lead_status", leadStatus, "No lead row exists for this merchant.");
  }
  if (paymentStatus !== "paid" && paymentStatus !== "payment_received") {
    maybeUnavailable("payment_amount", paymentAmount, "No payment is verified yet.");
    maybeUnavailable("payment_received_at", null, "No verified payment receipt timestamp exists yet.");
  }

  record.unavailable_fields = unavailableFields;

  return record;
}

function buildRegistry() {
  const clientRegistry = readJson("staffordos/clients/client_registry_v1.json", { clients: [] });
  const leadRegistry = readJson("staffordos/leads/lead_registry_v1.json", { items: [] });
  const opportunityUnits = readJson("staffordos/units/opportunity_units_v1.json", { units: [] });
  const deliveryUnits = readJson("staffordos/units/delivery_units_v1.json", { units: [] });
  const actionUnits = readJson("staffordos/units/action_units_v1.json", { units: [] });
  const revenueTruth = readJson("staffordos/revenue/revenue_truth_v1.json", {});
  const commandCenter = readJson("staffordos/shopifixer/shopifixer_command_center_v1.json", {});
  readJson("staffordos/audit/audit_result_surface.json", {});
  readJson("staffordos/shopifixer/shopifixer_send_authority_v1.json", {});
  readJson("staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json", {});
  readJson("staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json", {});

  const clients = Array.isArray(clientRegistry.clients) ? clientRegistry.clients : [];
  const leadItems = Array.isArray(leadRegistry.items) ? leadRegistry.items : [];
  const opportunities = Array.isArray(opportunityUnits.units) ? opportunityUnits.units : [];
  const deliveries = Array.isArray(deliveryUnits.units) ? deliveryUnits.units : [];
  const actions = Array.isArray(actionUnits.units) ? actionUnits.units : [];

  const records = clients
    .slice()
    .sort((a, b) => String(a.client_id || "").localeCompare(String(b.client_id || "")))
    .map((client) => buildMerchantRecord(client, leadItems, opportunities, deliveries, actions, revenueTruth, commandCenter));
  const activeRecord = selectActiveRecord(records);

  const summary = {
    records: records.length,
    current_stage_counts: records.reduce((acc, record) => {
      const key = record.current_stage || "unavailable";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    payment_status_counts: records.reduce((acc, record) => {
      const key = record.payment_status || "unavailable";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    records_with_payment_amount: records.filter((record) => record.payment_amount !== null && record.payment_amount !== undefined).length,
    records_with_lead_truth: records.filter((record) => record.lead_id).length,
    records_with_opportunity_truth: records.filter((record) => record.opportunity_id).length,
    records_with_delivery_truth: records.filter((record) => record.delivery_id).length,
  };

  return {
    schema: "staffordos.merchant_lifecycle_registry.v1",
    generated_at: new Date().toISOString(),
    active_record_selection: activeRecord
      ? {
          merchant_id: activeRecord.merchant_id,
          client_id: activeRecord.client_id,
          merchant_shop: activeRecord.merchant_shop,
          store_domain: activeRecord.store_domain,
          current_stage: activeRecord.current_stage,
          readiness_score: activeRecord.readiness_score,
          reservation_id: activeRecord.reservation_id,
          selection_source: "precomputed_in_builder",
        }
      : {
          merchant_id: null,
          client_id: null,
          merchant_shop: null,
          store_domain: null,
          current_stage: null,
          readiness_score: 0,
          reservation_id: null,
          selection_source: "none",
        },
    source_files: INPUT_FILES.slice(),
    summary,
    records,
  };
}

function renderMarkdown(registry) {
  const lines = [];
  lines.push("# Merchant Lifecycle Registry");
  lines.push("");
  lines.push(`Generated: ${registry.generated_at}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Records: ${registry.summary.records}`);
  lines.push(`- Lead-linked records: ${registry.summary.records_with_lead_truth}`);
  lines.push(`- Opportunity-linked records: ${registry.summary.records_with_opportunity_truth}`);
  lines.push(`- Delivery-linked records: ${registry.summary.records_with_delivery_truth}`);
  lines.push(`- Active merchant: ${registry.active_record_selection?.merchant_id || "unavailable"}`);
  lines.push("");
  lines.push("## ShopiFixer Panel Fields");
  lines.push("");
  lines.push("- audit.score");
  lines.push("- audit.top_issue");
  lines.push("- audit.recommendation");
  lines.push("- offer.send_allowed");
  lines.push("- payment.readiness");
  lines.push("- fulfillment.execution_status");
  lines.push("- fulfillment.proof_status");
  lines.push("- lifecycle_lane.audit_complete");
  lines.push("- lifecycle_lane.conversion_brief_generated");
  lines.push("- lifecycle_lane.offer_sent");
  lines.push("- lifecycle_lane.payment_received");
  lines.push("- lifecycle_lane.fulfillment_started");
  lines.push("- lifecycle_lane.proof_complete");
  lines.push("- lifecycle_lane.completed");
  lines.push("");
  lines.push("## Records");
  lines.push("");
  lines.push("| Merchant | Current stage | Next action | Readiness | Lead | Opportunity | Delivery | Action |");
  lines.push("| --- | --- | --- | ---: | --- | --- | --- | --- |");

  for (const record of registry.records) {
    lines.push(
      `| ${record.merchant_id} | ${record.current_stage} | ${record.next_required_action} | ${record.readiness_score} | ${record.lead_id || "unavailable"} | ${record.opportunity_id || "unavailable"} | ${record.delivery_id || "unavailable"} | ${record.action_id || "unavailable"} |`
    );
  }

  lines.push("");
  lines.push("## Unavailable Fields");
  lines.push("");

  for (const record of registry.records) {
    lines.push(`### ${record.merchant_id}`);
    if (!record.unavailable_fields.length) {
      lines.push("- None");
    } else {
      for (const field of record.unavailable_fields) {
        lines.push(`- ${field.field}: ${field.reason}`);
      }
    }
    lines.push("");
  }

  lines.push("## Source Files");
  lines.push("");
  for (const file of registry.source_files) {
    lines.push(`- \`${file}\``);
  }
  lines.push("");

  return lines.join("\n");
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const registry = buildRegistry();
  writeFileSync(OUT_JSON, JSON.stringify(registry, null, 2) + "\n");
  writeFileSync(OUT_MD, renderMarkdown(registry) + "\n");
  console.log(JSON.stringify({
    schema: registry.schema,
    generated_at: registry.generated_at,
    record_count: registry.records.length,
    output_json: OUT_JSON,
    output_md: OUT_MD,
  }, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith("build_merchant_lifecycle_registry_v1.mjs")) {
  main();
}

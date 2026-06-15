#!/usr/bin/env node

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const OUTPUT_PATH = resolve(REPO_ROOT, "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json");

const INPUT_FILES = [
  {
    file: "SHOPIFIXER_FULFILLMENT_SCHEMA_DRAFT.md",
    role: "schema_draft",
  },
  {
    file: "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md",
    role: "fulfillment_authority",
  },
  {
    file: "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md",
    role: "fulfillment_packet_template",
  },
  {
    file: "staffordos/governance/shopifixer_fulfillment_truth_audit/shopifixer_fulfillment_truth_audit_v1.md",
    role: "truth_audit",
  },
  {
    file: "staffordos/units/delivery_units_v1.json",
    role: "delivery_units_source",
  },
  {
    file: "staffordos/clients/client_registry_v1.json",
    role: "client_registry_source",
  },
  {
    file: "staffordos/snapshots/unit_work_snapshot_v1.json",
    role: "unit_work_snapshot_source",
  },
];

function abs(relPath) {
  return resolve(REPO_ROOT, relPath);
}

function now() {
  return new Date().toISOString();
}

function readJson(relPath, fallback) {
  const filePath = abs(relPath);
  try {
    const raw = readFileSync(filePath, "utf8");
    return {
      value: JSON.parse(raw),
      exists: true,
      status: "loaded",
      updated_at: statSync(filePath).mtime.toISOString(),
      file: relPath,
    };
  } catch (error) {
    return {
      value: fallback,
      exists: false,
      status: "missing_or_unreadable",
      updated_at: null,
      file: relPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function sourceFileRecord(file, role) {
  const filePath = abs(file);
  try {
    const stats = statSync(filePath);
    return {
      file,
      role,
      exists: true,
      status: "loaded",
      updated_at: stats.mtime.toISOString(),
    };
  } catch {
    return {
      file,
      role,
      exists: false,
      status: "missing",
      updated_at: null,
    };
  }
}

function text(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isPaidLike(status) {
  return [
    "paid",
    "payment_received",
    "collected",
    "completed",
    "complete",
    "succeeded",
    "settled",
  ].includes(String(status || "").toLowerCase());
}

function isDirectRun() {
  return Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

function sourceNote(status, source_file, source_field, note = null) {
  return {
    status,
    source_file,
    source_field,
    note,
  };
}

function unavailableField(field, reason, source_file, source_field) {
  return {
    field,
    status: "unavailable",
    reason,
    source_file,
    source_field,
  };
}

function buildItem({ unit, client, openWork, sourceFiles }) {
  const paymentReceived = isPaidLike(client?.deal?.payment_status);
  const paymentStatus = paymentReceived
    ? "payment_received"
    : text(unit.status) || "waiting_for_payment";
  const fulfillmentStatus = paymentReceived
    ? "payment_received"
    : text(unit.status) || "waiting_for_payment";
  const executionStatus = paymentReceived
    ? "not_started"
    : text(unit.status) === "active"
      ? "in_progress"
      : "not_started";
  const proofStatus = text(unit.proof_status) || "unavailable";
  const completionStatus =
    executionStatus === "in_progress" && proofStatus === "complete"
      ? "complete"
      : "not_started";

  const merchantShop = text(client?.merchant_shop || client?.client_id || unit.client_id);
  const storeUrl = merchantShop ? `https://${merchantShop}` : null;

  const itemUnavailableFields = [
    ...(merchantShop ? [] : [
      unavailableField(
        "store_domain",
        "No merchant shop could be proven from the source truth.",
        "staffordos/clients/client_registry_v1.json",
        "merchant_shop",
      ),
    ]),
    unavailableField(
      "merchant_name",
      "No merchant name is represented in the source truth.",
      "staffordos/clients/client_registry_v1.json",
      "merchant_name",
    ),
    unavailableField(
      "packet_id",
      "No canonical fulfillment packet has been bound to this fulfillment record yet.",
      "staffordos/units/delivery_units_v1.json",
      "packet_id",
    ),
    unavailableField(
      "paid_at",
      "No verified paid fulfillment exists yet.",
      "staffordos/clients/client_registry_v1.json",
      "deal.closed_at",
    ),
    unavailableField(
      "amount",
      "No verified paid amount exists yet.",
      "staffordos/clients/client_registry_v1.json",
      "deal.value",
    ),
    unavailableField(
      "payment_verified_source",
      "No verified payment source exists because the fulfillment has not been paid.",
      "staffordos/clients/client_registry_v1.json",
      "deal.payment_status",
    ),
    unavailableField(
      "client_approval_status",
      "No client approval state is represented in the current source truth.",
      "staffordos/clients/client_registry_v1.json",
      "not_available",
    ),
    unavailableField(
      "review_status",
      "No review status is represented in the current source truth.",
      "staffordos/clients/client_registry_v1.json",
      "not_available",
    ),
    unavailableField(
      "referral_status",
      "No referral status is represented in the current source truth.",
      "staffordos/clients/client_registry_v1.json",
      "not_available",
    ),
    unavailableField(
      "case_study_status",
      "No case study status is represented in the current source truth.",
      "staffordos/clients/client_registry_v1.json",
      "not_available",
    ),
    unavailableField(
      "affected_page_url",
      "No affected page URL is proven in the current source truth.",
      "staffordos/clients/client_registry_v1.json",
      "shopifixer.primary_problem",
    ),
    unavailableField(
      "observed_friction",
      "No observed friction statement is proven in the current source truth.",
      "staffordos/clients/client_registry_v1.json",
      "shopifixer.primary_problem",
    ),
    unavailableField(
      "why_it_matters",
      "No merchant-facing business rationale is proven in the current source truth.",
      "staffordos/clients/client_registry_v1.json",
      "shopifixer.primary_problem",
    ),
    unavailableField(
      "expected_improvement_category",
      "No improvement category is proven in the current source truth.",
      "staffordos/clients/client_registry_v1.json",
      "shopifixer.primary_problem",
    ),
    unavailableField(
      "scoped_fix",
      "No scoped fix is proven in the current source truth.",
      "staffordos/clients/client_registry_v1.json",
      "shopifixer.primary_problem",
    ),
    unavailableField(
      "merchant_approval_needed",
      "No merchant approval requirement is proven in the current source truth.",
      "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md",
      "Merchant Approval Needed?",
    ),
    unavailableField(
      "before_screenshot",
      "No before screenshot is represented in the current source truth.",
      "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md",
      "Before-State Evidence",
    ),
    unavailableField(
      "before_notes",
      "No before notes are represented in the current source truth.",
      "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md",
      "Before-State Evidence",
    ),
    unavailableField(
      "fix_started_at",
      "No fulfillment execution has started yet.",
      "staffordos/units/delivery_units_v1.json",
      "status",
    ),
    unavailableField(
      "change_made",
      "No execution change is represented in the current source truth.",
      "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md",
      "Execution Notes",
    ),
    unavailableField(
      "location_changed",
      "No execution location is represented in the current source truth.",
      "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md",
      "Execution Notes",
    ),
    unavailableField(
      "implementation_notes",
      "No implementation notes are represented in the current source truth.",
      "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md",
      "Execution Notes",
    ),
    unavailableField(
      "fix_completed_at",
      "No fulfillment completion timestamp exists yet.",
      "staffordos/clients/client_registry_v1.json",
      "shopifixer.fix_status",
    ),
    unavailableField(
      "after_screenshot",
      "No after screenshot is represented in the current source truth.",
      "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md",
      "After-State Evidence",
    ),
    unavailableField(
      "after_notes",
      "No after notes are represented in the current source truth.",
      "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md",
      "After-State Evidence",
    ),
    unavailableField(
      "proof_package_location",
      "No proof package artifact exists yet.",
      "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md",
      "Merchant-Facing Proof Summary",
    ),
    unavailableField(
      "merchant_facing_summary",
      "No merchant-facing proof summary exists yet.",
      "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md",
      "Merchant-Facing Proof Package",
    ),
    unavailableField(
      "completed_at",
      "No completion timestamp exists yet.",
      "staffordos/clients/client_registry_v1.json",
      "shopifixer.fix_status",
    ),
  ];

  const fulfillment = {
    fulfillment_id: unit.unit_id,
    packet_id: null,
    reservation_id: text(client?.deal?.reservation_id) || null,
    client_id: text(unit.client_id) || text(client?.client_id) || null,
    store_domain: merchantShop,
    merchant_name: null,
    opportunity_ref: text(unit.opportunity_ref),
    delivery_unit_ref: text(unit.unit_id),
    payment_status: paymentStatus,
    payment_verified_source: null,
    paid_at: null,
    amount: null,
    currency: text(client?.deal?.currency || client?.revenue?.currency || "USD") || "USD",
    fulfillment_status: fulfillmentStatus,
    execution_status: executionStatus,
    proof_status: proofStatus,
    completion_status: completionStatus,
    client_approval_status: null,
    review_status: null,
    referral_status: null,
    case_study_status: null,
    store_url: storeUrl,
    affected_page_url: null,
    observed_friction: null,
    why_it_matters: null,
    expected_improvement_category: null,
    scoped_fix: null,
    in_scope: [],
    out_of_scope: [],
    merchant_approval_needed: null,
    before_evidence_status: proofStatus === "not_started" ? "not_started" : "unavailable",
    before_screenshot: null,
    before_notes: null,
    risk_or_limitation: text(openWork?.next_action) || "Wait for payment or follow up before starting fix delivery.",
    fix_started_at: null,
    change_made: null,
    location_changed: null,
    implementation_notes: null,
    fix_completed_at: null,
    after_evidence_status: proofStatus === "complete" ? "available" : "not_started",
    after_screenshot: null,
    after_notes: null,
    remaining_limitations: text(openWork?.next_action) || "Wait for payment or follow up before starting fix delivery.",
    proof_package_status: proofStatus === "complete" ? "complete" : "not_started",
    proof_package_location: null,
    merchant_facing_summary: null,
    recommended_next_watch_item: text(openWork?.next_action) || text(unit.next_action),
    scoped_issue_addressed: false,
    before_evidence_captured: false,
    after_evidence_captured: false,
    merchant_proof_package_ready: false,
    execution_complete: false,
    proof_complete: false,
    completion_complete: false,
    completed_at: null,
    review_requested: false,
    review_received: false,
    referral_requested: false,
    referral_received: false,
    case_study_authorized: false,
    source_files: sourceFiles,
    field_sources: {
      fulfillment_id: sourceNote("source", "staffordos/units/delivery_units_v1.json", "units[].unit_id", "Canonical fulfillment items are built from ShopiFixer client_fix delivery units."),
      packet_id: sourceNote("unavailable", "staffordos/units/delivery_units_v1.json", "packet_id", "No canonical fulfillment packet is bound yet."),
      reservation_id: sourceNote("source", "staffordos/clients/client_registry_v1.json", "deal.reservation_id", "Reservation lineage is preserved from verified Stripe payment into client truth."),
      client_id: sourceNote("source", "staffordos/units/delivery_units_v1.json", "units[].client_id", "Delivery unit client binding is the canonical client key."),
      store_domain: sourceNote("source", "staffordos/clients/client_registry_v1.json", "merchant_shop", "Merchant shop is the best available store-domain truth."),
      merchant_name: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "merchant_name", "No merchant name is represented in current truth."),
      opportunity_ref: sourceNote("source", "staffordos/units/delivery_units_v1.json", "units[].opportunity_ref", "Delivery unit opportunity binding is preserved."),
      delivery_unit_ref: sourceNote("source", "staffordos/units/delivery_units_v1.json", "units[].unit_id", "Delivery unit id is the fulfillment unit key."),
      payment_status: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].status + staffordos/clients/client_registry_v1.json: deal.payment_status", "Delivery unit status is the source truth; client registry payment values are used to upgrade to payment_received when verified."),
      payment_verified_source: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "deal.payment_status", "No verified payment exists yet."),
      paid_at: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "deal.closed_at", "No verified payment timestamp exists yet."),
      amount: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "deal.value", "No verified paid amount exists yet."),
      currency: sourceNote("source", "staffordos/clients/client_registry_v1.json", "deal.currency", "Client registry currency is the best available monetary currency."),
      fulfillment_status: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].status + client_registry_v1.json: deal.payment_status", "Delivery unit status is upgraded to payment_received when verified payment exists."),
      execution_status: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].status + units[].stage", "Execution is derived from the delivery unit current state."),
      proof_status: sourceNote("source", "staffordos/units/delivery_units_v1.json", "units[].proof_status", "Proof status comes directly from delivery unit truth."),
      completion_status: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].status + units[].proof_status", "Completion is derived from execution and proof state."),
      client_approval_status: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "not_available", "No client approval field exists in current truth."),
      review_status: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "not_available", "No review state exists in current truth."),
      referral_status: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "not_available", "No referral state exists in current truth."),
      case_study_status: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "not_available", "No case study state exists in current truth."),
      store_url: sourceNote("derived", "staffordos/clients/client_registry_v1.json", "merchant_shop", "Store URL is derived from the merchant shop domain."),
      affected_page_url: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "shopifixer.primary_problem", "No affected page URL is proven yet."),
      observed_friction: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "shopifixer.primary_problem", "No observed friction is proven yet."),
      why_it_matters: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "shopifixer.primary_problem", "No business rationale is proven yet."),
      expected_improvement_category: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "shopifixer.primary_problem", "No improvement category is proven yet."),
      scoped_fix: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "shopifixer.primary_problem", "No scoped fix is proven yet."),
      in_scope: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md", "Fix Scope", "No scoped fix items are proven yet."),
      out_of_scope: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md", "Fix Scope", "No scoped out-of-scope items are proven yet."),
      merchant_approval_needed: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md", "Merchant Approval Needed?", "No merchant approval requirement is proven yet."),
      before_evidence_status: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].proof_status", "Before evidence is not started until proof work begins."),
      before_screenshot: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md", "Before-State Evidence", "No before screenshot exists yet."),
      before_notes: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md", "Before-State Evidence", "No before notes exist yet."),
      risk_or_limitation: sourceNote("derived", "staffordos/snapshots/unit_work_snapshot_v1.json", "open_work[].next_action", "Next action text is the best current limitation statement."),
      fix_started_at: sourceNote("unavailable", "staffordos/units/delivery_units_v1.json", "units[].status", "No fix has started yet."),
      change_made: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md", "Execution Notes", "No execution change exists yet."),
      location_changed: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md", "Execution Notes", "No execution location exists yet."),
      implementation_notes: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md", "Execution Notes", "No implementation notes exist yet."),
      fix_completed_at: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "shopifixer.fix_status", "No fix completion timestamp exists yet."),
      after_evidence_status: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].proof_status", "After evidence is unavailable until proof is complete."),
      after_screenshot: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md", "After-State Evidence", "No after screenshot exists yet."),
      after_notes: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md", "After-State Evidence", "No after notes exist yet."),
      remaining_limitations: sourceNote("derived", "staffordos/snapshots/unit_work_snapshot_v1.json", "open_work[].next_action", "Open work next action describes the current limitation."),
      proof_package_status: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].proof_status", "Proof package remains not started until proof work exists."),
      proof_package_location: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md", "Merchant-Facing Proof Summary", "No proof package artifact exists yet."),
      merchant_facing_summary: sourceNote("unavailable", "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md", "Merchant-Facing Proof Package", "No merchant-facing proof summary exists yet."),
      recommended_next_watch_item: sourceNote("source", "staffordos/snapshots/unit_work_snapshot_v1.json", "open_work[].next_action", "Open work next action is the best current watch item."),
      scoped_issue_addressed: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].status", "No issue has been addressed while waiting_for_payment."),
      before_evidence_captured: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].proof_status", "Before evidence has not been captured yet."),
      after_evidence_captured: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].proof_status", "After evidence has not been captured yet."),
      merchant_proof_package_ready: sourceNote("derived", "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md", "Completion Criteria", "Proof package is not ready until proof is complete."),
      execution_complete: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].status", "Execution is not complete while waiting_for_payment."),
      proof_complete: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].proof_status", "Proof is not complete."),
      completion_complete: sourceNote("derived", "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md", "Completion Criteria", "Completion requires execution, proof, and completion statuses to be complete."),
      completed_at: sourceNote("unavailable", "staffordos/clients/client_registry_v1.json", "shopifixer.fix_status", "No completion timestamp exists yet."),
      review_requested: sourceNote("derived", "staffordos/authority/output/revenue_success_gate_v1.md", "Gate 5", "Review request is not yet proven."),
      review_received: sourceNote("derived", "staffordos/authority/output/revenue_success_gate_v1.md", "Gate 5", "Review received is not yet proven."),
      referral_requested: sourceNote("derived", "staffordos/authority/output/revenue_success_gate_v1.md", "Gate 5", "Referral request is not yet proven."),
      referral_received: sourceNote("derived", "staffordos/authority/output/revenue_success_gate_v1.md", "Gate 5", "Referral received is not yet proven."),
      case_study_authorized: sourceNote("derived", "staffordos/governance/shopifixer_fulfillment_truth_audit/shopifixer_fulfillment_truth_audit_v1.md", "Smallest Repair", "Case study authorization is not yet proven."),
    },
    unavailable_fields: itemUnavailableFields,
  };

  return fulfillment;
}

function buildCounts(items) {
  return {
    waiting_for_payment: items.filter((item) => item.payment_status === "waiting_for_payment").length,
    paid: items.filter((item) => item.payment_status === "payment_received").length,
    in_progress: items.filter((item) => item.execution_status === "in_progress").length,
    awaiting_proof: items.filter((item) => item.proof_status === "awaiting_proof").length,
    awaiting_client_approval: items.filter((item) => item.client_approval_status === "awaiting_client_approval").length,
    completed: items.filter((item) => item.completion_status === "complete").length,
    case_study_candidate: items.filter(
      (item) => item.completion_status === "complete" && item.proof_package_status === "complete" && item.case_study_authorized === true,
    ).length,
    referral_candidate: items.filter(
      (item) => item.completion_status === "complete" && item.proof_package_status === "complete" && item.review_requested === true,
    ).length,
  };
}

function buildSnapshot() {
  const schemaDraft = readJson("SHOPIFIXER_FULFILLMENT_SCHEMA_DRAFT.md", null);
  const authority = readJson("staffordos/authority/output/shopifixer_fulfillment_authority_v1.md", null);
  const packetTemplate = readJson("staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md", null);
  const audit = readJson("staffordos/governance/shopifixer_fulfillment_truth_audit/shopifixer_fulfillment_truth_audit_v1.md", null);
  const deliveryUnits = readJson("staffordos/units/delivery_units_v1.json", { units: [] });
  const clientRegistry = readJson("staffordos/clients/client_registry_v1.json", { clients: [] });
  const unitWorkSnapshot = readJson("staffordos/snapshots/unit_work_snapshot_v1.json", { open_work: [] });

  const sourceFiles = INPUT_FILES.map((entry) => sourceFileRecord(entry.file, entry.role));
  const clients = Array.isArray(clientRegistry.value.clients) ? clientRegistry.value.clients : [];
  const units = Array.isArray(deliveryUnits.value.units) ? deliveryUnits.value.units : [];
  const openWork = Array.isArray(unitWorkSnapshot.value.open_work) ? unitWorkSnapshot.value.open_work : [];

  const clientById = new Map();
  const clientByMerchant = new Map();
  for (const client of clients) {
    if (client?.client_id) clientById.set(client.client_id, client);
    if (client?.merchant_shop) clientByMerchant.set(client.merchant_shop, client);
  }

  const shopifixerUnits = units.filter(
    (unit) => unit?.unit_type === "delivery" && (unit?.delivery_type === "client_fix" || unit?.domain_id === "shopifixer"),
  );

  const items = shopifixerUnits.map((unit) => {
    const client = clientById.get(unit.client_id) || clientByMerchant.get(unit.client_id) || clientByMerchant.get(unit.domain_id) || null;
    const matchingOpenWork = openWork.find((work) => work?.unit_id === unit.unit_id) || null;
    return buildItem({
      unit,
      client,
      openWork: matchingOpenWork,
      sourceFiles,
    });
  });

  const summaryCounts = buildCounts(items);
  const unavailableFields = items.flatMap((item) =>
    item.unavailable_fields.map((entry) => ({
      ...entry,
      item_id: item.fulfillment_id,
    })),
  );

  const fieldSources = {
    "summary_counts.waiting_for_payment": sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].status === waiting_for_payment", "Counted from canonical ShopiFixer client_fix delivery units."),
    "summary_counts.paid": sourceNote("derived", "staffordos/clients/client_registry_v1.json", "clients[].deal.payment_status", "Counted from paid-like client registry payment states."),
    "summary_counts.in_progress": sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].status === active / in_progress", "Counted from delivery unit execution states."),
    "summary_counts.awaiting_proof": sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].proof_status", "Counted from delivery unit proof states."),
    "summary_counts.awaiting_client_approval": sourceNote("derived", "staffordos/clients/client_registry_v1.json", "clients[].client_approval_status", "No source field exists yet; count remains zero."),
    "summary_counts.completed": sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[].status + units[].proof_status", "Counted from completion-ready delivery states."),
    "summary_counts.case_study_candidate": sourceNote("derived", "staffordos/governance/shopifixer_fulfillment_truth_audit/shopifixer_fulfillment_truth_audit_v1.md", "smallest repair", "Requires completion, proof, and case study authorization."),
    "summary_counts.referral_candidate": sourceNote("derived", "staffordos/authority/output/revenue_success_gate_v1.md", "Gate 5", "Requires proof and merchant satisfaction / review before referral."),
    items: sourceNote("derived", "staffordos/units/delivery_units_v1.json", "units[]", "Canonical fulfillment items are derived from delivery units and reconciled against client registry and open work."),
    source_files: sourceNote("file_metadata", "SHOPIFIXER_FULFILLMENT_SCHEMA_DRAFT.md", "authority docs + runtime truth inputs", "Preserves the canonical source list used to build the fulfillment truth read model."),
    updated_at: sourceNote("generated", "staffordos/fulfillment/build_shopifixer_fulfillment_truth_v1.mjs", "now()", null),
  };

  return {
    schema: "staffordos.shopifixer_fulfillment_truth.v1",
    generated_at: now(),
    source_files: sourceFiles,
    summary_counts: summaryCounts,
    items,
    unavailable_fields: unavailableFields,
    field_sources: fieldSources,
  };
}

export function rebuildShopifixerFulfillmentTruth() {
  const snapshot = buildSnapshot();
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return snapshot;
}

function main() {
  const snapshot = rebuildShopifixerFulfillmentTruth();
  console.log(JSON.stringify(snapshot, null, 2));
}

if (isDirectRun()) {
  main();
}

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");
const REGISTRY_PATH = join(repoRoot, "staffordos/clients/client_registry_v1.json");

function now() {
  return new Date().toISOString();
}

function ensureRegistry() {
  mkdirSync(dirname(REGISTRY_PATH), { recursive: true });

  if (!existsSync(REGISTRY_PATH)) {
    writeFileSync(
      REGISTRY_PATH,
      JSON.stringify({
        schema: "staffordos.client_registry.v1",
        purpose:
          "Canonical registry for StaffordOS clients, separating Stafford Media business revenue from ShopiFixer audit/fix data and Abando merchant performance data.",
        generated_at: now(),
        clients: []
      }, null, 2)
    );
  }
}

export function readClientRegistry() {
  ensureRegistry();
  return JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
}

export function writeClientRegistry(registry) {
  registry.generated_at = now();
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");
}

export function upsertClient({
  client_id,
  merchant_shop,
  source = "unknown",
  status = "prospect",
  contact = {},
  deal = {},
  revenue = {},
  shopifixer = {},
  abando = {},
  business = {},
  notes = [],
  selected_product = null,
  routing_reason = null,
  qualification_status = null,
  qualification_reason = null,
  qualification_source = null,
  qualification_updated_at = null,
  lifecycle = {},
  next_action = {}
}) {
  if (!client_id && !merchant_shop) {
    throw new Error("client_id_or_merchant_shop_required");
  }

  const id = client_id || merchant_shop;
  const registry = readClientRegistry();

  const existingIndex = registry.clients.findIndex(
    (client) => client.client_id === id || client.merchant_shop === merchant_shop
  );

  const existing = existingIndex >= 0 ? registry.clients[existingIndex] : {};
  const businessNextAction =
    typeof business?.next_action === "string"
      ? business.next_action
      : business?.next_action?.instructions || existing.business?.next_action || null;
  const leadPromotionNote = Array.isArray(notes)
    ? notes.find((note) => note?.type === "lead_promotion")
    : null;
  const derivedQualificationReason =
    qualification_reason ||
    existing.qualification_reason ||
    (typeof leadPromotionNote?.qualification_reasons !== "undefined"
      ? (Array.isArray(leadPromotionNote?.qualification_reasons)
          ? leadPromotionNote.qualification_reasons.join("; ")
          : String(leadPromotionNote?.qualification_reasons || "").trim() || null)
      : null) ||
    null;
  const derivedQualificationSource =
    qualification_source ||
    existing.qualification_source ||
    (leadPromotionNote ? "lead_promotion" : null);
  const derivedQualificationUpdatedAt =
    qualification_updated_at ||
    existing.qualification_updated_at ||
    leadPromotionNote?.at ||
    (qualification_status || existing.qualification_status ? now() : null);

  const merged = {
    client_id: id,
    merchant_shop: merchant_shop || existing.merchant_shop || null,
    source: source || existing.source || "unknown",
    status: status || existing.status || "prospect",
    created_at: existing.created_at || now(),
    updated_at: now(),
    selected_product: selected_product || existing.selected_product || null,
    routing_reason: routing_reason || existing.routing_reason || null,
    qualification_status: qualification_status || existing.qualification_status || null,
    qualification_reason: derivedQualificationReason,
    qualification_source: derivedQualificationSource,
    qualification_updated_at: derivedQualificationUpdatedAt,

    lifecycle: {
      stage: lifecycle.stage || existing.lifecycle?.stage || null,
      stage_updated_at: lifecycle.stage_updated_at || existing.lifecycle?.stage_updated_at || now(),
      blocked: lifecycle.blocked ?? existing.lifecycle?.blocked ?? false,
      block_reason: lifecycle.block_reason ?? existing.lifecycle?.block_reason ?? null
    },

    next_action: {
      type: next_action.type || existing.next_action?.type || null,
      owner: next_action.owner || existing.next_action?.owner || null,
      due_at: next_action.due_at || existing.next_action?.due_at || null,
      instructions:
        next_action.instructions ||
        existing.next_action?.instructions ||
        businessNextAction ||
        null,
      auto_executable: next_action.auto_executable ?? existing.next_action?.auto_executable ?? false,
      created_at: existing.next_action?.created_at || now(),
      updated_at: now()
    },

    contact: {
      ...(existing.contact || {}),
      ...contact
    },

    deal: {
      type: null,
      value: 0,
      currency: "USD",
      closed_at: null,
      payment_status: "unpaid",
      ...(existing.deal || {}),
      ...deal
    },

    revenue: {
      shopifixer_one_time: 0,
      shopifixer_collected: false,
      abando_recurring_mrr: 0,
      abando_percentage: 0,
      total_lifetime_value: 0,
      currency: "USD",
      ...(existing.revenue || {}),
      ...revenue
    },

    shopifixer: {
      audit_status: "not_started",
      audit_score: null,
      primary_problem: null,
      fix_status: "not_started",
      latest_audit_at: null,
      ...(existing.shopifixer || {}),
      ...shopifixer
    },

    abando: {
      installed: false,
      install_status: "unknown",
      checkout_events: 0,
      recovery_actions: 0,
      merchant_revenue_recovered: 0,
      currency: "USD",
      last_recovery_at: null,
      ...(existing.abando || {}),
      ...abando
    },

    business: {
      stafford_revenue_earned: 0,
      stafford_recurring_revenue: 0,
      lifetime_value: 0,
      next_action: null,
      ...(existing.business || {}),
      ...business
    },

    notes: [
      ...(existing.notes || []),
      ...notes
    ]
  };

  if (existingIndex >= 0) {
    registry.clients[existingIndex] = merged;
  } else {
    registry.clients.push(merged);
  }

  writeClientRegistry(registry);
  return merged;
}

function normalizeMerchantKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

export function recordVerifiedStripePayment({
  client_id,
  merchant_shop,
  packet_id,
  reservation_id = null,
  payment_reference,
  stripe_session_id,
  stripe_event_id,
  stripe_event_type = "checkout.session.completed",
  amount_total,
  currency,
  selected_product = "shopifixer",
  source = "stripe_webhook_checkout_session_completed",
} = {}) {
  const merchantKey = normalizeMerchantKey(merchant_shop || client_id || "");
  if (!merchantKey) {
    return null;
  }

  const registry = readClientRegistry();
  const existing = registry.clients.find((client) => {
    const clientKey = normalizeMerchantKey(client.merchant_shop || client.client_id || "");
    const idKey = normalizeMerchantKey(client.client_id || "");
    return (
      clientKey === merchantKey ||
      idKey === merchantKey ||
      (client_id && client.client_id === client_id)
    );
  });

  if (!existing) {
    return null;
  }

  const timestamp = now();
  const amountValue = Number.isFinite(Number(amount_total)) ? Number(amount_total) / 100 : null;
  const currentRevenue = existing.revenue || {};
  const currentBusiness = existing.business || {};
  const currentDeal = existing.deal || {};

  return upsertClient({
    client_id: existing.client_id,
    merchant_shop: existing.merchant_shop || merchantKey,
    source: existing.source || source,
    status: existing.status || "qualified",
    contact: existing.contact || {},
    deal: {
      ...currentDeal,
      reservation_id: reservation_id || currentDeal.reservation_id || null,
      payment_status: "paid",
      closed_at: currentDeal.closed_at || timestamp,
      value: amountValue ?? currentDeal.value ?? 0,
      currency: currency || currentDeal.currency || "USD",
    },
    revenue: {
      ...currentRevenue,
      shopifixer_one_time: amountValue ?? currentRevenue.shopifixer_one_time ?? 0,
      shopifixer_collected: true,
      total_lifetime_value:
        amountValue ?? currentRevenue.total_lifetime_value ?? currentBusiness.lifetime_value ?? 0,
      currency: currency || currentRevenue.currency || currentDeal.currency || "USD",
    },
    business: {
      ...currentBusiness,
      stafford_revenue_earned:
        amountValue ?? currentBusiness.stafford_revenue_earned ?? 0,
      lifetime_value: amountValue ?? currentBusiness.lifetime_value ?? 0,
    },
    selected_product: existing.selected_product || selected_product,
    routing_reason: existing.routing_reason || "verified Stripe checkout.session.completed payment",
    lifecycle: {
      stage: "deal_won",
      stage_updated_at: timestamp,
      blocked: existing.lifecycle?.blocked ?? false,
      block_reason: existing.lifecycle?.block_reason ?? null,
    },
    next_action: {
      type: "fix",
      owner: "system",
      due_at: null,
      instructions: "Start paid ShopiFixer fix execution packet.",
      auto_executable: true,
      created_at: existing.next_action?.created_at || timestamp,
      updated_at: timestamp,
    },
    notes: [
      ...(existing.notes || []),
      {
        at: timestamp,
        type: "stripe_payment_received",
        text: "Verified Stripe checkout.session.completed payment recorded.",
        packet_id: packet_id || null,
        payment_reference: payment_reference || null,
        stripe_session_id: stripe_session_id || null,
        stripe_event_id: stripe_event_id || null,
        stripe_event_type,
        amount_total: Number.isFinite(Number(amount_total)) ? Number(amount_total) : null,
        currency: currency || null,
      },
    ],
  });
}

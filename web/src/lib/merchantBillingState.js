import { prisma } from "../clients/prisma.js";
import { stripe } from "../clients/stripe.js";
import {
  getStripePriceIds,
  hasCollectableBillingConfig,
  hasRequiredStripePriceIds,
  isStripeConfigured,
} from "./stripeConfig.js";

export const BILLING_STATE_EVENT = "abando.billing_state.v1";

function cleanText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function toIso(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeBillingStatus(value = "") {
  const status = cleanText(value, "inactive").toLowerCase();
  if (["active", "trialing", "past_due", "canceled", "incomplete", "inactive"].includes(status)) {
    return status;
  }
  return "inactive";
}

export function getBillingRuntimeReadiness() {
  const priceMap = getStripePriceIds();
  const stripeConfigured = isStripeConfigured() && Boolean(stripe);
  const starterPricePresent = Boolean(priceMap.starter);
  const proPricePresent = Boolean(priceMap.pro);
  const priceIdsPresent = hasRequiredStripePriceIds();
  const canonicalRoute = "/proof/payment";
  const billingRouteActive = hasCollectableBillingConfig() && Boolean(stripe);

  return {
    canonical_billing_path: canonicalRoute,
    stripe_configured: stripeConfigured,
    price_ids_present: priceIdsPresent,
    starter_price_present: starterPricePresent,
    pro_price_present: proPricePresent,
    billing_route_active: billingRouteActive,
    persistence_wired: true,
    payout_destination: stripeConfigured ? "unprovable_from_runtime" : "unprovable_from_runtime",
  };
}

export async function getLatestMerchantBillingState(shop = "") {
  const normalizedShop = cleanText(shop).toLowerCase();
  if (!normalizedShop) return null;

  const event = await prisma.systemEvent.findFirst({
    where: {
      shopDomain: normalizedShop,
      eventType: BILLING_STATE_EVENT,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!event) return null;

  const payload = event.payload && typeof event.payload === "object" ? event.payload : {};
  return {
    event_id: event.id,
    created_at: event.createdAt?.toISOString?.() || null,
    shop: normalizedShop,
    plan: cleanText(payload.plan, "free").toLowerCase(),
    billing_status: normalizeBillingStatus(payload.billing_status),
    checkout_session_id: cleanText(payload.checkout_session_id) || null,
    stripe_customer_id: cleanText(payload.stripe_customer_id) || null,
    stripe_subscription_id: cleanText(payload.stripe_subscription_id) || null,
    payment_status: cleanText(payload.payment_status) || null,
    livemode: Boolean(payload.livemode),
    amount_total: Number(payload.amount_total || 0) || 0,
    currency: cleanText(payload.currency).toUpperCase() || null,
    source: cleanText(payload.source) || null,
    checkout_completed_at: toIso(payload.checkout_completed_at) || event.createdAt?.toISOString?.() || null,
  };
}

export async function persistMerchantBillingState({
  shop,
  plan = "starter",
  source = "connected_experience",
  session,
}) {
  const normalizedShop = cleanText(shop).toLowerCase();
  if (!normalizedShop) {
    throw new Error("missing_shop");
  }
  if (!session || typeof session !== "object") {
    throw new Error("missing_checkout_session");
  }

  const subscription = session.subscription && typeof session.subscription === "object"
    ? session.subscription
    : null;
  const customerId = typeof session.customer === "string"
    ? session.customer
    : cleanText(session.customer?.id || "");
  const billingStatus = normalizeBillingStatus(subscription?.status || (session.payment_status === "paid" ? "active" : "inactive"));
  const amountTotal = Number(session.amount_total || 0) || 0;

  const payload = {
    shop: normalizedShop,
    plan: cleanText(plan, "starter").toLowerCase(),
    source: cleanText(source, "connected_experience"),
    billing_status: billingStatus,
    payment_status: cleanText(session.payment_status, "unknown").toLowerCase(),
    checkout_session_id: cleanText(session.id),
    stripe_customer_id: customerId || null,
    stripe_subscription_id: cleanText(subscription?.id) || null,
    livemode: Boolean(session.livemode),
    amount_total: amountTotal,
    currency: cleanText(session.currency).toLowerCase() || null,
    checkout_completed_at: toIso(session.created ? new Date(Number(session.created) * 1000) : new Date()),
  };

  const event = await prisma.systemEvent.create({
    data: {
      shopDomain: normalizedShop,
      eventType: BILLING_STATE_EVENT,
      visibility: "merchant",
      payload,
    },
  });

  return {
    event_id: event.id,
    ...payload,
  };
}

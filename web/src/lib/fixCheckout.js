import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Stripe from "stripe";
import { markPaidTruth, sendPaymentLinkTruth } from "../../../staffordos/truth/lead_truth_store.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..");
const offersPath = resolve(repoRoot, ".tmp", "payment_offers.json");
let stripeClient = null;

export const FIX_CHECKOUT_DEFAULTS = {
  service: "Shopify dev setup stabilization",
  title: "Shopify dev setup stabilization",
  priceUsd: 250,
  currency: "usd",
  shortScope: "Fix Shopify dev tunnel, preview, and embedded app loading issues and return a stable working setup.",
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value = "") {
  const text = String(value || "").trim();
  return text || null;
}

function stripeModeForSession(session) {
  return session?.livemode ? "live" : "test";
}

function isoFromUnix(value) {
  const seconds = Number(value || 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

async function readOffers() {
  try {
    const raw = await readFile(offersPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function saveOffers(offers) {
  await mkdir(resolve(repoRoot, ".tmp"), { recursive: true });
  await writeFile(offersPath, `${JSON.stringify(offers, null, 2)}\n`, "utf8");
  return offers;
}

function buildReturnBaseUrl(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "http://127.0.0.1:8081";
  }
  return trimmed.replace(/\/+$/, "");
}

export function getFixCheckoutStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!secretKey) {
    return null;
  }

  stripeClient = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  return stripeClient;
}

export function isFixCheckoutConfigured() {
  return Boolean(getFixCheckoutStripeClient());
}

export async function createFixCheckoutSession({
  leadId = "",
  source = "fix_page",
  email = "",
  name = "",
  githubIssueUrl = "",
  returnBaseUrl = "",
} = {}) {
  const stripe = getFixCheckoutStripeClient();
  if (!stripe) {
    throw new Error("stripe_not_configured");
  }

  const baseUrl = buildReturnBaseUrl(returnBaseUrl);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    billing_address_collection: "auto",
    customer_email: normalizeText(email) || undefined,
    line_items: [
      {
        price_data: {
          currency: FIX_CHECKOUT_DEFAULTS.currency,
          product_data: {
            name: FIX_CHECKOUT_DEFAULTS.title,
            description: FIX_CHECKOUT_DEFAULTS.shortScope,
          },
          unit_amount: FIX_CHECKOUT_DEFAULTS.priceUsd * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      source: String(source || "fix_page"),
      leadId: String(leadId || ""),
      name: String(name || ""),
      githubIssueUrl: String(githubIssueUrl || ""),
      service: FIX_CHECKOUT_DEFAULTS.service,
    },
    success_url: `${baseUrl}/fix?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/fix?checkout=cancel`,
    after_expiration: {
      recovery: {
        enabled: true,
      },
    },
  });

  const record = {
    offerId: `offer_${leadId || "fix"}_${Date.now()}`,
    leadId: normalizeText(leadId),
    leadName: normalizeText(name),
    githubIssueUrl: normalizeText(githubIssueUrl),
    source: normalizeText(source) || "fix_page",
    offerTitle: FIX_CHECKOUT_DEFAULTS.title,
    service: FIX_CHECKOUT_DEFAULTS.service,
    priceUsd: FIX_CHECKOUT_DEFAULTS.priceUsd,
    shortScope: FIX_CHECKOUT_DEFAULTS.shortScope,
    paymentUrl: normalizeText(session.url),
    checkoutSessionId: normalizeText(session.id),
    expiresAt: isoFromUnix(session.expires_at),
    recoveryUrl: normalizeText(session.after_expiration?.recovery?.url),
    paymentPath: "stripe_checkout_session",
    stripeMode: stripeModeForSession(session),
    createdAt: nowIso(),
    status: "payment_ready",
  };

  const offers = await readOffers();
  offers.push(record);
  await saveOffers(offers);

  return {
    ok: true,
    offerId: record.offerId,
    leadId: record.leadId,
    checkoutUrl: record.paymentUrl,
    sessionId: record.checkoutSessionId,
    expiresAt: record.expiresAt,
    recoveryUrl: record.recoveryUrl,
    priceUsd: record.priceUsd,
  };
}

export async function markFixCheckoutSessionCompleted(session) {
  const sessionId = normalizeText(session?.id);
  if (!sessionId) {
    return { ok: false, reason: "missing_session_id" };
  }

  const offers = await readOffers();
  const offer = [...offers]
    .reverse()
    .find((item) => String(item?.checkoutSessionId || "") === sessionId);

  if (!offer) {
    return { ok: false, reason: "offer_not_found", sessionId };
  }

  offer.status = "paid";
  offer.paidAt = nowIso();
  offer.paymentUrl = normalizeText(session?.url) || offer.paymentUrl || null;
  offer.recoveryUrl = normalizeText(session?.after_expiration?.recovery?.url) || offer.recoveryUrl || null;
  await saveOffers(offers);

  let truthResult = null;
  if (offer.leadId) {
    const prepare = await sendPaymentLinkTruth(
      offer.leadId,
      offer.githubIssueUrl || "",
      offer.paymentUrl || "",
      offer.offerId || "",
      "stripe checkout session completed",
      true,
    );

    if (prepare?.ok) {
      truthResult = await markPaidTruth(
        offer.leadId,
        offer.githubIssueUrl || "",
        "stripe checkout session completed",
      );
    } else {
      truthResult = prepare;
    }
  }

  return {
    ok: true,
    offerId: offer.offerId,
    leadId: offer.leadId || null,
    sessionId,
    truthResult,
  };
}

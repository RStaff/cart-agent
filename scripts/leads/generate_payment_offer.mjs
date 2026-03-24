#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";

import { loadLeads } from "./pipeline_manager.mjs";
import { createDeliveryRecord } from "./create_delivery_record.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const requireFromWeb = createRequire(resolve(repoRoot, "web/package.json"));
const Stripe = requireFromWeb("stripe");

const OFFERS_PATH = ".tmp/payment_offers.json";
const DEFAULTS = {
  service: "Shopify dev setup stabilization",
  title: "Shopify dev setup stabilization",
  priceUsd: 250,
  currency: "usd",
  shortScope: "Fix Shopify dev tunnel, preview, and embedded app loading issues and return a stable working setup.",
  successUrl: "https://abando.ai/onboarding/",
  cancelUrl: "https://abando.ai/pricing/",
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeLeadName(name) {
  return String(name || "").trim() || "unknown";
}

function safeError(error) {
  return error instanceof Error ? error.message : String(error);
}

function loadEnvFiles() {
  const candidates = [
    ".env.local",
    "web/.env",
    "web/.env.local",
    "web/shopify/.env",
  ];
  for (const candidate of candidates) {
    dotenv.config({ path: resolve(repoRoot, candidate), override: true });
  }
}

async function readOffers() {
  try {
    const raw = await readFile(OFFERS_PATH, "utf8");
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
  await mkdir(".tmp", { recursive: true });
  await writeFile(OFFERS_PATH, `${JSON.stringify(offers, null, 2)}\n`, "utf8");
  return offers;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--id") {
      args.id = argv[index + 1];
      index += 1;
    } else if (token === "--refresh") {
      args.refresh = true;
    }
  }
  return args;
}

function findReusableOffer(offers, leadId) {
  return offers.find(
    (offer) =>
      offer.leadId === leadId &&
      offer.status === "payment_ready" &&
      typeof offer.paymentUrl === "string" &&
      offer.paymentUrl.startsWith("https://"),
  );
}

function buildStripeMode(secretKey) {
  if (String(secretKey || "").startsWith("sk_live_")) return "live";
  if (String(secretKey || "").startsWith("sk_test_")) return "test";
  return "unknown";
}

async function createStripeCheckout(lead) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("stripe_secret_key_missing");
  }

  const stripe = new Stripe(secretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: process.env.LEADS_STRIPE_SUCCESS_URL || DEFAULTS.successUrl,
    cancel_url: process.env.LEADS_STRIPE_CANCEL_URL || DEFAULTS.cancelUrl,
    line_items: [
      {
        price_data: {
          currency: DEFAULTS.currency,
          product_data: {
            name: DEFAULTS.title,
            description: DEFAULTS.shortScope,
          },
          unit_amount: DEFAULTS.priceUsd * 100,
        },
        quantity: 1,
      },
    ],
    customer_email: undefined,
    metadata: {
      source: "lead_machine",
      leadId: lead.id,
      leadName: normalizeLeadName(lead.name),
      service: DEFAULTS.service,
    },
  });

  return {
    paymentUrl: session.url,
    checkoutSessionId: session.id,
    stripeMode: buildStripeMode(secretKey),
  };
}

export async function generatePaymentOffer(leadId, options = {}) {
  loadEnvFiles();

  const leads = await loadLeads();
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) {
    throw new Error(`lead_not_found:${leadId}`);
  }

  const offers = await readOffers();
  const reusable = !options.refresh ? findReusableOffer(offers, leadId) : null;
  if (reusable) {
    await createDeliveryRecord(leadId);
    console.log(`[payment-offer] reusing existing payment URL for ${leadId}`);
    return reusable;
  }

  const stripeResult = await createStripeCheckout(lead);
  const record = {
    offerId: `offer_${lead.id}_${Date.now()}`,
    leadId: lead.id,
    leadName: normalizeLeadName(lead.name),
    offerTitle: DEFAULTS.title,
    service: DEFAULTS.service,
    priceUsd: DEFAULTS.priceUsd,
    shortScope: DEFAULTS.shortScope,
    paymentUrl: stripeResult.paymentUrl,
    checkoutSessionId: stripeResult.checkoutSessionId,
    paymentPath: "stripe_checkout_session",
    stripeMode: stripeResult.stripeMode,
    createdAt: nowIso(),
    status: "payment_ready",
  };

  offers.push(record);
  await saveOffers(offers);
  await createDeliveryRecord(leadId);

  console.table([
    {
      leadId: record.leadId,
      leadName: record.leadName,
      offerTitle: record.offerTitle,
      priceUsd: record.priceUsd,
      status: record.status,
    },
  ]);
  console.log(`\nPayment URL: ${record.paymentUrl}`);
  console.log(`Saved payment offer to ${OFFERS_PATH}`);
  return record;
}

async function main() {
  const args = parseArgs(process.argv);
  const leadId = String(args.id || "").trim();
  if (!leadId) {
    throw new Error("Missing required --id");
  }
  await generatePaymentOffer(leadId, { refresh: Boolean(args.refresh) });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[payment-offer] fatal:", safeError(error));
    process.exit(1);
  });
}

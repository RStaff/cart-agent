import fs from "fs";

const files = {
  checkout: "web/src/checkout-public.js",
  packetAuthority: "web/src/routes/packetAuthority.esm.js",
  stripeWebhook: "web/src/routes/stripeWebhook.esm.js",
  index: "web/src/index.js"
};

const src = Object.fromEntries(
  Object.entries(files).map(([k, p]) => [k, fs.existsSync(p) ? fs.readFileSync(p, "utf8") : ""])
);

const failures = [];
const warnings = [];

if (src.checkout.includes('status: "payment_received"')) {
  failures.push("checkout_public_can_mark_payment_received");
}

if (src.packetAuthority.includes('status: "payment_received"')) {
  failures.push("packet_authority_can_mark_payment_received");
}

if (!src.stripeWebhook.includes('status: "payment_received"')) {
  failures.push("stripe_webhook_missing_payment_received_transition");
}

if (!src.stripeWebhook.includes("constructEvent")) {
  failures.push("stripe_webhook_missing_signature_verification");
}

if (!src.stripeWebhook.includes("STRIPE_WEBHOOK_SECRET")) {
  failures.push("stripe_webhook_missing_webhook_secret_requirement");
}

if (!src.stripeWebhook.includes("checkout.session.completed")) {
  failures.push("stripe_webhook_missing_checkout_completed_handler");
}

if (!src.index.includes("installStripeWebhook(app)")) {
  failures.push("stripe_webhook_not_mounted");
}

const jsonIndex = src.index.indexOf("app.use(express.json");
const webhookIndex = src.index.indexOf("installStripeWebhook(app)");
if (jsonIndex !== -1 && webhookIndex !== -1 && jsonIndex < webhookIndex) {
  failures.push("stripe_webhook_mounted_after_express_json");
}

if (!src.index.includes("express.raw")) {
  warnings.push("index_missing_explicit_express_raw_for_stripe_webhook");
}

const result = {
  schema: "staffordos.payment_authority_source_validation.v1",
  status: failures.length ? "failed" : "passed",
  failures,
  warnings,
  current_blocker: failures.length ? "S2F_STRIPE_AUTHORITY_UNIFICATION" : null
};

fs.mkdirSync("staffordos/authority/output", { recursive: true });
fs.writeFileSync(
  "staffordos/authority/output/payment_authority_source_validation_v1.json",
  JSON.stringify(result, null, 2)
);

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);

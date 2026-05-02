import { writeFileSync, mkdirSync } from "node:fs";

const publicBase =
  process.env.ABANDO_PUBLIC_APP_ORIGIN ||
  process.env.APP_URL ||
  process.env.PUBLIC_APP_URL ||
  "https://pay.abando.ai";

const expectedRoute = "/api/shopify/webhooks/orders-paid";
const expectedUrl = `${publicBase.replace(/\/$/, "")}${expectedRoute}`;

const requiredEnv = [
  "SHOPIFY_API_SECRET"
];

const optionalEnv = [
  "SHOPIFY_API_KEY",
  "SHOPIFY_APP_URL",
  "ABANDO_PUBLIC_APP_ORIGIN",
  "APP_URL",
  "PUBLIC_APP_URL"
];

const missingRequired = requiredEnv.filter((key) => !process.env[key]);

const report = {
  generated_at: new Date().toISOString(),
  check_name: "shopify_webhook_production_registration_check_v1",
  status: missingRequired.length ? "NEEDS_ENV" : "READY_FOR_SHOPIFY_DASHBOARD_CONFIRMATION",
  expected_topic: "orders/paid",
  expected_callback_url: expectedUrl,
  expected_route: expectedRoute,
  hmac_secret_required: "SHOPIFY_API_SECRET",
  missing_required_env: missingRequired,
  observed_env: Object.fromEntries(
    [...requiredEnv, ...optionalEnv].map((key) => [
      key,
      process.env[key] ? "present" : "missing"
    ])
  ),
  manual_confirmation_required: [
    "Open Shopify Partner Dashboard",
    "Open Abando app",
    "Confirm orders/paid webhook points to expected_callback_url",
    "Confirm production runtime has SHOPIFY_API_SECRET set",
    "Send Shopify test webhook or create test order after install"
  ],
  truth_claim: "Code route is ready for real Shopify HMAC webhook attribution; production registration still requires Shopify dashboard/app configuration confirmation."
};

mkdirSync("staffordos/system_inventory/proof_summaries", { recursive: true });
writeFileSync(
  "staffordos/system_inventory/proof_summaries/shopify_webhook_registration_check_latest.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));

if (missingRequired.length) process.exit(2);

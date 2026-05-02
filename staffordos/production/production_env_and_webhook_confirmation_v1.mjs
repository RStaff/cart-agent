import { writeFileSync, mkdirSync } from "node:fs";

const productionBase =
  process.env.ABANDO_PRODUCTION_BASE ||
  process.env.ABANDO_PUBLIC_APP_ORIGIN ||
  "https://pay.abando.ai";

const webhookUrl = `${productionBase.replace(/\/$/, "")}/api/shopify/webhooks/orders-paid`;

async function checkUrl(url) {
  try {
    const response = await fetch(url, { method: "GET" });
    const text = await response.text();
    return {
      reachable: true,
      status: response.status,
      content_type: response.headers.get("content-type"),
      sample: text.slice(0, 160)
    };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

const envRequired = [
  "SHOPIFY_API_SECRET",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS"
];

const envOptional = [
  "SHOPIFY_API_KEY",
  "SHOPIFY_APP_URL",
  "ABANDO_PUBLIC_APP_ORIGIN",
  "APP_URL",
  "PUBLIC_APP_URL",
  "FROM_EMAIL",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM"
];

const missingRequiredLocal = envRequired.filter((key) => !process.env[key]);
const routeProbe = await checkUrl(webhookUrl);

const report = {
  generated_at: new Date().toISOString(),
  check_name: "production_env_and_webhook_confirmation_v1",
  production_base: productionBase,
  expected_webhook_topic: "orders/paid",
  expected_webhook_url: webhookUrl,
  route_probe: routeProbe,
  local_env_status: {
    status: missingRequiredLocal.length ? "LOCAL_ENV_INCOMPLETE" : "LOCAL_ENV_PRESENT",
    missing_required: missingRequiredLocal,
    observed: Object.fromEntries(
      [...envRequired, ...envOptional].map((key) => [
        key,
        process.env[key] ? "present" : "missing"
      ])
    )
  },
  production_confirmation_required: [
    {
      item: "Render/env confirmation",
      required: true,
      expected: "SHOPIFY_API_SECRET and SMTP env vars present in production runtime"
    },
    {
      item: "Shopify webhook registration",
      required: true,
      expected: `orders/paid callback URL equals ${webhookUrl}`
    },
    {
      item: "Shopify HMAC live proof",
      required: true,
      expected: "Real Shopify test webhook or real test order reaches production and returns 200"
    }
  ],
  current_truth_status:
    routeProbe.reachable
      ? "PRODUCTION_ROUTE_REACHABLE_BUT_ENV_AND_SHOPIFY_REGISTRATION_NOT_CONFIRMED"
      : "PRODUCTION_ROUTE_NOT_REACHABLE_OR_NOT_DEPLOYED",
  truth_claim:
    "Production webhook cannot be marked proven until production env and Shopify Partner Dashboard registration are confirmed."
};

mkdirSync("staffordos/system_inventory/proof_summaries", { recursive: true });
writeFileSync(
  "staffordos/system_inventory/proof_summaries/production_env_and_webhook_confirmation_latest.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));

if (report.current_truth_status !== "PRODUCTION_ROUTE_REACHABLE_BUT_ENV_AND_SHOPIFY_REGISTRATION_NOT_CONFIRMED") {
  process.exit(2);
}

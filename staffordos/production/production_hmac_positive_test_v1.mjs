import crypto from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";

const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_SHARED_SECRET || "";
const productionBase = process.env.ABANDO_PRODUCTION_BASE || "https://pay.abando.ai";
const url = `${productionBase.replace(/\/$/, "")}/api/shopify/webhooks/orders-paid`;

if (!secret) {
  console.error("❌ Missing SHOPIFY_API_SECRET. Cannot run positive HMAC test.");
  process.exit(2);
}

const body = JSON.stringify({
  id: "production-hmac-positive-test-1001",
  checkout_token: "production-hmac-positive-test",
  email: "rossstafford1@gmail.com",
  total_price: "125.00",
  currency: "USD"
});

const hmac = crypto
  .createHmac("sha256", secret)
  .update(Buffer.from(body))
  .digest("base64");

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-shopify-hmac-sha256": hmac,
    "x-shopify-shop-domain": "demo-shop.myshopify.com"
  },
  body
});

const text = await response.text();
let json = null;
try { json = JSON.parse(text); } catch {}

const report = {
  generated_at: new Date().toISOString(),
  check_name: "production_hmac_positive_test_v1",
  url,
  http_status: response.status,
  response_json: json,
  response_sample: json ? null : text.slice(0, 240),
  status:
    response.status === 200 && json?.status === "REAL_SHOPIFY_HMAC_ORDER_REVENUE_ATTRIBUTED"
      ? "PRODUCTION_HMAC_POSITIVE_TEST_PASSED"
      : "PRODUCTION_HMAC_POSITIVE_TEST_FAILED",
  truth_claim:
    "Production HMAC positive proof requires a correctly signed payload accepted by pay.abando.ai."
};

mkdirSync("staffordos/system_inventory/proof_summaries", { recursive: true });
writeFileSync(
  "staffordos/system_inventory/proof_summaries/production_hmac_positive_test_latest.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));

if (report.status !== "PRODUCTION_HMAC_POSITIVE_TEST_PASSED") process.exit(1);

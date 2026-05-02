import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

export function recordShopifyOrderAttribution({ repoRoot, order }) {
  const outputDir = `${repoRoot}/staffordos/system_inventory/output`;
  const orderLogFile = `${outputDir}/abando_order_attribution_log_v1.json`;
  const registerFile = `${outputDir}/execution_proof_register_v1.json`;
  const summaryFile = `${repoRoot}/staffordos/system_inventory/proof_summaries/abando_order_attribution_latest.json`;

  const amount =
    Number(order?.total_price) ||
    Number(order?.current_total_price) ||
    Number(order?.subtotal_price) ||
    0;

  const entry = {
    timestamp: new Date().toISOString(),
    status: "ORDER_REVENUE_ATTRIBUTED",
    proof_type: "synthetic_shopify_order_webhook_attribution",
    order_id: String(order?.id || order?.order_id || ""),
    checkout_id: String(order?.checkout_id || ""),
    checkout_token: String(order?.checkout_token || order?.cart_token || ""),
    email: String(order?.email || order?.customer?.email || ""),
    shop: String(order?.shop || order?.shop_domain || "demo-shop.myshopify.com"),
    revenue: amount,
    currency: String(order?.currency || "USD"),
    source: "/api/shopify/order-paid/attribution-test"
  };

  const log = readJson(orderLogFile, []);
  log.push(entry);
  writeJson(orderLogFile, log);

  const register = readJson(registerFile, {});
  register.latest_abando_order_attribution_proof = entry;
  writeJson(registerFile, register);

  writeJson(summaryFile, {
    generated_at: new Date().toISOString(),
    proof_name: "abando_order_attribution_latest",
    status: entry.status,
    proof_type: entry.proof_type,
    order_id: entry.order_id,
    checkout_token: entry.checkout_token,
    email: entry.email,
    shop: entry.shop,
    revenue: entry.revenue,
    currency: entry.currency,
    truth_claim: "Synthetic Shopify order webhook payload was attributed to Abando revenue proof register."
  });

  return entry;
}

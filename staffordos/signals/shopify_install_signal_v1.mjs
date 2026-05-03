import { writeFileSync, mkdirSync } from "node:fs";

const SHOP = "cart-agent-dev.myshopify.com";
const URL = `https://pay.abando.ai/api/install/status?shop=${SHOP}`;

mkdirSync("staffordos/proofs", { recursive: true });

const res = await fetch(URL);
const data = await res.json();

const signal = {
  signal_id: "shopify_install_status_v1",
  generated_at: new Date().toISOString(),
  product: "abando",
  shop: SHOP,
  source_url: URL,
  status: data.installed === true && data.token === true ? "GREEN" : "RED",
  installed: data.installed === true,
  token: data.token === true,
  installed_at: data.installed_at || null,
  operator_message:
    data.installed === true && data.token === true
      ? "Shopify OAuth install is proven live: token received and install state is true."
      : "Shopify OAuth install is not yet proven live.",
  next_action:
    data.installed === true && data.token === true
      ? "Move to webhook/event ingestion proof."
      : "Complete OAuth install before continuing."
};

writeFileSync(
  "staffordos/proofs/shopify_install_signal_latest.json",
  JSON.stringify(signal, null, 2)
);

console.log(JSON.stringify(signal, null, 2));

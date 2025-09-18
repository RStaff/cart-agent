import open from "open";

const shop = "cart-agent-dev.myshopify.com";   // dev store
const url  = `https://abando.ai/shopify/dev-install?shop=${shop}`;

console.log("🌐 Opening:", url);
await open(url);

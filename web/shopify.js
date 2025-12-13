// Minimal Shopify stub so imports don't crash in dev.
// We'll wire real Shopify helpers later when billing is ready.

const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://abando.dev";

const shopify = {
  config: {
    appUrl: APP_URL,
  },
};

export default shopify;

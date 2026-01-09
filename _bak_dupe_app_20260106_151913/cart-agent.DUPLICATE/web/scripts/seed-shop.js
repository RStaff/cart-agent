import { prisma } from "../src/db.js";

async function main() {
  const shopKey = process.argv[2] || process.env.SEED_SHOP_KEY;
  if (!shopKey) {
    console.error("SEED_SHOP_KEY (env) or arg <shopKey> is required");
    process.exit(1);
  }

  // decide provider by key
  const provider = shopKey.includes(".myshopify.com") ? "shopify" : "generic";

  const defaults = {
    name: provider === "shopify" ? "Demo Shopify Store" : "Demo Store",
    provider,                       // e.g., 'shopify' | 'generic'
    apiKey: process.env.SEED_API_KEY || "dev-seed-api-key",
    emailFrom: process.env.SEED_EMAIL_FROM || "sales@example.com",
  };

  const shop = await prisma.shop.upsert({
    where: { key: shopKey },
    create: { key: shopKey, ...defaults },
    update: { provider }, // keep it minimal; you can expand safely
  });

  console.log(JSON.stringify({ ok: true, shop }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

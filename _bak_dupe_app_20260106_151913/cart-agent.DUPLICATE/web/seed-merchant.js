import { prisma } from './lib/prisma.js';

const SHOP = process.env.SEED_SHOP || 'example.com';
const KEY  = process.env.SEED_KEY  || 'dev_api_key_123';

const run = async () => {
  await prisma.merchantConfig.upsert({
    where: { shopDomain: SHOP },
    update: { settings: { apiKey: KEY } },
    create: {
      shopDomain: SHOP,
      emailProvider: 'ethereal',
      fromEmail: 'Cart Agent <cart@example.com>',
      settings: { apiKey: KEY }
    }
  });
  console.log(`Seeded MerchantConfig for ${SHOP} with apiKey=${KEY}`);
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });

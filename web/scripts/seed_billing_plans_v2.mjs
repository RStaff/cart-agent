#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * v1 billing plans for Abando.
 *
 * Schema fields (from Prisma):
 * - key        (unique string identifier, e.g. "starter")
 * - name       (display name)
 * - priceCents (integer, e.g. 4900 for $49)
 * - currency   (e.g. "USD")
 * - interval   (e.g. "MONTHLY")
 */
async function main() {
  const plans = [
    {
      key: "starter",
      name: "Starter",
      priceCents: 4900,   // $49/mo
      currency: "USD",
      interval: "MONTHLY",
    },
    {
      key: "growth",
      name: "Growth",
      priceCents: 9900,   // $99/mo
      currency: "USD",
      interval: "MONTHLY",
    },
    {
      key: "scale",
      name: "Scale",
      priceCents: 19900,  // $199/mo
      currency: "USD",
      interval: "MONTHLY",
    },
  ];

  for (const plan of plans) {
    const result = await prisma.shopifyPlan.upsert({
      where: { key: plan.key },   // ✅ use `key`, not `code`
      update: {
        name: plan.name,
        priceCents: plan.priceCents,
        currency: plan.currency,
        interval: plan.interval,
      },
      create: plan,
    });

    console.log(`✅ Upserted plan: ${result.key} (${result.name}) – ${result.priceCents}¢`);
  }

  console.log("🎉 Done seeding ShopifyPlan.");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding plans:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      code: "starter",
      name: "Starter",
      monthlyPriceCents: 4900,
      maxRecoveredOrdersPerMonth: 200,
      sortOrder: 1,
    },
    {
      code: "growth",
      name: "Growth",
      monthlyPriceCents: 9900,
      maxRecoveredOrdersPerMonth: 1000,
      sortOrder: 2,
    },
    {
      code: "scale",
      name: "Scale",
      monthlyPriceCents: 19900,
      maxRecoveredOrdersPerMonth: 999999, // effectively "unlimited" for v1
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    const result = await prisma.shopifyPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        monthlyPriceCents: plan.monthlyPriceCents,
        maxRecoveredOrdersPerMonth: plan.maxRecoveredOrdersPerMonth,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    });

    console.log(`✅ Upserted plan: ${result.code} (${result.name})`);
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

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Canonical entitlements for a shop.
 * This is the ONLY place that decides gating.
 */
export async function resolveEntitlements(shopDomain) {
  const shop = await prisma.shop.findFirst({
    where: { domain: shopDomain.toLowerCase() },
    select: {
      domain: true,
      plan: true,
      billingStatus: true,     // e.g. "active" | "inactive" | "trialing"
      trialEndsAt: true,
      subscriptionId: true,
      installedAt: true,
    },
  });

  // Sensible defaults if shop not in DB yet
  const plan = shop?.plan ?? "free";
  const status = shop?.billingStatus ?? "inactive";

  const active =
    status === "active" ||
    (status === "trialing" && shop?.trialEndsAt && new Date(shop.trialEndsAt) > new Date());

  // Define capabilities by plan
  const capsByPlan = {
    free:    { can_auto_rescue: false, can_send_messages: false, can_ai_rewrite: false },
    starter: { can_auto_rescue: true,  can_send_messages: true,  can_ai_rewrite: true  },
    growth:  { can_auto_rescue: true,  can_send_messages: true,  can_ai_rewrite: true  },
    pro:     { can_auto_rescue: true,  can_send_messages: true,  can_ai_rewrite: true  },
  };

  const caps = capsByPlan[plan] ?? capsByPlan.free;

  return {
    plan,
    active,
    needs_subscription: !active,
    ...caps,
    meta: {
      shopFound: !!shop,
      billingStatus: status,
      trialEndsAt: shop?.trialEndsAt ?? null,
      subscriptionId: shop?.subscriptionId ?? null,
    },
  };
}

import { prisma } from "../clients/prisma.js";

export function usageGate({ kind = "abandoned_cart_run", cost = 1 } = {}) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "unauthenticated" });

      const fresh = await prisma.user.findUnique({ where: { id: user.id } });
      const active = fresh.stripeSubStatus === "active" || fresh.stripeSubStatus === "trialing";

      if (!active) {
        if (fresh.freeCredits <= 0) {
          return res.status(402).json({
            error: "payment_required",
            message: "Out of free credits. Please upgrade.",
          });
        }
        await prisma.$transaction([
          prisma.user.update({
            where: { id: fresh.id },
            data: { freeCredits: { decrement: cost } },
          }),
          prisma.usage.create({
            data: { userId: fresh.id, kind, cost, meta: {} },
          }),
        ]);
      } else {
        await prisma.usage.create({
          data: { userId: fresh.id, kind, cost, meta: {} },
        });
      }
      next();
    } catch (e) {
      console.error("usageGate error", e);
      res.status(500).json({ error: "internal_error" });
    }
  };
}

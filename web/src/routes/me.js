import { Router } from "express";
import { prisma } from "../clients/prisma.js";
export const meRouter = Router();
meRouter.get("/", async (req, res) => {
  if (!req.user) return res.json({ user: null, trial: null, billing: null });
  const u = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({
    user: { id: u.id, email: u.email },
    trial: { freeCredits: u.freeCredits },
    billing: {
      stripeCustomerId: u.stripeCustomerId,
      subscriptionStatus: u.stripeSubStatus,
    },
  });
});

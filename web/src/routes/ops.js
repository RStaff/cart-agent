import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import pino from "pino";

const log = pino();
const prisma = new PrismaClient();
export const opsRouter = Router();

// Protect with ADMIN_API_KEY (for cron)
opsRouter.post("/scan", async (req, res) => {
  try {
    const adminKey = req.header("x-admin-key") || "";
    if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    const toNotify = await prisma.cart.findMany({
      where: {
        status: "abandoned",
        createdAt: { lt: cutoff },
      },
      take: 50,
      orderBy: { createdAt: "asc" },
      include: { shop: true },
    });

    for (const cart of toNotify) {
      // TODO: replace with real mailer (Resend/SendGrid)
      log.info({ cartId: cart.cartId, to: cart.userEmail, shop: cart.shop.name }, "[ops] would send recovery email");
      // Optionally mark as 'queued' or leave as-is to retry later
      // await prisma.cart.update({ where: { id: cart.id }, data: { status: "queued" } })
    }

    res.json({ scanned: toNotify.length });
  } catch (err) {
    log.error({ err }, "[ops] scan failed");
    res.status(500).json({ error: "internal" });
  }
});

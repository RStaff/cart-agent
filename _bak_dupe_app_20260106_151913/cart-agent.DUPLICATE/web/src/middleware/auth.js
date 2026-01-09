import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function authenticate(req, res, next) {
  try {
    const apiKey = req.header("x-api-key") || "";
    if (!apiKey) return res.status(401).json({ error: "missing x-api-key" });

    const shop = await prisma.shop.findUnique({ where: { apiKey } });
    if (!shop) return res.status(401).json({ error: "invalid api key" });

    req.shop = shop; // attach for downstream use
    next();
  } catch (err) {
    next(err);
  }
}

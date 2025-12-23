// web/src/lib/webhook_events.js (ESM)
// DB-backed webhook event store via Prisma

import { PrismaClient } from "@prisma/client";

// Prisma singleton (safe for nodemon reload)
const prisma =
  globalThis.__abandoPrisma ||
  new PrismaClient({
    log: process.env.ABANDO_PRISMA_LOGS ? ["query", "error", "warn"] : ["error"],
  });

globalThis.__abandoPrisma = prisma;

export async function recordWebhookEvent(e) {
  // Keep this function resilient: never throw to the webhook responder.
  try {
    if (!e?.shop || !e?.topic) return null;

    return await prisma.abandoWebhookEvent.create({
      data: {
        shop: String(e.shop),
        topic: String(e.topic),
        apiVersion: e.apiVersion ? String(e.apiVersion) : null,
        bytes: Number.isFinite(e.bytes) ? e.bytes : 0,
        hmacOk: Boolean(e.hmacOk),
        headers: e.headers ?? {},
        query: e.query ?? null,
        bodyJson: e.bodyJson ?? null,
        bodyText: e.bodyText ?? null,
        rawBody: e.rawBody ?? null,
        // receivedAt default now()
      },
    });
  } catch (_err) {
    return null;
  }
}

export async function hasWebhookEventsForShop(shop) {
  try {
    const n = await prisma.abandoWebhookEvent.count({
      where: { shop: String(shop) },
    });
    return n > 0;
  } catch (_err) {
    return false;
  }
}

export async function lastWebhookEventForShop(shop) {
  try {
    return await prisma.abandoWebhookEvent.findFirst({
      where: { shop: String(shop) },
      orderBy: { receivedAt: "desc" },
      select: { topic: true, receivedAt: true, hmacOk: true, bytes: true },
    });
  } catch (_err) {
    return null;
  }
}

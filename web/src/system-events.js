import { EventVisibility } from "@prisma/client";
import { prisma } from "./clients/prisma.js";

export async function appendSystemEvent(input) {
  return prisma.systemEvent.create({
    data: {
      shopDomain: input.shopDomain,
      eventType: input.eventType,
      visibility: input.visibility ?? EventVisibility.system,
      relatedJobId: input.relatedJobId ?? null,
      payload: input.payload ?? undefined,
    },
  });
}

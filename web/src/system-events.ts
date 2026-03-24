import { EventVisibility } from "@prisma/client";
import { prisma } from "./clients/prisma.js";
import type { AppendSystemEventInput } from "./jobs/types.js";

export async function appendSystemEvent<TPayload extends Record<string, unknown> = Record<string, unknown>>(
  input: AppendSystemEventInput<TPayload>
) {
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

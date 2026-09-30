import { prisma } from "../clients/prisma.js";
import { processDueInboundInquiryEmails } from "./automationInquiryNotifications.js";

const TICK_MS = Number(process.env.STAFFORDOS_INBOUND_EMAIL_WORKER_TICK_MS || 60_000);
let started = false;

export async function runInboundEmailRetryTick({ now = new Date(), env = process.env } = {}) {
  return processDueInboundInquiryEmails({ prisma, env, now });
}

async function tick() {
  try {
    await runInboundEmailRetryTick();
  } catch {
    // Keep PII and provider payloads out of worker logs; the ledger records
    // delivery failures and the next tick retries due rows.
    console.error("[inbound-email-worker] tick failed");
  } finally {
    setTimeout(tick, TICK_MS);
  }
}

export function startInboundEmailRetryWorker({ env = process.env } = {}) {
  if (started || String(env.STAFFORDOS_INBOUND_EMAIL_ENABLED || "").toLowerCase() !== "true") return false;
  started = true;
  tick();
  return true;
}

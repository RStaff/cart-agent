import { prisma } from "../clients/prisma.js";
import { processDueInboundInquiryEmails } from "./automationInquiryNotifications.js";

const TICK_MS = Number(process.env.STAFFORDOS_INBOUND_EMAIL_WORKER_TICK_MS || 60_000);
let started = false;
let stopped = false;
let running = false;
let timer = null;
let activeRun = null;

export async function runInboundEmailRetryTick({ now = new Date(), env = process.env } = {}) {
  return processDueInboundInquiryEmails({ prisma, env, now });
}

async function tick() {
  if (stopped || running) return;
  running = true;
  activeRun = (async () => {
  try {
    await runInboundEmailRetryTick();
  } catch {
    // Keep PII and provider payloads out of worker logs; the ledger records
    // delivery failures and the next tick retries due rows.
    console.error("[inbound-email-worker] tick failed");
  } finally {
    running = false;
    activeRun = null;
    if (!stopped) timer = setTimeout(tick, TICK_MS);
  }
  })();
  await activeRun;
}

export function startInboundEmailRetryWorker({ env = process.env } = {}) {
  if (started || stopped || String(env.STAFFORDOS_INBOUND_EMAIL_ENABLED || "").toLowerCase() !== "true") return false;
  started = true;
  tick();
  return true;
}

export async function stopInboundEmailRetryWorker() {
  stopped = true;
  if (timer) clearTimeout(timer);
  if (activeRun) await activeRun;
  await prisma.$disconnect();
}

process.once("SIGTERM", () => { stopInboundEmailRetryWorker().catch(() => {}); });
process.once("SIGINT", () => { stopInboundEmailRetryWorker().catch(() => {}); });

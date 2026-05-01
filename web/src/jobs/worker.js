import { appendRecoveryLedger } from '../lib/recoveryLedger.js';
import { prisma } from "../clients/prisma.js";
import { sendEmail } from "../lib/mailer.js";
import { renderAbandonedEmail } from "../lib/renderAbandonedEmail.js";
import { sanitizeSignalPath } from "../lib/signalPath.js";
import {
  claimNextRunnableJob,
  markJobCompleted,
  markJobFailed,
} from "./repository.js";

const POLL_INTERVAL_MS = Number(process.env.JOB_WORKER_POLL_MS || 3000);
const RUN_ONCE = process.env.JOB_WORKER_RUN_ONCE === "1";
const TEST_MODE = String(process.env.ABANDO_WORKER_TEST_MODE || "").toLowerCase() === "true";
const RECOVERY_EMAIL_SUBJECT = "Complete your checkout with Abando";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function testLog(message, payload) {
  if (!TEST_MODE) return;
  console.log(message, payload || "");
}

function deriveResumeUrl(payload, cart, shopDomain) {
  return sanitizeSignalPath(payload.signalPath, shopDomain);
}

async function upsertRecoveryEmailState({ cart, shopId, to, subject, html, status, error }) {
  const existing = await prisma.emailQueue.findFirst({
    where: {
      cartId: cart.id,
      to,
      subject,
      status: {
        in: ["queued", "sending", "sent", "failed"],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!existing) {
    return prisma.emailQueue.create({
      data: {
        shopId,
        cartId: cart.id,
        to,
        subject,
        html,
        status,
        runAt: new Date(),
        error: error ?? null,
      },
    });
  }

  return prisma.emailQueue.update({
    where: { id: existing.id },
    data: {
      html,
      status,
      runAt: new Date(),
      error: error ?? null,
      sentAt: status === "sent" ? new Date() : existing.sentAt,
      attempts: status === "sent" ? { increment: 1 } : existing.attempts,
    },
  });
}

async function processRecoveryEmailJob(job) {
  const payload = job.payload && typeof job.payload === "object" ? job.payload : {};
  const shopDomain = typeof payload.shopDomain === "string" ? payload.shopDomain.trim().toLowerCase() : "";
  const cartToken = typeof payload.cartToken === "string" ? payload.cartToken.trim() : "";

  if (!shopDomain) {
    throw new Error("invalid_payload: missing shopDomain");
  }

  if (!cartToken) {
    throw new Error("invalid_payload: missing cartToken");
  }

  const shop = await prisma.shop.findFirst({
    where: {
      OR: [
        { id: typeof payload.shopId === "string" ? payload.shopId : undefined },
        { key: shopDomain },
      ],
    },
    select: {
      id: true,
      key: true,
      emailFrom: true,
      name: true,
    },
  });

  const cart = await prisma.cart.findUnique({
    where: { cartId: cartToken },
    select: {
      id: true,
      cartId: true,
      userEmail: true,
      items: true,
      shopId: true,
    },
  });

  if (!cart) {
    throw new Error(`cart_not_found: ${cartToken}`);
  }

  if (!cart.userEmail) {
    throw new Error(`missing_cart_email: ${cartToken}`);
  }

  const existingSent = await prisma.emailQueue.findFirst({
    where: {
      cartId: cart.id,
      to: cart.userEmail,
      subject: RECOVERY_EMAIL_SUBJECT,
      status: "sent",
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingSent) {
    console.log("[job-worker][send] recovery email already sent", {
      jobId: job.id,
      emailQueueId: existingSent.id,
      cartId: cart.cartId,
    });

    await markJobCompleted({
      id: job.id,
      result: {
        emailQueueId: existingSent.id,
        deduped: true,
      },
    });
    testLog("[job-worker] job succeeded", { jobId: job.id, deduped: true });

    return;
  }

  const html = renderAbandonedEmail({
    items: Array.isArray(cart.items) ? cart.items : [],
    resumeUrl: deriveResumeUrl(payload, cart, shopDomain),
  });

  const emailQueueRecord = await upsertRecoveryEmailState({
    cart,
    shopId: cart.shopId || shop?.id || null,
    to: cart.userEmail,
    subject: RECOVERY_EMAIL_SUBJECT,
    html,
    status: "sending",
    error: null,
  });

  try {
    testLog("[job-worker] sending recovery email", {
      jobId: job.id,
      to: cart.userEmail,
      cartId: cart.cartId,
    });

    const sendResult = await sendEmail({
      to: cart.userEmail,
      subject: RECOVERY_EMAIL_SUBJECT,
      html,
      from: shop?.emailFrom || process.env.DEFAULT_FROM,
    });

    const sentRecord = await prisma.emailQueue.update({
      where: { id: emailQueueRecord.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        attempts: { increment: 1 },
        error: null,
      },
    });

    await markJobCompleted({
      id: job.id,
      result: {
        emailQueueId: sentRecord.id,
        messageId: sendResult?.id ?? null,
        subject: RECOVERY_EMAIL_SUBJECT,
      },
    });
    testLog("[job-worker] job succeeded", { jobId: job.id, emailQueueId: sentRecord.id });
  } catch (error) {
    await prisma.emailQueue.update({
      where: { id: emailQueueRecord.id },
      data: {
        status: "failed",
        attempts: { increment: 1 },
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

async function processClaimedJob(job) {
  console.log("[job-worker][claim] claimed job", {
    jobId: job.id,
    type: job.type,
    shopDomain: job.shopDomain,
  });
  testLog("[job-worker] claimed job", {
    jobId: job.id,
    type: job.type,
    shopDomain: job.shopDomain,
  });

  if (job.type !== "recovery_email") {
    await markJobFailed({
      id: job.id,
      errorKind: "unsupported_job_type",
      errorMessage: `unsupported job type: ${job.type}`,
    });
    return { outcome: "failed", reason: "unsupported_job_type" };
  }

  await processRecoveryEmailJob(job);
  return { outcome: "completed" };
}

async function runIteration() {
  const job = await claimNextRunnableJob(["recovery_email"]);

  if (!job) {
    console.log("[job-worker] idle");
    return false;
  }

  try {
    const result = await processClaimedJob(job);
    if (result?.outcome === "completed") {
      console.log("[job-worker] completed job", {
        jobId: job.id,
        type: job.type,
      });
    }
  } catch (error) {
    console.error("[job-worker] job failed", {
      jobId: job.id,
      type: job.type,
      error: error instanceof Error ? error.message : String(error),
    });

    await markJobFailed({
      id: job.id,
      errorKind: "job_execution_failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }

  return true;
}

async function main() {
  console.log("[job-worker] starting", {
    runOnce: RUN_ONCE,
    pollIntervalMs: POLL_INTERVAL_MS,
  });

  if (RUN_ONCE) {
    await runIteration();
    return;
  }

  while (true) {
    try {
      await runIteration();
    } catch (error) {
      console.error("[job-worker] loop error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

main()
  .catch((error) => {
    console.error("[job-worker] fatal", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (RUN_ONCE) {
      await prisma.$disconnect();
    }
  });

process.on("SIGINT", async () => {
  console.log("[job-worker] shutting down");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[job-worker] shutting down");
  await prisma.$disconnect();
  process.exit(0);
});

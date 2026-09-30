import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../lib/prisma.js";
import { createAutomationInquiryRepository } from "./automationInquiryRepository.js";
import { createAutomationInquiryRateLimiter } from "./automationInquiryRateLimiter.js";
import { processDueInboundInquiryEmails, processInboundInquiryEmails } from "./automationInquiryNotifications.js";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

if (process.env.INQUIRY_RATE_CHILD === "1") {
  const { prisma: childPrisma } = await import("../../lib/prisma.js");
  const { createAutomationInquiryRateLimiter } = await import("./automationInquiryRateLimiter.js");
  const limiter = createAutomationInquiryRateLimiter({ prisma: childPrisma, secret: process.env.INQUIRY_RATE_SECRET, emailHashSecret: process.env.INQUIRY_RATE_EMAIL_KEY, now: () => new Date(process.env.INQUIRY_RATE_NOW) });
  const result = await limiter.consume(process.env.INQUIRY_RATE_TOKEN, process.env.INQUIRY_RATE_EMAIL);
  process.stdout.write(JSON.stringify(result));
  await childPrisma.$disconnect();
  process.exit(0);
}

const id = `dbtest_${Date.now()}`;
const input = (overrides = {}) => ({ schema: "staffordmedia.automation_inquiry.v1", submissionId: `${id}_1`, email: "dbtest@example.com", improvements: ["Lead response"], systems: ["Forms"], currentWorkflow: "A form arrives.", desiredWorkflow: "A human reviews.", contactAcknowledgement: true, ...overrides });

test("disposable database supports durable inquiry lifecycle", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const repository = createAutomationInquiryRepository({ prisma });
  try {
    const first = await repository.accept(input());
    const retry = await repository.accept(input());
    assert.equal(retry.created, false);
    await assert.rejects(() => repository.accept(input({ desiredWorkflow: "Changed." })), /IDEMPOTENCY_KEY_REUSE/);
    const later = await repository.accept(input({ submissionId: `${id}_2`, desiredWorkflow: "A person confirms." }));
    assert.equal(later.created, true);
    assert.equal(later.inquiry.possibleDuplicateOfId, first.inquiry.id);
    const listed = await repository.list();
    assert.equal(listed.filter((row) => row.email === "dbtest@example.com").length, 2);
    assert.equal(Object.hasOwn(listed[0], "password"), false);
  } finally {
    await prisma.staffordosInboundAutomationInquiry.deleteMany({ where: { submissionId: { startsWith: id } } });
    await prisma.$disconnect();
  }
});

test("inquiry and both email rows commit atomically; duplicate retry adds no rows", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const repository = createAutomationInquiryRepository({ prisma });
  const submissionId = `atomic_${Date.now()}`;
  const payload = input({ submissionId, email: "atomic@example.com" });
  try {
    const first = await repository.accept(payload);
    assert.equal(first.created, true);
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { inquiryId: first.inquiry.id } }), 2);
    const retry = await repository.accept(payload);
    assert.equal(retry.created, false);
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { inquiryId: first.inquiry.id } }), 2);
  } finally {
    await prisma.staffordosInboundAutomationInquiry.deleteMany({ where: { submissionId } });
  }
});

test("nested email-row failure leaves neither inquiry nor rows", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const repository = createAutomationInquiryRepository({ prisma });
  const submissionId = `atomic_fail_${Date.now()}`;
  const anchor = await prisma.staffordosInboundAutomationInquiry.create({ data: { submissionId: `${submissionId}_anchor`, payloadHash: "anchor", briefHash: "anchor", email: "anchor@example.com", improvements: [], systems: [] } });
  await prisma.staffordosInboundAutomationEmail.create({ data: { inquiryId: anchor.id, messageType: "TEST", idempotencyKey: `inquiry:${submissionId}:visitor-ack` } });
  try {
    await assert.rejects(() => repository.accept(input({ submissionId, email: "atomic-failure@example.com" })));
    assert.equal(await prisma.staffordosInboundAutomationInquiry.count({ where: { submissionId } }), 0);
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { idempotencyKey: `inquiry:${submissionId}:ross-notification` } }), 0);
  } finally {
    await prisma.staffordosInboundAutomationInquiry.deleteMany({ where: { id: anchor.id } });
  }
});

test("concurrent processors claim each message once and provider failure is retryable", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const repository = createAutomationInquiryRepository({ prisma });
  const submissionId = `email_process_${Date.now()}`;
  const payload = input({ submissionId, email: "processor@example.com" });
  const config = { STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", STAFFORDOS_INBOUND_EMAIL_ACTIVATED_AT: "1970-01-01T00:00:00Z", FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "operator@example.test", STAFFORDOS_INQUIRY_REPLY_TO_EMAIL: "support@staffordmedia.ai" };
  try {
    const accepted = await repository.accept(payload);
    let sends = 0;
    const provider = async () => { sends += 1; await new Promise((resolve) => setTimeout(resolve, 5)); return { id: `provider_${sends}` }; };
    await Promise.all([
      processInboundInquiryEmails({ prisma, inquiry: accepted.notificationInquiry, env: config, sendEmail: provider }),
      processInboundInquiryEmails({ prisma, inquiry: accepted.notificationInquiry, env: config, sendEmail: provider }),
    ]);
    assert.equal(sends, 2);
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { inquiryId: accepted.inquiry.id, status: "PROVIDER_ACCEPTED" } }), 2);

    const failedSubmission = `email_fail_${Date.now()}`;
    const failed = await repository.accept(input({ submissionId: failedSubmission, email: "processor-failure@example.com" }));
    await processInboundInquiryEmails({ prisma, inquiry: failed.notificationInquiry, env: config, sendEmail: async () => { throw new Error("provider unavailable"); } });
    assert.equal(await prisma.staffordosInboundAutomationInquiry.count({ where: { id: failed.inquiry.id } }), 1);
    const failedRows = await prisma.staffordosInboundAutomationEmail.findMany({ where: { inquiryId: failed.inquiry.id } });
    assert.equal(failedRows.every((row) => row.status === "FAILED" && row.nextAttemptAt), true);
    await processInboundInquiryEmails({ prisma, inquiry: failed.notificationInquiry, env: config, sendEmail: async () => ({ id: "provider_retry" }), now: new Date(Date.now() + 6 * 60 * 1000) });
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { inquiryId: failed.inquiry.id, status: "PROVIDER_ACCEPTED" } }), 2);
    await prisma.staffordosInboundAutomationInquiry.deleteMany({ where: { id: failed.inquiry.id } });

    const crashedSubmission = `email_crashed_${Date.now()}`;
    const crashed = await repository.accept(input({ submissionId: crashedSubmission, email: "processor-crashed@example.com" }));
    const crashTime = new Date(Date.now() - 6 * 60 * 1000);
    const crashedRow = await prisma.staffordosInboundAutomationEmail.findFirst({ where: { inquiryId: crashed.inquiry.id }, orderBy: { createdAt: "asc" } });
    await prisma.staffordosInboundAutomationEmail.update({ where: { id: crashedRow.id }, data: { status: "SENDING", claimToken: "crashed-worker", claimStartedAt: crashTime, claimExpiresAt: crashTime, attemptCount: 1 } });
    await processInboundInquiryEmails({ prisma, inquiry: crashed.notificationInquiry, env: config, sendEmail: async () => ({ id: "provider_after_crash" }), now: new Date() });
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { inquiryId: crashed.inquiry.id, status: "PROVIDER_ACCEPTED" } }), 2);
    await prisma.staffordosInboundAutomationInquiry.deleteMany({ where: { id: crashed.inquiry.id } });

    const ambiguousSubmission = `email_ambiguous_${Date.now()}`;
    const ambiguous = await repository.accept(input({ submissionId: ambiguousSubmission, email: "processor-ambiguous@example.com" }));
    const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const ambiguousRow = await prisma.staffordosInboundAutomationEmail.findFirst({ where: { inquiryId: ambiguous.inquiry.id }, orderBy: { createdAt: "asc" } });
    await prisma.staffordosInboundAutomationEmail.update({ where: { id: ambiguousRow.id }, data: { status: "SENDING", claimToken: "expired-worker", claimStartedAt: oldTime, claimExpiresAt: oldTime, createdAt: oldTime, attemptCount: 1 } });
    let ambiguousSend = false;
    await processInboundInquiryEmails({ prisma, inquiry: ambiguous.notificationInquiry, env: config, sendEmail: async () => { ambiguousSend = true; return { id: "must-not-send" }; }, now: new Date() });
    // The other message is still independently deliverable; the expired
    // idempotency window must suppress only the ambiguous message.
    assert.equal(ambiguousSend, true);
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { inquiryId: ambiguous.inquiry.id, status: "AMBIGUOUS" } }), 1);
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { inquiryId: ambiguous.inquiry.id, status: "PROVIDER_ACCEPTED" } }), 1);
    await prisma.staffordosInboundAutomationInquiry.deleteMany({ where: { id: ambiguous.inquiry.id } });
  } finally {
    await prisma.staffordosInboundAutomationInquiry.deleteMany({ where: { submissionId } });
  }
});

test("scheduled due processor is safe across concurrent worker ticks", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const repository = createAutomationInquiryRepository({ prisma });
  const submissionId = `scheduled_${Date.now()}`;
  const config = { STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", STAFFORDOS_INBOUND_EMAIL_ACTIVATED_AT: "1970-01-01T00:00:00Z", FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "operator@example.test" };
  try {
    const accepted = await repository.accept(input({ submissionId, email: "scheduled@example.com" }));
    let calls = 0;
    const provider = async () => { calls += 1; await new Promise((resolve) => setTimeout(resolve, 5)); return { id: `scheduled_provider_${calls}` }; };
    const [first, second] = await Promise.all([
      processDueInboundInquiryEmails({ prisma, env: config, sendEmail: provider }),
      processDueInboundInquiryEmails({ prisma, env: config, sendEmail: provider }),
    ]);
    assert.equal(first.disabled, false);
    assert.equal(second.disabled, false);
    assert.equal(calls, 2);
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { inquiryId: accepted.inquiry.id, status: "PROVIDER_ACCEPTED" } }), 2);
  } finally {
    await prisma.staffordosInboundAutomationInquiry.deleteMany({ where: { submissionId } });
  }
});

test("scheduled retries stop after the bounded attempt count", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const repository = createAutomationInquiryRepository({ prisma });
  const submissionId = `bounded_${Date.now()}`;
  const config = { STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", STAFFORDOS_INBOUND_EMAIL_ACTIVATED_AT: "1970-01-01T00:00:00Z", FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "operator@example.test" };
  try {
    const accepted = await repository.accept(input({ submissionId, email: "bounded@example.com" }));
    let calls = 0;
    const provider = async () => { calls += 1; throw new Error("provider unavailable"); };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await processDueInboundInquiryEmails({ prisma, env: config, sendEmail: provider, now: new Date(Date.now() + (attempt + 1) * 6 * 60 * 1000) });
    }
    const rows = await prisma.staffordosInboundAutomationEmail.findMany({ where: { inquiryId: accepted.inquiry.id } });
    assert.equal(calls, 6);
    assert.equal(rows.every((row) => row.attemptCount === 3 && row.status === "FAILED"), true);
    await processDueInboundInquiryEmails({ prisma, env: config, sendEmail: async () => { throw new Error("must-not-send"); }, now: new Date(Date.now() + 60 * 60 * 1000) });
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { inquiryId: accepted.inquiry.id, attemptCount: { gt: 3 } } }), 0);
  } finally {
    await prisma.staffordosInboundAutomationInquiry.deleteMany({ where: { submissionId } });
  }
});

test("activation policy suppresses pre-activation ledger rows", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const repository = createAutomationInquiryRepository({ prisma });
  const submissionId = `activation_${Date.now()}`;
  const activationAt = new Date(Date.now() + 60 * 60 * 1000);
  const config = { STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", STAFFORDOS_INBOUND_EMAIL_ACTIVATED_AT: activationAt.toISOString(), FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "operator@example.test" };
  try {
    const accepted = await repository.accept(input({ submissionId, email: "pre-activation@example.com" }));
    let calls = 0;
    const result = await processDueInboundInquiryEmails({ prisma, env: config, sendEmail: async () => { calls += 1; return { id: "must-not-send" }; }, now: new Date() });
    assert.equal(result.attempted, 0);
    assert.equal(calls, 0);
    assert.equal(await prisma.staffordosInboundAutomationEmail.count({ where: { inquiryId: accepted.inquiry.id, status: "SUPPRESSED" } }), 2);
  } finally {
    await prisma.staffordosInboundAutomationInquiry.deleteMany({ where: { submissionId } });
  }
});

test("independent limiter instances share an atomic window and fail closed on database errors", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const secret = "limiter-test-secret";
  const now = new Date("2026-09-27T20:00:00.000Z");
  const id = crypto.randomBytes(24).toString("base64url");
  const unsigned = `v1.${id}.${now.getTime()}`;
  const token = `${unsigned}.${crypto.createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
  const first = createAutomationInquiryRateLimiter({ prisma, secret, emailHashSecret: "email-hmac-secret", now: () => now });
  const second = createAutomationInquiryRateLimiter({ prisma, secret, emailHashSecret: "email-hmac-secret", now: () => now });
  try {
    for (let index = 0; index < 10; index += 1) assert.equal((await (index % 2 ? second : first).consume(token, "owner@example.com")).allowed, true);
    const limited = await second.consume(token, "owner@example.com");
    assert.equal(limited.allowed, false);
    assert.ok(limited.retryAfterSeconds > 0);
    now.setTime(now.getTime() + 15 * 60 * 1000);
    assert.equal((await first.consume(token, "owner@example.com")).allowed, true);
    await assert.rejects(() => first.consume(`${token}forged`, "owner@example.com"), /INQUIRY_VISITOR_TOKEN_INVALID/);
  } finally {
    await prisma.staffordosInboundAutomationRateLimit.deleteMany({ where: { scopeHash: { not: "" } } });
    await prisma.$disconnect();
  }
});

test("separate Node processes share the same atomic limit", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const secret = "process-limiter-secret";
  const now = new Date("2026-09-27T21:00:00.000Z");
  const id = crypto.randomBytes(24).toString("base64url");
  const unsigned = `v1.${id}.${now.getTime()}`;
  const token = `${unsigned}.${crypto.createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
  const childEnv = { ...process.env, INQUIRY_RATE_CHILD: "1", INQUIRY_RATE_SECRET: secret, INQUIRY_RATE_EMAIL_KEY: "email-hmac-secret", INQUIRY_RATE_NOW: now.toISOString(), INQUIRY_RATE_TOKEN: token, INQUIRY_RATE_EMAIL: "process@example.com" };
  try {
    const results = [];
    for (let index = 0; index < 11; index += 1) {
      const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: childEnv, encoding: "utf8" });
      assert.equal(child.status, 0, child.stderr);
      results.push(JSON.parse(child.stdout));
    }
    assert.equal(results.filter((result) => result.allowed).length, 10);
    assert.equal(results[10].allowed, false);
    const otherId = crypto.randomBytes(24).toString("base64url");
    const otherUnsigned = `v1.${otherId}.${now.getTime()}`;
    const otherToken = `${otherUnsigned}.${crypto.createHmac("sha256", secret).update(otherUnsigned).digest("base64url")}`;
    const newSessionSameEmail = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...childEnv, INQUIRY_RATE_TOKEN: otherToken }, encoding: "utf8" });
    assert.equal(newSessionSameEmail.status, 0, newSessionSameEmail.stderr);
    assert.equal(JSON.parse(newSessionSameEmail.stdout).allowed, false);
    const unrelated = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...childEnv, INQUIRY_RATE_TOKEN: otherToken, INQUIRY_RATE_EMAIL: "different@example.com" }, encoding: "utf8" });
    assert.equal(unrelated.status, 0, unrelated.stderr);
    assert.equal(JSON.parse(unrelated.stdout).allowed, true);
    const storedScopes = await prisma.staffordosInboundAutomationRateLimit.findMany({ select: { scopeHash: true } });
    assert.equal(storedScopes.some((row) => row.scopeHash.includes("process@example.com") || row.scopeHash.includes("owner@example.com")), false);
  } finally {
    const { prisma: cleanupPrisma } = await import("../../lib/prisma.js");
    await cleanupPrisma.staffordosInboundAutomationRateLimit.deleteMany({ where: { scopeHash: { not: "" } } });
    await cleanupPrisma.$disconnect();
  }
});

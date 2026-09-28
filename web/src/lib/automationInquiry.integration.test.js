import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../lib/prisma.js";
import { createAutomationInquiryRepository } from "./automationInquiryRepository.js";
import { createAutomationInquiryRateLimiter } from "./automationInquiryRateLimiter.js";
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

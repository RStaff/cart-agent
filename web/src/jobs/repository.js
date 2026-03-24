import { JobStatus, Prisma } from "@prisma/client";
import { prisma } from "../clients/prisma.js";

export async function createJob(input) {
  return prisma.job.create({
    data: {
      type: input.type,
      shopDomain: input.shopDomain,
      idempotencyKey: input.idempotencyKey,
      payload: input.payload,
      runAt: input.runAt ?? new Date(),
      maxAttempts: input.maxAttempts ?? 5,
      status: JobStatus.queued,
    },
  });
}

export async function getJobById(id) {
  return prisma.job.findUnique({
    where: { id },
  });
}

export async function getJobByIdempotencyKey(idempotencyKey) {
  return prisma.job.findUnique({
    where: { idempotencyKey },
  });
}

export async function claimNextRunnableJob(types = null) {
  const typeFilter = Array.isArray(types) && types.length > 0
    ? Prisma.sql`AND "type" IN (${Prisma.join(types)})`
    : Prisma.empty;

  const rows = await prisma.$queryRaw(
    Prisma.sql`
      UPDATE "Job"
      SET
        "status" = CAST(${JobStatus.running} AS "JobStatus"),
        "lockedAt" = NOW(),
        "updatedAt" = NOW(),
        "errorKind" = NULL,
        "errorMessage" = NULL
      WHERE "id" = (
        SELECT "id"
        FROM "Job"
        WHERE "status" = CAST(${JobStatus.queued} AS "JobStatus")
          AND "runAt" <= NOW()
          ${typeFilter}
        ORDER BY "runAt" ASC, "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
    `,
  );

  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function markJobRunning(id, lockedAt = new Date()) {
  return prisma.job.update({
    where: { id },
    data: {
      status: JobStatus.running,
      lockedAt,
      errorKind: null,
      errorMessage: null,
    },
  });
}

export async function markJobCompleted(input) {
  return prisma.job.update({
    where: { id: input.id },
    data: {
      status: JobStatus.succeeded,
      result: input.result ?? undefined,
      completedAt: new Date(),
      failedAt: null,
      lockedAt: null,
      errorKind: null,
      errorMessage: null,
    },
  });
}

export async function markJobFailed(input) {
  const current = await prisma.job.findUnique({
    where: { id: input.id },
    select: { attempts: true, maxAttempts: true },
  });

  if (!current) return null;

  const nextAttempts = input.attempts ?? current.attempts + 1;
  const maxAttempts = input.maxAttempts ?? current.maxAttempts;
  const terminal = nextAttempts >= maxAttempts;

  return prisma.job.update({
    where: { id: input.id },
    data: {
      status: terminal ? JobStatus.dead : JobStatus.failed,
      errorKind: input.errorKind,
      errorMessage: input.errorMessage,
      attempts: nextAttempts,
      maxAttempts,
      runAt: input.retryAt ?? new Date(),
      failedAt: new Date(),
      lockedAt: null,
    },
  });
}

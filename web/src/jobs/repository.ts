import { JobStatus } from "@prisma/client";
import { prisma } from "../clients/prisma.js";
import type {
  CreateJobInput,
  MarkJobCompletedInput,
  MarkJobFailedInput,
} from "./types.js";

export async function createJob<TPayload extends Record<string, unknown>>(input: CreateJobInput<TPayload>) {
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

export async function getJobById(id: string) {
  return prisma.job.findUnique({
    where: { id },
  });
}

export async function getJobByIdempotencyKey(idempotencyKey: string) {
  return prisma.job.findUnique({
    where: { idempotencyKey },
  });
}

export async function markJobRunning(id: string, lockedAt = new Date()) {
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

export async function markJobCompleted<TResult extends Record<string, unknown>>(
  input: MarkJobCompletedInput<TResult>
) {
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

export async function markJobFailed(input: MarkJobFailedInput) {
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

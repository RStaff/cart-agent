import type { EventVisibility as PrismaEventVisibility, JobStatus as PrismaJobStatus } from "@prisma/client";

export type JobStatus = PrismaJobStatus;
export type EventVisibility = PrismaEventVisibility;

export type JobPayload = Record<string, unknown>;
export type JobResult = Record<string, unknown>;

export interface CreateJobInput<TPayload extends JobPayload = JobPayload> {
  type: string;
  shopDomain: string;
  idempotencyKey: string;
  payload: TPayload;
  runAt?: Date;
  maxAttempts?: number;
}

export interface MarkJobCompletedInput<TResult extends JobResult = JobResult> {
  id: string;
  result?: TResult;
}

export interface MarkJobFailedInput {
  id: string;
  errorKind: string;
  errorMessage: string;
  attempts?: number;
  maxAttempts?: number;
  retryAt?: Date;
}

export interface AppendSystemEventInput<TPayload extends JobPayload = JobPayload> {
  shopDomain: string;
  eventType: string;
  visibility?: EventVisibility;
  relatedJobId?: string;
  payload?: TPayload;
}

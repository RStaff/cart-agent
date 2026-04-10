import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  hydrateFollowUpState,
  initializeFollowUpStateForSubmission,
  markFollowUpSentState,
  skipFollowUpState,
  snoozeFollowUpState,
} from "../services/followups";
import type { JobSearchRecommendation, JobSearchRiskFlag } from "./jobs_repo";

export const APPLICATION_APPROVAL_STATES = [
  "pending",
  "approved",
  "skipped",
] as const;

export const APPLICATION_DRAFT_STATES = [
  "not_started",
  "drafted",
  "ready",
] as const;

export const APPLICATION_SUBMISSION_STATES = [
  "not_submitted",
  "submitted",
] as const;

export const APPLICATION_FOLLOW_UP_STATES = [
  "none",
  "due",
  "sent",
] as const;

export const APPLICATION_OUTCOME_STATES = [
  "none",
  "interview",
  "rejected",
] as const;

export const APPLICATION_QUEUE_GROUPS = [
  "pursue",
  "stretch_pursue",
  "skip",
  "approved",
  "pending",
  "drafted",
] as const;

export const APPLICATION_FOLLOW_UP_STATUSES = [
  "none",
  "due",
  "scheduled",
  "completed",
] as const;

export const APPLICATION_LAST_CONTACT_TYPES = [
  "application",
  "follow_up",
] as const;

export const APPLICATION_FOLLOW_UP_HISTORY_ACTIONS = [
  "sent",
  "snoozed",
  "skipped",
] as const;

export type ApplicationApprovalState = typeof APPLICATION_APPROVAL_STATES[number];
export type ApplicationDraftState = typeof APPLICATION_DRAFT_STATES[number];
export type ApplicationSubmissionState = typeof APPLICATION_SUBMISSION_STATES[number];
export type ApplicationFollowUpState = typeof APPLICATION_FOLLOW_UP_STATES[number];
export type ApplicationOutcomeState = typeof APPLICATION_OUTCOME_STATES[number];
export type ApplicationQueueGroup = typeof APPLICATION_QUEUE_GROUPS[number];
export type ApplicationFollowUpStatus = typeof APPLICATION_FOLLOW_UP_STATUSES[number];
export type ApplicationLastContactType = typeof APPLICATION_LAST_CONTACT_TYPES[number];
export type ApplicationFollowUpHistoryAction = typeof APPLICATION_FOLLOW_UP_HISTORY_ACTIONS[number];

export type ApplicationFollowUpHistoryEntry = {
  timestamp: string;
  note: string;
  action: ApplicationFollowUpHistoryAction;
  next_follow_up_at?: string;
};

export type DraftApplicationRecord = {
  id: string;
  job_id: string;
  company: string;
  title: string;
  recommendation: JobSearchRecommendation;
  approval_state: ApplicationApprovalState;
  draft_state: ApplicationDraftState;
  submission_state: ApplicationSubmissionState;
  follow_up_state: ApplicationFollowUpState;
  outcome_state: ApplicationOutcomeState;
  tailored_resume_markdown: string;
  selected_resume_blocks: string[];
  strongest_angles: string[];
  risk_flags: JobSearchRiskFlag[];
  score_reasoning: string;
  notes: string;
  submitted_at: string;
  next_follow_up_at: string;
  last_follow_up_at: string;
  follow_up_count: number;
  follow_up_status: ApplicationFollowUpStatus;
  follow_up_history_json: ApplicationFollowUpHistoryEntry[];
  last_contact_type: ApplicationLastContactType;
  created_at: string;
  updated_at: string;
};

export type CreateDraftApplicationInput = {
  id?: string;
  job_id: string;
  company: string;
  title: string;
  recommendation: JobSearchRecommendation;
  approval_state?: ApplicationApprovalState;
  draft_state?: ApplicationDraftState;
  submission_state?: ApplicationSubmissionState;
  follow_up_state?: ApplicationFollowUpState;
  outcome_state?: ApplicationOutcomeState;
  tailored_resume_markdown: string;
  selected_resume_blocks: string[];
  strongest_angles?: string[];
  risk_flags?: JobSearchRiskFlag[];
  score_reasoning: string;
  notes?: string;
  submitted_at?: string;
  next_follow_up_at?: string;
  last_follow_up_at?: string;
  follow_up_count?: number;
  follow_up_status?: ApplicationFollowUpStatus;
  follow_up_history_json?: ApplicationFollowUpHistoryEntry[];
  last_contact_type?: ApplicationLastContactType;
};

export type DraftApplicationSummary = Pick<
  DraftApplicationRecord,
  | "job_id"
  | "company"
  | "title"
  | "recommendation"
  | "approval_state"
  | "draft_state"
  | "strongest_angles"
  | "risk_flags"
  | "submission_state"
  | "follow_up_state"
  | "outcome_state"
> & {
  submitted_at: string;
  next_follow_up_at: string;
  follow_up_count: number;
  follow_up_status: ApplicationFollowUpStatus;
};

const MODULE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(MODULE_ROOT, "data");
export const APPLICATIONS_STATE_PATH = path.join(DATA_DIR, "applications_state.json");

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanList(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => cleanText(value))
    .filter(Boolean);
}

function cleanApprovalState(value: unknown): ApplicationApprovalState {
  const normalized = cleanText(value).toLowerCase();
  return APPLICATION_APPROVAL_STATES.includes(normalized as ApplicationApprovalState)
    ? (normalized as ApplicationApprovalState)
    : "pending";
}

function cleanDraftState(value: unknown): ApplicationDraftState {
  const normalized = cleanText(value).toLowerCase();
  return APPLICATION_DRAFT_STATES.includes(normalized as ApplicationDraftState)
    ? (normalized as ApplicationDraftState)
    : "drafted";
}

function cleanSubmissionState(value: unknown): ApplicationSubmissionState {
  const normalized = cleanText(value).toLowerCase();
  return APPLICATION_SUBMISSION_STATES.includes(normalized as ApplicationSubmissionState)
    ? (normalized as ApplicationSubmissionState)
    : "not_submitted";
}

function cleanLegacyFollowUpState(value: unknown): ApplicationFollowUpState {
  const normalized = cleanText(value).toLowerCase();
  return APPLICATION_FOLLOW_UP_STATES.includes(normalized as ApplicationFollowUpState)
    ? (normalized as ApplicationFollowUpState)
    : "none";
}

function cleanOutcomeState(value: unknown): ApplicationOutcomeState {
  const normalized = cleanText(value).toLowerCase();
  return APPLICATION_OUTCOME_STATES.includes(normalized as ApplicationOutcomeState)
    ? (normalized as ApplicationOutcomeState)
    : "none";
}

function cleanFollowUpStatus(value: unknown): ApplicationFollowUpStatus {
  const normalized = cleanText(value).toLowerCase();
  return APPLICATION_FOLLOW_UP_STATUSES.includes(normalized as ApplicationFollowUpStatus)
    ? (normalized as ApplicationFollowUpStatus)
    : "none";
}

function cleanLastContactType(value: unknown): ApplicationLastContactType {
  const normalized = cleanText(value).toLowerCase();
  return APPLICATION_LAST_CONTACT_TYPES.includes(normalized as ApplicationLastContactType)
    ? (normalized as ApplicationLastContactType)
    : "application";
}

function cleanIsoString(value: unknown) {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return "";
  }

  const timestamp = Date.parse(cleaned);
  return Number.isNaN(timestamp) ? "" : new Date(timestamp).toISOString();
}

function cleanFollowUpCount(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return Math.floor(numeric);
}

function cleanFollowUpHistory(
  value: unknown,
): ApplicationFollowUpHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const item = entry as Partial<ApplicationFollowUpHistoryEntry>;
    const timestamp = cleanIsoString(item.timestamp);
    const note = cleanText(item.note);
    const action = cleanText(item.action).toLowerCase();
    const nextFollowUpAt = cleanIsoString(item.next_follow_up_at);

    if (
      !timestamp
      || !APPLICATION_FOLLOW_UP_HISTORY_ACTIONS.includes(action as ApplicationFollowUpHistoryAction)
    ) {
      return [];
    }

    return [{
      timestamp,
      note,
      action: action as ApplicationFollowUpHistoryAction,
      ...(nextFollowUpAt ? { next_follow_up_at: nextFollowUpAt } : {}),
    }];
  });
}

function nowIsoString() {
  return new Date().toISOString();
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function buildLegacyFollowUpState(application: DraftApplicationRecord): ApplicationFollowUpState {
  if (application.submission_state !== "submitted") {
    return "none";
  }

  if (application.follow_up_count > 0 && !application.next_follow_up_at) {
    return "sent";
  }

  return application.next_follow_up_at ? "due" : "none";
}

function applyDerivedApplicationState(application: DraftApplicationRecord) {
  const hydrated = hydrateFollowUpState(application);
  return {
    ...hydrated,
    submission_state: hydrated.submitted_at ? "submitted" as const : "not_submitted" as const,
    follow_up_state: buildLegacyFollowUpState(hydrated),
  };
}

export function buildDraftApplicationId(jobId: string) {
  const cleanedJobId = cleanText(jobId);

  if (!cleanedJobId) {
    throw new Error("job_id_required_for_application");
  }

  return `application:${cleanedJobId}`;
}

export function normalizeDraftApplication(
  input: CreateDraftApplicationInput,
): DraftApplicationRecord {
  const jobId = cleanText(input.job_id);
  const company = cleanText(input.company);
  const title = cleanText(input.title);
  const tailoredResumeMarkdown = cleanText(input.tailored_resume_markdown);
  const scoreReasoning = cleanText(input.score_reasoning);

  if (!jobId) {
    throw new Error("application_job_id_required");
  }

  if (!company) {
    throw new Error("application_company_required");
  }

  if (!title) {
    throw new Error("application_title_required");
  }

  if (!tailoredResumeMarkdown) {
    throw new Error("application_tailored_resume_required");
  }

  if (!scoreReasoning) {
    throw new Error("application_score_reasoning_required");
  }

  const timestamp = nowIsoString();

  return applyDerivedApplicationState({
    id: cleanText(input.id) || buildDraftApplicationId(jobId),
    job_id: jobId,
    company,
    title,
    recommendation: input.recommendation,
    approval_state: cleanApprovalState(input.approval_state),
    draft_state: cleanDraftState(input.draft_state),
    submission_state: cleanSubmissionState(input.submission_state),
    follow_up_state: cleanLegacyFollowUpState(input.follow_up_state),
    outcome_state: cleanOutcomeState(input.outcome_state),
    tailored_resume_markdown: tailoredResumeMarkdown,
    selected_resume_blocks: cleanList(input.selected_resume_blocks),
    strongest_angles: cleanList(input.strongest_angles),
    risk_flags: cleanList(input.risk_flags) as JobSearchRiskFlag[],
    score_reasoning: scoreReasoning,
    notes: cleanText(input.notes),
    submitted_at: cleanIsoString(input.submitted_at),
    next_follow_up_at: cleanIsoString(input.next_follow_up_at),
    last_follow_up_at: cleanIsoString(input.last_follow_up_at),
    follow_up_count: cleanFollowUpCount(input.follow_up_count),
    follow_up_status: cleanFollowUpStatus(input.follow_up_status),
    follow_up_history_json: cleanFollowUpHistory(input.follow_up_history_json),
    last_contact_type: cleanLastContactType(input.last_contact_type),
    created_at: timestamp,
    updated_at: timestamp,
  });
}

export function normalizePersistedApplication(
  input: Partial<DraftApplicationRecord>,
): DraftApplicationRecord {
  const timestamp = nowIsoString();

  return applyDerivedApplicationState({
    id: cleanText(input.id) || buildDraftApplicationId(cleanText(input.job_id)),
    job_id: cleanText(input.job_id),
    company: cleanText(input.company),
    title: cleanText(input.title),
    recommendation: input.recommendation as JobSearchRecommendation,
    approval_state: cleanApprovalState(input.approval_state),
    draft_state: cleanDraftState(input.draft_state),
    submission_state: cleanSubmissionState(input.submission_state),
    follow_up_state: cleanLegacyFollowUpState(input.follow_up_state),
    outcome_state: cleanOutcomeState(input.outcome_state),
    tailored_resume_markdown: cleanText(input.tailored_resume_markdown),
    selected_resume_blocks: cleanList(input.selected_resume_blocks),
    strongest_angles: cleanList(input.strongest_angles),
    risk_flags: cleanList(input.risk_flags) as JobSearchRiskFlag[],
    score_reasoning: cleanText(input.score_reasoning),
    notes: cleanText(input.notes),
    submitted_at: cleanIsoString(input.submitted_at),
    next_follow_up_at: cleanIsoString(input.next_follow_up_at),
    last_follow_up_at: cleanIsoString(input.last_follow_up_at),
    follow_up_count: cleanFollowUpCount(input.follow_up_count),
    follow_up_status: cleanFollowUpStatus(input.follow_up_status),
    follow_up_history_json: cleanFollowUpHistory(input.follow_up_history_json),
    last_contact_type: cleanLastContactType(input.last_contact_type),
    created_at: cleanIsoString(input.created_at) || timestamp,
    updated_at: cleanIsoString(input.updated_at) || timestamp,
  });
}

export function readCanonicalApplicationsState() {
  ensureDataDir();

  if (!fs.existsSync(APPLICATIONS_STATE_PATH)) {
    return [] as DraftApplicationRecord[];
  }

  try {
    const raw = fs.readFileSync(APPLICATIONS_STATE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((application) => normalizePersistedApplication(application))
      : [];
  } catch {
    return [] as DraftApplicationRecord[];
  }
}

export function writeCanonicalApplicationsState(applications: DraftApplicationRecord[]) {
  ensureDataDir();
  const normalized = applications.map((application) => normalizePersistedApplication(application));
  fs.writeFileSync(APPLICATIONS_STATE_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}

export function createDraftApplication(
  existingApplications: DraftApplicationRecord[],
  input: CreateDraftApplicationInput,
) {
  const normalized = normalizeDraftApplication(input);
  const existing = existingApplications.find((application) => application.job_id === normalized.job_id);

  if (existing) {
    return {
      status: "existing" as const,
      application: applyDerivedApplicationState({
        ...existing,
        ...normalized,
        id: existing.id,
        created_at: existing.created_at,
        updated_at: nowIsoString(),
      }),
    };
  }

  return {
    status: "created" as const,
    application: normalized,
  };
}

export function upsertApplication(
  applications: DraftApplicationRecord[],
  nextApplication: DraftApplicationRecord,
) {
  const existingIndex = applications.findIndex((application) => application.job_id === nextApplication.job_id);

  if (existingIndex === -1) {
    return [...applications, normalizePersistedApplication(nextApplication)];
  }

  const nextApplications = [...applications];
  nextApplications[existingIndex] = normalizePersistedApplication(nextApplication);
  return nextApplications;
}

export function saveCanonicalApplication(nextApplication: DraftApplicationRecord) {
  const applications = readCanonicalApplicationsState();
  const nextApplications = upsertApplication(applications, nextApplication);
  writeCanonicalApplicationsState(nextApplications);
  return normalizePersistedApplication(nextApplication);
}

export function updateApplicationApprovalState(
  application: DraftApplicationRecord,
  approvalState: ApplicationApprovalState,
) {
  const nextApprovalState = cleanApprovalState(approvalState);
  const nextDraftState =
    nextApprovalState === "approved"
      ? "ready"
      : application.draft_state;

  return applyDerivedApplicationState({
    ...application,
    approval_state: nextApprovalState,
    draft_state: nextDraftState,
    updated_at: nowIsoString(),
  });
}

export function markApplicationDraftReady(application: DraftApplicationRecord) {
  return applyDerivedApplicationState({
    ...application,
    draft_state: "ready" as ApplicationDraftState,
    updated_at: nowIsoString(),
  });
}

export function updateApplicationNotes(
  application: DraftApplicationRecord,
  notes: string,
) {
  return applyDerivedApplicationState({
    ...application,
    notes: cleanText(notes),
    updated_at: nowIsoString(),
  });
}

export function markApplicationSubmitted(
  application: DraftApplicationRecord,
  submittedAt = nowIsoString(),
) {
  return applyDerivedApplicationState(
    initializeFollowUpStateForSubmission(application, submittedAt),
  );
}

export function markApplicationFollowUpSent(
  application: DraftApplicationRecord,
  note = "",
) {
  return applyDerivedApplicationState(markFollowUpSentState(application, note));
}

export function snoozeApplicationFollowUp(
  application: DraftApplicationRecord,
  businessDays: number,
  note = "",
) {
  return applyDerivedApplicationState(snoozeFollowUpState(application, businessDays, note));
}

export function skipApplicationFollowUp(
  application: DraftApplicationRecord,
  note = "",
) {
  return applyDerivedApplicationState(skipFollowUpState(application, note));
}

export function fetchApplicationsByStatus(
  applications: DraftApplicationRecord[],
  status: ApplicationApprovalState | ApplicationDraftState | ApplicationSubmissionState | ApplicationFollowUpState | ApplicationOutcomeState,
) {
  return applications.filter((application) =>
    application.approval_state === status
    || application.draft_state === status
    || application.submission_state === status
    || application.follow_up_state === status
    || application.outcome_state === status
  );
}

export function fetchApplicationByJobId(
  applications: DraftApplicationRecord[],
  jobId: string,
) {
  const cleanedJobId = cleanText(jobId);
  return applications.find((application) => application.job_id === cleanedJobId) || null;
}

export function buildDraftApplicationSummary(
  application: DraftApplicationRecord,
): DraftApplicationSummary {
  return {
    job_id: application.job_id,
    company: application.company,
    title: application.title,
    recommendation: application.recommendation,
    approval_state: application.approval_state,
    draft_state: application.draft_state,
    strongest_angles: application.strongest_angles,
    risk_flags: application.risk_flags,
    submission_state: application.submission_state,
    follow_up_state: application.follow_up_state,
    outcome_state: application.outcome_state,
    submitted_at: application.submitted_at,
    next_follow_up_at: application.next_follow_up_at,
    follow_up_count: application.follow_up_count,
    follow_up_status: application.follow_up_status,
  };
}

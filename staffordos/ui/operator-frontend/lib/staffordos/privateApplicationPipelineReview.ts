import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";
import {
  PRIVATE_APPLICATION_EVENT_SCHEMA_VERSION,
  PRIVATE_APPLICATION_PIPELINE_SCHEMA_VERSION,
  PRIVATE_APPLICATION_SCHEMA_VERSION,
  type ApplicationEventType,
  type ApplicationStatus,
  type EmployerResponseStatus,
  type FutureApplicationReadModelRecord,
  type PrivateApplicationConfirmationNeeded,
  type PrivateApplicationEventRecord,
  type PrivateApplicationPipelineSummary,
  type PrivateApplicationRecord,
  type PrivateFollowUpReviewTask,
  type SubmittedAtPrecision,
} from "./manualApplicationEventTracking";

export const PRIVATE_APPLICATION_PIPELINE_REVIEW_VERSION = "J001.05B";
export const PRIVATE_DAILY_JOB_SEARCH_COMMAND_SCHEMA_VERSION =
  "staffordos.job_search.private_daily_job_search_command.v1";
export const PRIVATE_PIPELINE_REVIEW_DECISION_SCHEMA_VERSION =
  "staffordos.job_search.private_pipeline_review_decision.v1";
export const PRIVATE_PIPELINE_REVIEW_AUDIT_SCHEMA_VERSION =
  "staffordos.job_search.private_application_pipeline_review_audit.v1";

export const PIPELINE_REVIEW_DECISION_TYPES = [
  "CONTINUE_MONITORING",
  "PREPARE_FOLLOW_UP_DRAFT",
  "REVIEW_EMPLOYER_GUIDANCE",
  "RECORD_RECRUITER_RESPONSE",
  "CLOSE_FOLLOW_UP",
  "DEFER",
  "PREPARE_INTERVIEW_EVIDENCE",
  "RECORD_SCREENING",
  "RECORD_INTERVIEW",
  "RECORD_REJECTION",
  "RECORD_OFFER",
  "RECORD_WITHDRAWAL",
  "RECORD_CLOSED",
  "RESOLVE_CONFIRMATION",
  "CONFIRM_RESUME_USED",
] as const;

const DEFAULT_JOB_SEARCH_PRIVATE_ROOT = path.join(
  homedir(),
  ".staffordos/private/professional/job-search",
);

export type PipelineReviewDecisionType = (typeof PIPELINE_REVIEW_DECISION_TYPES)[number];
export type PipelineReviewActionStatus =
  | "OPEN"
  | "DUE"
  | "NOT_DUE"
  | "NEEDS_OPERATOR_CONFIRMATION"
  | "PREPARATION"
  | "RECORD_OUTCOME";

export type PrivateApplicationPipelineStore = {
  applications: PrivateApplicationRecord[];
  applicationEvents: PrivateApplicationEventRecord[];
  followUpReviews: PrivateFollowUpReviewTask[];
  confirmationNeeded: PrivateApplicationConfirmationNeeded[];
};

export type PrivatePipelineReviewAction = {
  actionId: string;
  applicationId: string | null;
  confirmationRecordId: string | null;
  followUpId: string | null;
  title: string;
  reason: string;
  priorityTier: number;
  status: PipelineReviewActionStatus;
  dueDate: string | null;
  reviewDate: string | null;
  submittedDate: string | null;
  daysSinceSubmission: number | null;
  employerResponseStatus: EmployerResponseStatus | "UNKNOWN";
  currentStage: ApplicationStatus | "NEEDS_OPERATOR_CONFIRMATION" | "UNKNOWN";
  known: string[];
  unknown: string[];
  whatRossShouldDo: string;
  authorityRequired: "ROSS_CONFIRMATION" | "ROSS_APPROVAL";
  completionProof: string;
  allowedActions: PipelineReviewDecisionType[];
  communicationAllowed: false;
  operatorApprovalRequired: true;
  limitations: string[];
  privatePathVisible: false;
};

export type PrivateApplicationPipelineReviewDecision = {
  schemaVersion: typeof PRIVATE_PIPELINE_REVIEW_DECISION_SCHEMA_VERSION;
  decisionId: string;
  workspaceId: "professional";
  actionId: string;
  applicationId: string | null;
  confirmationRecordId: string | null;
  followUpId: string | null;
  decisionType: PipelineReviewDecisionType;
  operatorConfirmed: true;
  operatorContext: string | null;
  employerProvidedReason: string | null;
  createdAt: string;
  supersedesDecisionId: string | null;
  sourceAuthority: "ROSS_OPERATOR_DECISION";
  privacy: "Professional owner-private";
  applicationSubmitted: false;
  messageSent: false;
  resumeMutated: false;
  externalProviderContacted: false;
  externalAiInvoked: false;
  limitations: string[];
};

export type PrivateDailyJobSearchCommand = {
  schemaVersion: typeof PRIVATE_DAILY_JOB_SEARCH_COMMAND_SCHEMA_VERSION;
  workflowVersion: typeof PRIVATE_APPLICATION_PIPELINE_REVIEW_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  primaryNextAction: PrivatePipelineReviewAction | null;
  applicationsNeedingAttention: PrivatePipelineReviewAction[];
  followUpsDue: PrivatePipelineReviewAction[];
  interviewsOrRecruiterContact: PrivatePipelineReviewAction[];
  confirmationNeeded: PrivatePipelineReviewAction[];
  submittedApplications: Array<{
    applicationId: string;
    company: string;
    role: string;
    submittedDate: string | null;
    currentStage: ApplicationStatus;
    employerResponseStatus: EmployerResponseStatus;
    nextReviewDate: string | null;
  }>;
  recentOutcomes: Array<{
    eventId: string;
    applicationId: string;
    eventType: ApplicationEventType;
    occurredAt: string | null;
  }>;
  evidencePositioningTasks: PrivatePipelineReviewAction[];
  pipelineSummary: PrivateApplicationPipelineSummary;
  searchHealth: {
    activeSubmittedApplications: number;
    awaitingEmployerResponse: number;
    followUpReviewsDue: number;
    applicationsNeedingOperatorConfirmation: number;
    interviewsActive: number;
    recentOutcomes: number;
    descriptiveSummary: string;
    vanityMetricGenerated: false;
    successProbabilityGenerated: false;
  };
  noEmployerSuccessProbability: true;
  privatePathVisible: false;
  limitations: string[];
};

export type PrivateApplicationPipelineReviewResult = {
  schemaVersion: typeof PRIVATE_PIPELINE_REVIEW_AUDIT_SCHEMA_VERSION;
  workflowVersion: typeof PRIVATE_APPLICATION_PIPELINE_REVIEW_VERSION;
  generatedAt: string;
  loaded: {
    applications: number;
    applicationEvents: number;
    followUpReviews: number;
    confirmationNeeded: number;
  };
  dailyCommand: PrivateDailyJobSearchCommand;
  nextActions: PrivatePipelineReviewAction[];
  decisions: PrivateApplicationPipelineReviewDecision[];
  generatedApplicationEvents: PrivateApplicationEventRecord[];
  followUpReviewDecisions: PrivateApplicationPipelineReviewDecision[];
  confirmationDecisions: PrivateApplicationPipelineReviewDecision[];
  futureReadModel: FutureApplicationReadModelRecord[];
  auditSummary: {
    noApplicationSubmitted: true;
    noMessageSent: true;
    noResumeMutated: true;
    noLinkedInMutated: true;
    noExternalProviderCall: true;
    noExternalAi: true;
    noOllama: true;
    noApiCreated: true;
    noDatabaseCreated: true;
    noOsConnection: true;
    noOperatorRouteCreated: true;
    applicationHistoryAppendOnly: true;
    privatePathVisible: false;
  };
};

export type ApplicationLifecycleProjection = {
  applicationId: string;
  currentStage: ApplicationStatus;
  employerResponseStatus: EmployerResponseStatus;
  latestOutcomeEventId: string | null;
  latestOutcomeEventType: ApplicationEventType | null;
  sourceAuthority: "APPLICATION_EVENT_HISTORY" | "APPLICATION_RECORD";
  applicationRecordMutated: false;
};

export type PrivateApplicationPipelineDecisionRunResult = {
  result: PrivateApplicationPipelineReviewResult;
  decision: PrivateApplicationPipelineReviewDecision | null;
  generatedApplicationEvents: PrivateApplicationEventRecord[];
  storeAfterDecision: PrivateApplicationPipelineStore;
  writeResult: ReturnType<typeof writePrivateApplicationPipelineReviewOutputs> | null;
  eventWriteResult: {
    runDirectory: string;
    artifactNames: string[];
    writtenFiles: string[];
    privatePathVisible: false;
  } | null;
  blockedReason: string | null;
  noExternalAction: true;
  noApplicationSubmitted: true;
  noMessageSent: true;
  noBrowserAutomation: true;
  noExternalAi: true;
};

type JsonRecord = Record<string, unknown>;

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function opaqueId(prefix: string, parts: readonly unknown[]) {
  return `${prefix}_${sha256Text(parts.map((part) => String(part ?? "")).join("|")).slice(0, 18)}`;
}

function compactDate(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 12);
}

function isInsideDirectory(candidatePath: string, parentPath: string) {
  const resolvedCandidate = path.resolve(candidatePath);
  const resolvedParent = path.resolve(parentPath);
  return resolvedCandidate === resolvedParent || resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`);
}

function assertOutsideRepository(directory: string, repositoryRoot: string, label: string) {
  if (!directory || isInsideDirectory(directory, repositoryRoot)) {
    throw new Error(`${label} must be outside the repository.`);
  }
}

function ensurePrivateDirectory(directory: string) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  chmodSync(filePath, 0o600);
}

function walkJsonFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const filePath = path.join(directory, entry);
    const stat = statSync(filePath);
    if (stat.isDirectory()) files.push(...walkJsonFiles(filePath));
    if (stat.isFile() && entry.endsWith(".json")) files.push(filePath);
  }
  return files;
}

function asRecord(value: unknown): JsonRecord | null {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) ? (value as JsonRecord) : null;
}

function arrayPayload(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) {
    return value.map(asRecord).filter((record): record is JsonRecord => record !== null);
  }
  const record = asRecord(value);
  if (!record) return [];
  for (const key of ["applications", "applicationEvents", "followUpReviews", "confirmationNeeded", "records"]) {
    if (Array.isArray(record[key])) {
      return (record[key] as unknown[]).map(asRecord).filter((entry): entry is JsonRecord => entry !== null);
    }
  }
  return [record];
}

function uniqueBy<T>(items: readonly T[], getKey: (item: T) => string | null | undefined) {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = getKey(item);
    if (key) map.set(key, item);
  }
  return [...map.values()];
}

function datePart(value: string | null | undefined) {
  if (!value) return null;
  const candidate = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}

function dateToUtcNoon(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function daysBetween(startDate: string | null, endDate: string) {
  if (!startDate) return null;
  const start = dateToUtcNoon(startDate);
  const end = dateToUtcNoon(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
}

function isTerminalStage(stage: ApplicationStatus) {
  return ["REJECTED_BY_EMPLOYER", "WITHDRAWN", "CLOSED"].includes(stage);
}

function requiresInterviewOrRecruiterAction(stage: ApplicationStatus) {
  return ["RECRUITER_CONTACT", "SCREENING", "INTERVIEW", "FINAL_INTERVIEW", "OFFER"].includes(stage);
}

function outcomeEvent(event: PrivateApplicationEventRecord) {
  return [
    "RECRUITER_CONTACT_RECORDED",
    "SCREENING_RECORDED",
    "INTERVIEW_SCHEDULED",
    "INTERVIEW_COMPLETED",
    "EMPLOYER_REJECTION_RECORDED",
    "OFFER_RECORDED",
    "WITHDRAWAL_RECORDED",
    "APPLICATION_CLOSED",
  ].includes(event.eventType);
}

function lifecycleEventSortKey(event: PrivateApplicationEventRecord) {
  return [event.occurredAt || "", event.createdAt || "", event.eventId].join("|");
}

function latestOutcomeEventFor(
  applicationId: string,
  events: readonly PrivateApplicationEventRecord[],
): PrivateApplicationEventRecord | null {
  return events
    .filter((event) => event.applicationId === applicationId && outcomeEvent(event))
    .sort((left, right) => lifecycleEventSortKey(right).localeCompare(lifecycleEventSortKey(left)))[0] || null;
}

function stageForOutcomeEvent(event: PrivateApplicationEventRecord): ApplicationStatus {
  if (event.eventType === "RECRUITER_CONTACT_RECORDED") return "RECRUITER_CONTACT";
  if (event.eventType === "SCREENING_RECORDED") return "SCREENING";
  if (event.eventType === "INTERVIEW_SCHEDULED" || event.eventType === "INTERVIEW_COMPLETED") return "INTERVIEW";
  if (event.eventType === "OFFER_RECORDED") return "OFFER";
  if (event.eventType === "EMPLOYER_REJECTION_RECORDED") return "REJECTED_BY_EMPLOYER";
  if (event.eventType === "WITHDRAWAL_RECORDED") return "WITHDRAWN";
  if (event.eventType === "APPLICATION_CLOSED") return "CLOSED";
  return "SUBMITTED_MANUAL_EXTERNAL";
}

function responseForOutcomeEvent(event: PrivateApplicationEventRecord): EmployerResponseStatus {
  if (event.eventType === "RECRUITER_CONTACT_RECORDED" || event.eventType === "SCREENING_RECORDED") return "RESPONDED";
  if (event.eventType === "INTERVIEW_SCHEDULED" || event.eventType === "INTERVIEW_COMPLETED") return "INTERVIEW_REQUESTED";
  if (event.eventType === "OFFER_RECORDED") return "OFFER";
  if (event.eventType === "EMPLOYER_REJECTION_RECORDED") return "REJECTED";
  if (event.eventType === "WITHDRAWAL_RECORDED" || event.eventType === "APPLICATION_CLOSED") return "RESPONDED";
  return "NONE_RECORDED";
}

export function projectApplicationLifecycle(input: {
  application: PrivateApplicationRecord;
  events: readonly PrivateApplicationEventRecord[];
}): ApplicationLifecycleProjection {
  const latest = latestOutcomeEventFor(input.application.applicationId, input.events);
  if (!latest) {
    return {
      applicationId: input.application.applicationId,
      currentStage: input.application.currentStage,
      employerResponseStatus: input.application.employerResponseStatus,
      latestOutcomeEventId: null,
      latestOutcomeEventType: null,
      sourceAuthority: "APPLICATION_RECORD",
      applicationRecordMutated: false,
    };
  }
  return {
    applicationId: input.application.applicationId,
    currentStage: stageForOutcomeEvent(latest),
    employerResponseStatus: responseForOutcomeEvent(latest),
    latestOutcomeEventId: latest.eventId,
    latestOutcomeEventType: latest.eventType,
    sourceAuthority: "APPLICATION_EVENT_HISTORY",
    applicationRecordMutated: false,
  };
}

function projectApplicationForLifecycle(input: {
  application: PrivateApplicationRecord;
  events: readonly PrivateApplicationEventRecord[];
}): PrivateApplicationRecord {
  const projection = projectApplicationLifecycle(input);
  if (projection.sourceAuthority !== "APPLICATION_EVENT_HISTORY") return input.application;
  return {
    ...input.application,
    currentStage: projection.currentStage,
    employerResponseStatus: projection.employerResponseStatus,
    limitations: uniqueBy(
      [
        ...input.application.limitations,
        "Current lifecycle stage is projected from append-only ApplicationEvent history; the original Application record content is not mutated.",
      ],
      (item) => item,
    ),
  };
}

function projectStoreForLifecycle(store: PrivateApplicationPipelineStore): PrivateApplicationPipelineStore {
  return {
    ...store,
    applications: store.applications.map((application) =>
      projectApplicationForLifecycle({ application, events: store.applicationEvents }),
    ),
  };
}

function actionSortKey(action: PrivatePipelineReviewAction) {
  return [
    String(action.priorityTier).padStart(2, "0"),
    action.dueDate || action.reviewDate || "9999-99-99",
    action.submittedDate || "9999-99-99",
    action.actionId,
  ].join("|");
}

function appLabel(application: PrivateApplicationRecord) {
  return `${application.companyReference.label} - ${application.roleReference.title}`;
}

function pushUniqueAction(actions: PrivatePipelineReviewAction[], action: PrivatePipelineReviewAction) {
  if (!actions.some((existing) => existing.actionId === action.actionId)) actions.push(action);
}

function buildPipelineSummary(input: {
  applications: readonly PrivateApplicationRecord[];
  followUps: readonly PrivateFollowUpReviewTask[];
  confirmations: readonly PrivateApplicationConfirmationNeeded[];
  generatedAt: string;
}): PrivateApplicationPipelineSummary {
  const today = input.generatedAt.slice(0, 10);
  return {
    schemaVersion: PRIVATE_APPLICATION_PIPELINE_SCHEMA_VERSION,
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    submittedApplications: input.applications.filter((app) => app.status === "SUBMITTED_MANUAL_EXTERNAL").length,
    followUpReviewsDue: input.followUps.filter((task) => task.reviewDate !== null && task.reviewDate <= today).length,
    recruiterResponses: input.applications.filter((app) => app.currentStage === "RECRUITER_CONTACT").length,
    screenings: input.applications.filter((app) => app.currentStage === "SCREENING").length,
    interviews: input.applications.filter((app) => app.currentStage === "INTERVIEW" || app.currentStage === "FINAL_INTERVIEW").length,
    offers: input.applications.filter((app) => app.currentStage === "OFFER").length,
    rejections: input.applications.filter((app) => app.currentStage === "REJECTED_BY_EMPLOYER").length,
    closedApplications: input.applications.filter((app) => app.currentStage === "CLOSED").length,
    applicationsNeedingOperatorConfirmation: input.confirmations.length,
    conversionRatesAvailable: false,
    limitations: [
      "Pipeline counts reflect recorded private Application records only.",
      "No conversion rate, employer interest, fit, interview probability, or outcome is inferred.",
    ],
  };
}

function futureReadModelFor(application: PrivateApplicationRecord, generatedAt: string): FutureApplicationReadModelRecord {
  return {
    applicationId: application.applicationId,
    workspaceId: "professional",
    company: application.companyReference.label,
    role: application.roleReference.title,
    submittedDate: datePart(application.submittedAt),
    currentStage: application.currentStage,
    employerResponseStatus: application.employerResponseStatus,
    nextAction: application.nextAction.what,
    nextReviewDate: application.nextReviewAt,
    capturedAsOf: generatedAt,
    limitations: [
      "Prepared for future authorized Professional read model only.",
      "Not connected to any route, API, provider, browser storage, or database.",
      "Private filesystem paths, raw resumes, raw cover letters, portal credentials, and private contacts are excluded.",
    ],
    privatePathVisible: false,
    rawResumeVisible: false,
    rawCoverLetterVisible: false,
    portalCredentialsVisible: false,
    recruiterContactVisible: false,
    connectedToOs: false,
  };
}

function buildStageAction(application: PrivateApplicationRecord, generatedAt: string): PrivatePipelineReviewAction | null {
  if (!requiresInterviewOrRecruiterAction(application.currentStage)) return null;
  const submittedDate = datePart(application.submittedAt);
  const today = generatedAt.slice(0, 10);
  return {
    actionId: opaqueId("privpipeaction", [application.applicationId, "stage", application.currentStage]),
    applicationId: application.applicationId,
    confirmationRecordId: null,
    followUpId: null,
    title:
      application.currentStage === "OFFER"
        ? `Review offer authority for ${appLabel(application)}`
        : `Prepare response for ${application.currentStage.toLowerCase().replace(/_/g, " ")}: ${appLabel(application)}`,
    reason: "Interview, recruiter, screening, or offer states outrank routine monitoring.",
    priorityTier: 1,
    status: "RECORD_OUTCOME",
    dueDate: today,
    reviewDate: today,
    submittedDate,
    daysSinceSubmission: daysBetween(submittedDate, today),
    employerResponseStatus: application.employerResponseStatus,
    currentStage: application.currentStage,
    known: [
      `Application stage is ${application.currentStage}.`,
      `Employer response status is ${application.employerResponseStatus}.`,
    ],
    unknown: ["Any unrecorded response detail remains unknown until Ross records it."],
    whatRossShouldDo: "Record the real outcome or prepare interview evidence. No outside action is taken by this command.",
    authorityRequired: "ROSS_APPROVAL",
    completionProof: "Ross records the actual response, interview state, offer state, or a preparation decision.",
    allowedActions:
      application.currentStage === "OFFER"
        ? ["RECORD_OFFER", "DEFER"]
        : ["PREPARE_INTERVIEW_EVIDENCE", "RECORD_RECRUITER_RESPONSE", "RECORD_SCREENING", "RECORD_INTERVIEW", "DEFER"],
    communicationAllowed: false,
    operatorApprovalRequired: true,
    limitations: [
      "No recruiter message, employer reply, acceptance, rejection, withdrawal, or interview scheduling is performed.",
    ],
    privatePathVisible: false,
  };
}

function buildRecordOutcomeAction(application: PrivateApplicationRecord, generatedAt: string): PrivatePipelineReviewAction | null {
  if (application.status !== "SUBMITTED_MANUAL_EXTERNAL") return null;
  if (isTerminalStage(application.currentStage)) return null;
  const submittedDate = datePart(application.submittedAt);
  const today = generatedAt.slice(0, 10);
  return {
    actionId: opaqueId("privpipeaction", [application.applicationId, "record-external-outcome"]),
    applicationId: application.applicationId,
    confirmationRecordId: null,
    followUpId: null,
    title: `Record external response or outcome for ${appLabel(application)}`,
    reason: "A response can arrive before a follow-up is due; recording it requires explicit Ross confirmation.",
    priorityTier: 8,
    status: "RECORD_OUTCOME",
    dueDate: null,
    reviewDate: application.nextReviewAt,
    submittedDate,
    daysSinceSubmission: daysBetween(submittedDate, today),
    employerResponseStatus: application.employerResponseStatus,
    currentStage: application.currentStage,
    known: [
      `Application stage is ${application.currentStage}.`,
      `Employer response state is ${application.employerResponseStatus}.`,
    ],
    unknown: ["No new employer response, rejection, interview, offer, withdrawal, or closure is inferred."],
    whatRossShouldDo: "Record only a response or outcome that happened outside CareerOS.",
    authorityRequired: "ROSS_CONFIRMATION",
    completionProof: "An append-only ApplicationEvent records the confirmed external response or outcome.",
    allowedActions: [
      "RECORD_RECRUITER_RESPONSE",
      "RECORD_SCREENING",
      "RECORD_INTERVIEW",
      "RECORD_REJECTION",
      "RECORD_OFFER",
      "RECORD_WITHDRAWAL",
      "RECORD_CLOSED",
      "DEFER",
    ],
    communicationAllowed: false,
    operatorApprovalRequired: true,
    limitations: [
      "No rejection, response, interview, offer, withdrawal, closure, or employer intent is inferred from silence.",
      "No email, message, calendar, provider, browser, or external AI action is available.",
    ],
    privatePathVisible: false,
  };
}

function buildFollowUpAction(
  application: PrivateApplicationRecord,
  followUp: PrivateFollowUpReviewTask,
  generatedAt: string,
): PrivatePipelineReviewAction {
  const today = generatedAt.slice(0, 10);
  const submittedDate = datePart(application.submittedAt);
  const due = Boolean(followUp.reviewDate && followUp.reviewDate <= today);
  return {
    actionId: opaqueId("privpipeaction", [application.applicationId, followUp.followUpId, due ? "due" : "not-due"]),
    applicationId: application.applicationId,
    confirmationRecordId: null,
    followUpId: followUp.followUpId,
    title: `${due ? "Review" : "Monitor"} follow-up timing for ${appLabel(application)}`,
    reason: due
      ? "A follow-up review date is due or past due, but no message is authorized."
      : "A follow-up review exists but is not due yet.",
    priorityTier: due ? 2 : 8,
    status: due ? "DUE" : "NOT_DUE",
    dueDate: followUp.reviewDate,
    reviewDate: followUp.reviewDate,
    submittedDate,
    daysSinceSubmission: daysBetween(submittedDate, today),
    employerResponseStatus: application.employerResponseStatus,
    currentStage: application.currentStage,
    known: [
      `Submitted date: ${submittedDate || "UNKNOWN"}.`,
      `Employer response state: ${application.employerResponseStatus}.`,
      `Communication allowed: ${followUp.communicationAllowed}.`,
      `Operator approval required: ${followUp.operatorApprovalRequired}.`,
    ],
    unknown: [
      followUp.employerGuidance === "Unknown; employer or recruiter instructions override generic timing."
        ? "Specific employer guidance is unknown."
        : "No unknown employer guidance was recorded.",
      application.submittedAt ? "Exact submission time remains unknown unless recorded." : "Submission date is unknown.",
    ],
    whatRossShouldDo: due
      ? "Choose whether to keep monitoring, prepare a draft for later approval, record a response, or defer."
      : "Continue monitoring until the review date or a real employer response is recorded.",
    authorityRequired: "ROSS_APPROVAL",
    completionProof: "A follow-up review decision or employer response event is recorded privately.",
    allowedActions: due
      ? [
          "CONTINUE_MONITORING",
          "PREPARE_FOLLOW_UP_DRAFT",
          "REVIEW_EMPLOYER_GUIDANCE",
          "RECORD_RECRUITER_RESPONSE",
          "CLOSE_FOLLOW_UP",
          "DEFER",
          "PREPARE_INTERVIEW_EVIDENCE",
        ]
      : ["CONTINUE_MONITORING", "DEFER"],
    communicationAllowed: false,
    operatorApprovalRequired: true,
    limitations: [
      "Follow-up review does not authorize communication.",
      "No employer response, recruiter interest, or rejection reason is inferred.",
    ],
    privatePathVisible: false,
  };
}

function buildConfirmationAction(confirmation: PrivateApplicationConfirmationNeeded): PrivatePipelineReviewAction {
  return {
    actionId: opaqueId("privpipeaction", [confirmation.confirmationRecordId, "resolve-confirmation"]),
    applicationId: null,
    confirmationRecordId: confirmation.confirmationRecordId,
    followUpId: null,
    title: `Resolve application confirmation: ${confirmation.companyName || "UNKNOWN"} - ${confirmation.roleTitle || "UNKNOWN"}`,
    reason: "A candidate application is missing critical facts and cannot become an Application record yet.",
    priorityTier: 3,
    status: "NEEDS_OPERATOR_CONFIRMATION",
    dueDate: null,
    reviewDate: null,
    submittedDate: null,
    daysSinceSubmission: null,
    employerResponseStatus: "UNKNOWN",
    currentStage: "NEEDS_OPERATOR_CONFIRMATION",
    known: [
      `Missing fields: ${confirmation.missingRequiredFields.join(", ")}.`,
      "No Application record exists for this candidate.",
    ],
    unknown: confirmation.conciseQuestions,
    whatRossShouldDo: "Confirm only the minimum fields needed: exact role, whether submission occurred, date, channel, and resume used if known.",
    authorityRequired: "ROSS_CONFIRMATION",
    completionProof: "Ross supplies the missing facts and a later governed command creates or rejects the Application record.",
    allowedActions: ["RESOLVE_CONFIRMATION", "DEFER"],
    communicationAllowed: false,
    operatorApprovalRequired: true,
    limitations: [
      "No Application is created until operator confirmation is sufficient.",
      "Partial context is preserved without inference.",
    ],
    privatePathVisible: false,
  };
}

function buildMissingApplicationConfirmationAction(
  application: PrivateApplicationRecord,
  generatedAt: string,
): PrivatePipelineReviewAction | null {
  const missing: string[] = [];
  if (!application.submittedAt || application.submittedAtPrecision === "UNKNOWN") missing.push("submission date");
  if (!application.submissionChannel) missing.push("submission channel");
  if (application.resumeReference.status === "UNKNOWN") missing.push("resume used");
  if (missing.length === 0) return null;
  const submittedDate = datePart(application.submittedAt);
  const today = generatedAt.slice(0, 10);
  return {
    actionId: opaqueId("privpipeaction", [application.applicationId, "missing-critical-confirmation", missing.join(",")]),
    applicationId: application.applicationId,
    confirmationRecordId: null,
    followUpId: null,
    title: `Confirm missing application details for ${appLabel(application)}`,
    reason: "The Application exists, but critical tracking facts are still unknown.",
    priorityTier: 3,
    status: "NEEDS_OPERATOR_CONFIRMATION",
    dueDate: null,
    reviewDate: application.nextReviewAt,
    submittedDate,
    daysSinceSubmission: daysBetween(submittedDate, today),
    employerResponseStatus: application.employerResponseStatus,
    currentStage: application.currentStage,
    known: [`Application status is ${application.status}.`, "StaffordOS did not submit it."],
    unknown: missing,
    whatRossShouldDo: "Record only the missing tracking details if known; otherwise defer without inventing them.",
    authorityRequired: "ROSS_CONFIRMATION",
    completionProof: "Missing Application tracking details are confirmed or explicitly deferred.",
    allowedActions: ["RESOLVE_CONFIRMATION", "CONFIRM_RESUME_USED", "DEFER"],
    communicationAllowed: false,
    operatorApprovalRequired: true,
    limitations: [
      "Unknown values stay unknown.",
      "Resume reference does not verify Career truth.",
      "No duplicate Application is created.",
    ],
    privatePathVisible: false,
  };
}

function buildPreparationAction(application: PrivateApplicationRecord, generatedAt: string): PrivatePipelineReviewAction | null {
  if (application.status !== "SUBMITTED_MANUAL_EXTERNAL" || isTerminalStage(application.currentStage)) return null;
  const submittedDate = datePart(application.submittedAt);
  const today = generatedAt.slice(0, 10);
  return {
    actionId: opaqueId("privpipeaction", [application.applicationId, "prepare-evidence"]),
    applicationId: application.applicationId,
    confirmationRecordId: null,
    followUpId: null,
    title: `Prepare interview or follow-up evidence for ${appLabel(application)}`,
    reason: "A high-value submitted application can benefit from preparation even when no employer response is recorded.",
    priorityTier: 4,
    status: "PREPARATION",
    dueDate: application.nextReviewAt,
    reviewDate: application.nextReviewAt,
    submittedDate,
    daysSinceSubmission: daysBetween(submittedDate, today),
    employerResponseStatus: application.employerResponseStatus,
    currentStage: application.currentStage,
    known: [
      `Current stage is ${application.currentStage}.`,
      `Employer response state is ${application.employerResponseStatus}.`,
    ],
    unknown: ["Future employer response and interview status are unknown."],
    whatRossShouldDo: "Prepare reusable evidence and positioning notes without making any external representation.",
    authorityRequired: "ROSS_APPROVAL",
    completionProof: "Preparation decision or private evidence task is recorded.",
    allowedActions: ["PREPARE_INTERVIEW_EVIDENCE", "CONTINUE_MONITORING", "DEFER"],
    communicationAllowed: false,
    operatorApprovalRequired: true,
    limitations: [
      "Preparation does not imply fit, employer interest, or interview probability.",
      "No resume is changed by this workflow.",
    ],
    privatePathVisible: false,
  };
}

function buildEvidenceAction(application: PrivateApplicationRecord, generatedAt: string): PrivatePipelineReviewAction | null {
  if (!application.analysisRunId || isTerminalStage(application.currentStage)) return null;
  const submittedDate = datePart(application.submittedAt);
  const today = generatedAt.slice(0, 10);
  return {
    actionId: opaqueId("privpipeaction", [application.applicationId, "unresolved-evidence"]),
    applicationId: application.applicationId,
    confirmationRecordId: null,
    followUpId: null,
    title: `Review unresolved evidence questions for ${appLabel(application)}`,
    reason: "Analysis-linked applications can reuse unresolved evidence work across future roles.",
    priorityTier: 5,
    status: "OPEN",
    dueDate: null,
    reviewDate: application.nextReviewAt,
    submittedDate,
    daysSinceSubmission: daysBetween(submittedDate, today),
    employerResponseStatus: application.employerResponseStatus,
    currentStage: application.currentStage,
    known: ["A private analysis run is linked to this Application."],
    unknown: ["Remaining role-specific evidence questions are tracked in the private analysis workflow."],
    whatRossShouldDo: "Use the private evidence review workflow when this becomes more urgent than application tracking.",
    authorityRequired: "ROSS_APPROVAL",
    completionProof: "Private evidence review decisions or a deferred action are recorded.",
    allowedActions: ["PREPARE_INTERVIEW_EVIDENCE", "DEFER"],
    communicationAllowed: false,
    operatorApprovalRequired: true,
    limitations: ["This command does not review Career facts directly or expose private evidence through a browser surface."],
    privatePathVisible: false,
  };
}

function buildResumeLinkageAction(application: PrivateApplicationRecord, generatedAt: string): PrivatePipelineReviewAction | null {
  if (application.resumeReference.status !== "UNKNOWN" || isTerminalStage(application.currentStage)) return null;
  const submittedDate = datePart(application.submittedAt);
  const today = generatedAt.slice(0, 10);
  return {
    actionId: opaqueId("privpipeaction", [application.applicationId, "resume-linkage"]),
    applicationId: application.applicationId,
    confirmationRecordId: null,
    followUpId: null,
    title: `Confirm resume used for ${appLabel(application)}`,
    reason: "Resume linkage is materially useful for application history, but the resume itself is not Career truth.",
    priorityTier: 6,
    status: "OPEN",
    dueDate: null,
    reviewDate: application.nextReviewAt,
    submittedDate,
    daysSinceSubmission: daysBetween(submittedDate, today),
    employerResponseStatus: application.employerResponseStatus,
    currentStage: application.currentStage,
    known: ["Application is recorded without a resume reference."],
    unknown: ["Resume used is unknown."],
    whatRossShouldDo: "Confirm the resume reference if known, or leave it unknown.",
    authorityRequired: "ROSS_CONFIRMATION",
    completionProof: "A private resume reference decision is recorded or deferred.",
    allowedActions: ["CONFIRM_RESUME_USED", "DEFER"],
    communicationAllowed: false,
    operatorApprovalRequired: true,
    limitations: ["No resume file is copied or modified.", "Resume wording cannot verify Career facts."],
    privatePathVisible: false,
  };
}

function buildOlderNoOutcomeAction(application: PrivateApplicationRecord, generatedAt: string): PrivatePipelineReviewAction | null {
  const submittedDate = datePart(application.submittedAt);
  const today = generatedAt.slice(0, 10);
  const days = daysBetween(submittedDate, today);
  if (days === null || days < 21) return null;
  if (!["NONE_RECORDED", "UNKNOWN"].includes(application.employerResponseStatus)) return null;
  if (isTerminalStage(application.currentStage)) return null;
  return {
    actionId: opaqueId("privpipeaction", [application.applicationId, "older-no-outcome"]),
    applicationId: application.applicationId,
    confirmationRecordId: null,
    followUpId: null,
    title: `Review older application with no outcome for ${appLabel(application)}`,
    reason: "Older submitted applications with no recorded outcome should be monitored or closed only with operator authority.",
    priorityTier: 7,
    status: "OPEN",
    dueDate: null,
    reviewDate: application.nextReviewAt,
    submittedDate,
    daysSinceSubmission: days,
    employerResponseStatus: application.employerResponseStatus,
    currentStage: application.currentStage,
    known: [`Days since submission: ${days}.`, `Employer response state: ${application.employerResponseStatus}.`],
    unknown: ["No employer outcome is recorded."],
    whatRossShouldDo: "Decide whether to continue monitoring, record an outcome, or close with explicit authority.",
    authorityRequired: "ROSS_APPROVAL",
    completionProof: "Monitoring, outcome, withdrawal, or closure decision is recorded.",
    allowedActions: ["CONTINUE_MONITORING", "RECORD_REJECTION", "RECORD_WITHDRAWAL", "RECORD_CLOSED", "DEFER"],
    communicationAllowed: false,
    operatorApprovalRequired: true,
    limitations: ["No rejection reason is invented.", "Closure and withdrawal require Ross authority."],
    privatePathVisible: false,
  };
}

export function loadPrivateApplicationPipelineStore(options: {
  applicationRoot: string;
  repositoryRoot: string;
}): PrivateApplicationPipelineStore {
  if (!existsSync(options.applicationRoot)) {
    return { applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] };
  }
  assertOutsideRepository(options.applicationRoot, options.repositoryRoot, "Private application root");
  const applications: PrivateApplicationRecord[] = [];
  const applicationEvents: PrivateApplicationEventRecord[] = [];
  const followUpReviews: PrivateFollowUpReviewTask[] = [];
  const confirmationNeeded: PrivateApplicationConfirmationNeeded[] = [];

  for (const filePath of walkJsonFiles(options.applicationRoot)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      continue;
    }
    for (const record of arrayPayload(parsed)) {
      if (record.schemaVersion === PRIVATE_APPLICATION_SCHEMA_VERSION && typeof record.applicationId === "string") {
        applications.push(record as PrivateApplicationRecord);
      } else if (
        record.schemaVersion === PRIVATE_APPLICATION_EVENT_SCHEMA_VERSION &&
        typeof record.eventId === "string"
      ) {
        applicationEvents.push(record as PrivateApplicationEventRecord);
      } else if (
        typeof record.followUpId === "string" &&
        typeof record.applicationId === "string" &&
        record.communicationAllowed === false
      ) {
        followUpReviews.push(record as PrivateFollowUpReviewTask);
      } else if (
        typeof record.confirmationRecordId === "string" &&
        record.status === "NEEDS_OPERATOR_CONFIRMATION" &&
        record.shouldCreateApplication === false
      ) {
        confirmationNeeded.push(record as PrivateApplicationConfirmationNeeded);
      }
    }
  }

  return {
    applications: uniqueBy(applications, (app) => app.applicationId),
    applicationEvents: uniqueBy(applicationEvents, (event) => event.eventId),
    followUpReviews: uniqueBy(followUpReviews, (task) => task.followUpId),
    confirmationNeeded: uniqueBy(confirmationNeeded, (item) => item.confirmationRecordId),
  };
}

export function buildPipelineReviewActions(input: {
  store: PrivateApplicationPipelineStore;
  generatedAt: string;
}): PrivatePipelineReviewAction[] {
  const actions: PrivatePipelineReviewAction[] = [];
  const store = projectStoreForLifecycle(input.store);
  const applicationsById = new Map(store.applications.map((application) => [application.applicationId, application]));

  for (const application of store.applications) {
    const stageAction = buildStageAction(application, input.generatedAt);
    if (stageAction) pushUniqueAction(actions, stageAction);

    const missingAction = buildMissingApplicationConfirmationAction(application, input.generatedAt);
    if (missingAction) pushUniqueAction(actions, missingAction);

    const preparationAction = buildPreparationAction(application, input.generatedAt);
    if (preparationAction) pushUniqueAction(actions, preparationAction);

    const recordOutcomeAction = buildRecordOutcomeAction(application, input.generatedAt);
    if (recordOutcomeAction) pushUniqueAction(actions, recordOutcomeAction);

    const evidenceAction = buildEvidenceAction(application, input.generatedAt);
    if (evidenceAction) pushUniqueAction(actions, evidenceAction);

    const resumeAction = buildResumeLinkageAction(application, input.generatedAt);
    if (resumeAction) pushUniqueAction(actions, resumeAction);

    const olderAction = buildOlderNoOutcomeAction(application, input.generatedAt);
    if (olderAction) pushUniqueAction(actions, olderAction);
  }

  for (const followUp of store.followUpReviews) {
    const application = applicationsById.get(followUp.applicationId);
    if (!application) continue;
    if (isTerminalStage(application.currentStage)) continue;
    pushUniqueAction(actions, buildFollowUpAction(application, followUp, input.generatedAt));
  }

  for (const confirmation of store.confirmationNeeded) {
    pushUniqueAction(actions, buildConfirmationAction(confirmation));
  }

  return actions.sort((left, right) => actionSortKey(left).localeCompare(actionSortKey(right)));
}

export function buildDailyJobSearchCommand(input: {
  store: PrivateApplicationPipelineStore;
  generatedAt: string;
  actions?: readonly PrivatePipelineReviewAction[];
}): PrivateDailyJobSearchCommand {
  const store = projectStoreForLifecycle(input.store);
  const actions = [...(input.actions || buildPipelineReviewActions(input))];
  const pipelineSummary = buildPipelineSummary({
    applications: store.applications,
    followUps: store.followUpReviews,
    confirmations: store.confirmationNeeded,
    generatedAt: input.generatedAt,
  });
  const recentOutcomes = store.applicationEvents
    .filter(outcomeEvent)
    .sort((left, right) => (right.occurredAt || "").localeCompare(left.occurredAt || ""))
    .slice(0, 10)
    .map((event) => ({
      eventId: event.eventId,
      applicationId: event.applicationId,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
    }));
  const awaitingEmployerResponse = store.applications.filter((application) => {
    return (
      !isTerminalStage(application.currentStage) &&
      ["NONE_RECORDED", "UNKNOWN"].includes(application.employerResponseStatus)
    );
  }).length;
  const interviewsActive = store.applications.filter((application) => {
    return ["SCREENING", "INTERVIEW", "FINAL_INTERVIEW"].includes(application.currentStage);
  }).length;

  return {
    schemaVersion: PRIVATE_DAILY_JOB_SEARCH_COMMAND_SCHEMA_VERSION,
    workflowVersion: PRIVATE_APPLICATION_PIPELINE_REVIEW_VERSION,
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    primaryNextAction: actions[0] || null,
    applicationsNeedingAttention: actions.filter((action) => action.priorityTier <= 4),
    followUpsDue: actions.filter((action) => action.followUpId && action.status === "DUE"),
    interviewsOrRecruiterContact: actions.filter((action) => action.priorityTier === 1),
    confirmationNeeded: actions.filter((action) => action.status === "NEEDS_OPERATOR_CONFIRMATION"),
    submittedApplications: store.applications
      .filter((application) => application.status === "SUBMITTED_MANUAL_EXTERNAL")
      .map((application) => ({
        applicationId: application.applicationId,
        company: application.companyReference.label,
        role: application.roleReference.title,
        submittedDate: datePart(application.submittedAt),
        currentStage: application.currentStage,
        employerResponseStatus: application.employerResponseStatus,
        nextReviewDate: application.nextReviewAt,
      })),
    recentOutcomes,
    evidencePositioningTasks: actions.filter((action) => action.priorityTier === 5),
    pipelineSummary,
    searchHealth: {
      activeSubmittedApplications: pipelineSummary.submittedApplications,
      awaitingEmployerResponse,
      followUpReviewsDue: pipelineSummary.followUpReviewsDue,
      applicationsNeedingOperatorConfirmation: pipelineSummary.applicationsNeedingOperatorConfirmation,
      interviewsActive,
      recentOutcomes: recentOutcomes.length,
      descriptiveSummary: [
        `${pipelineSummary.submittedApplications} submitted manual applications recorded.`,
        `${pipelineSummary.followUpReviewsDue} follow-up reviews are due.`,
        `${pipelineSummary.applicationsNeedingOperatorConfirmation} candidates need operator confirmation.`,
        `${interviewsActive} screenings or interviews are active.`,
      ].join(" "),
      vanityMetricGenerated: false,
      successProbabilityGenerated: false,
    },
    noEmployerSuccessProbability: true,
    privatePathVisible: false,
    limitations: [
      "This is an owner-private local command output.",
      "No automatic submission, message, resume change, provider call, probability, or vanity score is available.",
      "Future UI read-model data is prepared only for a later authorized server boundary.",
    ],
  };
}

function eventTypeForDecision(decisionType: PipelineReviewDecisionType): ApplicationEventType | null {
  const map: Partial<Record<PipelineReviewDecisionType, ApplicationEventType>> = {
    RECORD_RECRUITER_RESPONSE: "RECRUITER_CONTACT_RECORDED",
    RECORD_SCREENING: "SCREENING_RECORDED",
    RECORD_INTERVIEW: "INTERVIEW_SCHEDULED",
    RECORD_REJECTION: "EMPLOYER_REJECTION_RECORDED",
    RECORD_OFFER: "OFFER_RECORDED",
    RECORD_WITHDRAWAL: "WITHDRAWAL_RECORDED",
    RECORD_CLOSED: "APPLICATION_CLOSED",
  };
  return map[decisionType] || null;
}

export function buildPipelineReviewDecision(input: {
  action: PrivatePipelineReviewAction;
  decisionType: PipelineReviewDecisionType;
  operatorConfirmed: boolean;
  createdAt: string;
  operatorContext?: string | null;
  employerProvidedReason?: string | null;
  supersedesDecisionId?: string | null;
}): PrivateApplicationPipelineReviewDecision {
  if (!input.operatorConfirmed) {
    throw new Error("Operator decisions require explicit confirmation.");
  }
  if (!input.action.allowedActions.includes(input.decisionType)) {
    throw new Error(`Decision ${input.decisionType} is not allowed for action ${input.action.actionId}.`);
  }
  const limitations = [
    "Owner-private operator decision only.",
    "No external action is performed.",
    "Application history remains append-only.",
  ];
  if (input.decisionType === "RECORD_REJECTION" && !input.employerProvidedReason) {
    limitations.push("No employer-provided rejection reason was supplied or invented.");
  }

  return {
    schemaVersion: PRIVATE_PIPELINE_REVIEW_DECISION_SCHEMA_VERSION,
    decisionId: opaqueId("privpipedecision", [
      input.action.actionId,
      input.decisionType,
      input.createdAt,
      input.operatorContext || "",
    ]),
    workspaceId: "professional",
    actionId: input.action.actionId,
    applicationId: input.action.applicationId,
    confirmationRecordId: input.action.confirmationRecordId,
    followUpId: input.action.followUpId,
    decisionType: input.decisionType,
    operatorConfirmed: true,
    operatorContext: input.operatorContext || null,
    employerProvidedReason: input.employerProvidedReason || null,
    createdAt: input.createdAt,
    supersedesDecisionId: input.supersedesDecisionId || null,
    sourceAuthority: "ROSS_OPERATOR_DECISION",
    privacy: "Professional owner-private",
    applicationSubmitted: false,
    messageSent: false,
    resumeMutated: false,
    externalProviderContacted: false,
    externalAiInvoked: false,
    limitations,
  };
}

function eventFromDecision(decision: PrivateApplicationPipelineReviewDecision): PrivateApplicationEventRecord | null {
  const eventType = eventTypeForDecision(decision.decisionType);
  if (!eventType || !decision.applicationId) return null;
  return {
    schemaVersion: PRIVATE_APPLICATION_EVENT_SCHEMA_VERSION,
    eventId: opaqueId("privappevent", [decision.applicationId, eventType, decision.decisionId]),
    applicationId: decision.applicationId,
    eventType,
    occurredAt: decision.createdAt,
    occurredAtPrecision: "DATE_TIME" as SubmittedAtPrecision,
    sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
    operatorConfirmed: true,
    channel: null,
    evidenceReferences: [],
    limitations:
      decision.decisionType === "RECORD_REJECTION" && !decision.employerProvidedReason
        ? ["Employer rejection recorded without an employer-provided reason; no reason was invented."]
        : ["Outcome event recorded from owner-private operator decision."],
    createdAt: decision.createdAt,
    submittedByStaffordOS: false,
    externalActionPerformedByStaffordOS: false,
  };
}

export function applyPipelineReviewDecision(input: {
  store: PrivateApplicationPipelineStore;
  decision: PrivateApplicationPipelineReviewDecision;
}) {
  const newEvent = eventFromDecision(input.decision);
  return {
    ...input.store,
    applicationEvents: newEvent ? [...input.store.applicationEvents, newEvent] : [...input.store.applicationEvents],
  };
}

export function buildPrivateApplicationPipelineReviewResult(input: {
  store: PrivateApplicationPipelineStore;
  generatedAt: string;
  decisions?: readonly PrivateApplicationPipelineReviewDecision[];
}): PrivateApplicationPipelineReviewResult {
  const generatedApplicationEvents = input.decisions
    ? input.decisions.map(eventFromDecision).filter((event): event is PrivateApplicationEventRecord => event !== null)
    : [];
  const storeWithEvents: PrivateApplicationPipelineStore = {
    ...input.store,
    applicationEvents: [...input.store.applicationEvents, ...generatedApplicationEvents],
  };
  const projectedStoreWithEvents = projectStoreForLifecycle(storeWithEvents);
  const actions = buildPipelineReviewActions({ store: storeWithEvents, generatedAt: input.generatedAt });
  const dailyCommand = buildDailyJobSearchCommand({ store: storeWithEvents, generatedAt: input.generatedAt, actions });
  const decisions = [...(input.decisions || [])];
  return {
    schemaVersion: PRIVATE_PIPELINE_REVIEW_AUDIT_SCHEMA_VERSION,
    workflowVersion: PRIVATE_APPLICATION_PIPELINE_REVIEW_VERSION,
    generatedAt: input.generatedAt,
    loaded: {
      applications: input.store.applications.length,
      applicationEvents: input.store.applicationEvents.length,
      followUpReviews: input.store.followUpReviews.length,
      confirmationNeeded: input.store.confirmationNeeded.length,
    },
    dailyCommand,
    nextActions: actions,
    decisions,
    generatedApplicationEvents,
    followUpReviewDecisions: decisions.filter((decision) => decision.followUpId !== null),
    confirmationDecisions: decisions.filter((decision) => decision.confirmationRecordId !== null),
    futureReadModel: projectedStoreWithEvents.applications.map((application) => futureReadModelFor(application, input.generatedAt)),
    auditSummary: {
      noApplicationSubmitted: true,
      noMessageSent: true,
      noResumeMutated: true,
      noLinkedInMutated: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noApiCreated: true,
      noDatabaseCreated: true,
      noOsConnection: true,
      noOperatorRouteCreated: true,
      applicationHistoryAppendOnly: true,
      privatePathVisible: false,
    },
  };
}

function writePrivateApplicationOutcomeEventOutputs(input: {
  applicationRoot: string;
  repositoryRoot: string;
  result: PrivateApplicationPipelineReviewResult;
}) {
  assertOutsideRepository(input.applicationRoot, input.repositoryRoot, "Private application root");
  const outputRoot = path.join(input.applicationRoot, "careeros-v1-08-outcomes");
  const runDirectory = path.join(outputRoot, `careeros_v1_08_${compactDate(input.result.generatedAt)}`);
  ensurePrivateDirectory(input.applicationRoot);
  ensurePrivateDirectory(outputRoot);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "application_outcome_decisions.json": input.result.decisions,
    "application_events.json": input.result.generatedApplicationEvents,
    "application_outcome_audit.json": {
      ...input.result.auditSummary,
      applicationEventAuthorityReused: true,
      applicationEventsCreated: input.result.generatedApplicationEvents.length,
      applicationRecordsMutated: false,
      silenceClassifiedAsRejection: false,
      noEmailRead: true,
      noCalendarIntegration: true,
      noBrowserAutomation: true,
      noExternalCommunication: true,
      privatePathVisible: false,
    },
  };
  const writtenFiles: string[] = [];
  for (const [name, value] of Object.entries(artifacts)) {
    const filePath = path.join(runDirectory, name);
    writeJson(filePath, value);
    writtenFiles.push(filePath);
  }
  return {
    runDirectory,
    artifactNames: Object.keys(artifacts),
    writtenFiles,
    privatePathVisible: false as const,
  };
}

function choosePipelineAction(input: {
  actions: readonly PrivatePipelineReviewAction[];
  applicationId: string;
  actionId?: string | null;
  decisionType: PipelineReviewDecisionType;
}) {
  const matching = input.actions.filter((action) => action.applicationId === input.applicationId);
  if (input.actionId) {
    const exact = matching.find((action) => action.actionId === input.actionId);
    if (exact) return exact;
  }
  return matching.find((action) => action.allowedActions.includes(input.decisionType)) || null;
}

export function runApplicationOutcomeDecisionFromPrivateArtifacts(input: {
  generatedAt?: string;
  jobSearchRoot?: string;
  repositoryRoot?: string;
  applicationId: string;
  actionId?: string | null;
  decisionType: PipelineReviewDecisionType;
  operatorConfirmed?: boolean;
  operatorContext?: string | null;
  employerProvidedReason?: string | null;
  writeOutputs?: boolean;
}): PrivateApplicationPipelineDecisionRunResult {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  const repositoryRoot = input.repositoryRoot || process.cwd();
  const applicationRoot = path.join(jobSearchRoot, "applications");
  const reviewRoot = path.join(jobSearchRoot, "application-pipeline-review");
  const store = loadPrivateApplicationPipelineStore({ applicationRoot, repositoryRoot });
  const current = buildPrivateApplicationPipelineReviewResult({ store, generatedAt });
  const action = choosePipelineAction({
    actions: current.nextActions,
    applicationId: input.applicationId,
    actionId: input.actionId || null,
    decisionType: input.decisionType,
  });
  if (!input.operatorConfirmed) {
    return {
      result: current,
      decision: null,
      generatedApplicationEvents: [],
      storeAfterDecision: store,
      writeResult: null,
      eventWriteResult: null,
      blockedReason: "OPERATOR_CONFIRMATION_REQUIRED",
      noExternalAction: true,
      noApplicationSubmitted: true,
      noMessageSent: true,
      noBrowserAutomation: true,
      noExternalAi: true,
    };
  }
  if (!action) {
    return {
      result: current,
      decision: null,
      generatedApplicationEvents: [],
      storeAfterDecision: store,
      writeResult: null,
      eventWriteResult: null,
      blockedReason: "NO_SUPPORTED_ACTION_FOR_APPLICATION",
      noExternalAction: true,
      noApplicationSubmitted: true,
      noMessageSent: true,
      noBrowserAutomation: true,
      noExternalAi: true,
    };
  }

  const decision = buildPipelineReviewDecision({
    action,
    decisionType: input.decisionType,
    operatorConfirmed: true,
    createdAt: generatedAt,
    operatorContext: input.operatorContext || null,
    employerProvidedReason: input.employerProvidedReason || null,
  });
  const result = buildPrivateApplicationPipelineReviewResult({
    store,
    generatedAt,
    decisions: [decision],
  });
  const storeAfterDecision = {
    ...store,
    applicationEvents: [...store.applicationEvents, ...result.generatedApplicationEvents],
  };
  const eventWriteResult = input.writeOutputs
    ? writePrivateApplicationOutcomeEventOutputs({ applicationRoot, repositoryRoot, result })
    : null;
  const writeResult = input.writeOutputs
    ? writePrivateApplicationPipelineReviewOutputs({ outputRoot: reviewRoot, repositoryRoot, result })
    : null;
  return {
    result,
    decision,
    generatedApplicationEvents: result.generatedApplicationEvents,
    storeAfterDecision,
    writeResult,
    eventWriteResult,
    blockedReason: null,
    noExternalAction: true,
    noApplicationSubmitted: true,
    noMessageSent: true,
    noBrowserAutomation: true,
    noExternalAi: true,
  };
}

export function writePrivateApplicationPipelineReviewOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: PrivateApplicationPipelineReviewResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private application pipeline output root");
  const runDirectory = path.join(input.outputRoot, `j001_05b_${compactDate(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "daily_job_search_command.json": input.result.dailyCommand,
    "pipeline_summary.json": input.result.dailyCommand.pipelineSummary,
    "next_actions.json": input.result.nextActions,
    "follow_up_review_decisions.json": input.result.followUpReviewDecisions,
    "confirmation_decisions.json": input.result.confirmationDecisions,
    "application_events.json": input.result.generatedApplicationEvents,
    "future_ui_read_model.json": input.result.futureReadModel,
    "processing_audit_summary.json": input.result.auditSummary,
  };
  for (const [name, value] of Object.entries(artifacts)) {
    writeJson(path.join(runDirectory, name), value);
  }
  return {
    runDirectory,
    artifactNames: Object.keys(artifacts),
    privatePathVisible: false as const,
  };
}

export function buildPrivateApplicationPipelineCliSummary(result: PrivateApplicationPipelineReviewResult) {
  return {
    workflowVersion: result.workflowVersion,
    applicationsLoaded: result.loaded.applications,
    applicationEventsLoaded: result.loaded.applicationEvents,
    followUpReviewsLoaded: result.loaded.followUpReviews,
    confirmationNeededLoaded: result.loaded.confirmationNeeded,
    primaryActionAvailable: result.dailyCommand.primaryNextAction !== null,
    applicationsNeedingAttention: result.dailyCommand.applicationsNeedingAttention.length,
    followUpsDue: result.dailyCommand.followUpsDue.length,
    interviewsOrRecruiterContact: result.dailyCommand.interviewsOrRecruiterContact.length,
    submittedApplications: result.dailyCommand.pipelineSummary.submittedApplications,
    recentOutcomes: result.dailyCommand.recentOutcomes.length,
    decisionsRecorded: result.decisions.length,
    privatePathVisible: false,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noMessageSent: result.auditSummary.noMessageSent,
    noResumeMutated: result.auditSummary.noResumeMutated,
    noExternalProviderCall: result.auditSummary.noExternalProviderCall,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
  };
}

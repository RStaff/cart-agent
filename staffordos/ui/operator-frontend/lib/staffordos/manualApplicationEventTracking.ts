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
import * as path from "node:path";

export const MANUAL_APPLICATION_TRACKING_VERSION = "J001.05A";
export const PRIVATE_APPLICATION_SCHEMA_VERSION =
  "staffordos.job_search.private_application.v1";
export const PRIVATE_APPLICATION_EVENT_SCHEMA_VERSION =
  "staffordos.job_search.private_application_event.v2";
export const PRIVATE_APPLICATION_PIPELINE_SCHEMA_VERSION =
  "staffordos.job_search.private_application_pipeline_summary.v1";
export const PRIVATE_APPLICATION_AUDIT_SCHEMA_VERSION =
  "staffordos.job_search.private_application_tracking_audit.v1";

export const APPLICATION_STATUSES = [
  "PREPARING",
  "READY_FOR_OPERATOR_APPROVAL",
  "APPROVED_TO_APPLY",
  "SUBMITTED_MANUAL_EXTERNAL",
  "SUBMITTED_FUTURE_STAFFORDOS",
  "FOLLOW_UP_REVIEW_DUE",
  "RECRUITER_CONTACT",
  "SCREENING",
  "INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER",
  "REJECTED_BY_EMPLOYER",
  "WITHDRAWN",
  "CLOSED",
  "NEEDS_OPERATOR_CONFIRMATION",
] as const;

export const APPLICATION_EVENT_TYPES = [
  "APPLICATION_CREATED",
  "RESUME_SELECTED",
  "COVER_LETTER_USED",
  "SUBMITTED_MANUAL_EXTERNAL",
  "FOLLOW_UP_REVIEW_SCHEDULED",
  "RECRUITER_CONTACT_RECORDED",
  "SCREENING_RECORDED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "EMPLOYER_REJECTION_RECORDED",
  "OFFER_RECORDED",
  "WITHDRAWAL_RECORDED",
  "APPLICATION_CLOSED",
] as const;

export const APPLICATION_DUPLICATE_STATUSES = [
  "NO_DUPLICATE",
  "POSSIBLE_DUPLICATE",
  "CONFIRMED_DUPLICATE",
  "REAPPLICATION",
  "NEEDS_OPERATOR_REVIEW",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type ApplicationEventType = (typeof APPLICATION_EVENT_TYPES)[number];
export type ApplicationDuplicateStatus = (typeof APPLICATION_DUPLICATE_STATUSES)[number];
export type SubmittedAtPrecision = "DATE" | "DATE_TIME" | "UNKNOWN";
export type ResumeReferenceStatus =
  | "UNKNOWN"
  | "PRIVATE_LEGACY_REFERENCE"
  | "ASSET_REFERENCE_PENDING"
  | "APPLICATION_ARTIFACT_VERSION";
export type CoverLetterStatus = "UNKNOWN" | "NOT_USED" | "USED" | "DRAFTED_EXTERNALLY";
export type EmployerResponseStatus =
  | "UNKNOWN"
  | "NONE_RECORDED"
  | "RESPONDED"
  | "REJECTED"
  | "INTERVIEW_REQUESTED"
  | "OFFER";

export type ManualApplicationInput = {
  sourceRecordId: string;
  opportunityId?: string | null;
  analysisRunId?: string | null;
  companyName?: string | null;
  roleTitle?: string | null;
  requisitionAlias?: string | null;
  submissionOccurred: boolean;
  submissionMethod: "MANUAL_EXTERNAL";
  submissionChannel?: string | null;
  submittedAt?: string | null;
  submittedAtPrecision?: SubmittedAtPrecision;
  allowUnknownSubmittedAt?: boolean;
  allowUnknownSubmissionChannel?: boolean;
  resumeFilename?: string | null;
  coverLetterStatus?: CoverLetterStatus;
  employerResponseStatus?: EmployerResponseStatus;
  operatorConfirmed: boolean;
  positioningHypotheses?: string[];
  limitations?: string[];
};

export type PrivateResumeReference = {
  resumeReferenceId: string;
  applicationId: string;
  status: ResumeReferenceStatus;
  filename: string | null;
  assetReferenceId: string | null;
  version: string | null;
  createdAt: string | null;
  purpose: string;
  authority: "ROSS_CONFIRMED" | "UNKNOWN" | "ASSET_AUTHORITY_PENDING";
  privacy: "Professional owner-private";
  limitations: string[];
  resumeIsCanonicalCareerTruth: false;
};

export type PrivateCoverLetterReference = {
  coverLetterReferenceId: string;
  applicationId: string;
  status: CoverLetterStatus;
  filename: string | null;
  authority: "ROSS_CONFIRMED" | "UNKNOWN";
  privacy: "Professional owner-private";
  limitations: string[];
};

export type PrivateApplicationNextAction = {
  nextActionId: string;
  applicationId: string | null;
  confirmationRecordId: string | null;
  what: string;
  whyNow: string;
  when: string | null;
  proofOfCompletion: string;
  authorityRequired: "ROSS_CONFIRMATION" | "ROSS_APPROVAL";
  limitations: string[];
};

export type PrivateFollowUpReviewTask = {
  followUpId: string;
  applicationId: string;
  reviewDate: string | null;
  reason: string;
  recommendedAction: string;
  employerGuidance: string;
  communicationAllowed: false;
  operatorApprovalRequired: true;
  status: "SCHEDULED" | "NEEDS_DATE" | "NOT_DUE";
  limitations: string[];
};

export type PrivateApplicationRecord = {
  schemaVersion: typeof PRIVATE_APPLICATION_SCHEMA_VERSION;
  applicationId: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  opportunityId: string | null;
  analysisRunId: string | null;
  companyReference: {
    label: string;
    requisitionAlias: string | null;
  };
  roleReference: {
    title: string;
  };
  status: ApplicationStatus;
  submissionMethod: "MANUAL_EXTERNAL";
  submissionChannel: string | null;
  submittedAt: string | null;
  submittedAtPrecision: SubmittedAtPrecision;
  operatorConfirmed: true;
  resumeReference: PrivateResumeReference;
  coverLetterReference: PrivateCoverLetterReference;
  employerResponseStatus: EmployerResponseStatus;
  currentStage: ApplicationStatus;
  nextAction: PrivateApplicationNextAction;
  nextReviewAt: string | null;
  sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL";
  privacy: "Professional owner-private";
  duplicateStatus: ApplicationDuplicateStatus;
  limitations: string[];
  createdAt: string;
  updatedAt: string;
  submittedByStaffordOS: false;
  applicationSubmittedByThisWorkflow: false;
  noEmployerInterestInferred: true;
  noFitInferred: true;
  testOnly: false;
};

export type PrivateApplicationEventRecord = {
  schemaVersion: typeof PRIVATE_APPLICATION_EVENT_SCHEMA_VERSION;
  eventId: string;
  applicationId: string;
  eventType: ApplicationEventType;
  occurredAt: string | null;
  occurredAtPrecision: SubmittedAtPrecision;
  sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL";
  operatorConfirmed: true;
  channel: string | null;
  evidenceReferences: string[];
  limitations: string[];
  createdAt: string;
  submittedByStaffordOS: false;
  externalActionPerformedByStaffordOS: false;
};

export type PrivatePositioningHypothesis = {
  hypothesisId: string;
  applicationId: string;
  recordType: "POSITIONING_HYPOTHESIS";
  statement: string;
  status: "TO_VALIDATE_AGAINST_OUTCOMES";
  learningCreated: false;
  limitations: string[];
};

export type PrivateApplicationConfirmationNeeded = {
  confirmationRecordId: string;
  sourceRecordId: string;
  workspaceId: "professional";
  companyName: string | null;
  roleTitle: string | null;
  missingRequiredFields: string[];
  status: "NEEDS_OPERATOR_CONFIRMATION";
  shouldCreateApplication: false;
  conciseQuestions: string[];
  limitations: string[];
};

export type PrivateApplicationPipelineSummary = {
  schemaVersion: typeof PRIVATE_APPLICATION_PIPELINE_SCHEMA_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  submittedApplications: number;
  followUpReviewsDue: number;
  recruiterResponses: number;
  screenings: number;
  interviews: number;
  offers: number;
  rejections: number;
  closedApplications: number;
  applicationsNeedingOperatorConfirmation: number;
  conversionRatesAvailable: false;
  limitations: string[];
};

export type FutureApplicationReadModelRecord = {
  applicationId: string;
  workspaceId: "professional";
  company: string;
  role: string;
  submittedDate: string | null;
  currentStage: ApplicationStatus;
  employerResponseStatus: EmployerResponseStatus;
  nextAction: string;
  nextReviewDate: string | null;
  capturedAsOf: string;
  limitations: string[];
  privatePathVisible: false;
  rawResumeVisible: false;
  rawCoverLetterVisible: false;
  portalCredentialsVisible: false;
  recruiterContactVisible: false;
  connectedToOs: false;
};

export type ManualApplicationTrackingResult = {
  schemaVersion: typeof PRIVATE_APPLICATION_AUDIT_SCHEMA_VERSION;
  workflowVersion: typeof MANUAL_APPLICATION_TRACKING_VERSION;
  generatedAt: string;
  applications: PrivateApplicationRecord[];
  applicationEvents: PrivateApplicationEventRecord[];
  resumeReferences: PrivateResumeReference[];
  coverLetterReferences: PrivateCoverLetterReference[];
  followUpReviews: PrivateFollowUpReviewTask[];
  pipelineSummary: PrivateApplicationPipelineSummary;
  nextActions: PrivateApplicationNextAction[];
  positioningHypotheses: PrivatePositioningHypothesis[];
  confirmationNeeded: PrivateApplicationConfirmationNeeded[];
  duplicateReview: Array<{
    sourceRecordId: string;
    duplicateStatus: ApplicationDuplicateStatus;
    matchingApplicationIds: string[];
    disposition: string;
  }>;
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
    privatePathVisible: false;
  };
};

type AnyRecord = Record<string, unknown>;

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function compactDate(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 12);
}

function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function opaqueId(prefix: string, parts: readonly unknown[]) {
  return `${prefix}_${sha256Text(parts.map((part) => String(part ?? "")).join("|")).slice(0, 18)}`;
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
  const output: string[] = [];
  for (const name of readdirSync(directory)) {
    const filePath = path.join(directory, name);
    const stat = statSync(filePath);
    if (stat.isDirectory()) output.push(...walkJsonFiles(filePath));
    if (stat.isFile() && name.endsWith(".json")) output.push(filePath);
  }
  return output;
}

function arrayPayload(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value.filter((item): item is AnyRecord => Boolean(item && typeof item === "object" && !Array.isArray(item)));
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["applications", "records"]) {
      if (Array.isArray(record[key])) {
        return (record[key] as unknown[]).filter((item): item is AnyRecord => Boolean(item && typeof item === "object" && !Array.isArray(item)));
      }
    }
    return [record as AnyRecord];
  }
  return [];
}

function submittedAtPrecision(input: ManualApplicationInput): SubmittedAtPrecision {
  if (!input.submittedAt) return "UNKNOWN";
  if (input.submittedAtPrecision) return input.submittedAtPrecision;
  return /t|\d{2}:\d{2}/i.test(input.submittedAt) ? "DATE_TIME" : "DATE";
}

function addBusinessDays(dateText: string | null, days: number) {
  if (!dateText) return null;
  const datePart = dateText.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const date = new Date(`${datePart}T12:00:00Z`);
  let remaining = days;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return date.toISOString().slice(0, 10);
}

function missingFields(input: ManualApplicationInput) {
  const missing: string[] = [];
  if (!input.companyName) missing.push("company");
  if (!input.roleTitle) missing.push("role");
  if (!input.submissionOccurred) missing.push("submission occurred");
  if (!input.submittedAt && !input.allowUnknownSubmittedAt) missing.push("submission date");
  if (!input.submissionChannel && !input.allowUnknownSubmissionChannel) missing.push("submission channel");
  if (!input.operatorConfirmed) missing.push("operator confirmation");
  return missing;
}

function duplicateKeyFromParts(input: {
  opportunityId?: string | null;
  companyName?: string | null;
  roleTitle?: string | null;
  requisitionAlias?: string | null;
  submittedAt?: string | null;
}) {
  if (input.opportunityId) return `opportunity:${input.opportunityId}`;
  return [
    "manual",
    normalizeText(input.companyName),
    normalizeText(input.roleTitle),
    normalizeText(input.requisitionAlias),
    (input.submittedAt || "").slice(0, 10),
  ].join("|");
}

function applicationIdFor(input: ManualApplicationInput) {
  return opaqueId("privapp", [
    "professional",
    duplicateKeyFromParts(input),
    input.submissionMethod,
    input.submittedAt || "UNKNOWN",
  ]);
}

function existingDuplicateKey(record: Partial<PrivateApplicationRecord>) {
  return duplicateKeyFromParts({
    opportunityId: record.opportunityId || null,
    companyName: record.companyReference?.label || null,
    roleTitle: record.roleReference?.title || null,
    requisitionAlias: record.companyReference?.requisitionAlias || null,
    submittedAt: record.submittedAt || null,
  });
}

function classifyDuplicate(input: ManualApplicationInput, existing: readonly PrivateApplicationRecord[]) {
  const key = duplicateKeyFromParts(input);
  const matches = existing.filter((record) => existingDuplicateKey(record) === key);
  if (matches.length > 0) {
    return {
      duplicateStatus: "CONFIRMED_DUPLICATE" as const,
      matchingApplicationIds: matches.map((record) => record.applicationId),
    };
  }
  const possible = existing.filter((record) => {
    return (
      normalizeText(record.companyReference.label) === normalizeText(input.companyName) &&
      normalizeText(record.roleReference.title) === normalizeText(input.roleTitle)
    );
  });
  if (possible.length > 0) {
    return {
      duplicateStatus: "POSSIBLE_DUPLICATE" as const,
      matchingApplicationIds: possible.map((record) => record.applicationId),
    };
  }
  return { duplicateStatus: "NO_DUPLICATE" as const, matchingApplicationIds: [] };
}

function buildResumeReference(input: ManualApplicationInput, applicationId: string): PrivateResumeReference {
  const filename = input.resumeFilename || null;
  return {
    resumeReferenceId: opaqueId("privresume", [applicationId, filename || "UNKNOWN"]),
    applicationId,
    status: filename ? "PRIVATE_LEGACY_REFERENCE" : "UNKNOWN",
    filename,
    assetReferenceId: null,
    version: null,
    createdAt: null,
    purpose: "Application resume reference pending J001.06 Asset linkage.",
    authority: filename ? "ROSS_CONFIRMED" : "UNKNOWN",
    privacy: "Professional owner-private",
    limitations: [
      filename
        ? "Legacy private resume filename reference only; the resume file is not copied or treated as Career truth."
        : "Resume used is unknown until Ross records it.",
      "Resume wording is downstream positioning and cannot verify canonical Career facts.",
    ],
    resumeIsCanonicalCareerTruth: false,
  };
}
function buildCoverLetterReference(input: ManualApplicationInput, applicationId: string): PrivateCoverLetterReference {
  const status = input.coverLetterStatus || "UNKNOWN";
  return {
    coverLetterReferenceId: opaqueId("privcoverletter", [applicationId, status]),
    applicationId,
    status,
    filename: null,
    authority: status === "UNKNOWN" ? "UNKNOWN" : "ROSS_CONFIRMED",
    privacy: "Professional owner-private",
    limitations: [
      status === "UNKNOWN" ? "Cover-letter usage is unknown until Ross records it." : "Cover-letter usage is operator-confirmed only.",
      "No cover-letter file is copied or mutated by this workflow.",
    ],
  };
}

function nextActionFor(input: {
  applicationId: string | null;
  confirmationRecordId?: string | null;
  submittedAt: string | null;
  submittedAtPrecision: SubmittedAtPrecision;
  nextReviewAt: string | null;
  confirmationMissing?: readonly string[];
}) {
  if (input.confirmationRecordId) {
    return {
      nextActionId: opaqueId("privappaction", [input.confirmationRecordId, "confirm"]),
      applicationId: null,
      confirmationRecordId: input.confirmationRecordId,
      what: "Confirm required application facts before creating an Application record.",
      whyNow: "StaffordOS cannot preserve a confirmed application without company, role, submission occurrence, date, channel, and operator confirmation.",
      when: null,
      proofOfCompletion: `Ross supplies: ${(input.confirmationMissing || []).join(", ")}.`,
      authorityRequired: "ROSS_CONFIRMATION" as const,
      limitations: ["No Application record exists for this candidate yet."],
    };
  }

  if (!input.submittedAt || input.submittedAtPrecision === "UNKNOWN") {
    return {
      nextActionId: opaqueId("privappaction", [input.applicationId, "monitor-unknown-date"]),
      applicationId: input.applicationId,
      confirmationRecordId: null,
      what: "Monitor application and confirm missing submission history when available.",
      whyNow: "The application is already submitted manually, but submission timing or channel remains incomplete.",
      when: null,
      proofOfCompletion: "Employer response or missing submission details are recorded.",
      authorityRequired: "ROSS_CONFIRMATION" as const,
      limitations: ["Do not apply again; StaffordOS did not submit this application."],
    };
  }

  return {
    nextActionId: opaqueId("privappaction", [input.applicationId, "follow-up-review", input.nextReviewAt || "NONE"]),
    applicationId: input.applicationId,
    confirmationRecordId: null,
    what: "Review follow-up timing and prepare evidence before any outreach.",
    whyNow: "A submitted manual application should be monitored without sending automatic messages.",
    when: input.nextReviewAt,
    proofOfCompletion: "Ross records employer response, approves a follow-up plan, or defers outreach.",
    authorityRequired: "ROSS_APPROVAL" as const,
    limitations: ["Follow-up is a review task only; communication remains disabled until Ross approves it separately."],
  };
}

function followUpFor(applicationId: string, submittedAt: string | null, nextReviewAt: string | null): PrivateFollowUpReviewTask {
  return {
    followUpId: opaqueId("privfollowup", [applicationId, nextReviewAt || "UNKNOWN"]),
    applicationId,
    reviewDate: nextReviewAt,
    reason: submittedAt
      ? "Generic 10-business-day follow-up review proposal after manual submission."
      : "Submission date is unknown, so follow-up timing needs Ross confirmation.",
    recommendedAction: "Review employer guidance and decide whether a follow-up is appropriate.",
    employerGuidance: "Unknown; employer or recruiter instructions override generic timing.",
    communicationAllowed: false,
    operatorApprovalRequired: true,
    status: nextReviewAt ? "SCHEDULED" : "NEEDS_DATE",
    limitations: [
      "This task does not send messages.",
      "No recruiter or employer response is inferred.",
      "Generic timing is a proposal only.",
    ],
  };
}

function createConfirmationNeeded(input: ManualApplicationInput, missing: readonly string[]): PrivateApplicationConfirmationNeeded {
  const id = opaqueId("privappconfirm", [input.sourceRecordId, input.companyName || "", input.roleTitle || ""]);
  return {
    confirmationRecordId: id,
    sourceRecordId: input.sourceRecordId,
    workspaceId: "professional",
    companyName: input.companyName || null,
    roleTitle: input.roleTitle || null,
    missingRequiredFields: [...missing],
    status: "NEEDS_OPERATOR_CONFIRMATION",
    shouldCreateApplication: false,
    conciseQuestions: missing.map((field) => `Confirm ${field}.`),
    limitations: [
      "No Application record was created because required operator-confirmed facts are missing.",
      "Do not infer from partial context.",
    ],
  };
}

function buildApplication(input: ManualApplicationInput, generatedAt: string, duplicateStatus: ApplicationDuplicateStatus) {
  const applicationId = applicationIdFor(input);
  const precision = submittedAtPrecision(input);
  const nextReviewAt = input.submittedAt ? addBusinessDays(input.submittedAt, 10) : null;
  const resumeReference = buildResumeReference(input, applicationId);
  const coverLetterReference = buildCoverLetterReference(input, applicationId);
  const nextAction = nextActionFor({
    applicationId,
    submittedAt: input.submittedAt || null,
    submittedAtPrecision: precision,
    nextReviewAt,
  });
  const limitations = [
    "Application was submitted manually by Ross outside StaffordOS.",
    "StaffordOS did not submit, approve, send, message, or contact the employer.",
    "Submission does not imply employer interest, recruiter review, fit, interview probability, or outcome.",
    ...(input.limitations || []),
  ];
  const application: PrivateApplicationRecord = {
    schemaVersion: PRIVATE_APPLICATION_SCHEMA_VERSION,
    applicationId,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    opportunityId: input.opportunityId || null,
    analysisRunId: input.analysisRunId || null,
    companyReference: {
      label: input.companyName || "UNKNOWN",
      requisitionAlias: input.requisitionAlias || null,
    },
    roleReference: {
      title: input.roleTitle || "UNKNOWN",
    },
    status: "SUBMITTED_MANUAL_EXTERNAL",
    submissionMethod: "MANUAL_EXTERNAL",
    submissionChannel: input.submissionChannel || null,
    submittedAt: input.submittedAt || null,
    submittedAtPrecision: precision,
    operatorConfirmed: true,
    resumeReference,
    coverLetterReference,
    employerResponseStatus: input.employerResponseStatus || "NONE_RECORDED",
    currentStage: "SUBMITTED_MANUAL_EXTERNAL",
    nextAction,
    nextReviewAt,
    sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
    privacy: "Professional owner-private",
    duplicateStatus,
    limitations,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    submittedByStaffordOS: false,
    applicationSubmittedByThisWorkflow: false,
    noEmployerInterestInferred: true,
    noFitInferred: true,
    testOnly: false,
  };
  const events: PrivateApplicationEventRecord[] = [
    {
      schemaVersion: PRIVATE_APPLICATION_EVENT_SCHEMA_VERSION,
      eventId: opaqueId("privappevent", [applicationId, "APPLICATION_CREATED", generatedAt]),
      applicationId,
      eventType: "APPLICATION_CREATED",
      occurredAt: generatedAt,
      occurredAtPrecision: "DATE_TIME",
      sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
      operatorConfirmed: true,
      channel: null,
      evidenceReferences: [],
      limitations: ["Application record created from Ross-confirmed manual submission context."],
      createdAt: generatedAt,
      submittedByStaffordOS: false,
      externalActionPerformedByStaffordOS: false,
    },
    {
      schemaVersion: PRIVATE_APPLICATION_EVENT_SCHEMA_VERSION,
      eventId: opaqueId("privappevent", [applicationId, "SUBMITTED_MANUAL_EXTERNAL", input.submittedAt || "UNKNOWN"]),
      applicationId,
      eventType: "SUBMITTED_MANUAL_EXTERNAL",
      occurredAt: input.submittedAt || null,
      occurredAtPrecision: precision,
      sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
      operatorConfirmed: true,
      channel: input.submissionChannel || null,
      evidenceReferences: [],
      limitations: ["Ross submitted manually outside StaffordOS; no StaffordOS external action occurred."],
      createdAt: generatedAt,
      submittedByStaffordOS: false,
      externalActionPerformedByStaffordOS: false,
    },
  ];
  if (nextReviewAt) {
    events.push({
      schemaVersion: PRIVATE_APPLICATION_EVENT_SCHEMA_VERSION,
      eventId: opaqueId("privappevent", [applicationId, "FOLLOW_UP_REVIEW_SCHEDULED", nextReviewAt]),
      applicationId,
      eventType: "FOLLOW_UP_REVIEW_SCHEDULED",
      occurredAt: nextReviewAt,
      occurredAtPrecision: "DATE",
      sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
      operatorConfirmed: true,
      channel: null,
      evidenceReferences: [],
      limitations: ["Follow-up review scheduled; no message is authorized or sent."],
      createdAt: generatedAt,
      submittedByStaffordOS: false,
      externalActionPerformedByStaffordOS: false,
    });
  }
  return { application, events, resumeReference, coverLetterReference, followUp: followUpFor(applicationId, input.submittedAt || null, nextReviewAt) };
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
    submittedDate: application.submittedAt ? application.submittedAt.slice(0, 10) : null,
    currentStage: application.currentStage,
    employerResponseStatus: application.employerResponseStatus,
    nextAction: application.nextAction.what,
    nextReviewDate: application.nextReviewAt,
    capturedAsOf: generatedAt,
    limitations: [
      "Prepared for future authorized Professional read model only.",
      "Not connected to /os, /operator, API, provider, browser storage, or database.",
    ],
    privatePathVisible: false,
    rawResumeVisible: false,
    rawCoverLetterVisible: false,
    portalCredentialsVisible: false,
    recruiterContactVisible: false,
    connectedToOs: false,
  };
}

export function loadExistingPrivateApplications(options: {
  applicationRoot: string;
  repositoryRoot: string;
}): PrivateApplicationRecord[] {
  if (!existsSync(options.applicationRoot)) return [];
  assertOutsideRepository(options.applicationRoot, options.repositoryRoot, "Private application root");
  const applications = new Map<string, PrivateApplicationRecord>();
  for (const filePath of walkJsonFiles(options.applicationRoot)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      continue;
    }
    for (const record of arrayPayload(parsed)) {
      if (record.schemaVersion === PRIVATE_APPLICATION_SCHEMA_VERSION && typeof record.applicationId === "string") {
        applications.set(record.applicationId, record as PrivateApplicationRecord);
      }
    }
  }
  return [...applications.values()];
}

export function buildManualApplicationTrackingResult(input: {
  applications: readonly ManualApplicationInput[];
  existingApplications?: readonly PrivateApplicationRecord[];
  generatedAt: string;
}): ManualApplicationTrackingResult {
  const existing = [...(input.existingApplications || [])];
  const created: PrivateApplicationRecord[] = [];
  const events: PrivateApplicationEventRecord[] = [];
  const resumeReferences: PrivateResumeReference[] = [];
  const coverLetterReferences: PrivateCoverLetterReference[] = [];
  const followUps: PrivateFollowUpReviewTask[] = [];
  const confirmationNeeded: PrivateApplicationConfirmationNeeded[] = [];
  const duplicateReview: ManualApplicationTrackingResult["duplicateReview"] = [];
  const nextActions: PrivateApplicationNextAction[] = [];
  const positioningHypotheses: PrivatePositioningHypothesis[] = [];

  for (const applicationInput of input.applications) {
    const missing = missingFields(applicationInput);
    if (missing.length > 0) {
      const confirmation = createConfirmationNeeded(applicationInput, missing);
      confirmationNeeded.push(confirmation);
      const action = nextActionFor({
        applicationId: null,
        confirmationRecordId: confirmation.confirmationRecordId,
        submittedAt: null,
        submittedAtPrecision: "UNKNOWN",
        nextReviewAt: null,
        confirmationMissing: missing,
      });
      nextActions.push(action);
      continue;
    }

    if (applicationInput.submissionMethod !== "MANUAL_EXTERNAL") {
      const confirmation = createConfirmationNeeded(applicationInput, ["manual external submission method"]);
      confirmation.limitations.push("J001.05A cannot create StaffordOS-submitted application records.");
      confirmationNeeded.push(confirmation);
      nextActions.push(nextActionFor({
        applicationId: null,
        confirmationRecordId: confirmation.confirmationRecordId,
        submittedAt: null,
        submittedAtPrecision: "UNKNOWN",
        nextReviewAt: null,
        confirmationMissing: confirmation.missingRequiredFields,
      }));
      continue;
    }

    const duplicate = classifyDuplicate(applicationInput, [...existing, ...created]);
    if (duplicate.duplicateStatus !== "NO_DUPLICATE") {
      duplicateReview.push({
        sourceRecordId: applicationInput.sourceRecordId,
        duplicateStatus: duplicate.duplicateStatus,
        matchingApplicationIds: duplicate.matchingApplicationIds,
        disposition: "No new Application was created; duplicate requires operator review.",
      });
      continue;
    }

    const built = buildApplication(applicationInput, input.generatedAt, duplicate.duplicateStatus);
    created.push(built.application);
    events.push(...built.events);
    resumeReferences.push(built.resumeReference);
    coverLetterReferences.push(built.coverLetterReference);
    followUps.push(built.followUp);
    nextActions.push(built.application.nextAction);
    for (const statement of applicationInput.positioningHypotheses || []) {
      positioningHypotheses.push({
        hypothesisId: opaqueId("privapphyp", [built.application.applicationId, statement]),
        applicationId: built.application.applicationId,
        recordType: "POSITIONING_HYPOTHESIS",
        statement,
        status: "TO_VALIDATE_AGAINST_OUTCOMES",
        learningCreated: false,
        limitations: [
          "Hypothesis only; do not convert to Learning until future outcomes support it and Ross approves.",
        ],
      });
    }
  }

  const pipelineSummary = buildPipelineSummary({
    applications: [...existing, ...created],
    followUps,
    confirmations: confirmationNeeded,
    generatedAt: input.generatedAt,
  });

  return {
    schemaVersion: PRIVATE_APPLICATION_AUDIT_SCHEMA_VERSION,
    workflowVersion: MANUAL_APPLICATION_TRACKING_VERSION,
    generatedAt: input.generatedAt,
    applications: created,
    applicationEvents: events,
    resumeReferences,
    coverLetterReferences,
    followUpReviews: followUps,
    pipelineSummary,
    nextActions,
    positioningHypotheses,
    confirmationNeeded,
    duplicateReview,
    futureReadModel: created.map((application) => futureReadModelFor(application, input.generatedAt)),
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
      privatePathVisible: false,
    },
  };
}

export function writeManualApplicationTrackingOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: ManualApplicationTrackingResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private application output root");
  const runDirectory = path.join(input.outputRoot, `j001_05a_${compactDate(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "applications.json": input.result.applications,
    "application_events.json": input.result.applicationEvents,
    "resume_references.json": input.result.resumeReferences,
    "cover_letter_references.json": input.result.coverLetterReferences,
    "follow_up_reviews.json": input.result.followUpReviews,
    "pipeline_summary.json": input.result.pipelineSummary,
    "next_actions.json": input.result.nextActions,
    "positioning_hypotheses.json": input.result.positioningHypotheses,
    "confirmation_needed.json": input.result.confirmationNeeded,
    "future_ui_read_model.json": input.result.futureReadModel,
    "change_report.json": {
      schemaVersion: "staffordos.job_search.private_application_tracking_change_report.v1",
      generatedAt: input.result.generatedAt,
      applicationsCreated: input.result.applications.length,
      eventsCreated: input.result.applicationEvents.length,
      confirmationNeeded: input.result.confirmationNeeded.length,
      duplicateReview: input.result.duplicateReview.length,
      noApplicationSubmitted: true,
      noMessageSent: true,
      noResumeMutated: true,
    },
    "processing_audit_summary.json": input.result.auditSummary,
  };
  const artifactNames = Object.keys(artifacts);
  for (const [name, value] of Object.entries(artifacts)) {
    writeJson(path.join(runDirectory, name), value);
  }
  return {
    runDirectory,
    runDirectoryRedacted: runDirectory.replace(/^\/Users\/[^/]+/, "~"),
    artifactNames,
    privatePathVisible: false as const,
  };
}

export function buildManualApplicationCliSummary(result: ManualApplicationTrackingResult) {
  return {
    workflowVersion: result.workflowVersion,
    applicationsCreated: result.applications.length,
    eventsCreated: result.applicationEvents.length,
    followUpReviewsCreated: result.followUpReviews.length,
    confirmationNeeded: result.confirmationNeeded.length,
    duplicatesBlocked: result.duplicateReview.length,
    submittedApplications: result.pipelineSummary.submittedApplications,
    followUpReviewsDue: result.pipelineSummary.followUpReviewsDue,
    privatePathVisible: false,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noMessageSent: result.auditSummary.noMessageSent,
    noResumeMutated: result.auditSummary.noResumeMutated,
    noLinkedInMutated: result.auditSummary.noLinkedInMutated,
    noExternalProviderCall: result.auditSummary.noExternalProviderCall,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
  };
}

import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import {
  loadPrivateApplicationPipelineStore,
  type PrivateApplicationPipelineStore,
} from "./privateApplicationPipelineReview";
import type {
  ApplicationEventType,
  ApplicationStatus,
  EmployerResponseStatus,
  PrivateApplicationEventRecord,
  PrivateApplicationRecord,
  PrivateFollowUpReviewTask,
} from "./manualApplicationEventTracking";

export const APPLICATION_FOLLOW_UP_RESPONSE_TRACKING_VERSION = "J004.01";
export const APPLICATION_ENGAGEMENT_ITEM_SCHEMA_VERSION =
  "staffordos.job_search.private_application_engagement_item.v1";
export const APPLICATION_ENGAGEMENT_QUEUE_SCHEMA_VERSION =
  "staffordos.job_search.private_application_engagement_queue.v1";
export const APPLICATION_ENGAGEMENT_READ_MODEL_SCHEMA_VERSION =
  "staffordos.job_search.private_application_engagement_read_model.v1";

export const FOLLOW_UP_STATES = [
  "NOT_DUE",
  "DUE",
  "OVERDUE",
  "COMPLETED",
  "NOT_REQUIRED",
] as const;

export type FollowUpState = (typeof FOLLOW_UP_STATES)[number];

export const RESPONSE_STATES = [
  "NO_RESPONSE",
  "RECRUITER_CONTACT",
  "HIRING_MANAGER_CONTACT",
  "INTERVIEW_REQUEST",
  "REJECTION",
  "WITHDRAWN",
  "OTHER_RESPONSE",
] as const;

export type ApplicationResponseState = (typeof RESPONSE_STATES)[number];

export const NEXT_ENGAGEMENT_ACTIONS = [
  "FOLLOW_UP",
  "REVIEW_RESPONSE",
  "PREPARE_FOR_INTERVIEW",
  "NO_ACTION",
  "CLOSE_OUT",
] as const;

export type NextEngagementAction = (typeof NEXT_ENGAGEMENT_ACTIONS)[number];

export type FollowUpDueDateAuthority =
  | "FOLLOW_UP_REVIEW_TASK"
  | "APPLICATION_NEXT_REVIEW"
  | "DETERMINISTIC_10_BUSINESS_DAY_POLICY"
  | "NONE";

export type ApplicationEngagementEventSummary = {
  eventId: string;
  eventType: ApplicationEventType | string;
  occurredAt: string | null;
  sourceAuthority: PrivateApplicationEventRecord["sourceAuthority"];
};

export type ApplicationEngagementItem = {
  schemaVersion: typeof APPLICATION_ENGAGEMENT_ITEM_SCHEMA_VERSION;
  workflowVersion: typeof APPLICATION_FOLLOW_UP_RESPONSE_TRACKING_VERSION;
  engagementItemId: string;
  applicationId: string;
  company: string;
  role: string;
  applicationDate: string | null;
  currentApplicationStatus: ApplicationStatus;
  currentStage: ApplicationStatus;
  employerResponseStatus: EmployerResponseStatus;
  lastApplicationEvent: ApplicationEngagementEventSummary | null;
  followUpState: FollowUpState;
  followUpDueDate: string | null;
  followUpDueDateAuthority: FollowUpDueDateAuthority;
  responseState: ApplicationResponseState;
  responseStateAuthority: "APPLICATION_EVENT_HISTORY" | "APPLICATION_RECORD" | "NO_RESPONSE_RECORDED";
  recommendedNextEngagementAction: NextEngagementAction;
  blockingIssues: string[];
  limitations: string[];
  queuePriority: number;
  needsAttention: boolean;
  communicationAllowed: false;
  operatorApprovalRequired: true;
  applicationCreated: false;
  applicationSubmitted: false;
  messageSent: false;
  outreachGenerated: false;
  resumeGenerated: false;
  resumeMutated: false;
  browserAutomationUsed: false;
  externalProviderCall: false;
  externalAiUsed: false;
  ollamaUsed: false;
  noEmployerIntentInferred: true;
  responseProbabilityGenerated: false;
  interviewProbabilityGenerated: false;
  privatePathVisible: false;
  rawMessageVisible: false;
  recruiterContactVisible: false;
};

export type ApplicationEngagementReadModelRecord = {
  schemaVersion: typeof APPLICATION_ENGAGEMENT_READ_MODEL_SCHEMA_VERSION;
  engagementItemId: string;
  applicationId: string;
  company: string;
  role: string;
  applicationDate: string | null;
  currentApplicationStatus: ApplicationStatus;
  lastApplicationEventType: string | null;
  followUpState: FollowUpState;
  followUpDueDateKnown: boolean;
  responseState: ApplicationResponseState;
  recommendedNextEngagementAction: NextEngagementAction;
  blockingIssueCount: number;
  needsAttention: boolean;
  communicationAllowed: false;
  operatorApprovalRequired: true;
  applicationSubmitted: false;
  messageSent: false;
  outreachGenerated: false;
  resumeMutated: false;
  browserAutomationUsed: false;
  externalProviderCall: false;
  externalAiUsed: false;
  ollamaUsed: false;
  privatePathVisible: false;
  recruiterContactVisible: false;
  limitations: string[];
};

export type ApplicationEngagementQueueResult = {
  schemaVersion: typeof APPLICATION_ENGAGEMENT_QUEUE_SCHEMA_VERSION;
  workflowVersion: typeof APPLICATION_FOLLOW_UP_RESPONSE_TRACKING_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Engagement";
  sourceAuthority: {
    existingApplicationAuthorityReused: true;
    applicationEventsReused: true;
    followUpReviewTasksReused: true;
    existingPipelineStoreLoaderReused: true;
    opportunityAuthorityReused: true;
    applicationContractCreated: false;
    applicationEventsCreated: false;
    applicationRecordsMutated: false;
    pipelineLogicRebuilt: false;
  };
  loaded: {
    applications: number;
    applicationEvents: number;
    followUpReviewTasks: number;
  };
  engagementItems: ApplicationEngagementItem[];
  careerEngagementQueue: ApplicationEngagementItem[];
  readModel: ApplicationEngagementReadModelRecord[];
  summary: {
    applicationsReviewed: number;
    applicationsNeedingAttention: number;
    followUpDue: number;
    followUpOverdue: number;
    followUpCompleted: number;
    responsesRecorded: number;
    interviewPreparationItems: number;
    closeOutItems: number;
    noActionItems: number;
    applicationsCreated: 0;
    applicationsSubmitted: 0;
    messagesSent: 0;
    outreachGenerated: 0;
    resumesGenerated: 0;
    resumesMutated: 0;
  };
  auditSummary: {
    noParallelApplicationContract: true;
    noApplicationCreated: true;
    noApplicationSubmitted: true;
    noApplicationMutated: true;
    noApplicationEventCreated: true;
    noMessageSent: true;
    noOutreachGenerated: true;
    noResumeGenerated: true;
    noResumeMutated: true;
    noLinkedInMutated: true;
    noBrowserAutomation: true;
    noCalendarIntegration: true;
    noExternalProviderCall: true;
    noExternalAi: true;
    noOllama: true;
    noOsConnection: true;
    noOperatorConnection: true;
    noEmployerIntentInferred: true;
    noResponseProbability: true;
    noInterviewProbability: true;
    privatePathVisible: false;
  };
};

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function opaqueId(prefix: string, parts: readonly unknown[]) {
  return `${prefix}_${sha256Text(parts.map((part) => String(part ?? "")).join("|")).slice(0, 18)}`;
}

function compactTimestamp(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 14);
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

function datePart(value: string | null | undefined) {
  if (!value) return null;
  const candidate = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}

function dateToUtcNoon(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function addBusinessDays(dateText: string | null, days: number) {
  const startDate = datePart(dateText);
  if (!startDate) return null;
  const date = dateToUtcNoon(startDate);
  let remaining = days;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return date.toISOString().slice(0, 10);
}

function eventSortKey(event: PrivateApplicationEventRecord) {
  return [event.occurredAt || "", event.createdAt || "", event.eventId].join("|");
}

function latestEventFor(
  application: PrivateApplicationRecord,
  events: readonly PrivateApplicationEventRecord[],
): PrivateApplicationEventRecord | null {
  const matching = events
    .filter((event) => event.applicationId === application.applicationId)
    .sort((left, right) => eventSortKey(right).localeCompare(eventSortKey(left)));
  return matching[0] || null;
}

function responseEventFor(
  application: PrivateApplicationRecord,
  events: readonly PrivateApplicationEventRecord[],
): PrivateApplicationEventRecord | null {
  const responseEvents = events
    .filter((event) => event.applicationId === application.applicationId)
    .filter((event) =>
      [
        "RECRUITER_CONTACT_RECORDED",
        "SCREENING_RECORDED",
        "INTERVIEW_SCHEDULED",
        "INTERVIEW_COMPLETED",
        "EMPLOYER_REJECTION_RECORDED",
        "OFFER_RECORDED",
        "WITHDRAWAL_RECORDED",
        "APPLICATION_CLOSED",
      ].includes(event.eventType),
    )
    .sort((left, right) => eventSortKey(right).localeCompare(eventSortKey(left)));
  return responseEvents[0] || null;
}

function responseStateFromEvent(event: PrivateApplicationEventRecord): ApplicationResponseState {
  if (event.eventType === "RECRUITER_CONTACT_RECORDED") return "RECRUITER_CONTACT";
  if (event.eventType === "INTERVIEW_SCHEDULED") return "INTERVIEW_REQUEST";
  if (event.eventType === "EMPLOYER_REJECTION_RECORDED") return "REJECTION";
  if (event.eventType === "WITHDRAWAL_RECORDED") return "WITHDRAWN";
  return "OTHER_RESPONSE";
}

function responseStateFromApplication(application: PrivateApplicationRecord): ApplicationResponseState {
  if (application.currentStage === "RECRUITER_CONTACT") return "RECRUITER_CONTACT";
  if (["INTERVIEW", "FINAL_INTERVIEW"].includes(application.currentStage)) return "INTERVIEW_REQUEST";
  if (application.currentStage === "REJECTED_BY_EMPLOYER" || application.employerResponseStatus === "REJECTED") {
    return "REJECTION";
  }
  if (application.currentStage === "WITHDRAWN") return "WITHDRAWN";
  if (application.employerResponseStatus === "INTERVIEW_REQUESTED") return "INTERVIEW_REQUEST";
  if (application.employerResponseStatus === "RESPONDED" || application.employerResponseStatus === "OFFER") {
    return "OTHER_RESPONSE";
  }
  return "NO_RESPONSE";
}

function responseStateFor(input: {
  application: PrivateApplicationRecord;
  events: readonly PrivateApplicationEventRecord[];
}): {
  responseState: ApplicationResponseState;
  authority: ApplicationEngagementItem["responseStateAuthority"];
} {
  const responseEvent = responseEventFor(input.application, input.events);
  if (responseEvent) {
    return {
      responseState: responseStateFromEvent(responseEvent),
      authority: "APPLICATION_EVENT_HISTORY",
    };
  }
  const fromApplication = responseStateFromApplication(input.application);
  if (fromApplication !== "NO_RESPONSE") {
    return {
      responseState: fromApplication,
      authority: "APPLICATION_RECORD",
    };
  }
  return {
    responseState: "NO_RESPONSE",
    authority: "NO_RESPONSE_RECORDED",
  };
}

function terminalStage(stage: ApplicationStatus) {
  return ["REJECTED_BY_EMPLOYER", "WITHDRAWN", "CLOSED"].includes(stage);
}

function followUpTaskFor(
  application: PrivateApplicationRecord,
  followUps: readonly PrivateFollowUpReviewTask[],
): PrivateFollowUpReviewTask | null {
  const matching = followUps
    .filter((task) => task.applicationId === application.applicationId)
    .sort(
      (left, right) =>
        (left.reviewDate || "9999-99-99").localeCompare(right.reviewDate || "9999-99-99") ||
        left.followUpId.localeCompare(right.followUpId),
    );
  return matching[0] || null;
}

function dueDateFor(application: PrivateApplicationRecord, followUp: PrivateFollowUpReviewTask | null): {
  dueDate: string | null;
  authority: FollowUpDueDateAuthority;
} {
  if (followUp?.reviewDate) return { dueDate: datePart(followUp.reviewDate), authority: "FOLLOW_UP_REVIEW_TASK" };
  if (application.nextReviewAt) return { dueDate: datePart(application.nextReviewAt), authority: "APPLICATION_NEXT_REVIEW" };
  const policyDate = addBusinessDays(application.submittedAt, 10);
  if (policyDate) return { dueDate: policyDate, authority: "DETERMINISTIC_10_BUSINESS_DAY_POLICY" };
  return { dueDate: null, authority: "NONE" };
}

function followUpStateFor(input: {
  application: PrivateApplicationRecord;
  followUp: PrivateFollowUpReviewTask | null;
  responseState: ApplicationResponseState;
  generatedAt: string;
}): {
  followUpState: FollowUpState;
  dueDate: string | null;
  dueDateAuthority: FollowUpDueDateAuthority;
} {
  const due = dueDateFor(input.application, input.followUp);
  const today = input.generatedAt.slice(0, 10);
  if (terminalStage(input.application.currentStage) || ["REJECTION", "WITHDRAWN"].includes(input.responseState)) {
    return { followUpState: "NOT_REQUIRED", dueDate: due.dueDate, dueDateAuthority: due.authority };
  }
  if (input.responseState !== "NO_RESPONSE") {
    return { followUpState: "COMPLETED", dueDate: due.dueDate, dueDateAuthority: due.authority };
  }
  if (!due.dueDate) return { followUpState: "NOT_DUE", dueDate: null, dueDateAuthority: "NONE" };
  if (due.dueDate < today) return { followUpState: "OVERDUE", dueDate: due.dueDate, dueDateAuthority: due.authority };
  if (due.dueDate === today) return { followUpState: "DUE", dueDate: due.dueDate, dueDateAuthority: due.authority };
  return { followUpState: "NOT_DUE", dueDate: due.dueDate, dueDateAuthority: due.authority };
}

function nextActionFor(input: {
  followUpState: FollowUpState;
  responseState: ApplicationResponseState;
}): NextEngagementAction {
  if (input.responseState === "INTERVIEW_REQUEST") return "PREPARE_FOR_INTERVIEW";
  if (input.responseState === "REJECTION" || input.responseState === "WITHDRAWN") return "CLOSE_OUT";
  if (["RECRUITER_CONTACT", "HIRING_MANAGER_CONTACT", "OTHER_RESPONSE"].includes(input.responseState)) {
    return "REVIEW_RESPONSE";
  }
  if (input.followUpState === "DUE" || input.followUpState === "OVERDUE") return "FOLLOW_UP";
  return "NO_ACTION";
}

function priorityFor(action: NextEngagementAction, followUpState: FollowUpState) {
  if (action === "PREPARE_FOR_INTERVIEW") return 1;
  if (action === "REVIEW_RESPONSE") return 2;
  if (followUpState === "OVERDUE") return 3;
  if (action === "FOLLOW_UP") return 4;
  if (action === "CLOSE_OUT") return 5;
  return 9;
}

function eventSummary(event: PrivateApplicationEventRecord | null): ApplicationEngagementEventSummary | null {
  if (!event) return null;
  return {
    eventId: event.eventId,
    eventType: event.eventType,
    occurredAt: event.occurredAt,
    sourceAuthority: event.sourceAuthority,
  };
}

function blockingIssuesFor(input: {
  application: PrivateApplicationRecord;
  dueDate: string | null;
  dueDateAuthority: FollowUpDueDateAuthority;
}) {
  const issues: string[] = [];
  if (input.application.status !== "SUBMITTED_MANUAL_EXTERNAL") {
    issues.push("Application is not a confirmed manual external submission.");
  }
  if (!datePart(input.application.submittedAt)) {
    issues.push("Application date is unknown, so follow-up timing is limited.");
  }
  if (!input.dueDate && input.dueDateAuthority === "NONE") {
    issues.push("No authoritative or policy-derived follow-up due date is available.");
  }
  if (input.application.submittedByStaffordOS || input.application.applicationSubmittedByThisWorkflow) {
    issues.push("Application authority is inconsistent: StaffordOS submission flags must remain false.");
  }
  return issues;
}

function engagementItemFor(input: {
  application: PrivateApplicationRecord;
  events: readonly PrivateApplicationEventRecord[];
  followUps: readonly PrivateFollowUpReviewTask[];
  generatedAt: string;
}): ApplicationEngagementItem {
  const lastEvent = latestEventFor(input.application, input.events);
  const response = responseStateFor({ application: input.application, events: input.events });
  const followUp = followUpTaskFor(input.application, input.followUps);
  const followUpState = followUpStateFor({
    application: input.application,
    followUp,
    responseState: response.responseState,
    generatedAt: input.generatedAt,
  });
  const nextAction = nextActionFor({
    followUpState: followUpState.followUpState,
    responseState: response.responseState,
  });
  const blockingIssues = blockingIssuesFor({
    application: input.application,
    dueDate: followUpState.dueDate,
    dueDateAuthority: followUpState.dueDateAuthority,
  });
  const priority = priorityFor(nextAction, followUpState.followUpState);

  return {
    schemaVersion: APPLICATION_ENGAGEMENT_ITEM_SCHEMA_VERSION,
    workflowVersion: APPLICATION_FOLLOW_UP_RESPONSE_TRACKING_VERSION,
    engagementItemId: opaqueId("privcareerengagement", [
      input.application.applicationId,
      followUpState.followUpState,
      response.responseState,
      input.generatedAt,
    ]),
    applicationId: input.application.applicationId,
    company: input.application.companyReference.label,
    role: input.application.roleReference.title,
    applicationDate: datePart(input.application.submittedAt),
    currentApplicationStatus: input.application.status,
    currentStage: input.application.currentStage,
    employerResponseStatus: input.application.employerResponseStatus,
    lastApplicationEvent: eventSummary(lastEvent),
    followUpState: followUpState.followUpState,
    followUpDueDate: followUpState.dueDate,
    followUpDueDateAuthority: followUpState.dueDateAuthority,
    responseState: response.responseState,
    responseStateAuthority: response.authority,
    recommendedNextEngagementAction: nextAction,
    blockingIssues,
    limitations: [
      "Engagement item is a private planning recommendation only.",
      "No employer intent, response probability, interview probability, or success probability is inferred.",
      "No follow-up message, recruiter response, application submission, browser action, provider call, external AI, or Ollama call is available.",
    ],
    queuePriority: priority,
    needsAttention: nextAction !== "NO_ACTION" || blockingIssues.length > 0,
    communicationAllowed: false,
    operatorApprovalRequired: true,
    applicationCreated: false,
    applicationSubmitted: false,
    messageSent: false,
    outreachGenerated: false,
    resumeGenerated: false,
    resumeMutated: false,
    browserAutomationUsed: false,
    externalProviderCall: false,
    externalAiUsed: false,
    ollamaUsed: false,
    noEmployerIntentInferred: true,
    responseProbabilityGenerated: false,
    interviewProbabilityGenerated: false,
    privatePathVisible: false,
    rawMessageVisible: false,
    recruiterContactVisible: false,
  };
}

function engagementSortKey(item: ApplicationEngagementItem) {
  return [
    String(item.queuePriority).padStart(2, "0"),
    item.followUpDueDate || "9999-99-99",
    item.applicationDate || "9999-99-99",
    item.company,
    item.role,
    item.applicationId,
  ].join("|");
}

function readModelFor(item: ApplicationEngagementItem): ApplicationEngagementReadModelRecord {
  return {
    schemaVersion: APPLICATION_ENGAGEMENT_READ_MODEL_SCHEMA_VERSION,
    engagementItemId: item.engagementItemId,
    applicationId: item.applicationId,
    company: item.company,
    role: item.role,
    applicationDate: item.applicationDate,
    currentApplicationStatus: item.currentApplicationStatus,
    lastApplicationEventType: item.lastApplicationEvent?.eventType || null,
    followUpState: item.followUpState,
    followUpDueDateKnown: Boolean(item.followUpDueDate),
    responseState: item.responseState,
    recommendedNextEngagementAction: item.recommendedNextEngagementAction,
    blockingIssueCount: item.blockingIssues.length,
    needsAttention: item.needsAttention,
    communicationAllowed: false,
    operatorApprovalRequired: true,
    applicationSubmitted: false,
    messageSent: false,
    outreachGenerated: false,
    resumeMutated: false,
    browserAutomationUsed: false,
    externalProviderCall: false,
    externalAiUsed: false,
    ollamaUsed: false,
    privatePathVisible: false,
    recruiterContactVisible: false,
    limitations: [
      "Read model excludes recruiter/contact details, message text, private paths, and execution controls.",
      ...item.limitations,
    ],
  };
}

export function buildApplicationEngagementQueue(input: {
  store: PrivateApplicationPipelineStore;
  generatedAt: string;
}): ApplicationEngagementQueueResult {
  if (!input.store.applications.length) {
    throw new Error("J004.01 requires existing authoritative Application records; no Application exists.");
  }

  const engagementItems = input.store.applications
    .map((application) =>
      engagementItemFor({
        application,
        events: input.store.applicationEvents,
        followUps: input.store.followUpReviews,
        generatedAt: input.generatedAt,
      }),
    )
    .sort((left, right) => engagementSortKey(left).localeCompare(engagementSortKey(right)));
  const careerEngagementQueue = engagementItems.filter((item) => item.needsAttention);

  return {
    schemaVersion: APPLICATION_ENGAGEMENT_QUEUE_SCHEMA_VERSION,
    workflowVersion: APPLICATION_FOLLOW_UP_RESPONSE_TRACKING_VERSION,
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Engagement",
    sourceAuthority: {
      existingApplicationAuthorityReused: true,
      applicationEventsReused: true,
      followUpReviewTasksReused: true,
      existingPipelineStoreLoaderReused: true,
      opportunityAuthorityReused: true,
      applicationContractCreated: false,
      applicationEventsCreated: false,
      applicationRecordsMutated: false,
      pipelineLogicRebuilt: false,
    },
    loaded: {
      applications: input.store.applications.length,
      applicationEvents: input.store.applicationEvents.length,
      followUpReviewTasks: input.store.followUpReviews.length,
    },
    engagementItems,
    careerEngagementQueue,
    readModel: engagementItems.map(readModelFor),
    summary: {
      applicationsReviewed: engagementItems.length,
      applicationsNeedingAttention: careerEngagementQueue.length,
      followUpDue: engagementItems.filter((item) => item.followUpState === "DUE").length,
      followUpOverdue: engagementItems.filter((item) => item.followUpState === "OVERDUE").length,
      followUpCompleted: engagementItems.filter((item) => item.followUpState === "COMPLETED").length,
      responsesRecorded: engagementItems.filter((item) => item.responseState !== "NO_RESPONSE").length,
      interviewPreparationItems: engagementItems.filter((item) => item.recommendedNextEngagementAction === "PREPARE_FOR_INTERVIEW").length,
      closeOutItems: engagementItems.filter((item) => item.recommendedNextEngagementAction === "CLOSE_OUT").length,
      noActionItems: engagementItems.filter((item) => item.recommendedNextEngagementAction === "NO_ACTION").length,
      applicationsCreated: 0,
      applicationsSubmitted: 0,
      messagesSent: 0,
      outreachGenerated: 0,
      resumesGenerated: 0,
      resumesMutated: 0,
    },
    auditSummary: {
      noParallelApplicationContract: true,
      noApplicationCreated: true,
      noApplicationSubmitted: true,
      noApplicationMutated: true,
      noApplicationEventCreated: true,
      noMessageSent: true,
      noOutreachGenerated: true,
      noResumeGenerated: true,
      noResumeMutated: true,
      noLinkedInMutated: true,
      noBrowserAutomation: true,
      noCalendarIntegration: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noOsConnection: true,
      noOperatorConnection: true,
      noEmployerIntentInferred: true,
      noResponseProbability: true,
      noInterviewProbability: true,
      privatePathVisible: false,
    },
  };
}

export function loadApplicationEngagementStoreFile(filePath: string): PrivateApplicationPipelineStore {
  const source = JSON.parse(readFileSync(filePath, "utf8")) as {
    applicationPipelineStore?: PrivateApplicationPipelineStore;
    store?: PrivateApplicationPipelineStore;
    result?: {
      applications?: PrivateApplicationRecord[];
      applicationEvents?: PrivateApplicationEventRecord[];
      followUpReviews?: PrivateFollowUpReviewTask[];
    };
    applications?: PrivateApplicationRecord[];
    applicationEvents?: PrivateApplicationEventRecord[];
    followUpReviews?: PrivateFollowUpReviewTask[];
  };
  if (source.applicationPipelineStore) return source.applicationPipelineStore;
  if (source.store) return source.store;
  if (source.result?.applications) {
    return {
      applications: source.result.applications || [],
      applicationEvents: source.result.applicationEvents || [],
      followUpReviews: source.result.followUpReviews || [],
      confirmationNeeded: [],
    };
  }
  if (source.applications) {
    return {
      applications: source.applications || [],
      applicationEvents: source.applicationEvents || [],
      followUpReviews: source.followUpReviews || [],
      confirmationNeeded: [],
    };
  }
  throw new Error("Engagement store file must contain existing Applications and related ApplicationEvents.");
}

export function loadApplicationEngagementStoreFromPrivateRoot(options: {
  applicationRoot: string;
  repositoryRoot: string;
}): PrivateApplicationPipelineStore {
  return loadPrivateApplicationPipelineStore(options);
}

export function writeApplicationEngagementQueueOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: ApplicationEngagementQueueResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private J004.01 Career Engagement output root");
  const runDirectory = path.join(input.outputRoot, `J004_01_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "career_engagement_queue.json": input.result.careerEngagementQueue,
    "application_engagement_items.json": input.result.engagementItems,
    "application_engagement_read_model.json": input.result.readModel,
    "follow_up_states.json": input.result.engagementItems.map((item) => ({
      applicationId: item.applicationId,
      followUpState: item.followUpState,
      followUpDueDate: item.followUpDueDate,
      followUpDueDateAuthority: item.followUpDueDateAuthority,
      recommendedNextEngagementAction: item.recommendedNextEngagementAction,
    })),
    "response_states.json": input.result.engagementItems.map((item) => ({
      applicationId: item.applicationId,
      responseState: item.responseState,
      responseStateAuthority: item.responseStateAuthority,
      lastApplicationEvent: item.lastApplicationEvent,
      recommendedNextEngagementAction: item.recommendedNextEngagementAction,
    })),
    "career_engagement_audit.json": input.result.auditSummary,
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

export function buildApplicationEngagementCliSummary(result: ApplicationEngagementQueueResult, writtenCount = 0) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    applicationsReviewed: result.summary.applicationsReviewed,
    applicationsNeedingAttention: result.summary.applicationsNeedingAttention,
    followUpDue: result.summary.followUpDue,
    followUpOverdue: result.summary.followUpOverdue,
    followUpCompleted: result.summary.followUpCompleted,
    responsesRecorded: result.summary.responsesRecorded,
    interviewPreparationItems: result.summary.interviewPreparationItems,
    closeOutItems: result.summary.closeOutItems,
    noActionItems: result.summary.noActionItems,
    privateArtifactsWritten: writtenCount,
    noApplicationCreated: result.auditSummary.noApplicationCreated,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noApplicationEventCreated: result.auditSummary.noApplicationEventCreated,
    noMessageSent: result.auditSummary.noMessageSent,
    noOutreachGenerated: result.auditSummary.noOutreachGenerated,
    noResumeMutated: result.auditSummary.noResumeMutated,
    noExternalProviderCall: result.auditSummary.noExternalProviderCall,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
    privatePathVisible: false,
  };
}

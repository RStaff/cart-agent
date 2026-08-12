import { createHash } from "node:crypto";
import {
  appendFileSync,
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
  OPPORTUNITY_RECOMMENDATION_ENGINE_VERSION,
  OPPORTUNITY_RECOMMENDATION_RESULT_SCHEMA_VERSION,
  canonicalOpportunityIdentity,
} from "./opportunityRecommendationEngine";
import type {
  ApplicationReadinessState,
  OpportunityApplicationRecommendation,
  OpportunityRecommendationReadModelRecord,
  OpportunityRecommendationRecord,
  OpportunityRecommendationResult,
  ResumeReuseStatus,
  ResumeUpdateEffort,
} from "./opportunityRecommendationEngine";

export const CAREER_WORKFLOW_ACTIONS_VERSION = "J003.03";
export const CAREER_WORKFLOW_ACTION_SCHEMA_VERSION =
  "staffordos.job_search.private_career_workflow_action.v1";
export const CAREER_WORKFLOW_STATE_SCHEMA_VERSION =
  "staffordos.job_search.private_career_workflow_state.v1";
export const CAREER_WORKFLOW_STATE_ITEM_SCHEMA_VERSION =
  "staffordos.job_search.private_career_workflow_state_item.v1";
export const DEFAULT_CAREER_WORKFLOW_JOB_SEARCH_ROOT = path.join(
  homedir(),
  ".staffordos/private/professional/job-search",
);

export const CAREER_WORKFLOW_ACTION_TYPES = [
  "APPLY",
  "REVIEW_LATER",
  "SKIP",
  "NOT_INTERESTED",
] as const;

export const CAREER_WORKFLOW_STATES = [
  "READY_TO_APPLY",
  "REVIEW_LATER",
  "SKIPPED",
  "NOT_INTERESTED",
] as const;

export type CareerWorkflowActionType = (typeof CAREER_WORKFLOW_ACTION_TYPES)[number];
export type CareerWorkflowStateName = (typeof CAREER_WORKFLOW_STATES)[number];

export type CareerWorkflowQueueEffect =
  | "MOVE_TO_APPLICATION_WORKSPACE_READY_TO_APPLY"
  | "RETURN_TO_FUTURE_WORK_QUEUE"
  | "REMOVE_FROM_TODAYS_QUEUE"
  | "EXCLUDE_FROM_FUTURE_RECOMMENDATIONS"
  | "NO_WORKFLOW_ACTION_RECORDED";

export type CareerWorkflowActionRecord = {
  schemaVersion: typeof CAREER_WORKFLOW_ACTION_SCHEMA_VERSION;
  workflowVersion: typeof CAREER_WORKFLOW_ACTIONS_VERSION;
  actionId: string;
  recommendationId: string;
  queueItemId: string;
  sourceRecordId: string | null;
  opportunityId: string | null;
  canonicalOpportunityId?: string | null;
  company: string;
  role: string;
  actionType: CareerWorkflowActionType;
  workflowState: CareerWorkflowStateName;
  queueEffect: CareerWorkflowQueueEffect;
  operatorConfirmed: true;
  createdAt: string;
  sourceAuthority: "ROSS_OPERATOR_DECISION";
  privacy: "Professional owner-private";
  applicationWorkspace: {
    movedToApplicationWorkspace: boolean;
    workspaceState: "READY_TO_APPLY" | null;
    applicationCreated: false;
    applicationSubmitted: false;
    completionProof: string;
    limitations: string[];
  };
  todaysQueue: {
    visibleToday: boolean;
    removedFromTodaysQueue: boolean;
  };
  futureWorkQueue: {
    queuedForFutureReview: boolean;
  };
  futureRecommendations: {
    eligibleForFutureRecommendations: boolean;
    excludedUntilExplicitlyRestored: boolean;
  };
  authorityRequired: "ROSS_OPERATOR_DECISION";
  completionProof: string;
  deterministicRulesOnly: true;
  recommendationLogicModified: false;
  discoveryModified: false;
  providerAdded: false;
  applicationCreated: false;
  applicationSubmitted: false;
  resumeGenerated: false;
  resumeMutated: false;
  coverLetterGenerated: false;
  messageSent: false;
  externalProviderCall: false;
  externalAiUsed: false;
  ollamaUsed: false;
  browserAutomationUsed: false;
  limitations: string[];
};

export type CareerWorkflowStateItem = {
  schemaVersion: typeof CAREER_WORKFLOW_STATE_ITEM_SCHEMA_VERSION;
  recommendationId: string;
  queueItemId: string;
  sourceRecordId: string | null;
  opportunityId: string | null;
  canonicalOpportunityId?: string | null;
  company: string;
  role: string;
  recommendation: OpportunityApplicationRecommendation;
  qualification: OpportunityRecommendationReadModelRecord["qualification"];
  shortlistedForDecision: boolean;
  applicationReadiness: ApplicationReadinessState;
  recommendedResumeVersion: {
    status: ResumeReuseStatus;
    safeLabel: string | null;
    factSafetyStatus: OpportunityRecommendationReadModelRecord["recommendedResumeVersion"]["factSafetyStatus"];
  };
  missingSkillCount: number;
  supportingEvidenceCount: number;
  estimatedResumeUpdateEffort: ResumeUpdateEffort;
  recommendedNextAction: string;
  workflowActionType: CareerWorkflowActionType | null;
  workflowState: CareerWorkflowStateName | null;
  stateAuthority: "ROSS_OPERATOR_DECISION" | "NO_WORKFLOW_ACTION_RECORDED";
  queueEffect: CareerWorkflowQueueEffect;
  currentWorkflowNextAction: string;
  inTodaysQueue: boolean;
  inFutureWorkQueue: boolean;
  readyToApply: boolean;
  skippedToday: boolean;
  excludedFromFutureRecommendations: boolean;
  applicationWorkspaceState: "READY_TO_APPLY" | null;
  applicationCreated: false;
  applicationSubmitted: false;
  resumeGenerated: false;
  resumeMutated: false;
  coverLetterGenerated: false;
  messageSent: false;
  limitations: string[];
  privatePathVisible: false;
  sourceUrlVisible: false;
  rawJobTextVisible: false;
  rawResumeTextVisible: false;
};

export type CareerWorkflowStateResult = {
  schemaVersion: typeof CAREER_WORKFLOW_STATE_SCHEMA_VERSION;
  workflowVersion: typeof CAREER_WORKFLOW_ACTIONS_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  sourceAuthority: {
    opportunityQueueReused: true;
    recommendationReadModelReused: true;
    explainableFitReused: true;
    applicationTrackingReused: true;
    resumeVersionReadModelReused: true;
    recommendationLogicModified: false;
    discoveryModified: false;
    providerAdded: false;
  };
  workflowActions: CareerWorkflowActionRecord[];
  stateItems: CareerWorkflowStateItem[];
  applicationWorkspaceReadyToApply: CareerWorkflowStateItem[];
  futureWorkQueue: CareerWorkflowStateItem[];
  todaysQueue: CareerWorkflowStateItem[];
  skippedToday: CareerWorkflowStateItem[];
  excludedFromFutureRecommendations: CareerWorkflowStateItem[];
  summary: {
    recommendationsReviewed: number;
    workflowActionsRecorded: number;
    pendingWorkflowAction: number;
    readyToApply: number;
    reviewLater: number;
    skipped: number;
    notInterested: number;
    applicationsCreated: 0;
    applicationsSubmitted: 0;
    resumesGenerated: 0;
    resumesMutated: 0;
    messagesSent: 0;
  };
  auditSummary: {
    noRecommendationLogicModified: true;
    noDiscoveryModified: true;
    noProviderAdded: true;
    noApplicationCreated: true;
    noApplicationSubmitted: true;
    noResumeGenerated: true;
    noResumeMutated: true;
    noCoverLetterGenerated: true;
    noMessageSent: true;
    noLinkedInMutated: true;
    noBrowserAutomation: true;
    noExternalProviderCall: true;
    noExternalAi: true;
    noOllama: true;
    noOsConnection: true;
    noOperatorConnection: true;
    privatePathVisible: false;
    rawJobTextVisible: false;
    rawResumeTextVisible: false;
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

function latestDirectory(root: string): string | null {
  if (!existsSync(root)) return null;
  const directories = readdirSync(root)
    .map((entry) => path.join(root, entry))
    .filter((entryPath) => {
      try {
        return statSync(entryPath).isDirectory();
      } catch {
        return false;
      }
    })
    .sort((left, right) => statSync(left).mtimeMs - statSync(right).mtimeMs || left.localeCompare(right));
  return directories[directories.length - 1] || null;
}

function latestJson<T>(root: string, filename: string): T | null {
  const directory = latestDirectory(root);
  if (!directory) return null;
  const filePath = path.join(directory, filename);
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function latestOpportunityRecommendationResult(jobSearchRoot: string): OpportunityRecommendationResult | null {
  const readModel = latestJson<OpportunityRecommendationReadModelRecord[]>(
    path.join(jobSearchRoot, "opportunity-recommendations"),
    "future_read_model.json",
  );
  if (!readModel) return null;
  const recommendations = latestJson<OpportunityRecommendationRecord[]>(
    path.join(jobSearchRoot, "opportunity-recommendations"),
    "opportunity_recommendations.json",
  ) || [];
  const generatedAt = readModel[0]?.capturedAsOf || new Date().toISOString();

  return {
    schemaVersion: OPPORTUNITY_RECOMMENDATION_RESULT_SCHEMA_VERSION,
    workflowVersion: OPPORTUNITY_RECOMMENDATION_ENGINE_VERSION,
    generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {
      opportunityQueueReused: true,
      explainableFitReused: true,
      resumeVersionAuthorityReused: true,
      discoveryRebuilt: false,
      providerAdded: false,
    },
    recommendations,
    readModel,
    summary: {
      queueItemsReviewed: readModel.length,
      recommendationsCreated: readModel.length,
      applyNow: readModel.filter((record) => record.recommendation === "APPLY_NOW").length,
      review: readModel.filter((record) => record.recommendation === "REVIEW").length,
      wait: readModel.filter((record) => record.recommendation === "WAIT").length,
      skip: readModel.filter((record) => record.recommendation === "SKIP").length,
      resumeVersionsEvaluated: recommendations.reduce(
        (count, record) => count + record.recommendedResumeVersion.evaluatedResumeVersions.length,
        0,
      ),
      opportunitiesWithRecommendedResumeVersion: readModel.filter(
        (record) => record.recommendedResumeVersion.status === "SELECTED_EXISTING_RESUMEVERSION",
      ).length,
      opportunitiesMissingSkills: readModel.filter((record) => record.missingSkillCount > 0).length,
      readinessReadyForOperatorApprovedApplication: readModel.filter(
        (record) => record.applicationReadiness === "READY_FOR_OPERATOR_APPROVED_APPLICATION",
      ).length,
      hiringProbabilityGenerated: false,
      interviewProbabilityGenerated: false,
      aiConfidenceScoreGenerated: false,
    },
    auditSummary: {
      noApplicationCreated: true,
      noApplicationSubmitted: true,
      noResumeGenerated: true,
      noResumeMutated: true,
      noCoverLetterGenerated: true,
      noMessageSent: true,
      noLinkedInMutated: true,
      noBrowserAutomation: true,
      noProviderAdded: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noOsConnection: true,
      noOperatorConnection: true,
      noCareerFactPromoted: true,
      noCareerEvidenceMutated: true,
      privatePathVisible: false,
    },
  };
}

function actionType(value: unknown): CareerWorkflowActionType {
  if (typeof value === "string" && CAREER_WORKFLOW_ACTION_TYPES.includes(value as CareerWorkflowActionType)) {
    return value as CareerWorkflowActionType;
  }
  throw new Error(`Unsupported Career workflow action: ${String(value)}`);
}

function transitionFor(action: CareerWorkflowActionType): {
  workflowState: CareerWorkflowStateName;
  queueEffect: CareerWorkflowQueueEffect;
  visibleToday: boolean;
  futureReview: boolean;
  readyToApply: boolean;
  skippedToday: boolean;
  excludedFuture: boolean;
  currentWorkflowNextAction: string;
  completionProof: string;
  limitations: string[];
} {
  if (action === "APPLY") {
    return {
      workflowState: "READY_TO_APPLY",
      queueEffect: "MOVE_TO_APPLICATION_WORKSPACE_READY_TO_APPLY",
      visibleToday: false,
      futureReview: false,
      readyToApply: true,
      skippedToday: false,
      excludedFuture: false,
      currentWorkflowNextAction:
        "Prepare the manual application package in the Application Workspace. No Application exists until a separately authorized workflow creates one.",
      completionProof: "The recommendation appears in the private Ready to Apply workspace queue.",
      limitations: [
        "APPLY records application-planning intent only.",
        "No Application is created and nothing is submitted.",
      ],
    };
  }
  if (action === "REVIEW_LATER") {
    return {
      workflowState: "REVIEW_LATER",
      queueEffect: "RETURN_TO_FUTURE_WORK_QUEUE",
      visibleToday: false,
      futureReview: true,
      readyToApply: false,
      skippedToday: false,
      excludedFuture: false,
      currentWorkflowNextAction: "Return this recommendation to the future work queue for later review.",
      completionProof: "The recommendation appears in the private future work queue.",
      limitations: ["Review-later keeps the recommendation eligible for future operator review."],
    };
  }
  if (action === "SKIP") {
    return {
      workflowState: "SKIPPED",
      queueEffect: "REMOVE_FROM_TODAYS_QUEUE",
      visibleToday: false,
      futureReview: false,
      readyToApply: false,
      skippedToday: true,
      excludedFuture: false,
      currentWorkflowNextAction: "Keep this recommendation out of today's queue without excluding it from future recommendations.",
      completionProof: "The recommendation is removed from today's queue.",
      limitations: ["Skip is a current-queue decision only; it is not a permanent exclusion."],
    };
  }
  return {
    workflowState: "NOT_INTERESTED",
    queueEffect: "EXCLUDE_FROM_FUTURE_RECOMMENDATIONS",
    visibleToday: false,
    futureReview: false,
    readyToApply: false,
    skippedToday: false,
    excludedFuture: true,
    currentWorkflowNextAction: "Exclude this opportunity from future recommendations until Ross explicitly restores it.",
    completionProof: "The recommendation appears in the private future-exclusion list.",
    limitations: ["Restore is intentionally outside this mission and requires separately authorized operator action."],
  };
}

function fullRecommendationById(result: OpportunityRecommendationResult) {
  return new Map(result.recommendations.map((record) => [record.recommendationId, record]));
}

function readModelById(result: OpportunityRecommendationResult) {
  return new Map(result.readModel.map((record) => [record.recommendationId, record]));
}

function assertApplyIsPlanningOnly(record: OpportunityRecommendationReadModelRecord) {
  if (
    record.recommendation !== "APPLY_NOW" ||
    record.applicationReadiness !== "READY_FOR_OPERATOR_APPROVED_APPLICATION"
  ) {
    throw new Error("APPLY requires an APPLY_NOW recommendation that is ready for operator-approved application planning.");
  }
}

function assertSingleActionPerRecommendation(actions: readonly CareerWorkflowActionRecord[]) {
  const seen = new Map<string, CareerWorkflowActionRecord>();
  for (const action of actions) {
    const parsedActionType = actionType(action.actionType);
    if (action.operatorConfirmed !== true) {
      throw new Error(`Workflow action ${action.actionId} is missing operator confirmation.`);
    }
    const expectedState = transitionFor(parsedActionType).workflowState;
    if (action.workflowState !== expectedState) {
      throw new Error(`Workflow action ${action.actionId} has an invalid workflow state.`);
    }
    const existing = seen.get(action.recommendationId);
    if (existing) {
      throw new Error(`Recommendation ${action.recommendationId} already has workflow action ${existing.actionId}.`);
    }
    seen.set(action.recommendationId, action);
  }
}

function assertActionMatchesReadModel(
  action: CareerWorkflowActionRecord,
  readModel: OpportunityRecommendationReadModelRecord,
) {
  const stableIdentityMatches = Boolean(action.canonicalOpportunityId && readModel.canonicalOpportunityId && action.canonicalOpportunityId === readModel.canonicalOpportunityId);
  if (!stableIdentityMatches && action.queueItemId !== readModel.queueItemId) {
    throw new Error(`Workflow action ${action.actionId} does not match the recommendation queue item.`);
  }
  if (action.company !== readModel.company || action.role !== readModel.role) {
    throw new Error(`Workflow action ${action.actionId} does not match the recommendation record.`);
  }
  if (action.actionType === "APPLY") assertApplyIsPlanningOnly(readModel);
}

export function createCareerWorkflowAction(input: {
  recommendationResult: OpportunityRecommendationResult;
  recommendationId: string;
  actionType: CareerWorkflowActionType;
  generatedAt: string;
  operatorConfirmed: boolean;
  existingActions?: readonly CareerWorkflowActionRecord[];
}): CareerWorkflowActionRecord {
  if (input.operatorConfirmed !== true) {
    throw new Error("Workflow action requires explicit Ross operator confirmation.");
  }
  const parsedAction = actionType(input.actionType);
  const readModel = readModelById(input.recommendationResult).get(input.recommendationId);
  if (!readModel) throw new Error("Recommendation not found.");
  const existingActions = [...(input.existingActions || [])];
  assertSingleActionPerRecommendation(existingActions);
  if (existingActions.some((action) => action.recommendationId === input.recommendationId)) {
    throw new Error("Each recommendation may receive exactly one workflow action.");
  }
  if (parsedAction === "APPLY") assertApplyIsPlanningOnly(readModel);
  const fullRecord = fullRecommendationById(input.recommendationResult).get(input.recommendationId) || null;
  const transition = transitionFor(parsedAction);

  return {
    schemaVersion: CAREER_WORKFLOW_ACTION_SCHEMA_VERSION,
    workflowVersion: CAREER_WORKFLOW_ACTIONS_VERSION,
    actionId: opaqueId("privcareerworkflowaction", [
      CAREER_WORKFLOW_ACTIONS_VERSION,
      input.recommendationId,
      readModel.queueItemId,
      parsedAction,
      input.generatedAt,
    ]),
    recommendationId: input.recommendationId,
    queueItemId: readModel.queueItemId,
    sourceRecordId: fullRecord?.sourceRecordId || null,
    opportunityId: fullRecord?.opportunityId || null,
    canonicalOpportunityId: fullRecord?.canonicalOpportunityId || null,
    company: readModel.company,
    role: readModel.role,
    actionType: parsedAction,
    workflowState: transition.workflowState,
    queueEffect: transition.queueEffect,
    operatorConfirmed: true,
    createdAt: input.generatedAt,
    sourceAuthority: "ROSS_OPERATOR_DECISION",
    privacy: "Professional owner-private",
    applicationWorkspace: {
      movedToApplicationWorkspace: parsedAction === "APPLY",
      workspaceState: parsedAction === "APPLY" ? "READY_TO_APPLY" : null,
      applicationCreated: false,
      applicationSubmitted: false,
      completionProof: transition.completionProof,
      limitations: [
        "Application Workspace state is a private planning queue only.",
        "Application tracking remains a separate authority and is not mutated by J003.03.",
      ],
    },
    todaysQueue: {
      visibleToday: transition.visibleToday,
      removedFromTodaysQueue: !transition.visibleToday,
    },
    futureWorkQueue: {
      queuedForFutureReview: transition.futureReview,
    },
    futureRecommendations: {
      eligibleForFutureRecommendations: !transition.excludedFuture,
      excludedUntilExplicitlyRestored: transition.excludedFuture,
    },
    authorityRequired: "ROSS_OPERATOR_DECISION",
    completionProof: transition.completionProof,
    deterministicRulesOnly: true,
    recommendationLogicModified: false,
    discoveryModified: false,
    providerAdded: false,
    applicationCreated: false,
    applicationSubmitted: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    externalProviderCall: false,
    externalAiUsed: false,
    ollamaUsed: false,
    browserAutomationUsed: false,
    limitations: [
      "Workflow action records Ross's private decision about an existing recommendation.",
      "The recommendation and ranking logic are reused unchanged.",
      ...transition.limitations,
    ],
  };
}

function stateItem(input: {
  record: OpportunityRecommendationReadModelRecord;
  fullRecord: OpportunityRecommendationRecord | null;
  action: CareerWorkflowActionRecord | null;
}): CareerWorkflowStateItem {
  const transition = input.action ? transitionFor(input.action.actionType) : null;
  return {
    schemaVersion: CAREER_WORKFLOW_STATE_ITEM_SCHEMA_VERSION,
    recommendationId: input.record.recommendationId,
    queueItemId: input.record.queueItemId,
    sourceRecordId: input.fullRecord?.sourceRecordId || input.action?.sourceRecordId || null,
    opportunityId: input.fullRecord?.opportunityId || input.action?.opportunityId || null,
    canonicalOpportunityId: input.fullRecord?.canonicalOpportunityId || input.action?.canonicalOpportunityId || null,
    company: input.record.company,
    role: input.record.role,
    recommendation: input.record.recommendation,
    qualification: input.record.qualification,
    shortlistedForDecision: input.record.shortlistedForDecision,
    applicationReadiness: input.record.applicationReadiness,
    recommendedResumeVersion: input.record.recommendedResumeVersion,
    missingSkillCount: input.record.missingSkillCount,
    supportingEvidenceCount: input.record.supportingEvidenceCount,
    estimatedResumeUpdateEffort: input.record.estimatedResumeUpdateEffort,
    recommendedNextAction: input.record.recommendedNextAction,
    workflowActionType: input.action?.actionType || null,
    workflowState: input.action?.workflowState || null,
    stateAuthority: input.action ? "ROSS_OPERATOR_DECISION" : "NO_WORKFLOW_ACTION_RECORDED",
    queueEffect: transition?.queueEffect || "NO_WORKFLOW_ACTION_RECORDED",
    currentWorkflowNextAction:
      transition?.currentWorkflowNextAction || "Choose APPLY, REVIEW_LATER, SKIP, or NOT_INTERESTED.",
    inTodaysQueue: transition ? transition.visibleToday : input.record.shortlistedForDecision ?? true,
    inFutureWorkQueue: Boolean(transition?.futureReview),
    readyToApply: Boolean(transition?.readyToApply),
    skippedToday: Boolean(transition?.skippedToday),
    excludedFromFutureRecommendations: Boolean(transition?.excludedFuture),
    applicationWorkspaceState: transition?.readyToApply ? "READY_TO_APPLY" : null,
    applicationCreated: false,
    applicationSubmitted: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    limitations: [
      "State is projected from the J003.01 recommendation read model plus owner-private workflow actions.",
      "No Application, resume, cover letter, message, provider action, or external action is performed.",
      ...input.record.limitations,
      ...(input.action?.limitations || []),
    ],
    privatePathVisible: false,
    sourceUrlVisible: false,
    rawJobTextVisible: false,
    rawResumeTextVisible: false,
  };
}

function actionMapFor(
  recommendationResult: OpportunityRecommendationResult,
  actions: readonly CareerWorkflowActionRecord[],
) {
  assertSingleActionPerRecommendation(actions);
  const readModels = readModelById(recommendationResult);
  const actionByRecommendation = new Map<string, CareerWorkflowActionRecord>();
  for (const action of actions) {
    const readModel = readModels.get(action.recommendationId) || [...readModels.values()].find((candidate) =>
      Boolean(action.canonicalOpportunityId && candidate.canonicalOpportunityId === action.canonicalOpportunityId),
    );
    if (!readModel) {
      if (action.canonicalOpportunityId) continue;
      throw new Error(`Workflow action ${action.actionId} references an unknown recommendation.`);
    }
    assertActionMatchesReadModel(action, readModel);
    actionByRecommendation.set(readModel.recommendationId, action);
  }
  return actionByRecommendation;
}

function actionsCompatibleWithRecommendationResult(
  recommendationResult: OpportunityRecommendationResult,
  actions: readonly CareerWorkflowActionRecord[],
) {
  const readModels = readModelById(recommendationResult);
  return actions.filter((action) => {
    const readModel = readModels.get(action.recommendationId) || [...readModels.values()].find((candidate) =>
      Boolean(action.canonicalOpportunityId && candidate.canonicalOpportunityId === action.canonicalOpportunityId),
    );
    return Boolean(readModel &&
      ((readModel.canonicalOpportunityId && action.canonicalOpportunityId && readModel.canonicalOpportunityId === action.canonicalOpportunityId) ||
        (readModel.queueItemId === action.queueItemId && readModel.company === action.company && readModel.role === action.role)));
  });
}

export function buildCareerWorkflowState(input: {
  recommendationResult: OpportunityRecommendationResult;
  workflowActions?: readonly CareerWorkflowActionRecord[];
  generatedAt: string;
}): CareerWorkflowStateResult {
  const actions = [...(input.workflowActions || [])].sort(
    (left, right) =>
      left.recommendationId.localeCompare(right.recommendationId) ||
      left.createdAt.localeCompare(right.createdAt) ||
      left.actionId.localeCompare(right.actionId),
  );
  const actionsByRecommendation = actionMapFor(input.recommendationResult, actions);
  const fullById = fullRecommendationById(input.recommendationResult);
  const stateItems = input.recommendationResult.readModel.map((record) =>
    stateItem({
      record,
      fullRecord: fullById.get(record.recommendationId) || null,
      action: actionsByRecommendation.get(record.recommendationId) || null,
    }),
  );

  return {
    schemaVersion: CAREER_WORKFLOW_STATE_SCHEMA_VERSION,
    workflowVersion: CAREER_WORKFLOW_ACTIONS_VERSION,
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {
      opportunityQueueReused: true,
      recommendationReadModelReused: true,
      explainableFitReused: true,
      applicationTrackingReused: true,
      resumeVersionReadModelReused: true,
      recommendationLogicModified: false,
      discoveryModified: false,
      providerAdded: false,
    },
    workflowActions: actions,
    stateItems,
    applicationWorkspaceReadyToApply: stateItems.filter((item) => item.readyToApply),
    futureWorkQueue: stateItems.filter((item) => item.inFutureWorkQueue),
    todaysQueue: stateItems.filter((item) => item.inTodaysQueue),
    skippedToday: stateItems.filter((item) => item.skippedToday),
    excludedFromFutureRecommendations: stateItems.filter((item) => item.excludedFromFutureRecommendations),
    summary: {
      recommendationsReviewed: stateItems.length,
      workflowActionsRecorded: actions.length,
      pendingWorkflowAction: stateItems.filter((item) => !item.workflowActionType).length,
      readyToApply: stateItems.filter((item) => item.readyToApply).length,
      reviewLater: stateItems.filter((item) => item.workflowState === "REVIEW_LATER").length,
      skipped: stateItems.filter((item) => item.workflowState === "SKIPPED").length,
      notInterested: stateItems.filter((item) => item.workflowState === "NOT_INTERESTED").length,
      applicationsCreated: 0,
      applicationsSubmitted: 0,
      resumesGenerated: 0,
      resumesMutated: 0,
      messagesSent: 0,
    },
    auditSummary: {
      noRecommendationLogicModified: true,
      noDiscoveryModified: true,
      noProviderAdded: true,
      noApplicationCreated: true,
      noApplicationSubmitted: true,
      noResumeGenerated: true,
      noResumeMutated: true,
      noCoverLetterGenerated: true,
      noMessageSent: true,
      noLinkedInMutated: true,
      noBrowserAutomation: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noOsConnection: true,
      noOperatorConnection: true,
      privatePathVisible: false,
      rawJobTextVisible: false,
      rawResumeTextVisible: false,
    },
  };
}

export function writeCareerWorkflowAction(input: {
  actionRoot: string;
  repositoryRoot: string;
  action: CareerWorkflowActionRecord;
}) {
  assertOutsideRepository(input.actionRoot, input.repositoryRoot, "Private J003.03 Career workflow action root");
  ensurePrivateDirectory(input.actionRoot);
  const actionLog = path.join(input.actionRoot, "workflow_actions.ndjson");
  appendFileSync(actionLog, `${JSON.stringify(input.action)}\n`, { encoding: "utf8", mode: 0o600 });
  chmodSync(actionLog, 0o600);
  return {
    artifactName: "workflow_actions.ndjson",
    actionId: input.action.actionId,
    privatePathVisible: false as const,
  };
}

export function writeCareerWorkflowStateOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: CareerWorkflowStateResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private J003.03 Career workflow state output root");
  const runDirectory = path.join(input.outputRoot, `J003_03_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "workflow_state.json": input.result,
    "application_workspace_ready_to_apply.json": input.result.applicationWorkspaceReadyToApply,
    "future_work_queue.json": input.result.futureWorkQueue,
    "todays_queue.json": input.result.todaysQueue,
    "skipped_today.json": input.result.skippedToday,
    "excluded_from_future_recommendations.json": input.result.excludedFromFutureRecommendations,
    "workflow_actions.json": input.result.workflowActions,
    "workflow_audit.json": input.result.auditSummary,
  };
  const written: string[] = [];
  for (const [filename, value] of Object.entries(artifacts)) {
    const filePath = path.join(runDirectory, filename);
    writeJson(filePath, value);
    written.push(filePath);
  }
  return {
    runDirectory,
    artifactNames: Object.keys(artifacts),
    writtenFiles: written,
    privatePathVisible: false as const,
  };
}

function readJson(filePath: string) {
  return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

export function loadOpportunityRecommendationResultFile(filePath: string): OpportunityRecommendationResult {
  const record = readJson(filePath) as {
    opportunityRecommendationResult?: OpportunityRecommendationResult;
    recommendationResult?: OpportunityRecommendationResult;
    result?: OpportunityRecommendationResult;
    readModel?: unknown;
    recommendations?: unknown;
  };
  if (record.opportunityRecommendationResult) return record.opportunityRecommendationResult;
  if (record.recommendationResult) return record.recommendationResult;
  if (record.result) return record.result;
  if (record.readModel && record.recommendations) return record as unknown as OpportunityRecommendationResult;
  throw new Error("Recommendation result file must contain a full J003.01 OpportunityRecommendationResult.");
}

export function loadCareerWorkflowActionsFile(filePath: string): CareerWorkflowActionRecord[] {
  if (!existsSync(filePath)) return [];
  const source = readFileSync(filePath, "utf8").trim();
  if (!source) return [];
  if (filePath.endsWith(".ndjson")) {
    return source
      .split(/\n+/)
      .map((line) => JSON.parse(line) as CareerWorkflowActionRecord);
  }
  const record = JSON.parse(source) as unknown;
  if (Array.isArray(record)) return record as CareerWorkflowActionRecord[];
  const object = record as {
    workflowActions?: CareerWorkflowActionRecord[];
    actions?: CareerWorkflowActionRecord[];
    result?: { workflowActions?: CareerWorkflowActionRecord[] };
  };
  return object.workflowActions || object.actions || object.result?.workflowActions || [];
}

export function loadLatestCareerWorkflowActions(jobSearchRoot = DEFAULT_CAREER_WORKFLOW_JOB_SEARCH_ROOT) {
  const actionLog = path.join(jobSearchRoot, "career-workflow-actions", "workflow_actions.ndjson");
  if (!existsSync(actionLog)) return [];
  const actions = loadCareerWorkflowActionsFile(actionLog);
  const recommendationRuns = path.join(jobSearchRoot, "opportunity-recommendations");
  const historicalRecommendationById = new Map<string, { sourceRecordId: string }>();
  if (existsSync(recommendationRuns)) {
    for (const directory of readdirSync(recommendationRuns)) {
      const filePath = path.join(recommendationRuns, directory, "opportunity_recommendation_result.json");
      if (!existsSync(filePath)) continue;
      try {
        const result = loadOpportunityRecommendationResultFile(filePath);
        for (const record of result.recommendations) historicalRecommendationById.set(record.recommendationId, { sourceRecordId: record.sourceRecordId });
      } catch (_error) {
        // Ignore malformed historical runs; current authority remains fail-closed.
      }
    }
  }
  const sourceRecordById = new Map<string, { providerId?: string; providerJobId?: string; sourceUrl?: string }>();
  const discoveryRoot = path.join(jobSearchRoot, "greenhouse-discovery");
  if (existsSync(discoveryRoot)) {
    for (const directory of readdirSync(discoveryRoot)) {
      const filePath = path.join(discoveryRoot, directory, "job_source_import_queue_result.json");
      if (!existsSync(filePath)) continue;
      try {
        const result = JSON.parse(readFileSync(filePath, "utf8"));
        for (const record of result.normalizedSourceRecords || []) sourceRecordById.set(record.jobSourceRecordId, record);
      } catch (_error) {
        // Ignore malformed historical runs; current authority remains fail-closed.
      }
    }
  }
  return actions.map((action) => {
    if (action.canonicalOpportunityId) return action;
    const historical = historicalRecommendationById.get(action.recommendationId);
    const source = historical ? sourceRecordById.get(historical.sourceRecordId) : null;
    const canonicalOpportunityId = source ? canonicalOpportunityIdentity(source) : null;
    return canonicalOpportunityId ? { ...action, canonicalOpportunityId } : action;
  });
}

export function loadLatestCareerWorkflowState(jobSearchRoot = DEFAULT_CAREER_WORKFLOW_JOB_SEARCH_ROOT) {
  return latestJson<CareerWorkflowStateResult>(
    path.join(jobSearchRoot, "career-workflow-state"),
    "workflow_state.json",
  );
}

export function runCareerWorkflowActionFromPrivateArtifacts(input: {
  recommendationId: string;
  actionType: CareerWorkflowActionType;
  operatorConfirmed: boolean;
  generatedAt?: string;
  jobSearchRoot?: string;
  repositoryRoot?: string;
  writeOutputs?: boolean;
}) {
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_CAREER_WORKFLOW_JOB_SEARCH_ROOT;
  const repositoryRoot = input.repositoryRoot || process.cwd();
  assertOutsideRepository(jobSearchRoot, repositoryRoot, "Private CareerOS job-search root");
  const recommendationResult = latestOpportunityRecommendationResult(jobSearchRoot);
  if (!recommendationResult) throw new Error("No latest Opportunity Recommendation read model is available.");
  const existingActions = actionsCompatibleWithRecommendationResult(
    recommendationResult,
    loadLatestCareerWorkflowActions(jobSearchRoot),
  );
  const generatedAt = input.generatedAt || new Date().toISOString();
  const action = createCareerWorkflowAction({
    recommendationResult,
    recommendationId: input.recommendationId,
    actionType: input.actionType,
    generatedAt,
    operatorConfirmed: input.operatorConfirmed,
    existingActions,
  });
  const actionWrite = input.writeOutputs
    ? writeCareerWorkflowAction({
        actionRoot: path.join(jobSearchRoot, "career-workflow-actions"),
        repositoryRoot,
        action,
      })
    : null;
  const result = buildCareerWorkflowState({
    recommendationResult,
    workflowActions: [...existingActions, action],
    generatedAt,
  });
  const stateWrite = input.writeOutputs
    ? writeCareerWorkflowStateOutputs({
        outputRoot: path.join(jobSearchRoot, "career-workflow-state"),
        repositoryRoot,
        result,
      })
    : null;
  return {
    action,
    result,
    actionWrite,
    stateWrite,
    auditSummary: {
      noApplicationCreated: result.auditSummary.noApplicationCreated,
      noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
      noResumeGenerated: result.auditSummary.noResumeGenerated,
      noResumeMutated: result.auditSummary.noResumeMutated,
      noMessageSent: result.auditSummary.noMessageSent,
      noExternalProviderCall: result.auditSummary.noExternalProviderCall,
      noExternalAi: result.auditSummary.noExternalAi,
      noOllama: result.auditSummary.noOllama,
      noBrowserAutomation: result.auditSummary.noBrowserAutomation,
      privatePathVisible: false as const,
    },
  };
}

export function projectCareerWorkflowStateFromPrivateArtifacts(input: {
  jobSearchRoot?: string;
  repositoryRoot?: string;
  generatedAt?: string;
}) {
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_CAREER_WORKFLOW_JOB_SEARCH_ROOT;
  const repositoryRoot = input.repositoryRoot || process.cwd();
  assertOutsideRepository(jobSearchRoot, repositoryRoot, "Private CareerOS job-search root");
  const recommendationResult = latestOpportunityRecommendationResult(jobSearchRoot);
  if (!recommendationResult) return null;
  return buildCareerWorkflowState({
    recommendationResult,
    workflowActions: actionsCompatibleWithRecommendationResult(
      recommendationResult,
      loadLatestCareerWorkflowActions(jobSearchRoot),
    ),
    generatedAt: input.generatedAt || recommendationResult.generatedAt,
  });
}

export function buildCareerWorkflowCliSummary(input: {
  result: CareerWorkflowStateResult;
  actionWritten?: CareerWorkflowActionRecord | null;
  privateArtifactsWritten?: number;
}) {
  return {
    workflowVersion: input.result.workflowVersion,
    generatedAt: input.result.generatedAt,
    recommendationsReviewed: input.result.summary.recommendationsReviewed,
    workflowActionsRecorded: input.result.summary.workflowActionsRecorded,
    pendingWorkflowAction: input.result.summary.pendingWorkflowAction,
    readyToApply: input.result.summary.readyToApply,
    reviewLater: input.result.summary.reviewLater,
    skipped: input.result.summary.skipped,
    notInterested: input.result.summary.notInterested,
    actionWritten: input.actionWritten
      ? {
          actionId: input.actionWritten.actionId,
          recommendationId: input.actionWritten.recommendationId,
          actionType: input.actionWritten.actionType,
          workflowState: input.actionWritten.workflowState,
          queueEffect: input.actionWritten.queueEffect,
        }
      : null,
    privateArtifactsWritten: input.privateArtifactsWritten || 0,
    noRecommendationLogicModified: input.result.auditSummary.noRecommendationLogicModified,
    noDiscoveryModified: input.result.auditSummary.noDiscoveryModified,
    noProviderAdded: input.result.auditSummary.noProviderAdded,
    noApplicationCreated: input.result.auditSummary.noApplicationCreated,
    noApplicationSubmitted: input.result.auditSummary.noApplicationSubmitted,
    noResumeGenerated: input.result.auditSummary.noResumeGenerated,
    noResumeMutated: input.result.auditSummary.noResumeMutated,
    noCoverLetterGenerated: input.result.auditSummary.noCoverLetterGenerated,
    noMessageSent: input.result.auditSummary.noMessageSent,
    noExternalProviderCall: input.result.auditSummary.noExternalProviderCall,
    noExternalAi: input.result.auditSummary.noExternalAi,
    noOllama: input.result.auditSummary.noOllama,
    privatePathVisible: false,
  };
}

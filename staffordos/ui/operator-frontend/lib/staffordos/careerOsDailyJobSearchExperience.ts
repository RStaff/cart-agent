import {
  buildCareerOsCommandCenterPresentation,
  type CareerOsCommandCenterInput,
  type CareerOsCommandCenterPresentation,
  type CareerOsPipelineSummary,
  type CareerOsSystemHealth,
  type CareerOsTopRecommendation,
} from "./careerOsCommandCenterPresentation";
import {
  JOB_COMMAND_PRIMARY_QUESTION,
  JOB_COMMAND_ROUTE,
  JOB_COMMAND_WORKSPACE_ID,
} from "./jobSearchCommandPresentation";
import type {
  ApplicationEngagementQueueResult,
  ApplicationEngagementReadModelRecord,
} from "./applicationFollowUpResponseTracking";
import type {
  ApplicationReviewWorkspaceReadModelRecord,
  ApplicationReviewWorkspaceResult,
} from "./applicationReviewWorkspace";
import type {
  ReadyToApplyApplicationPackageReadModelRecord,
  ReadyToApplyApplicationPackageResult,
} from "./readyToApplyApplicationPackage";
import type {
  ApplicationIntelligenceHumanReviewProjection,
  ApplicationIntelligencePacketReadModelRecord,
} from "./applicationIntelligencePacket";
import type {
  TruthBoundResumeDraftReadModelRecord,
  TruthBoundResumeDraftReviewReadModelRecord,
} from "./truthBoundResumeDraft";
import type { ReviewedResumeDraftExportReadModelRecord } from "./reviewedResumeDraftExport";
import type { ManualSubmissionReadModelRecord } from "./manualSubmissionRecordAndArtifactLinkage";
import type {
  CareerWorkflowActionType,
  CareerWorkflowStateItem,
  CareerWorkflowStateResult,
} from "./careerWorkflowActions";
import type {
  PipelineReviewDecisionType,
  PrivatePipelineReviewAction,
} from "./privateApplicationPipelineReview";

export const CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE_VERSION = "CAREEROS_V1.01";
export const CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE_SCHEMA_VERSION =
  "staffordos.job_search.careeros_daily_job_search_experience.v1";

export type CareerOsDailyRecommendation = "APPLY NOW" | "REVIEW" | "WAIT" | "SKIP";
export type CareerOsDailyActionKind =
  | "Review Package"
  | "Open Opportunity"
  | "Decide"
  | "View Intelligence"
  | "Review Draft"
  | "Approve for Export"
  | "Download DOCX"
  | "Mark as Submitted"
  | "View Resume"
  | "Review Evidence"
  | "Prepare Resume Draft"
  | "Follow Up"
  | "Prepare Interview"
  | "Ready for Manual Application"
  | "No Action";

export type CareerOsDailyBriefMetric = {
  id:
    | "applications-needing-follow-up"
    | "ready-to-apply"
    | "opportunities-requiring-decision"
    | "resume-reviews-needed"
    | "new-opportunities"
    | "interview-activity";
  label: string;
  value: number;
  detail: string;
};

export type CareerOsDailyPriority = {
  id: string;
  title: string;
  company: string | null;
  role: string | null;
  category:
    | "Application follow-up"
    | "Application review"
    | "Resume review"
    | "Evidence review"
    | "Opportunity review"
    | "Interview activity";
  status: string;
  detail: string;
  action: CareerOsDailyActionKind;
  urgency: "today" | "next" | "later";
  externalActionAvailable: false;
  limitations: string[];
};

export type CareerOsDailyTopOpportunity = {
  id: string;
  company: string;
  position: string;
  explainableFit: string;
  recommendation: CareerOsDailyRecommendation;
  resumeVersion: string;
  nextAction: CareerOsDailyActionKind;
  detail: string;
  externalActionAvailable: false;
  limitations: string[];
};

export type CareerOsDailyOpportunityDecisionItem = {
  id: string;
  recommendationId: string;
  queueItemId: string;
  company: string;
  role: string;
  recommendation: CareerOsDailyRecommendation;
  operatorDecision: "No Ross decision yet" | "Apply" | "Review later" | "Skipped" | "Not interested";
  workflowState: string;
  decisionAuthority: "Ross decision" | "Awaiting Ross decision";
  applicationReadiness: string;
  resumeReadiness: string;
  explainableFit: string;
  whyItFits: string;
  gaps: string;
  evidence: string;
  humanReview: ApplicationIntelligenceHumanReviewProjection | null;
  recommendedNextAction: string;
  currentWorkflowNextAction: string;
  status: "NEEDS_DECISION" | "READY_TO_APPLY" | "REVIEW_LATER" | "SKIPPED" | "NOT_INTERESTED";
  shownInTodaysQueue: boolean;
  downstreamStage: "PREPARE_RESUME_DRAFT" | "FUTURE_REVIEW" | "REMOVED_TODAY" | "EXCLUDED_UNTIL_RESTORED" | "AWAITING_DECISION";
  availableActions: Array<{
    actionType: CareerWorkflowActionType;
    label: "Apply" | "Review later" | "Skip" | "Not interested";
    enabled: boolean;
    reason: string;
    nextStep: string;
  }>;
  externalActionAvailable: false;
  applicationCreated: false;
  applicationSubmitted: false;
  resumeGenerated: false;
  messageSent: false;
  limitations: string[];
};

export type CareerOsDailyApplicationWorkItem = {
  id: string;
  company: string;
  role: string;
  task: CareerOsDailyActionKind;
  status: string;
  detail: string;
  applicationDate: string | null;
  humanReviewRequired: boolean;
  externalActionAvailable: false;
  limitations: string[];
};

export type CareerOsDailyApplicationOutcomeAction = {
  actionId: string;
  decisionType: PipelineReviewDecisionType;
  label:
    | "Record response"
    | "Record screening"
    | "Record interview"
    | "Record rejection"
    | "Record offer"
    | "Close / withdraw"
    | "Close application";
  enabled: true;
  reason: string;
  requiresExplicitConfirmation: true;
  externalActionAvailable: false;
};

export type CareerOsDailyApplicationOutcomeItem = {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  submittedDate: string | null;
  currentStage: string;
  employerResponseStatus: string;
  latestOutcome: string | null;
  resumeArtifact: string;
  exactResumeArtifactKnown: boolean;
  followUpState: string;
  followUpDueDateKnown: boolean;
  nextAction: CareerOsDailyActionKind;
  recommendedNextEngagementAction: string;
  availableActions: CareerOsDailyApplicationOutcomeAction[];
  unknowns: string[];
  noRejectionInferred: true;
  externalActionAvailable: false;
  applicationSubmittedByStaffordOS: false;
  messageSent: false;
  browserAutomationUsed: false;
  externalAiUsed: false;
  limitations: string[];
};

export type CareerOsDailyApplicationIntelligenceItem = {
  id: string;
  company: string;
  role: string;
  recommendation: CareerOsDailyRecommendation;
  fit: string;
  rankedLanes: string[];
  resumeVersion: string;
  resumeSafety: string;
  gaps: string;
  evidence: string;
  humanReview: ApplicationIntelligenceHumanReviewProjection;
  nextAction: CareerOsDailyActionKind;
  detail: string;
  externalActionAvailable: false;
  limitations: string[];
};

export type CareerOsDailyResumeDraftItem = {
  id: string;
  packetId: string;
  company: string;
  role: string;
  version: number;
  safetyState: string;
  operatorApprovalState: string;
  reviewStatus: string;
  approvalAllowed: boolean;
  requestChangesAllowed: boolean;
  rejectAllowed: boolean;
  tracedClaimCount: number;
  blockedIssueCount: number;
  reviewIssueCount: number;
  omittedUnsupportedClaimCount: number;
  sections: {
    summary: string[];
    skills: string[];
    experience: Array<{
      employer: string | null;
      title: string | null;
      dateRange: string | null;
      bullets: string[];
      limitations: string[];
    }>;
    projects: Array<{
      label: string;
      bullets: string[];
      limitations: string[];
    }>;
    education: string[];
    certifications: string[];
  };
  needsAttention: string[];
  nextAction: CareerOsDailyActionKind;
  detail: string;
  humanReviewRequired: true;
  externalActionAvailable: false;
  limitations: string[];
};

export type CareerOsDailyResumeExportItem = {
  id: string;
  sourceDraftArtifactVersionId: string;
  packetId: string;
  company: string;
  role: string;
  version: number;
  exportState: string;
  docxCreated: boolean;
  pdfCreated: false;
  docxFilename: string | null;
  downloadPath: string | null;
  submissionStatus: "NOT_SUBMITTED" | "SUBMITTED";
  submittedDate: string | null;
  applicationId: string | null;
  exactResumeArtifactKnown: boolean;
  followUpState: string | null;
  followUpDueDateKnown: boolean;
  validationIssueCount: number;
  nextAction: CareerOsDailyActionKind;
  detail: string;
  externalActionAvailable: false;
  privatePathVisible: false;
  limitations: string[];
};

export type CareerOsDailyPipelineStage = {
  id: "applied" | "interview" | "offer" | "closed";
  label: "Applied" | "Interview" | "Offer" | "Closed";
  value: number;
  detail: string;
};

export type CareerOsDailySystemHealth = {
  providerStatus: string;
  lastDiscoveryRun: string;
  openOpportunityBacklog: number;
  detail: string;
};

export type CareerOsDailyJobSearchExperience = {
  schemaVersion: typeof CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE_SCHEMA_VERSION;
  workflowVersion: typeof CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE_VERSION;
  workspaceId: typeof JOB_COMMAND_WORKSPACE_ID;
  route: typeof JOB_COMMAND_ROUTE;
  title: "CareerOS";
  primaryQuestion: typeof JOB_COMMAND_PRIMARY_QUESTION;
  greeting: "Good morning";
  dailyBriefing: {
    headline: string;
    summary: string;
    capturedAsOf: string;
    metrics: CareerOsDailyBriefMetric[];
  };
  todaysPriorities: CareerOsDailyPriority[];
  opportunityDecisions: CareerOsDailyOpportunityDecisionItem[];
  topOpportunities: CareerOsDailyTopOpportunity[];
  applicationWork: CareerOsDailyApplicationWorkItem[];
  applicationOutcomes: CareerOsDailyApplicationOutcomeItem[];
  applicationIntelligence: CareerOsDailyApplicationIntelligenceItem[];
  resumeDrafts: CareerOsDailyResumeDraftItem[];
  resumeExports: CareerOsDailyResumeExportItem[];
  applicationPipeline: CareerOsDailyPipelineStage[];
  dailyActions: Array<{
    action: CareerOsDailyActionKind;
    label: string;
    enabled: false;
    reason: string;
  }>;
  systemHealth: CareerOsDailySystemHealth;
  approvalBoundary: string;
  emptyState: string | null;
  auditSummary: {
    existingReadModelsReused: true;
    commandCenterPresentationReused: true;
    noRecommendationLogicDuplicated: true;
    noDiscoveryModified: true;
    noProviderAdded: true;
    noProviderCalledByExperience: true;
    noApplicationCreated: true;
    noApplicationSubmitted: true;
    noResumeGenerated: true;
    noResumeMutated: true;
    noCoverLetterGenerated: true;
    noMessageSent: true;
    noBrowserAutomation: true;
    noExternalAi: true;
    noOllama: true;
    noNewPrivateDataRoute: true;
    rawInternalDataVisible: false;
    privatePathVisible: false;
    rawJobTextVisible: false;
    rawResumeTextVisible: false;
  };
};

export type CareerOsDailyJobSearchExperienceInput = CareerOsCommandCenterInput & {
  commandCenter?: CareerOsCommandCenterPresentation;
  applicationEngagementResult?: ApplicationEngagementQueueResult | null;
  applicationEngagementReadModel?: readonly ApplicationEngagementReadModelRecord[];
  applicationPackageResult?: ReadyToApplyApplicationPackageResult | null;
  applicationPackageReadModel?: readonly ReadyToApplyApplicationPackageReadModelRecord[];
  applicationReviewWorkspaceResult?: ApplicationReviewWorkspaceResult | null;
  applicationReviewReadModel?: readonly ApplicationReviewWorkspaceReadModelRecord[];
  applicationIntelligenceReadModel?: readonly ApplicationIntelligencePacketReadModelRecord[];
  resumeDraftReadModel?: readonly TruthBoundResumeDraftReadModelRecord[];
  resumeDraftReviewReadModel?: readonly TruthBoundResumeDraftReviewReadModelRecord[];
  resumeExportReadModel?: readonly ReviewedResumeDraftExportReadModelRecord[];
  manualSubmissionReadModel?: readonly ManualSubmissionReadModelRecord[];
  careerWorkflowStateResult?: CareerWorkflowStateResult | null;
  careerWorkflowStateItems?: readonly CareerWorkflowStateItem[];
};

const EMPTY_STATE =
  "No current opportunity, package, or engagement artifacts are connected yet. Run the existing private CareerOS workflows to populate today's work.";

function userRecommendation(value: string): CareerOsDailyRecommendation {
  if (value === "APPLY_NOW") return "APPLY NOW";
  if (value === "REVIEW" || value === "WAIT" || value === "SKIP") return value;
  return "REVIEW";
}

function metric(
  id: CareerOsDailyBriefMetric["id"],
  label: string,
  value: number,
  detail: string,
): CareerOsDailyBriefMetric {
  return { id, label, value, detail };
}

function engagementItems(input: CareerOsDailyJobSearchExperienceInput) {
  return input.applicationEngagementResult?.readModel || input.applicationEngagementReadModel || [];
}

function packageItems(input: CareerOsDailyJobSearchExperienceInput) {
  return input.applicationPackageResult?.readModel || input.applicationPackageReadModel || [];
}

function reviewItems(input: CareerOsDailyJobSearchExperienceInput) {
  return input.applicationReviewWorkspaceResult?.readModel || input.applicationReviewReadModel || [];
}

function intelligenceItems(input: CareerOsDailyJobSearchExperienceInput) {
  return input.applicationIntelligenceReadModel || [];
}

function draftItems(input: CareerOsDailyJobSearchExperienceInput) {
  return input.resumeDraftReadModel || [];
}

function draftReviewItems(input: CareerOsDailyJobSearchExperienceInput) {
  return input.resumeDraftReviewReadModel || [];
}

function exportItems(input: CareerOsDailyJobSearchExperienceInput) {
  return input.resumeExportReadModel || [];
}

function manualSubmissionItems(input: CareerOsDailyJobSearchExperienceInput) {
  return input.manualSubmissionReadModel || [];
}

function workflowItems(input: CareerOsDailyJobSearchExperienceInput) {
  return input.careerWorkflowStateResult?.stateItems || input.careerWorkflowStateItems || [];
}

function recommendationActionRank(item: CareerWorkflowStateItem) {
  if (item.recommendation === "APPLY_NOW") return 0;
  if (item.recommendation === "REVIEW") return 1;
  if (item.recommendation === "WAIT") return 2;
  return 3;
}

function activeWorkflowDecisionItems(input: CareerOsDailyJobSearchExperienceInput) {
  return workflowItems(input)
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.inTodaysQueue && !item.workflowActionType)
    .sort(
      (left, right) =>
        recommendationActionRank(left.item) - recommendationActionRank(right.item) ||
        left.index - right.index,
    )
    .map(({ item }) => item);
}

function readyWorkflowItems(input: CareerOsDailyJobSearchExperienceInput) {
  return workflowItems(input).filter((item) => item.readyToApply);
}

function countBrief(commandCenter: CareerOsCommandCenterPresentation, label: string) {
  return commandCenter.todaysBrief.find((item) => item.label === label)?.value || 0;
}

function readyToApplyCount(input: CareerOsDailyJobSearchExperienceInput, commandCenter: CareerOsCommandCenterPresentation) {
  return Math.max(
    countBrief(commandCenter, "Ready to Apply"),
    readyWorkflowItems(input).length,
    packageItems(input).length,
    reviewItems(input).filter((item) => item.reviewState === "PENDING_REVIEW").length,
  );
}

function resumeReviewsNeeded(input: CareerOsDailyJobSearchExperienceInput) {
  return (
    packageItems(input).filter((item) => item.applicationReadiness === "NEEDS_RESUME_REVIEW").length +
    reviewItems(input).filter((item) => item.reviewState === "NEEDS_CHANGES").length
  );
}

function opportunitiesRequiringDecision(input: CareerOsDailyJobSearchExperienceInput) {
  return activeWorkflowDecisionItems(input).length;
}

function interviewActivity(input: CareerOsDailyJobSearchExperienceInput, commandCenter: CareerOsCommandCenterPresentation) {
  return Math.max(
    commandCenter.pipeline.interviews,
    engagementItems(input).filter((item) => item.recommendedNextEngagementAction === "PREPARE_FOR_INTERVIEW").length,
  );
}

function applicationsNeedingFollowUp(
  input: CareerOsDailyJobSearchExperienceInput,
  commandCenter: CareerOsCommandCenterPresentation,
) {
  return Math.max(
    commandCenter.pipeline.followUpsDue,
    engagementItems(input).filter((item) =>
      item.recommendedNextEngagementAction === "FOLLOW_UP" ||
      item.followUpState === "DUE" ||
      item.followUpState === "OVERDUE",
    ).length,
  );
}

function buildBriefing(
  input: CareerOsDailyJobSearchExperienceInput,
  commandCenter: CareerOsCommandCenterPresentation,
) {
  const followUps = applicationsNeedingFollowUp(input, commandCenter);
  const ready = readyToApplyCount(input, commandCenter);
  const resumeReviews = resumeReviewsNeeded(input);
  const decisions = opportunitiesRequiringDecision(input);
  const opportunities = countBrief(commandCenter, "New Opportunities");
  const interviews = interviewActivity(input, commandCenter);
  const headline =
    followUps > 0
      ? "Start with application follow-up."
      : ready > 0
        ? "Start with application package review."
        : resumeReviews > 0
          ? "Start with resume review."
          : decisions > 0
            ? "Start with the highest-ranked opportunity decision."
            : opportunities > 0
              ? "Start with the strongest new opportunity."
            : "No urgent job-search action is due from connected artifacts.";

  return {
    headline,
    summary:
      "Today is organized around the next professional task: follow up, review a package, inspect an opportunity, or confirm that no action is due.",
    capturedAsOf: commandCenter.capturedAsOf,
    metrics: [
      metric("applications-needing-follow-up", "Applications needing follow-up", followUps, "Applications with due follow-up or response review."),
      metric("ready-to-apply", "Ready To Apply", ready, "Opportunities moved into application preparation."),
      metric("opportunities-requiring-decision", "Needs Decision", decisions, "Ranked opportunities awaiting Ross's decision."),
      metric("resume-reviews-needed", "Resume Reviews Needed", resumeReviews, "Packages that need resume or package changes before applying."),
      metric("new-opportunities", "New Opportunities", opportunities, "New items available from the existing opportunity pipeline."),
      metric("interview-activity", "Interview Activity", interviews, "Applications with interview handoff activity."),
    ],
  };
}

function actionForRecommendation(recommendation: CareerOsDailyRecommendation): CareerOsDailyActionKind {
  if (recommendation === "APPLY NOW") return "Open Opportunity";
  if (recommendation === "REVIEW") return "Review Evidence";
  if (recommendation === "WAIT") return "Open Opportunity";
  return "No Action";
}

function actionForPacket(item: ApplicationIntelligencePacketReadModelRecord): CareerOsDailyActionKind {
  if (item.nextAction === "REVIEW_RESUME") return "View Resume";
  if (item.nextAction === "REVIEW_EVIDENCE") return "Review Evidence";
  if (item.nextAction === "READY_TO_APPLY" || item.nextAction === "REVIEW_APPLICATION_PACKAGE") return "Review Package";
  if (item.nextAction === "SKIP" || item.nextAction === "HOLD") return "Open Opportunity";
  return "View Intelligence";
}

function opportunityDecisionLabel(action: CareerWorkflowStateItem["workflowActionType"]): CareerOsDailyOpportunityDecisionItem["operatorDecision"] {
  if (action === "APPLY") return "Apply";
  if (action === "REVIEW_LATER") return "Review later";
  if (action === "SKIP") return "Skipped";
  if (action === "NOT_INTERESTED") return "Not interested";
  return "No Ross decision yet";
}

function resumeReadinessLabel(item: Pick<ApplicationIntelligencePacketReadModelRecord, "resumeSafetyState" | "resumeSafeToReuse">): ApplicationIntelligenceHumanReviewProjection["resumeReadiness"]["label"] {
  if (item.resumeSafeToReuse) return "Ready to tailor";
  if (item.resumeSafetyState === "NOT_SAFE_TO_REUSE" || item.resumeSafetyState === "NO_RESUMEVERSION_AVAILABLE") return "Blocked";
  return "Needs review";
}

function fallbackHumanReview(item: ApplicationIntelligencePacketReadModelRecord): ApplicationIntelligenceHumanReviewProjection {
  const resumeLabel = resumeReadinessLabel(item);
  const gapSummary = `${item.skillGapCount} skill / ${item.evidenceGapCount} evidence`;
  return {
    whyThisFits: [item.fitSummary].filter(Boolean),
    supportingExperience: item.supportingEvidenceCount > 0
      ? [{
          label: "Supporting experience connected",
          detail: `${item.supportingEvidenceCount} supporting reference${item.supportingEvidenceCount === 1 ? "" : "s"} are connected in the private evidence record.`,
          supportLevel: "Supported with limitation",
          limitations: ["Detailed evidence names are not included in this read model."],
        }]
      : [],
    gapsAndRisks: item.skillGapCount || item.evidenceGapCount
      ? [{
          kind: "Needs verification",
          requirement: gapSummary,
          detail: "Review unmatched or unverified requirements before positioning this application.",
        }]
      : [],
    resumeReadiness: {
      label: resumeLabel,
      detail: resumeLabel === "Ready to tailor"
        ? "The selected resume is safe to tailor from the current evidence."
        : resumeLabel === "Blocked"
          ? "Do not use this resume until Ross resolves the blocking issue."
          : "The selected resume needs Ross's review before use.",
      blockers: item.blockerCount > 0 ? [`${item.blockerCount} review blocker${item.blockerCount === 1 ? "" : "s"} remain.`] : [],
    },
    nextAction: item.fitSummary,
  };
}

function humanReviewFor(item: ApplicationIntelligencePacketReadModelRecord) {
  return item.humanReview || fallbackHumanReview(item);
}

function decisionStatus(item: CareerWorkflowStateItem): CareerOsDailyOpportunityDecisionItem["status"] {
  if (item.workflowState === "READY_TO_APPLY") return "READY_TO_APPLY";
  if (item.workflowState === "REVIEW_LATER") return "REVIEW_LATER";
  if (item.workflowState === "SKIPPED") return "SKIPPED";
  if (item.workflowState === "NOT_INTERESTED") return "NOT_INTERESTED";
  return "NEEDS_DECISION";
}

function downstreamStage(item: CareerWorkflowStateItem): CareerOsDailyOpportunityDecisionItem["downstreamStage"] {
  if (item.readyToApply) return "PREPARE_RESUME_DRAFT";
  if (item.inFutureWorkQueue) return "FUTURE_REVIEW";
  if (item.skippedToday) return "REMOVED_TODAY";
  if (item.excludedFromFutureRecommendations) return "EXCLUDED_UNTIL_RESTORED";
  return "AWAITING_DECISION";
}

function userActionFor(action: CareerWorkflowActionType) {
  if (action === "APPLY") return "Apply";
  if (action === "REVIEW_LATER") return "Review later";
  if (action === "SKIP") return "Skip";
  return "Not interested";
}

function availableOpportunityActions(item: CareerWorkflowStateItem): CareerOsDailyOpportunityDecisionItem["availableActions"] {
  const undecided = item.inTodaysQueue && !item.workflowActionType;
  return (["APPLY", "REVIEW_LATER", "SKIP", "NOT_INTERESTED"] as const).map((actionType) => {
    const applyAllowed =
      actionType !== "APPLY" ||
      (item.recommendation === "APPLY_NOW" &&
        item.applicationReadiness === "READY_FOR_OPERATOR_APPROVED_APPLICATION");
    const enabled = undecided && applyAllowed;
    return {
      actionType,
      label: userActionFor(actionType),
      enabled,
      reason: enabled
        ? actionType === "APPLY"
          ? "Records Ross's intent to proceed into application preparation only."
          : "Records Ross's private opportunity decision using existing workflow authority."
        : actionType === "APPLY"
          ? "Apply is available only when the existing recommendation/readiness permits application planning."
          : "This opportunity already has a Ross workflow decision or is not in today's queue.",
      nextStep:
        actionType === "APPLY"
          ? "Prepare Resume Draft"
          : actionType === "REVIEW_LATER"
            ? "Future review queue"
            : actionType === "SKIP"
              ? "Removed from today's queue"
              : "Excluded until explicitly restored",
    };
  });
}

function opportunityDecisions(
  input: CareerOsDailyJobSearchExperienceInput,
  topOpportunityRecords: readonly CareerOsDailyTopOpportunity[],
): CareerOsDailyOpportunityDecisionItem[] {
  const topById = new Map(topOpportunityRecords.map((item) => [item.id, item]));
  const intelligenceByRecommendationId = new Map(
    intelligenceItems(input)
      .map((item) => [item.recommendationId, humanReviewFor(item)] as const)
      .filter((entry): entry is [string, ApplicationIntelligenceHumanReviewProjection] => Boolean(entry[0])),
  );
  const intelligenceByCompanyRole = new Map(
    intelligenceItems(input).map((item) => [`${item.company}\n${item.role}`, humanReviewFor(item)] as const),
  );
  return activeWorkflowDecisionItems(input).slice(0, 5).map((item) => {
    const top = topById.get(item.recommendationId) || null;
    const recommendation = userRecommendation(item.recommendation);
    const humanReview =
      intelligenceByRecommendationId.get(item.recommendationId) ||
      intelligenceByCompanyRole.get(`${item.company}\n${item.role}`) ||
      null;
    return {
      id: `decision:${item.recommendationId}`,
      recommendationId: item.recommendationId,
      queueItemId: item.queueItemId,
      company: item.company,
      role: item.role,
      recommendation,
      operatorDecision: opportunityDecisionLabel(item.workflowActionType),
      workflowState: item.workflowState || "NEEDS_DECISION",
      decisionAuthority: item.stateAuthority === "ROSS_OPERATOR_DECISION" ? "Ross decision" : "Awaiting Ross decision",
      applicationReadiness: item.applicationReadiness,
      resumeReadiness: item.recommendedResumeVersion.safeLabel || item.recommendedResumeVersion.status,
      explainableFit: top?.explainableFit || "Explainable Fit details are available from the existing recommendation output.",
      whyItFits:
        item.supportingEvidenceCount > 0
          ? `${item.supportingEvidenceCount} supporting evidence references are attached to this recommendation.`
          : "No supporting evidence references are attached in the safe read model.",
      gaps: `${item.missingSkillCount} missing skills / resume effort ${item.estimatedResumeUpdateEffort}`,
      evidence: `${item.supportingEvidenceCount} supporting evidence references`,
      humanReview,
      recommendedNextAction: item.recommendedNextAction,
      currentWorkflowNextAction: item.currentWorkflowNextAction,
      status: decisionStatus(item),
      shownInTodaysQueue: item.inTodaysQueue,
      downstreamStage: downstreamStage(item),
      availableActions: availableOpportunityActions(item),
      externalActionAvailable: false,
      applicationCreated: false,
      applicationSubmitted: false,
      resumeGenerated: false,
      messageSent: false,
      limitations: [
        "Recommendation is CareerOS guidance; Ross's button choice is the separate operator decision.",
        "Decision display groups existing recommendation states by immediate actionability while preserving original recommendation order inside each group.",
        "Decision state is projected from the existing J003.03 private workflow action authority.",
        "No Application, submission, message, provider call, browser action, AI call, resume generation, or resume mutation happens here.",
        ...item.limitations,
      ],
    };
  });
}

function actionForDraft(item: TruthBoundResumeDraftReadModelRecord | TruthBoundResumeDraftReviewReadModelRecord): CareerOsDailyActionKind {
  if (item.nextAction === "BLOCKED") return "Review Evidence";
  if (item.nextAction === "REVIEW_EVIDENCE") return "Review Evidence";
  if (item.nextAction === "EXPORT_READY") return "Approve for Export";
  return "Review Draft";
}

function actionForExport(item: ReviewedResumeDraftExportReadModelRecord): CareerOsDailyActionKind {
  if (item.nextAction === "DOWNLOAD_DOCX" && item.docxCreated) return "Download DOCX";
  return "Review Evidence";
}

function actionForSubmission(item: ManualSubmissionReadModelRecord): CareerOsDailyActionKind {
  if (item.nextAction === "PREPARE_FOR_INTERVIEW") return "Prepare Interview";
  if (item.nextAction === "FOLLOW_UP" || item.nextAction === "REVIEW_RESPONSE") return "Follow Up";
  return "No Action";
}

function submissionForExport(
  item: ReviewedResumeDraftExportReadModelRecord,
  submissions: readonly ManualSubmissionReadModelRecord[],
) {
  return submissions.find((submission) => submission.artifactVersionId === item.artifactVersionId) || null;
}

function applicationIntelligence(
  input: CareerOsDailyJobSearchExperienceInput,
): CareerOsDailyApplicationIntelligenceItem[] {
  return intelligenceItems(input).slice(0, 5).map((item) => ({
    id: item.packetId,
    company: item.company,
    role: item.role,
    recommendation: userRecommendation(item.recommendation),
    fit: item.fitRecommendation || item.fitSummary,
    rankedLanes: [...item.rankedLaneLabels],
    resumeVersion: item.resumeVersionLabel || item.resumeVersionStatus,
    resumeSafety: item.resumeSafetyState,
    gaps: `${item.skillGapCount} skill / ${item.evidenceGapCount} evidence`,
    evidence: `${item.supportingEvidenceCount} support / ${item.careerFactReferenceCount} fact refs`,
    humanReview: humanReviewFor(item),
    nextAction: actionForPacket(item),
    detail: item.fitSummary,
    externalActionAvailable: false,
    limitations: [
      "Shown from the existing private Application Intelligence Packet read model.",
      "No application, message, resume change, browser action, provider call, or external AI action is available here.",
      ...item.limitations,
    ],
  }));
}

function resumeDrafts(input: CareerOsDailyJobSearchExperienceInput): CareerOsDailyResumeDraftItem[] {
  const exportByDraftId = new Map(exportItems(input).map((item) => [item.sourceDraftArtifactVersionId, item]));
  const reviewRecords = draftReviewItems(input);
  if (reviewRecords.length) {
    return reviewRecords.slice(0, 5).map((item) => {
      const latestReview = exportByDraftId.get(item.artifactVersionId);
      const operatorApprovalState = latestReview?.operatorApprovalState || item.operatorApprovalState;
      const safetyState = latestReview?.sourceDraftSafetyState || item.safetyState;
      const approvalAllowed =
        item.approvalAllowed &&
        operatorApprovalState === "PENDING_REVIEW" &&
        safetyState === "DRAFT_READY_FOR_REVIEW";
      return {
        id: item.artifactVersionId,
        packetId: item.packetId,
        company: item.company,
        role: item.role,
        version: item.version,
        safetyState,
        operatorApprovalState,
        reviewStatus: item.reviewStatus,
        approvalAllowed,
        requestChangesAllowed: item.requestChangesAllowed && operatorApprovalState === "PENDING_REVIEW",
        rejectAllowed: item.rejectAllowed && operatorApprovalState === "PENDING_REVIEW",
        tracedClaimCount: item.tracedClaimCount,
        blockedIssueCount: item.blockedIssueCount,
        reviewIssueCount: item.reviewIssueCount,
        omittedUnsupportedClaimCount: item.omittedUnsupportedClaimCount,
        sections: item.sections,
        needsAttention: item.needsAttention,
        nextAction: actionForDraft({ ...item, safetyState }),
        detail: `${item.tracedClaimCount} traced claims / ${item.blockedIssueCount} blocking / ${item.reviewIssueCount} review issues`,
        humanReviewRequired: true,
        externalActionAvailable: false,
        limitations: [
          "Shown from the existing private ApplicationArtifactVersion as a review-safe projection.",
          "Resume wording is displayed for operator review, but claim IDs, CareerFact IDs, CareerEvidence IDs, source digests, packet internals, and filesystem paths remain private.",
          "No application, export, upload, message, browser action, provider call, or model action is available here.",
          ...item.limitations,
          ...(latestReview?.limitations || []),
        ],
      };
    });
  }

  return draftItems(input).slice(0, 5).map((item) => {
    const latestReview = exportByDraftId.get(item.artifactVersionId);
    const operatorApprovalState = latestReview?.operatorApprovalState || item.operatorApprovalState;
    const safetyState = latestReview?.sourceDraftSafetyState || item.safetyState;
    return {
      id: item.artifactVersionId,
      packetId: item.packetId,
      company: item.company,
      role: item.role,
      version: item.version,
      safetyState,
      operatorApprovalState,
      reviewStatus: safetyState === "DRAFT_READY_FOR_REVIEW" ? "READY_FOR_REVIEW" : safetyState,
      approvalAllowed: false,
      requestChangesAllowed: false,
      rejectAllowed: false,
      tracedClaimCount: item.tracedClaimCount,
      blockedIssueCount: item.blockedIssueCount,
      reviewIssueCount: item.reviewIssueCount,
      omittedUnsupportedClaimCount: item.omittedUnsupportedClaimCount,
      sections: {
        summary: [],
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
      },
      needsAttention: [],
      nextAction: actionForDraft({ ...item, safetyState }),
      detail: `${item.tracedClaimCount} traced claims / ${item.blockedIssueCount} blocking / ${item.reviewIssueCount} review issues`,
      humanReviewRequired: true,
      externalActionAvailable: false,
      limitations: [
        "Shown from the existing private truth-bound resume draft read model.",
        "Generated draft content is unavailable in this legacy status-only read model.",
        "No application, export, upload, message, browser action, provider call, or model action is available here.",
        ...item.limitations,
        ...(latestReview?.limitations || []),
      ],
    };
  });
}

function resumeExports(input: CareerOsDailyJobSearchExperienceInput): CareerOsDailyResumeExportItem[] {
  const submissions = manualSubmissionItems(input);
  return exportItems(input).slice(0, 5).map((item) => {
    const submission = submissionForExport(item, submissions);
    return {
      id: item.artifactVersionId,
      sourceDraftArtifactVersionId: item.sourceDraftArtifactVersionId,
      packetId: item.packetId,
      company: item.company,
      role: item.role,
      version: item.version,
      exportState: item.exportState,
      docxCreated: item.docxCreated,
      pdfCreated: false,
      docxFilename: item.docxFilename,
      downloadPath: item.downloadPath,
      submissionStatus: submission ? "SUBMITTED" : item.submissionStatus,
      submittedDate: submission?.submittedDate || null,
      applicationId: submission?.applicationId || null,
      exactResumeArtifactKnown: submission?.exactResumeArtifactKnown || false,
      followUpState: submission?.followUpState || null,
      followUpDueDateKnown: submission?.followUpDueDateKnown || false,
      validationIssueCount: item.validationIssueCount,
      nextAction: submission ? actionForSubmission(submission) : actionForExport(item),
      detail: submission
        ? "Ross confirmed manual submission. The exact resume artifact is linked to the Application record."
        : item.docxCreated
          ? "DOCX is ready for Ross to download, use manually, and then mark submitted."
          : "Export is blocked until evidence or draft review issues are resolved.",
      externalActionAvailable: false,
      privatePathVisible: false,
      limitations: [
        "Shown from the private reviewed resume export and manual submission read models.",
        "Generated resume text, private paths, claim IDs, CareerFact IDs, CareerEvidence IDs, and source URLs are not exposed in this display.",
        submission ? "Submission status is confirmed by an explicit V1.04 artifact linkage." : "Submission status remains NOT_SUBMITTED.",
        ...item.limitations,
        ...(submission?.limitations || []),
      ],
    };
  });
}

function topOpportunities(
  input: CareerOsDailyJobSearchExperienceInput,
  commandCenter: CareerOsCommandCenterPresentation,
): CareerOsDailyTopOpportunity[] {
  const activeRecommendationIds = workflowItems(input).length
    ? new Set(workflowItems(input).filter((item) => item.inTodaysQueue).map((item) => item.recommendationId))
    : null;
  return commandCenter.topRecommendations
    .filter((record) => !activeRecommendationIds || activeRecommendationIds.has(record.id))
    .map((record: CareerOsTopRecommendation) => {
    const recommendation = userRecommendation(record.recommendation);
    return {
      id: record.id,
      company: record.company,
      position: record.position,
      explainableFit: record.explainableFit,
      recommendation,
      resumeVersion: record.resumeVersion,
      nextAction: actionForRecommendation(recommendation),
      detail: record.nextAction,
      externalActionAvailable: false,
      limitations: [
        "Shown from the existing recommendation output.",
        "No application, message, resume change, browser action, provider call, or external AI action is available here.",
        ...record.limitations,
      ],
    };
  });
}

function actionForEngagement(item: ApplicationEngagementReadModelRecord): CareerOsDailyActionKind {
  if (item.recommendedNextEngagementAction === "PREPARE_FOR_INTERVIEW") return "Prepare Interview";
  if (item.recommendedNextEngagementAction === "FOLLOW_UP") return "Follow Up";
  if (item.recommendedNextEngagementAction === "REVIEW_RESPONSE") return "Follow Up";
  return "No Action";
}

function labelForOutcomeDecision(decisionType: PipelineReviewDecisionType): CareerOsDailyApplicationOutcomeAction["label"] | null {
  if (decisionType === "RECORD_RECRUITER_RESPONSE") return "Record response";
  if (decisionType === "RECORD_SCREENING") return "Record screening";
  if (decisionType === "RECORD_INTERVIEW") return "Record interview";
  if (decisionType === "RECORD_REJECTION") return "Record rejection";
  if (decisionType === "RECORD_OFFER") return "Record offer";
  if (decisionType === "RECORD_WITHDRAWAL") return "Close / withdraw";
  if (decisionType === "RECORD_CLOSED") return "Close application";
  return null;
}

function outcomeActionsFor(actions: readonly PrivatePipelineReviewAction[]): CareerOsDailyApplicationOutcomeAction[] {
  const byDecision = new Map<PipelineReviewDecisionType, CareerOsDailyApplicationOutcomeAction>();
  for (const action of actions) {
    if (!action.applicationId) continue;
    for (const decisionType of action.allowedActions) {
      const label = labelForOutcomeDecision(decisionType);
      if (!label || byDecision.has(decisionType)) continue;
      byDecision.set(decisionType, {
        actionId: action.actionId,
        decisionType,
        label,
        enabled: true as const,
        reason: `${action.whatRossShouldDo} Requires explicit Ross confirmation.`,
        requiresExplicitConfirmation: true as const,
        externalActionAvailable: false as const,
      });
    }
  }
  return [...byDecision.values()];
}

function actionsByApplication(input: CareerOsDailyJobSearchExperienceInput) {
  const map = new Map<string, PrivatePipelineReviewAction[]>();
  const actions = input.applicationPipelineResult?.nextActions || [];
  for (const action of actions) {
    if (!action.applicationId) continue;
    map.set(action.applicationId, [...(map.get(action.applicationId) || []), action]);
  }
  return map;
}

function engagementByApplication(input: CareerOsDailyJobSearchExperienceInput) {
  return new Map(engagementItems(input).map((item) => [item.applicationId, item]));
}

function submissionByApplication(input: CareerOsDailyJobSearchExperienceInput) {
  return new Map(manualSubmissionItems(input).map((item) => [item.applicationId, item]));
}

function submittedApplicationsFromPipeline(input: CareerOsDailyJobSearchExperienceInput) {
  return input.applicationPipelineResult?.dailyCommand.submittedApplications || [];
}

function applicationOutcomes(input: CareerOsDailyJobSearchExperienceInput): CareerOsDailyApplicationOutcomeItem[] {
  const pipelineApplications = submittedApplicationsFromPipeline(input);
  const actions = actionsByApplication(input);
  const engagements = engagementByApplication(input);
  const submissions = submissionByApplication(input);
  return pipelineApplications
    .map((application) => {
      const applicationActions = actions.get(application.applicationId) || [];
      const engagement = engagements.get(application.applicationId) || null;
      const submission = submissions.get(application.applicationId) || null;
      const outcomeActions = outcomeActionsFor(applicationActions);
      const currentStage = engagement?.currentApplicationStatus === "SUBMITTED_MANUAL_EXTERNAL"
        ? application.currentStage
        : application.currentStage;
      const followUpState = engagement?.followUpState || submission?.followUpState || "UNKNOWN";
      const recommendedNext = engagement?.recommendedNextEngagementAction || submission?.nextAction || "NO_ACTION";
      const unknowns = [
        submission && !submission.exactResumeArtifactKnown ? "Exact submitted resume artifact is unknown." : null,
        !submission ? "No V1.04 exact artifact linkage is connected in the current read model." : null,
        application.employerResponseStatus === "NONE_RECORDED" || application.employerResponseStatus === "UNKNOWN"
          ? "No employer response is recorded."
          : null,
        !application.submittedDate ? "Submission date is unknown." : null,
      ].filter((item): item is string => Boolean(item));
      return {
        id: `application-outcome:${application.applicationId}`,
        applicationId: application.applicationId,
        company: application.company,
        role: application.role,
        submittedDate: application.submittedDate,
        currentStage,
        employerResponseStatus: application.employerResponseStatus,
        latestOutcome: engagement?.lastApplicationEventType || null,
        resumeArtifact: submission
          ? `${submission.resumeArtifactFilename} v${submission.resumeArtifactVersion}`
          : "UNKNOWN",
        exactResumeArtifactKnown: Boolean(submission?.exactResumeArtifactKnown),
        followUpState,
        followUpDueDateKnown: Boolean(engagement?.followUpDueDateKnown || submission?.followUpDueDateKnown),
        nextAction: actionForEngagement(engagement || {
          recommendedNextEngagementAction: recommendedNext,
          followUpState,
        } as ApplicationEngagementReadModelRecord),
        recommendedNextEngagementAction: recommendedNext,
        availableActions: outcomeActions,
        unknowns,
        noRejectionInferred: true as const,
        externalActionAvailable: false as const,
        applicationSubmittedByStaffordOS: false as const,
        messageSent: false as const,
        browserAutomationUsed: false as const,
        externalAiUsed: false as const,
        limitations: [
          "Shown from existing Application/ApplicationEvent, V1.04 artifact linkage, and J004 engagement authority.",
          "Outcome buttons record owner-private after-the-fact events only.",
          "No response, rejection, interview, offer, withdrawal, or employer intent is inferred from silence.",
          "No email, message, calendar, provider, browser, or external AI action is available here.",
          ...applicationActions.flatMap((action) => action.limitations),
          ...(engagement?.limitations || []),
          ...(submission?.limitations || []),
        ],
      };
    })
    .sort(
      (left, right) =>
        (left.submittedDate || "9999-99-99").localeCompare(right.submittedDate || "9999-99-99") ||
        left.company.localeCompare(right.company) ||
        left.role.localeCompare(right.role) ||
        left.applicationId.localeCompare(right.applicationId),
    );
}

function engagementPriorities(items: readonly ApplicationEngagementReadModelRecord[]): CareerOsDailyPriority[] {
  return items
    .filter((item) => item.needsAttention || item.recommendedNextEngagementAction !== "NO_ACTION")
    .map((item) => {
      const action = actionForEngagement(item);
      return {
        id: `engagement:${item.engagementItemId}`,
        title:
          action === "Prepare Interview"
            ? "Prepare for interview activity"
            : action === "Follow Up"
              ? "Review follow-up timing"
              : "Review application response",
        company: item.company,
        role: item.role,
        category: action === "Prepare Interview" ? "Interview activity" : "Application follow-up",
        status: `${item.followUpState} / ${item.responseState}`,
        detail: item.followUpDueDateKnown
          ? "A follow-up or response state is available for this application."
          : "This application needs attention, but the exact follow-up date is not available in the safe display.",
        action,
        urgency: action === "Prepare Interview" || item.followUpState === "DUE" || item.followUpState === "OVERDUE" ? "today" : "next",
        externalActionAvailable: false,
        limitations: [...item.limitations],
      };
    });
}

function packagePriorities(items: readonly ReadyToApplyApplicationPackageReadModelRecord[]): CareerOsDailyPriority[] {
  return items
    .filter((item) => item.applicationReadiness !== "READY")
    .map((item) => {
      const action =
        item.applicationReadiness === "NEEDS_RESUME_REVIEW"
          ? "View Resume"
          : item.applicationReadiness === "NEEDS_EVIDENCE_REVIEW"
            ? "Review Evidence"
            : "Review Package";
      return {
        id: `package:${item.packageId}`,
        title:
          item.applicationReadiness === "NEEDS_RESUME_REVIEW"
            ? "Resume review needed before applying"
            : item.applicationReadiness === "NEEDS_EVIDENCE_REVIEW"
              ? "Evidence review needed before applying"
              : "Resolve package blockers",
        company: item.company,
        role: item.role,
        category:
          item.applicationReadiness === "NEEDS_RESUME_REVIEW"
            ? "Resume review"
            : item.applicationReadiness === "NEEDS_EVIDENCE_REVIEW"
              ? "Evidence review"
              : "Application review",
        status: item.applicationReadiness,
        detail: item.recommendedNextAction,
        action,
        urgency: "next",
        externalActionAvailable: false,
        limitations: [...item.limitations],
      };
    });
}

function reviewPriorities(items: readonly ApplicationReviewWorkspaceReadModelRecord[]): CareerOsDailyPriority[] {
  return items
    .filter((item) => item.reviewState === "PENDING_REVIEW" || item.reviewState === "MANUAL_APPLICATION_READY")
    .map((item) => ({
      id: `review:${item.packageId}`,
      title: item.reviewState === "MANUAL_APPLICATION_READY" ? "Ready for manual application" : "Review application package",
      company: item.company,
      role: item.role,
      category: "Application review" as const,
      status: item.reviewState === "MANUAL_APPLICATION_READY" ? "Ready for manual application" : "Needs human review",
      detail: item.recommendedNextAction,
      action: item.reviewState === "MANUAL_APPLICATION_READY" ? "Ready for Manual Application" : "Review Package",
      urgency: item.reviewState === "MANUAL_APPLICATION_READY" ? "today" : "next",
      externalActionAvailable: false,
      limitations: [...item.limitations],
    }));
}

function opportunityPriorities(records: readonly CareerOsDailyTopOpportunity[]) {
  return records
    .filter((item) => item.recommendation === "APPLY NOW" || item.recommendation === "REVIEW")
    .slice(0, 3)
    .map((item) => ({
      id: `opportunity:${item.id}`,
      title: item.recommendation === "APPLY NOW" ? "Inspect top apply-now opportunity" : "Review opportunity fit",
      company: item.company,
      role: item.position,
      category: "Opportunity review" as const,
      status: item.recommendation,
      detail: item.detail,
      action: item.nextAction,
      urgency: "later" as const,
      externalActionAvailable: false as const,
      limitations: [...item.limitations],
    }));
}

function opportunityDecisionPriorities(records: readonly CareerOsDailyOpportunityDecisionItem[]) {
  return records.slice(0, 3).map((item, index) => ({
    id: `opportunity-decision:${item.recommendationId}`,
    title: index === 0 ? "Decide the top opportunity" : "Decide whether to work this opportunity",
    company: item.company,
    role: item.role,
    category: "Opportunity review" as const,
    status: `${item.recommendation} / ${item.operatorDecision}`,
    detail: item.humanReview?.nextAction || item.recommendedNextAction,
    action: "Decide" as const,
    urgency: item.recommendation === "APPLY NOW" || item.recommendation === "REVIEW" ? "today" as const : "next" as const,
    externalActionAvailable: false as const,
    limitations: [...item.limitations],
  })) satisfies CareerOsDailyPriority[];
}

function resumeExportPriorities(records: readonly CareerOsDailyResumeExportItem[]) {
  return records
    .filter((item) => item.submissionStatus !== "SUBMITTED" && (item.docxCreated || item.validationIssueCount > 0))
    .slice(0, 3)
    .map((item) => ({
      id: `resume-export:${item.id}`,
      title: item.docxCreated ? "Download reviewed resume artifact" : "Resolve resume export blocker",
      company: item.company,
      role: item.role,
      category: item.docxCreated ? "Application review" : "Evidence review",
      status: item.exportState,
      detail: item.detail,
      action: item.nextAction,
      urgency: item.docxCreated ? "today" : "next",
      externalActionAvailable: false,
      limitations: [...item.limitations],
    })) satisfies CareerOsDailyPriority[];
}

function applicationOutcomePriorities(records: readonly CareerOsDailyApplicationOutcomeItem[]) {
  return records
    .filter((item) => item.nextAction !== "No Action" || item.availableActions.length > 0)
    .slice(0, 3)
    .map((item) => ({
      id: `application-outcome-priority:${item.applicationId}`,
      title:
        item.nextAction === "Prepare Interview"
          ? "Record or prepare for interview activity"
          : item.nextAction === "Follow Up"
            ? "Review application follow-up"
            : "Review application outcome",
      company: item.company,
      role: item.role,
      category: item.nextAction === "Prepare Interview" ? "Interview activity" : "Application follow-up",
      status: `${item.currentStage} / ${item.employerResponseStatus}`,
      detail: item.followUpState === "UNKNOWN"
        ? "Application state is available; follow-up detail is not connected in the safe display."
        : `Follow-up state: ${item.followUpState}.`,
      action: item.nextAction,
      urgency: item.nextAction === "Prepare Interview" || item.nextAction === "Follow Up" ? "today" as const : "next" as const,
      externalActionAvailable: false as const,
      limitations: [...item.limitations],
    })) satisfies CareerOsDailyPriority[];
}

function prioritySortKey(item: CareerOsDailyPriority) {
  const urgencyRank = item.urgency === "today" ? "1" : item.urgency === "next" ? "2" : "3";
  const categoryRank =
    item.category === "Interview activity"
      ? "1"
      : item.category === "Application follow-up"
        ? "2"
        : item.category === "Application review"
          ? "3"
          : item.category === "Resume review"
            ? "4"
            : item.category === "Evidence review"
              ? "5"
              : "6";
  return [urgencyRank, categoryRank, item.company || "", item.role || "", item.id].join("|");
}

function todaysPriorities(
  input: CareerOsDailyJobSearchExperienceInput,
  topOpportunityRecords: readonly CareerOsDailyTopOpportunity[],
  resumeExportRecords: readonly CareerOsDailyResumeExportItem[],
  opportunityDecisionRecords: readonly CareerOsDailyOpportunityDecisionItem[],
  applicationOutcomeRecords: readonly CareerOsDailyApplicationOutcomeItem[],
) {
  const priorities = [
    ...engagementPriorities(engagementItems(input)),
    ...(engagementItems(input).length ? [] : applicationOutcomePriorities(applicationOutcomeRecords)),
    ...reviewPriorities(reviewItems(input)),
    ...packagePriorities(packageItems(input)),
    ...resumeExportPriorities(resumeExportRecords),
    ...(opportunityDecisionRecords.length
      ? opportunityDecisionPriorities(opportunityDecisionRecords)
      : opportunityPriorities(topOpportunityRecords)),
  ].sort((left, right) => prioritySortKey(left).localeCompare(prioritySortKey(right)));

  return priorities.slice(0, 8);
}

function applicationWork(input: CareerOsDailyJobSearchExperienceInput): CareerOsDailyApplicationWorkItem[] {
  const fromReadyWorkflow: CareerOsDailyApplicationWorkItem[] = readyWorkflowItems(input).map((item) => ({
    id: `workflow-ready:${item.recommendationId}`,
    company: item.company,
    role: item.role,
    task: "Prepare Resume Draft",
    status: item.workflowState || "READY_TO_APPLY",
    detail: "Ross chose Apply. Prepare the existing Application Intelligence and truth-bound resume draft workflow before any external action.",
    applicationDate: null,
    humanReviewRequired: true,
    externalActionAvailable: false as const,
    limitations: [...item.limitations],
  }));
  const fromReviews: CareerOsDailyApplicationWorkItem[] = reviewItems(input).map((item) => ({
    id: `review:${item.packageId}`,
    company: item.company,
    role: item.role,
    task: item.reviewState === "MANUAL_APPLICATION_READY" ? "Ready for Manual Application" : "Review Package",
    status: item.reviewState,
    detail: item.recommendedNextAction,
    applicationDate: null,
    humanReviewRequired: item.humanReviewRequired,
    externalActionAvailable: false as const,
    limitations: [...item.limitations],
  }));
  const fromEngagement: CareerOsDailyApplicationWorkItem[] = engagementItems(input)
    .filter((item) => item.needsAttention || item.recommendedNextEngagementAction !== "NO_ACTION")
    .map((item) => ({
      id: `engagement:${item.engagementItemId}`,
      company: item.company,
      role: item.role,
      task: actionForEngagement(item),
      status: `${item.followUpState} / ${item.responseState}`,
      detail: item.followUpDueDateKnown
        ? "Review the follow-up or response state before any external communication."
        : "Review the application state before deciding whether any follow-up is appropriate.",
      applicationDate: item.applicationDate,
      humanReviewRequired: item.operatorApprovalRequired,
      externalActionAvailable: false as const,
      limitations: [...item.limitations],
    }));
  const fromSubmissions: CareerOsDailyApplicationWorkItem[] = manualSubmissionItems(input).map((item) => ({
    id: `submission:${item.applicationId}`,
    company: item.company,
    role: item.role,
    task: actionForSubmission(item),
    status: item.currentStage,
    detail: item.followUpState
      ? `Resume ${item.resumeArtifactFilename} v${item.resumeArtifactVersion} linked. Follow-up: ${item.followUpState}.`
      : `Resume ${item.resumeArtifactFilename} v${item.resumeArtifactVersion} linked.`,
    applicationDate: item.submittedDate,
    humanReviewRequired: true,
    externalActionAvailable: false as const,
    limitations: [...item.limitations],
  }));

  return [...fromEngagement, ...fromReadyWorkflow, ...fromReviews, ...fromSubmissions].sort(
    (left, right) =>
      left.company.localeCompare(right.company) ||
      left.role.localeCompare(right.role) ||
      left.id.localeCompare(right.id),
  );
}

function pipelineStages(pipeline: CareerOsPipelineSummary): CareerOsDailyPipelineStage[] {
  return [
    {
      id: "applied",
      label: "Applied",
      value: pipeline.applicationsSubmitted,
      detail: "Applications submitted manually and tracked in CareerOS.",
    },
    {
      id: "interview",
      label: "Interview",
      value: pipeline.interviews,
      detail: "Interview activity recorded in the application pipeline.",
    },
    {
      id: "offer",
      label: "Offer",
      value: pipeline.offers ?? 0,
      detail: "Offer outcomes recorded in the application pipeline.",
    },
    {
      id: "closed",
      label: "Closed",
      value: pipeline.closedApplications ?? 0,
      detail: "Closed outcomes remain governed by application events.",
    },
  ];
}

function systemHealth(system: CareerOsSystemHealth): CareerOsDailySystemHealth {
  const provider = system.providerStatus[0];
  return {
    providerStatus: provider ? `${provider.label}: ${provider.state}` : "Discovery status unavailable",
    lastDiscoveryRun: system.lastDiscoveryRun,
    openOpportunityBacklog: system.queueSize,
    detail: "Status is shown from existing discovery and opportunity information only.",
  };
}

function dailyActions(priorities: readonly CareerOsDailyPriority[]) {
  const seen = new Set<CareerOsDailyActionKind>();
  const actions: CareerOsDailyActionKind[] = priorities
    .map((priority) => priority.action)
    .filter((action) => action !== "No Action")
    .filter((action) => {
      if (seen.has(action)) return false;
      seen.add(action);
      return true;
    })
    .slice(0, 6);

  if (!actions.length) actions.push("No Action");

  return actions.map((action) => ({
    action,
    label: action,
    enabled: false as const,
    reason: "Planning action only. CareerOS does not perform external actions from this experience.",
  }));
}

export function buildCareerOsDailyJobSearchExperience(
  input: CareerOsDailyJobSearchExperienceInput = {},
): CareerOsDailyJobSearchExperience {
  const commandCenter = input.commandCenter || buildCareerOsCommandCenterPresentation(input);
  const top = topOpportunities(input, commandCenter);
  const intelligence = applicationIntelligence(input);
  const drafts = resumeDrafts(input);
  const exports = resumeExports(input);
  const decisions = opportunityDecisions(input, top);
  const outcomes = applicationOutcomes(input);
  const priorities = todaysPriorities(input, top, exports, decisions, outcomes);
  const work = applicationWork(input);
  const hasConnectedWork =
    priorities.length > 0 ||
    decisions.length > 0 ||
    top.length > 0 ||
    intelligence.length > 0 ||
    drafts.length > 0 ||
    exports.length > 0 ||
    outcomes.length > 0 ||
    work.length > 0 ||
    commandCenter.pipeline.applicationsSubmitted > 0 ||
    commandCenter.systemHealth.queueSize > 0;

  return {
    schemaVersion: CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE_SCHEMA_VERSION,
    workflowVersion: CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE_VERSION,
    workspaceId: JOB_COMMAND_WORKSPACE_ID,
    route: JOB_COMMAND_ROUTE,
    title: "CareerOS",
    primaryQuestion: JOB_COMMAND_PRIMARY_QUESTION,
    greeting: "Good morning",
    dailyBriefing: buildBriefing(input, commandCenter),
    todaysPriorities: priorities,
    opportunityDecisions: decisions,
    topOpportunities: top,
    applicationWork: work,
    applicationIntelligence: intelligence,
    resumeDrafts: drafts,
    resumeExports: exports,
    applicationOutcomes: outcomes,
    applicationPipeline: pipelineStages(commandCenter.pipeline),
    dailyActions: dailyActions(priorities),
    systemHealth: systemHealth(commandCenter.systemHealth),
    approvalBoundary:
      "Ross remains the approval authority for applications, resume use, outreach, withdrawals, offers, and any external representation.",
    emptyState: hasConnectedWork ? null : EMPTY_STATE,
    auditSummary: {
      existingReadModelsReused: true,
      commandCenterPresentationReused: true,
      noRecommendationLogicDuplicated: true,
      noDiscoveryModified: true,
      noProviderAdded: true,
      noProviderCalledByExperience: true,
      noApplicationCreated: true,
      noApplicationSubmitted: true,
      noResumeGenerated: true,
      noResumeMutated: true,
      noCoverLetterGenerated: true,
      noMessageSent: true,
      noBrowserAutomation: true,
      noExternalAi: true,
      noOllama: true,
      noNewPrivateDataRoute: true,
      rawInternalDataVisible: false,
      privatePathVisible: false,
      rawJobTextVisible: false,
      rawResumeTextVisible: false,
    },
  };
}

export const EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE =
  buildCareerOsDailyJobSearchExperience();

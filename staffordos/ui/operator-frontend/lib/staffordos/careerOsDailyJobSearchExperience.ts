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
import type { ApplicationIntelligencePacketReadModelRecord } from "./applicationIntelligencePacket";

export const CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE_VERSION = "CAREEROS_V1.01";
export const CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE_SCHEMA_VERSION =
  "staffordos.job_search.careeros_daily_job_search_experience.v1";

export type CareerOsDailyRecommendation = "APPLY NOW" | "REVIEW" | "WAIT" | "SKIP";
export type CareerOsDailyActionKind =
  | "Review Package"
  | "Open Opportunity"
  | "View Intelligence"
  | "View Resume"
  | "Review Evidence"
  | "Follow Up"
  | "Prepare Interview"
  | "Ready for Manual Application"
  | "No Action";

export type CareerOsDailyBriefMetric = {
  id:
    | "applications-needing-follow-up"
    | "ready-to-apply"
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
  nextAction: CareerOsDailyActionKind;
  detail: string;
  externalActionAvailable: false;
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
  topOpportunities: CareerOsDailyTopOpportunity[];
  applicationWork: CareerOsDailyApplicationWorkItem[];
  applicationIntelligence: CareerOsDailyApplicationIntelligenceItem[];
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

function countBrief(commandCenter: CareerOsCommandCenterPresentation, label: string) {
  return commandCenter.todaysBrief.find((item) => item.label === label)?.value || 0;
}

function readyToApplyCount(input: CareerOsDailyJobSearchExperienceInput, commandCenter: CareerOsCommandCenterPresentation) {
  return Math.max(
    countBrief(commandCenter, "Ready to Apply"),
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
  const opportunities = countBrief(commandCenter, "New Opportunities");
  const interviews = interviewActivity(input, commandCenter);
  const headline =
    followUps > 0
      ? "Start with application follow-up."
      : ready > 0
        ? "Start with application package review."
        : resumeReviews > 0
          ? "Start with resume review."
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

function topOpportunities(commandCenter: CareerOsCommandCenterPresentation): CareerOsDailyTopOpportunity[] {
  return commandCenter.topRecommendations.map((record: CareerOsTopRecommendation) => {
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
) {
  const priorities = [
    ...engagementPriorities(engagementItems(input)),
    ...reviewPriorities(reviewItems(input)),
    ...packagePriorities(packageItems(input)),
    ...opportunityPriorities(topOpportunityRecords),
  ].sort((left, right) => prioritySortKey(left).localeCompare(prioritySortKey(right)));

  return priorities.slice(0, 8);
}

function applicationWork(input: CareerOsDailyJobSearchExperienceInput): CareerOsDailyApplicationWorkItem[] {
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

  return [...fromEngagement, ...fromReviews].sort(
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
  const top = topOpportunities(commandCenter);
  const intelligence = applicationIntelligence(input);
  const priorities = todaysPriorities(input, top);
  const work = applicationWork(input);
  const hasConnectedWork =
    priorities.length > 0 ||
    top.length > 0 ||
    intelligence.length > 0 ||
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
    topOpportunities: top,
    applicationWork: work,
    applicationIntelligence: intelligence,
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

import {
  JOB_COMMAND_ROUTE,
  JOB_COMMAND_WORKSPACE_ID,
  type JobCommandPresentation,
} from "./jobSearchCommandPresentation";
import type { StaffordOsWorkspaceId } from "./workspaceRegistry";
import type { GreenhouseDiscoveryResult } from "./greenhouseDiscoveryProvider";
import type { PrivateApplicationPipelineReviewResult } from "./privateApplicationPipelineReview";
import type { PrivateJobSourceImportQueueResult } from "./privateJobSourceImportQueue";
import type {
  OpportunityApplicationRecommendation,
  OpportunityRecommendationReadModelRecord,
  OpportunityRecommendationRecord,
  OpportunityRecommendationResult,
} from "./opportunityRecommendationEngine";
import type { NormalizedJobSourceRecord } from "./privateJobSourceImportQueue";

export const CAREEROS_COMMAND_CENTER_VERSION = "J003.02";
export const CAREEROS_COMMAND_CENTER_SCHEMA_VERSION =
  "staffordos.job_search.careeros_command_center.v1";
export const CAREEROS_COMMAND_CENTER_TITLE = "CareerOS Command Center";
export const CAREEROS_COMMAND_CENTER_EMPTY_AS_OF = "NO_PRIVATE_READ_MODEL_CONNECTED";

export type CareerOsBriefItem = {
  id: "new-opportunities" | "ready-to-apply" | "review" | "waiting" | "skipped";
  label: string;
  value: number;
  sourceAuthority: string;
  limitations: string[];
};

export type CareerOsTopRecommendation = {
  id: string;
  position: string;
  company: string;
  recommendation: OpportunityApplicationRecommendation;
  qualification: OpportunityRecommendationReadModelRecord["qualification"];
  shortlistedForDecision: boolean;
  explainableFit: string;
  resumeVersion: string;
  nextAction: string;
  applicationReadiness: string;
  supportingEvidenceCount: number;
  missingSkillCount: number;
  estimatedResumeUpdateEffort: string;
  location: string | null;
  workArrangement: string | null;
  capturedAsOf: string;
  limitations: string[];
  applicationActionAvailable: false;
  messageActionAvailable: false;
  resumeMutationAvailable: false;
};

export type CareerOsPipelineSummary = {
  applicationsSubmitted: number;
  interviews: number;
  offers: number;
  closedApplications: number;
  followUpsDue: number;
  sourceAuthority: string;
  limitations: string[];
};

export type CareerOsProviderStatus = {
  id: string;
  label: string;
  state: string;
  detail: string;
  sourceAuthority: string;
  limitations: string[];
};

export type CareerOsSystemHealth = {
  providerStatus: CareerOsProviderStatus[];
  lastDiscoveryRun: string;
  queueSize: number;
  sourceAuthority: string;
  limitations: string[];
};

export type CareerOsCommandCenterPresentation = {
  schemaVersion: typeof CAREEROS_COMMAND_CENTER_SCHEMA_VERSION;
  workflowVersion: typeof CAREEROS_COMMAND_CENTER_VERSION;
  workspaceId: StaffordOsWorkspaceId;
  route: typeof JOB_COMMAND_ROUTE;
  title: typeof CAREEROS_COMMAND_CENTER_TITLE;
  primaryQuestion: JobCommandPresentation["primaryQuestion"];
  summary: string;
  capturedAsOf: string;
  todaysBrief: CareerOsBriefItem[];
  topRecommendations: CareerOsTopRecommendation[];
  pipeline: CareerOsPipelineSummary;
  systemHealth: CareerOsSystemHealth;
  authorityStatement: string;
  approvalStatement: string;
  limitations: string[];
  auditSummary: {
    noRecommendationLogicDuplicated: true;
    noProviderAdded: true;
    noProviderCalledByDashboard: true;
    noApplicationSubmitted: true;
    noApplicationCreated: true;
    noResumeGenerated: true;
    noResumeMutated: true;
    noCoverLetterGenerated: true;
    noMessageSent: true;
    noExternalAi: true;
    noOllama: true;
    noOsPrivateLoader: true;
    noOperatorPrivateLoader: true;
    privatePathVisible: false;
    rawJobTextVisible: false;
    rawResumeTextVisible: false;
  };
};

export type CareerOsCommandCenterInput = {
  workspaceId?: StaffordOsWorkspaceId;
  primaryQuestion?: string;
  recommendationResult?: OpportunityRecommendationResult | null;
  importQueueResult?: PrivateJobSourceImportQueueResult | null;
  greenhouseDiscoveryResult?: GreenhouseDiscoveryResult | null;
  applicationPipelineResult?: PrivateApplicationPipelineReviewResult | null;
  sourceRecords?: readonly Pick<NormalizedJobSourceRecord, "jobSourceRecordId" | "location" | "remoteState">[];
  topRecommendationLimit?: number;
};

const ZERO_LIMITATIONS = [
  "No private read model is connected to this route yet.",
  "The dashboard does not load private files, provider data, or application records by itself.",
];

function countRecommendation(
  readModel: readonly OpportunityRecommendationReadModelRecord[],
  recommendation: OpportunityApplicationRecommendation,
) {
  return readModel.filter((record) => record.recommendation === recommendation).length;
}

function recommendationRecordById(result: OpportunityRecommendationResult | null | undefined) {
  return new Map((result?.recommendations || []).map((record) => [record.recommendationId, record]));
}

function queueSize(input: CareerOsCommandCenterInput) {
  return (
    input.importQueueResult?.summary.queueItems ??
    input.greenhouseDiscoveryResult?.summary.queueItems ??
    input.recommendationResult?.summary.queueItemsReviewed ??
    0
  );
}

function newOpportunityCount(input: CareerOsCommandCenterInput) {
  return input.importQueueResult?.summary.queueItems ?? input.greenhouseDiscoveryResult?.summary.queueItems ?? queueSize(input);
}

function sourceTimestamp(input: CareerOsCommandCenterInput) {
  return (
    input.recommendationResult?.generatedAt ??
    input.greenhouseDiscoveryResult?.generatedAt ??
    input.importQueueResult?.generatedAt ??
    input.applicationPipelineResult?.generatedAt ??
    CAREEROS_COMMAND_CENTER_EMPTY_AS_OF
  );
}

function briefItem(
  id: CareerOsBriefItem["id"],
  label: string,
  value: number,
  sourceAuthority: string,
  limitations: string[],
): CareerOsBriefItem {
  return { id, label, value, sourceAuthority, limitations };
}

function buildTodaysBrief(input: CareerOsCommandCenterInput): CareerOsBriefItem[] {
  const readModel = input.recommendationResult?.readModel || [];
  const sourceAuthority = input.recommendationResult
    ? "J003.01 Opportunity Recommendation read model"
    : "No private recommendation read model connected";

  return [
    briefItem("new-opportunities", "Current Opportunities", newOpportunityCount(input), "J002 Opportunity Queue read model", []),
    briefItem("ready-to-apply", "Ready to Apply", countRecommendation(readModel, "APPLY_NOW"), sourceAuthority, []),
    briefItem("review", "Review", countRecommendation(readModel, "REVIEW"), sourceAuthority, []),
    briefItem("waiting", "Waiting", countRecommendation(readModel, "WAIT"), sourceAuthority, []),
    briefItem("skipped", "Skipped", countRecommendation(readModel, "SKIP"), sourceAuthority, []),
  ];
}

function explainableFitLabel(record: OpportunityRecommendationRecord | null) {
  if (!record) return "Fit summary unavailable in the redacted recommendation read model.";
  if (!record.explainableFit.available) return "No Explainable Fit artifact supplied.";
  return record.explainableFit.fitRecommendation || "Explainable Fit artifact available.";
}

function resumeVersionLabel(record: OpportunityRecommendationReadModelRecord) {
  return record.recommendedResumeVersion.safeLabel || record.recommendedResumeVersion.status;
}

function sourceRecordById(input: CareerOsCommandCenterInput) {
  const records =
    input.sourceRecords ||
    input.importQueueResult?.normalizedSourceRecords ||
    input.greenhouseDiscoveryResult?.jobSourceImportQueue?.normalizedSourceRecords ||
    [];
  return new Map(records.map((record) => [record.jobSourceRecordId, record]));
}

function topRecommendations(input: CareerOsCommandCenterInput): CareerOsTopRecommendation[] {
  const readModel = input.recommendationResult?.readModel || [];
  const fullRecordById = recommendationRecordById(input.recommendationResult);
  const sourceRecords = sourceRecordById(input);
  const limit = input.topRecommendationLimit ?? 5;

  return readModel
    .filter((record) =>
      record.shortlistedForDecision &&
      record.recommendation !== "WAIT" &&
      record.recommendation !== "SKIP" &&
      record.qualification?.state !== "HARD_MISMATCH")
    .slice(0, limit)
    .map((record) => {
    const fullRecord = fullRecordById.get(record.recommendationId) || null;
    const sourceRecord = fullRecord?.sourceRecordId ? sourceRecords.get(fullRecord.sourceRecordId) || null : null;
    return {
      id: record.recommendationId,
      position: record.role,
      company: record.company,
      recommendation: record.recommendation,
      qualification: record.qualification,
      shortlistedForDecision: record.shortlistedForDecision,
      explainableFit: explainableFitLabel(fullRecord),
      resumeVersion: resumeVersionLabel(record),
      nextAction: record.recommendedNextAction,
      applicationReadiness: record.applicationReadiness,
      supportingEvidenceCount: record.supportingEvidenceCount,
      missingSkillCount: record.missingSkillCount,
      estimatedResumeUpdateEffort: record.estimatedResumeUpdateEffort,
      location: sourceRecord?.location || null,
      workArrangement: sourceRecord?.remoteState || null,
      capturedAsOf: record.capturedAsOf,
      limitations: [
        "Shortlisted opportunity ordering is inherited from the J003.01 recommendation read model.",
        "This projection shows only records already marked shortlisted by existing recommendation authority.",
        ...record.limitations,
      ],
      applicationActionAvailable: false,
      messageActionAvailable: false,
      resumeMutationAvailable: false,
    };
  });
}

function pipelineSummary(input: CareerOsCommandCenterInput): CareerOsPipelineSummary {
  const pipeline = input.applicationPipelineResult?.dailyCommand;
  if (!pipeline) {
    return {
      applicationsSubmitted: 0,
      interviews: 0,
      offers: 0,
      closedApplications: 0,
      followUpsDue: 0,
      sourceAuthority: "No J001.05B application pipeline read model connected",
      limitations: [...ZERO_LIMITATIONS],
    };
  }

  return {
    applicationsSubmitted: pipeline.pipelineSummary.submittedApplications,
    interviews: pipeline.searchHealth.interviewsActive,
    offers: pipeline.pipelineSummary.offers,
    closedApplications: pipeline.pipelineSummary.closedApplications,
    followUpsDue: pipeline.pipelineSummary.followUpReviewsDue,
    sourceAuthority: "J001.05B private application pipeline read model",
    limitations: [...pipeline.limitations, ...pipeline.pipelineSummary.limitations],
  };
}

function providerStatus(input: CareerOsCommandCenterInput): CareerOsProviderStatus[] {
  if (input.greenhouseDiscoveryResult) {
    const result = input.greenhouseDiscoveryResult;
    const state =
      result.summary.boardsFailed > 0
        ? "PARTIAL_GREENHOUSE_DISCOVERY_RUN"
        : result.summary.boardsRetrieved > 0
          ? "GREENHOUSE_DISCOVERY_RUN_AVAILABLE"
          : "NO_GREENHOUSE_BOARD_RETRIEVED";
    return [
      {
        id: "provider-greenhouse",
        label: "Greenhouse",
        state,
        detail: `${result.summary.boardsRetrieved} boards retrieved, ${result.summary.publishedJobsRetrieved} published jobs retrieved, ${result.summary.eligibleJobs} eligible.`,
        sourceAuthority: "J002.02B Greenhouse discovery result",
        limitations: [...result.providerManifest.limitations],
      },
    ];
  }

  if (input.importQueueResult) {
    return input.importQueueResult.providerCapabilityMatrix.map((provider) => ({
      id: `provider-${provider.providerId.toLowerCase()}`,
      label: provider.providerName,
      state: provider.connectionStatus,
      detail: provider.limitations.join(" "),
      sourceAuthority: "J002.02A provider capability matrix",
      limitations: [...provider.limitations],
    }));
  }

  return [
    {
      id: "provider-greenhouse",
      label: "Greenhouse",
      state: "NO_DISCOVERY_RUN_CONNECTED",
      detail: "The dashboard has no private Greenhouse discovery result attached.",
      sourceAuthority: "J002.02B Greenhouse provider exists outside this static route",
      limitations: [...ZERO_LIMITATIONS],
    },
  ];
}

function systemHealth(input: CareerOsCommandCenterInput): CareerOsSystemHealth {
  return {
    providerStatus: providerStatus(input),
    lastDiscoveryRun: input.greenhouseDiscoveryResult?.generatedAt ?? input.importQueueResult?.generatedAt ?? "UNKNOWN",
    queueSize: queueSize(input),
    sourceAuthority: "Existing provider, import queue, and recommendation read models",
    limitations: input.greenhouseDiscoveryResult || input.importQueueResult ? [] : [...ZERO_LIMITATIONS],
  };
}

export function buildCareerOsCommandCenterPresentation(
  input: CareerOsCommandCenterInput = {},
): CareerOsCommandCenterPresentation {
  return {
    schemaVersion: CAREEROS_COMMAND_CENTER_SCHEMA_VERSION,
    workflowVersion: CAREEROS_COMMAND_CENTER_VERSION,
    workspaceId: input.workspaceId || JOB_COMMAND_WORKSPACE_ID,
    route: JOB_COMMAND_ROUTE,
    title: CAREEROS_COMMAND_CENTER_TITLE,
    primaryQuestion: input.primaryQuestion || "What should I do next in my job search?",
    summary:
      "A read-only operational view over the existing opportunity queue, recommendation, application pipeline, and provider status read models.",
    capturedAsOf: sourceTimestamp(input),
    todaysBrief: buildTodaysBrief(input),
    topRecommendations: topRecommendations(input),
    pipeline: pipelineSummary(input),
    systemHealth: systemHealth(input),
    authorityStatement:
      "This dashboard composes existing CareerOS read models only. It does not calculate recommendations, import providers, load private files, or perform external actions.",
    approvalStatement:
      "Ross remains the approval authority for applications, resume use, outreach, withdrawals, offers, and any external representation.",
    limitations: input.recommendationResult || input.importQueueResult || input.applicationPipelineResult || input.greenhouseDiscoveryResult
      ? [
          "Displayed records depend on supplied authoritative read models.",
          "The route is intentionally not wired to private storage in this mission.",
        ]
      : [...ZERO_LIMITATIONS],
    auditSummary: {
      noRecommendationLogicDuplicated: true,
      noProviderAdded: true,
      noProviderCalledByDashboard: true,
      noApplicationSubmitted: true,
      noApplicationCreated: true,
      noResumeGenerated: true,
      noResumeMutated: true,
      noCoverLetterGenerated: true,
      noMessageSent: true,
      noExternalAi: true,
      noOllama: true,
      noOsPrivateLoader: true,
      noOperatorPrivateLoader: true,
      privatePathVisible: false,
      rawJobTextVisible: false,
      rawResumeTextVisible: false,
    },
  };
}

export const EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION =
  buildCareerOsCommandCenterPresentation();

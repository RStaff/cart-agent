import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";
import {
  buildCareerOsCommandCenterPresentation,
} from "./careerOsCommandCenterPresentation";
import {
  GREENHOUSE_DISCOVERY_RESULT_SCHEMA_VERSION,
  GREENHOUSE_DISCOVERY_VERSION,
  GREENHOUSE_PROVIDER_MANIFEST_SCHEMA_VERSION,
  type GreenhouseDiscoveryResult,
  type GreenhouseEligibilityReview,
  type GreenhouseRetrievalResult,
} from "./greenhouseDiscoveryProvider";
import {
  buildCareerOsDailyJobSearchExperience,
  type CareerOsDailyJobSearchExperience,
  type CareerOsDailyJobSearchExperienceInput,
} from "./careerOsDailyJobSearchExperience";
import type { ApplicationEngagementReadModelRecord } from "./applicationFollowUpResponseTracking";
import type { ApplicationReviewWorkspaceReadModelRecord } from "./applicationReviewWorkspace";
import type {
  OpportunityRecommendationReadModelRecord,
  OpportunityRecommendationRecord,
  OpportunityRecommendationResult,
} from "./opportunityRecommendationEngine";
import type {
  JobSourceImportQueueItem,
  PrivateJobSourceImportQueueResult,
} from "./privateJobSourceImportQueue";
import type {
  PrivateApplicationPipelineReviewResult,
  PrivateDailyJobSearchCommand,
} from "./privateApplicationPipelineReview";
import type { ReadyToApplyApplicationPackageReadModelRecord } from "./readyToApplyApplicationPackage";
import {
  loadLatestApplicationIntelligencePacketReadModel,
  type ApplicationIntelligencePacketReadModelRecord,
} from "./applicationIntelligencePacket";
import {
  loadLatestTruthBoundResumeDraftReadModel,
  loadLatestTruthBoundResumeDraftReviewReadModel,
  type TruthBoundResumeDraftReadModelRecord,
  type TruthBoundResumeDraftReviewReadModelRecord,
} from "./truthBoundResumeDraft";
import {
  loadLatestReviewedResumeDraftExportReadModel,
  type ReviewedResumeDraftExportReadModelRecord,
} from "./reviewedResumeDraftExport";
import {
  loadLatestManualSubmissionReadModel,
  type ManualSubmissionReadModelRecord,
} from "./manualSubmissionRecordAndArtifactLinkage";

export const CAREEROS_DAILY_PRIVATE_ARTIFACT_LOADER_VERSION = "CAREEROS_V1.01";

export type CareerOsDailyPrivateArtifactLoadResult = {
  experience: CareerOsDailyJobSearchExperience;
  loadedArtifacts: {
    opportunityRecommendations: boolean;
    applicationPipeline: boolean;
    applicationEngagement: boolean;
    applicationPackages: boolean;
    applicationReviewWorkspace: boolean;
    applicationIntelligencePackets: boolean;
    truthBoundResumeDrafts: boolean;
    reviewedResumeDraftExports: boolean;
    manualSubmissionArtifactLinks: boolean;
    greenhouseDiscovery: boolean;
  };
  missingArtifacts: string[];
  auditSummary: {
    noNewPrivateDataRoute: true;
    onlyExistingPrivateArtifactsRead: true;
    rawInternalDataVisible: false;
    privatePathVisible: false;
    noProviderCalled: true;
    noApplicationCreated: true;
    noApplicationSubmitted: true;
    noMessageSent: true;
    noResumeGenerated: true;
    noResumeMutated: true;
    noExternalAi: true;
    noOllama: true;
  };
};

const DEFAULT_JOB_SEARCH_ROOT = path.join(homedir(), ".staffordos/private/professional/job-search");

function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
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
    .sort((left, right) => left.localeCompare(right));
  return directories[directories.length - 1] || null;
}

function latestJson<T>(root: string, filename: string): T | null {
  const directory = latestDirectory(root);
  if (!directory) return null;
  return readJsonFile<T>(path.join(directory, filename));
}

function latestGreenhouseDiscoveryResult(root: string): GreenhouseDiscoveryResult | null {
  const directory = latestDirectory(path.join(root, "greenhouse-discovery"));
  if (!directory) return null;

  const providerManifest = readJsonFile<GreenhouseDiscoveryResult["providerManifest"]>(
    path.join(directory, "greenhouse_provider_manifest_snapshot.json"),
  );
  const retrievals = readJsonFile<GreenhouseRetrievalResult[]>(
    path.join(directory, "greenhouse_retrievals.json"),
  ) || [];
  const eligibilityReviews = readJsonFile<GreenhouseEligibilityReview[]>(
    path.join(directory, "eligibility_reviews.json"),
  ) || [];
  const queueResult = readJsonFile<PrivateJobSourceImportQueueResult>(
    path.join(directory, "job_source_import_queue_result.json"),
  );
  const opportunityQueue = readJsonFile<JobSourceImportQueueItem[]>(
    path.join(directory, "opportunity_queue.json"),
  ) || queueResult?.importQueue || [];
  const explainableFitArtifacts = readJsonFile<GreenhouseDiscoveryResult["explainableFitArtifacts"]>(
    path.join(directory, "explainable_fit_artifacts.json"),
  ) || [];
  const auditSummary = readJsonFile<GreenhouseDiscoveryResult["auditSummary"]>(
    path.join(directory, "greenhouse_discovery_audit.json"),
  );

  if (!providerManifest || !queueResult) return null;

  const boardsRetrieved = retrievals.filter((retrieval) => retrieval.status === "RETRIEVED").length;
  const boardsFailed = retrievals.filter((retrieval) => retrieval.status === "FAILED").length;
  const eligibleJobs = eligibilityReviews.filter((review) => review.status === "ELIGIBLE").length;
  const rejectedJobs = eligibilityReviews.filter((review) => review.status === "REJECTED").length;
  const careerFactsLoadedFromAuthority = Math.max(
    0,
    ...explainableFitArtifacts.map((artifact) => artifact.careerFactsLoadedFromAuthority || 0),
  );
  const careerEvidenceRecordsLoadedFromAuthority = Math.max(
    0,
    ...explainableFitArtifacts.map((artifact) => artifact.careerEvidenceRecordsLoadedFromAuthority || 0),
  );
  const fitArtifactsWithSupportingEvidence = explainableFitArtifacts.filter((artifact) =>
    artifact.mappings.some((mapping) => mapping.careerFactIds.length || mapping.careerEvidenceIds.length),
  ).length;

  return {
    schemaVersion: GREENHOUSE_DISCOVERY_RESULT_SCHEMA_VERSION,
    workflowVersion: GREENHOUSE_DISCOVERY_VERSION,
    generatedAt: queueResult.generatedAt,
    providerManifest: {
      schemaVersion: GREENHOUSE_PROVIDER_MANIFEST_SCHEMA_VERSION,
      sourceCount: providerManifest.sourceCount,
      enabledGreenhouseSources: providerManifest.enabledGreenhouseSources,
      limitations: providerManifest.limitations || [],
    },
    retrievals,
    eligibilityReviews,
    jobSourceImportQueue: queueResult,
    opportunityQueue,
    explainableFitArtifacts,
    summary: {
      companiesRequested: providerManifest.sourceCount,
      boardsRetrieved,
      boardsFailed,
      publishedJobsRetrieved: retrievals.reduce((count, retrieval) => count + retrieval.jobCount, 0),
      eligibleJobs,
      rejectedJobs,
      normalizedRecords: queueResult.summary.normalizedRecords,
      queueItems: queueResult.summary.queueItems,
      readyForOpportunityImport: queueResult.summary.readyForOpportunityImport,
      duplicateItems: queueResult.summary.duplicateItems,
      existingApplicationItems: queueResult.summary.existingApplicationItems,
      externalProviderCalls: retrievals.length,
      careerFactsLoadedFromAuthority,
      careerEvidenceRecordsLoadedFromAuthority,
      fitArtifactsWithSupportingEvidence,
    },
    auditSummary: auditSummary || {
      publicGreenhouseApiOnly: true,
      noAuthentication: true,
      noCookies: true,
      noBrowserAutomation: true,
      noScraping: true,
      noApplicationSubmitted: true,
      noApplicationCreated: true,
      noResumeGenerated: true,
      noCoverLetterGenerated: true,
      noMessageSent: true,
      noExternalAi: true,
      noOllama: true,
      noCareerFactPromoted: true,
      noCareerEvidenceMutated: true,
      noLinkedIn: true,
      noWorkday: true,
      noLever: true,
      noAshby: true,
      noDeployment: true,
      noPush: true,
    },
  };
}

function generatedAtFromDailyCommand(command: PrivateDailyJobSearchCommand | null) {
  return command?.generatedAt || null;
}

function applicationPipelineResult(command: PrivateDailyJobSearchCommand | null): PrivateApplicationPipelineReviewResult | null {
  if (!command) return null;
  return {
    schemaVersion: "staffordos.job_search.private_application_pipeline_review_audit.v1",
    workflowVersion: command.workflowVersion,
    generatedAt: command.generatedAt,
    loaded: {
      applications: command.pipelineSummary.submittedApplications,
      applicationEvents: command.recentOutcomes.length,
      followUpReviews: command.pipelineSummary.followUpReviewsDue,
      confirmationNeeded: command.pipelineSummary.applicationsNeedingOperatorConfirmation,
    },
    dailyCommand: command,
    nextActions: [
      ...(command.primaryNextAction ? [command.primaryNextAction] : []),
      ...command.applicationsNeedingAttention,
    ],
    decisions: [],
    generatedApplicationEvents: [],
    followUpReviewDecisions: [],
    confirmationDecisions: [],
    futureReadModel: [],
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

function recommendationResult(input: {
  readModel: OpportunityRecommendationReadModelRecord[] | null;
  recommendations: OpportunityRecommendationRecord[] | null;
  generatedAt: string;
}): OpportunityRecommendationResult | null {
  if (!input.readModel) return null;
  return {
    schemaVersion: "staffordos.job_search.private_opportunity_recommendation_result.v1",
    workflowVersion: "J003.01",
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {
      opportunityQueueReused: true,
      explainableFitReused: true,
      resumeVersionAuthorityReused: true,
      discoveryRebuilt: false,
      providerAdded: false,
    },
    recommendations: input.recommendations || [],
    readModel: input.readModel,
    summary: {
      queueItemsReviewed: input.readModel.length,
      recommendationsCreated: input.readModel.length,
      applyNow: input.readModel.filter((record) => record.recommendation === "APPLY_NOW").length,
      review: input.readModel.filter((record) => record.recommendation === "REVIEW").length,
      wait: input.readModel.filter((record) => record.recommendation === "WAIT").length,
      skip: input.readModel.filter((record) => record.recommendation === "SKIP").length,
      resumeVersionsEvaluated: input.recommendations?.reduce(
        (count, record) => count + record.recommendedResumeVersion.evaluatedResumeVersions.length,
        0,
      ) || 0,
      opportunitiesWithRecommendedResumeVersion: input.readModel.filter(
        (record) => record.recommendedResumeVersion.status === "SELECTED_EXISTING_RESUMEVERSION",
      ).length,
      opportunitiesMissingSkills: input.readModel.filter((record) => record.missingSkillCount > 0).length,
      readinessReadyForOperatorApprovedApplication: input.readModel.filter(
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

export function loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts(options: {
  jobSearchRoot?: string;
} = {}): CareerOsDailyPrivateArtifactLoadResult {
  const root = options.jobSearchRoot || DEFAULT_JOB_SEARCH_ROOT;
  const missingArtifacts: string[] = [];

  const dailyCommand = latestJson<PrivateDailyJobSearchCommand>(
    path.join(root, "application-pipeline-review"),
    "daily_job_search_command.json",
  );
  if (!dailyCommand) missingArtifacts.push("application pipeline daily command");

  const recommendationReadModel = latestJson<OpportunityRecommendationReadModelRecord[]>(
    path.join(root, "opportunity-recommendations"),
    "future_read_model.json",
  );
  const recommendationRecords = latestJson<OpportunityRecommendationRecord[]>(
    path.join(root, "opportunity-recommendations"),
    "opportunity_recommendations.json",
  );
  if (!recommendationReadModel) missingArtifacts.push("opportunity recommendation output");

  const engagementReadModel = latestJson<ApplicationEngagementReadModelRecord[]>(
    path.join(root, "career-engagement"),
    "application_engagement_read_model.json",
  );
  if (!engagementReadModel) missingArtifacts.push("career engagement output");

  const applicationPackageReadModel = latestJson<ReadyToApplyApplicationPackageReadModelRecord[]>(
    path.join(root, "application-packages"),
    "application_package_read_model.json",
  );
  if (!applicationPackageReadModel) missingArtifacts.push("application package output");

  const applicationReviewReadModel = latestJson<ApplicationReviewWorkspaceReadModelRecord[]>(
    path.join(root, "application-review-workspace"),
    "application_review_read_model.json",
  );
  if (!applicationReviewReadModel) missingArtifacts.push("application review workspace output");

  const applicationIntelligenceReadModel: ApplicationIntelligencePacketReadModelRecord[] =
    loadLatestApplicationIntelligencePacketReadModel(root);
  if (!applicationIntelligenceReadModel.length) missingArtifacts.push("application intelligence packet output");

  const resumeDraftReadModel: TruthBoundResumeDraftReadModelRecord[] =
    loadLatestTruthBoundResumeDraftReadModel(root);
  if (!resumeDraftReadModel.length) missingArtifacts.push("truth-bound resume draft output");
  const resumeDraftReviewReadModel: TruthBoundResumeDraftReviewReadModelRecord[] =
    loadLatestTruthBoundResumeDraftReviewReadModel(root);

  const resumeExportReadModel: ReviewedResumeDraftExportReadModelRecord[] =
    loadLatestReviewedResumeDraftExportReadModel(root);

  const manualSubmissionReadModel: ManualSubmissionReadModelRecord[] =
    loadLatestManualSubmissionReadModel(root);

  const generatedAt =
    generatedAtFromDailyCommand(dailyCommand) ||
    recommendationReadModel?.[0]?.capturedAsOf ||
    engagementReadModel?.[0]?.applicationDate ||
    "NO_PRIVATE_ARTIFACT_TIMESTAMP_AVAILABLE";
  const recommendation = recommendationResult({
    readModel: recommendationReadModel,
    recommendations: recommendationRecords,
    generatedAt,
  });
  const pipeline = applicationPipelineResult(dailyCommand);
  const greenhouseDiscovery = latestGreenhouseDiscoveryResult(root);
  const commandCenter = buildCareerOsCommandCenterPresentation({
    recommendationResult: recommendation,
    applicationPipelineResult: pipeline,
    greenhouseDiscoveryResult: greenhouseDiscovery,
  });
  const experienceInput: CareerOsDailyJobSearchExperienceInput = {
    commandCenter,
    applicationEngagementReadModel: engagementReadModel || [],
    applicationPackageReadModel: applicationPackageReadModel || [],
    applicationReviewReadModel: applicationReviewReadModel || [],
    applicationIntelligenceReadModel,
    resumeDraftReadModel,
    resumeDraftReviewReadModel,
    resumeExportReadModel,
    manualSubmissionReadModel,
  };

  return {
    experience: buildCareerOsDailyJobSearchExperience(experienceInput),
    loadedArtifacts: {
      opportunityRecommendations: Boolean(recommendationReadModel),
      applicationPipeline: Boolean(dailyCommand),
      applicationEngagement: Boolean(engagementReadModel),
      applicationPackages: Boolean(applicationPackageReadModel),
      applicationReviewWorkspace: Boolean(applicationReviewReadModel),
      applicationIntelligencePackets: applicationIntelligenceReadModel.length > 0,
      truthBoundResumeDrafts: resumeDraftReadModel.length > 0,
      reviewedResumeDraftExports: resumeExportReadModel.length > 0,
      manualSubmissionArtifactLinks: manualSubmissionReadModel.length > 0,
      greenhouseDiscovery: Boolean(greenhouseDiscovery),
    },
    missingArtifacts,
    auditSummary: {
      noNewPrivateDataRoute: true,
      onlyExistingPrivateArtifactsRead: true,
      rawInternalDataVisible: false,
      privatePathVisible: false,
      noProviderCalled: true,
      noApplicationCreated: true,
      noApplicationSubmitted: true,
      noMessageSent: true,
      noResumeGenerated: true,
      noResumeMutated: true,
      noExternalAi: true,
      noOllama: true,
    },
  };
}

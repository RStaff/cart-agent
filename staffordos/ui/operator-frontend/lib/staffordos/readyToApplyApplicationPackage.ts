import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import {
  loadOpportunityRecommendationResultFile,
  type CareerWorkflowStateItem,
  type CareerWorkflowStateResult,
} from "./careerWorkflowActions";
import {
  loadQueueResultFile,
  type MissingSkillRecord,
  type OpportunityRecommendationRecord,
  type OpportunityRecommendationResult,
  type SupportingCareerEvidenceRecord,
} from "./opportunityRecommendationEngine";
import type {
  JobSourceImportQueueItem,
  NormalizedJobSourceRecord,
  PrivateJobSourceImportQueueResult,
} from "./privateJobSourceImportQueue";

export const READY_TO_APPLY_APPLICATION_PACKAGE_VERSION = "J003.04";
export const READY_TO_APPLY_APPLICATION_PACKAGE_SCHEMA_VERSION =
  "staffordos.job_search.private_ready_to_apply_application_package.v1";
export const READY_TO_APPLY_APPLICATION_PACKAGE_RESULT_SCHEMA_VERSION =
  "staffordos.job_search.private_ready_to_apply_application_package_result.v1";
export const READY_TO_APPLY_APPLICATION_PACKAGE_READ_MODEL_SCHEMA_VERSION =
  "staffordos.job_search.private_ready_to_apply_application_package_read_model.v1";

export const APPLICATION_PACKAGE_READINESS_STATES = [
  "READY",
  "NEEDS_RESUME_REVIEW",
  "NEEDS_EVIDENCE_REVIEW",
  "BLOCKED",
] as const;

export type ApplicationPackageReadinessState = (typeof APPLICATION_PACKAGE_READINESS_STATES)[number];

export type ReadyToApplyApplicationPackage = {
  schemaVersion: typeof READY_TO_APPLY_APPLICATION_PACKAGE_SCHEMA_VERSION;
  workflowVersion: typeof READY_TO_APPLY_APPLICATION_PACKAGE_VERSION;
  packageId: string;
  recommendationId: string;
  workflowActionState: "READY_TO_APPLY";
  opportunityId: string | null;
  queueItemId: string;
  sourceRecordId: string | null;
  company: string;
  role: string;
  canonicalJobUrl: string | null;
  canonicalJobUrlAuthority: "J002_SOURCE_RECORD" | "UNKNOWN";
  recommendationState: {
    recommendation: "APPLY_NOW";
    applicationReadiness: "READY_FOR_OPERATOR_APPROVED_APPLICATION";
    workflowState: "READY_TO_APPLY";
    recommendedNextAction: string;
  };
  explainableFitSummary: {
    available: boolean;
    fitRecommendation: string | null;
    coverage: OpportunityRecommendationRecord["explainableFit"]["coverage"];
    majorBlockers: string[];
    limitations: string[];
  };
  recommendedResumeVersion: {
    status: OpportunityRecommendationRecord["recommendedResumeVersion"]["status"];
    resumeVersionId: string | null;
    safeLabel: string | null;
    factSafetyStatus: CareerWorkflowStateItem["recommendedResumeVersion"]["factSafetyStatus"];
    reviewRequired: boolean;
    limitations: string[];
    resumeGenerated: false;
    resumeMutated: false;
    rawResumeTextVisible: false;
    privatePathVisible: false;
  };
  supportingCareerEvidence: SupportingCareerEvidenceRecord[];
  relevantStrengths: string[];
  missingSkills: MissingSkillRecord[];
  resumeUpdateRequirements: string[];
  applicationReadiness: ApplicationPackageReadinessState;
  blockingIssues: string[];
  recommendedNextAction: string;
  humanReviewRequired: true;
  deterministicRulesOnly: true;
  applicationCreated: false;
  applicationSubmitted: false;
  resumeGenerated: false;
  resumeMutated: false;
  coverLetterGenerated: false;
  messageSent: false;
  browserAutomationUsed: false;
  externalProviderCall: false;
  externalAiUsed: false;
  ollamaUsed: false;
  privatePathVisible: false;
  rawJobTextVisible: false;
  rawResumeTextVisible: false;
  sourceUrlVisibleInReadModel: false;
  limitations: string[];
};

export type ReadyToApplyApplicationPackageReadModelRecord = {
  schemaVersion: typeof READY_TO_APPLY_APPLICATION_PACKAGE_READ_MODEL_SCHEMA_VERSION;
  packageId: string;
  recommendationId: string;
  opportunityId: string | null;
  company: string;
  role: string;
  applicationReadiness: ApplicationPackageReadinessState;
  canonicalJobUrlKnown: boolean;
  resumeVersionLabel: string | null;
  resumeVersionStatus: ReadyToApplyApplicationPackage["recommendedResumeVersion"]["status"];
  factSafetyStatus: ReadyToApplyApplicationPackage["recommendedResumeVersion"]["factSafetyStatus"];
  supportingEvidenceCount: number;
  missingSkillCount: number;
  blockingIssueCount: number;
  resumeUpdateRequirementCount: number;
  recommendedNextAction: string;
  humanReviewRequired: true;
  applicationCreated: false;
  applicationSubmitted: false;
  resumeGenerated: false;
  resumeMutated: false;
  coverLetterGenerated: false;
  messageSent: false;
  privatePathVisible: false;
  rawJobTextVisible: false;
  rawResumeTextVisible: false;
  sourceUrlVisible: false;
  limitations: string[];
};

export type ReadyToApplyApplicationPackageResult = {
  schemaVersion: typeof READY_TO_APPLY_APPLICATION_PACKAGE_RESULT_SCHEMA_VERSION;
  workflowVersion: typeof READY_TO_APPLY_APPLICATION_PACKAGE_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  sourceAuthority: {
    workflowStateReused: true;
    recommendationReadModelReused: true;
    opportunityQueueReused: true;
    explainableFitReused: true;
    resumeVersionReused: true;
    careerEvidenceReused: true;
    recommendationLogicModified: false;
    discoveryModified: false;
    providerAdded: false;
  };
  packages: ReadyToApplyApplicationPackage[];
  readModel: ReadyToApplyApplicationPackageReadModelRecord[];
  summary: {
    readyToApplyItemsReviewed: number;
    packagesCreated: number;
    ready: number;
    needsResumeReview: number;
    needsEvidenceReview: number;
    blocked: number;
    humanReviewRequired: true;
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
    noCareerEvidenceMutated: true;
    noCareerFactPromoted: true;
    privatePathVisible: false;
    rawJobTextVisible: false;
    rawResumeTextVisible: false;
  };
};

export type ReadyToApplyApplicationPackageInput = {
  generatedAt: string;
  workflowState: CareerWorkflowStateResult;
  recommendationResult: OpportunityRecommendationResult;
  queueResult?: PrivateJobSourceImportQueueResult | null;
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

function recommendationById(result: OpportunityRecommendationResult) {
  return new Map(result.recommendations.map((record) => [record.recommendationId, record]));
}

function sourceById(queueResult: PrivateJobSourceImportQueueResult | null | undefined) {
  return new Map((queueResult?.normalizedSourceRecords || []).map((record) => [record.jobSourceRecordId, record]));
}

function queueItemById(queueResult: PrivateJobSourceImportQueueResult | null | undefined) {
  return new Map((queueResult?.importQueue || []).map((record) => [record.queueItemId, record]));
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function canonicalJobUrl(input: {
  stateItem: CareerWorkflowStateItem;
  sourceRecord: NormalizedJobSourceRecord | null;
  queueItem: JobSourceImportQueueItem | null;
}) {
  if (input.sourceRecord?.sourceUrl) {
    return {
      value: input.sourceRecord.sourceUrl,
      authority: "J002_SOURCE_RECORD" as const,
    };
  }
  return {
    value: null,
    authority: "UNKNOWN" as const,
  };
}

function resumeRequirements(input: {
  stateItem: CareerWorkflowStateItem;
  record: OpportunityRecommendationRecord | null;
}) {
  const requirements: string[] = [];
  const resume = input.record?.recommendedResumeVersion;
  if (!resume?.resumeVersionId || !resume.safeLabel) {
    requirements.push("Confirm a safe existing ResumeVersion before preparing a manual application.");
  }
  if (resume?.status === "REVIEW_BEFORE_REUSE") {
    requirements.push("Review the selected ResumeVersion before reuse.");
  }
  if (resume?.status === "NO_SAFE_EXISTING_RESUMEVERSION") {
    requirements.push("No safe existing ResumeVersion is available for this opportunity.");
  }
  if (resume?.status === "NO_RESUMEVERSION_AVAILABLE") {
    requirements.push("No ResumeVersion is available for this opportunity.");
  }
  const factSafety = input.stateItem.recommendedResumeVersion.factSafetyStatus;
  if (factSafety === "NEEDS_EVIDENCE" || factSafety === "PARTIALLY_SUPPORTED" || factSafety === "UNKNOWN") {
    requirements.push(`Review ResumeVersion fact safety before reuse: ${factSafety}.`);
  }
  if (factSafety === "CONFLICTING" || factSafety === "STALE" || factSafety === "UNSUPPORTED") {
    requirements.push(`Do not reuse the selected ResumeVersion until fact-safety status is resolved: ${factSafety}.`);
  }
  if (
    input.stateItem.estimatedResumeUpdateEffort === "MODERATE" ||
    input.stateItem.estimatedResumeUpdateEffort === "HIGH" ||
    input.stateItem.estimatedResumeUpdateEffort === "UNKNOWN"
  ) {
    requirements.push(`Resume update effort requires review: ${input.stateItem.estimatedResumeUpdateEffort}.`);
  }
  return uniqueSorted(requirements);
}

function evidenceIssues(record: OpportunityRecommendationRecord | null) {
  const issues: string[] = [];
  if (!record) {
    issues.push("Full recommendation record is unavailable.");
    return issues;
  }
  if (!record.explainableFit.available) {
    issues.push("Explainable Fit artifact is unavailable.");
  }
  if (record.explainableFit.coverage) {
    if (record.explainableFit.coverage.MISSING > 0) {
      issues.push(`Explainable Fit has ${record.explainableFit.coverage.MISSING} missing requirement mappings.`);
    }
    if (record.explainableFit.coverage.UNKNOWN > 0) {
      issues.push(`Explainable Fit has ${record.explainableFit.coverage.UNKNOWN} unknown requirement mappings.`);
    }
  }
  if (record.explainableFit.majorBlockers.length) {
    issues.push(...record.explainableFit.majorBlockers);
  }
  if (record.missingSkills.length) {
    issues.push(...record.missingSkills.map((gap) => gap.reason));
  }
  if (!record.supportingCareerEvidence.length) {
    issues.push("No supporting Career Evidence is attached to the recommendation.");
  }
  return uniqueSorted(issues);
}

function hardBlockingIssues(input: {
  stateItem: CareerWorkflowStateItem;
  record: OpportunityRecommendationRecord | null;
  canonicalUrl: string | null;
}) {
  const issues: string[] = [];
  if (!input.stateItem.readyToApply || input.stateItem.workflowState !== "READY_TO_APPLY") {
    issues.push("Workflow state is not READY_TO_APPLY.");
  }
  if (!input.record) {
    issues.push("Full recommendation record is missing.");
    return issues;
  }
  if (input.record.recommendation !== "APPLY_NOW") {
    issues.push("Recommendation is no longer APPLY_NOW.");
  }
  if (input.record.applicationReadiness !== "READY_FOR_OPERATOR_APPROVED_APPLICATION") {
    issues.push("Recommendation is not ready for operator-approved application planning.");
  }
  if (!input.canonicalUrl) {
    issues.push("Canonical job URL is missing from the supplied Opportunity Queue source record.");
  }
  const resume = input.record.recommendedResumeVersion;
  const factSafety = input.stateItem.recommendedResumeVersion.factSafetyStatus;
  if (!resume.resumeVersionId || !resume.safeLabel) {
    issues.push("Recommended ResumeVersion identity is missing.");
  }
  if (resume.status === "NO_SAFE_EXISTING_RESUMEVERSION" || resume.status === "NO_RESUMEVERSION_AVAILABLE") {
    issues.push(`Recommended ResumeVersion is not available for safe reuse: ${resume.status}.`);
  }
  if (factSafety === "CONFLICTING" || factSafety === "STALE" || factSafety === "UNSUPPORTED") {
    issues.push(`Recommended ResumeVersion fact-safety status blocks reuse: ${factSafety}.`);
  }
  return uniqueSorted(issues);
}

function readinessFor(input: {
  stateItem: CareerWorkflowStateItem;
  record: OpportunityRecommendationRecord | null;
  canonicalUrl: string | null;
  resumeRequirements: readonly string[];
  evidenceIssues: readonly string[];
}) {
  const blockingIssues = hardBlockingIssues({
    stateItem: input.stateItem,
    record: input.record,
    canonicalUrl: input.canonicalUrl,
  });
  if (blockingIssues.length) return { readiness: "BLOCKED" as const, blockingIssues };
  if (input.resumeRequirements.length) return { readiness: "NEEDS_RESUME_REVIEW" as const, blockingIssues: [] };
  if (input.evidenceIssues.length) return { readiness: "NEEDS_EVIDENCE_REVIEW" as const, blockingIssues: [] };
  return { readiness: "READY" as const, blockingIssues: [] };
}

function nextActionFor(readiness: ApplicationPackageReadinessState) {
  if (readiness === "READY") {
    return "Human-review the package, confirm the existing ResumeVersion, then apply manually outside StaffordOS.";
  }
  if (readiness === "NEEDS_RESUME_REVIEW") {
    return "Review ResumeVersion safety and update requirements before any manual application.";
  }
  if (readiness === "NEEDS_EVIDENCE_REVIEW") {
    return "Review supporting Career Evidence and unresolved gaps before any manual application.";
  }
  return "Do not apply until blocking issues are resolved and the package is regenerated.";
}

function packageFor(input: {
  generatedAt: string;
  stateItem: CareerWorkflowStateItem;
  record: OpportunityRecommendationRecord | null;
  sourceRecord: NormalizedJobSourceRecord | null;
  queueItem: JobSourceImportQueueItem | null;
}): ReadyToApplyApplicationPackage {
  const source = canonicalJobUrl({
    stateItem: input.stateItem,
    sourceRecord: input.sourceRecord,
    queueItem: input.queueItem,
  });
  const resumeUpdateRequirements = resumeRequirements({
    stateItem: input.stateItem,
    record: input.record,
  });
  const unresolvedEvidence = evidenceIssues(input.record);
  const readiness = readinessFor({
    stateItem: input.stateItem,
    record: input.record,
    canonicalUrl: source.value,
    resumeRequirements: resumeUpdateRequirements,
    evidenceIssues: unresolvedEvidence,
  });
  const record = input.record;
  const supporting = record?.supportingCareerEvidence || [];
  const missing = record?.missingSkills || [];
  const resume = record?.recommendedResumeVersion;

  return {
    schemaVersion: READY_TO_APPLY_APPLICATION_PACKAGE_SCHEMA_VERSION,
    workflowVersion: READY_TO_APPLY_APPLICATION_PACKAGE_VERSION,
    packageId: opaqueId("privreadyapplicationpackage", [
      READY_TO_APPLY_APPLICATION_PACKAGE_VERSION,
      input.stateItem.recommendationId,
      input.stateItem.queueItemId,
      input.generatedAt,
    ]),
    recommendationId: input.stateItem.recommendationId,
    workflowActionState: "READY_TO_APPLY",
    opportunityId: input.stateItem.opportunityId,
    queueItemId: input.stateItem.queueItemId,
    sourceRecordId: input.stateItem.sourceRecordId,
    company: input.stateItem.company,
    role: input.stateItem.role,
    canonicalJobUrl: source.value,
    canonicalJobUrlAuthority: source.authority,
    recommendationState: {
      recommendation: "APPLY_NOW",
      applicationReadiness: "READY_FOR_OPERATOR_APPROVED_APPLICATION",
      workflowState: "READY_TO_APPLY",
      recommendedNextAction: input.stateItem.recommendedNextAction,
    },
    explainableFitSummary: {
      available: Boolean(record?.explainableFit.available),
      fitRecommendation: record?.explainableFit.fitRecommendation || null,
      coverage: record?.explainableFit.coverage || null,
      majorBlockers: [...(record?.explainableFit.majorBlockers || [])],
      limitations: [...(record?.explainableFit.limitations || ["Full Explainable Fit record is unavailable."])],
    },
    recommendedResumeVersion: {
      status: resume?.status || input.stateItem.recommendedResumeVersion.status,
      resumeVersionId: resume?.resumeVersionId || null,
      safeLabel: resume?.safeLabel || input.stateItem.recommendedResumeVersion.safeLabel,
      factSafetyStatus: input.stateItem.recommendedResumeVersion.factSafetyStatus,
      reviewRequired: resumeUpdateRequirements.length > 0,
      limitations: [
        ...(resume?.limitations || []),
        "Recommended ResumeVersion is reused from J003.01 and is not generated, copied, rewritten, or mutated.",
      ],
      resumeGenerated: false,
      resumeMutated: false,
      rawResumeTextVisible: false,
      privatePathVisible: false,
    },
    supportingCareerEvidence: supporting,
    relevantStrengths: uniqueSorted(supporting.map((evidence) => evidence.safePositioning)),
    missingSkills: missing,
    resumeUpdateRequirements,
    applicationReadiness: readiness.readiness,
    blockingIssues: readiness.blockingIssues,
    recommendedNextAction: nextActionFor(readiness.readiness),
    humanReviewRequired: true,
    deterministicRulesOnly: true,
    applicationCreated: false,
    applicationSubmitted: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    browserAutomationUsed: false,
    externalProviderCall: false,
    externalAiUsed: false,
    ollamaUsed: false,
    privatePathVisible: false,
    rawJobTextVisible: false,
    rawResumeTextVisible: false,
    sourceUrlVisibleInReadModel: false,
    limitations: [
      "Application package is private preparation output only.",
      "Human review is required before any manual application.",
      "No Application, resume, cover letter, message, provider action, browser action, external AI, or Ollama action is performed.",
      ...input.stateItem.limitations,
      ...(record?.limitations || []),
      ...(input.queueItem?.limitations || []),
    ],
  };
}

function readModelFor(pkg: ReadyToApplyApplicationPackage): ReadyToApplyApplicationPackageReadModelRecord {
  return {
    schemaVersion: READY_TO_APPLY_APPLICATION_PACKAGE_READ_MODEL_SCHEMA_VERSION,
    packageId: pkg.packageId,
    recommendationId: pkg.recommendationId,
    opportunityId: pkg.opportunityId,
    company: pkg.company,
    role: pkg.role,
    applicationReadiness: pkg.applicationReadiness,
    canonicalJobUrlKnown: Boolean(pkg.canonicalJobUrl),
    resumeVersionLabel: pkg.recommendedResumeVersion.safeLabel,
    resumeVersionStatus: pkg.recommendedResumeVersion.status,
    factSafetyStatus: pkg.recommendedResumeVersion.factSafetyStatus,
    supportingEvidenceCount: pkg.supportingCareerEvidence.length,
    missingSkillCount: pkg.missingSkills.length,
    blockingIssueCount: pkg.blockingIssues.length,
    resumeUpdateRequirementCount: pkg.resumeUpdateRequirements.length,
    recommendedNextAction: pkg.recommendedNextAction,
    humanReviewRequired: true,
    applicationCreated: false,
    applicationSubmitted: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    privatePathVisible: false,
    rawJobTextVisible: false,
    rawResumeTextVisible: false,
    sourceUrlVisible: false,
    limitations: [
      "Read model excludes canonical job URL value, private paths, raw job text, raw resume text, and execution controls.",
      ...pkg.limitations,
    ],
  };
}

export function buildReadyToApplyApplicationPackages(
  input: ReadyToApplyApplicationPackageInput,
): ReadyToApplyApplicationPackageResult {
  const recommendations = recommendationById(input.recommendationResult);
  const sources = sourceById(input.queueResult || null);
  const queueItems = queueItemById(input.queueResult || null);
  const readyItems = [...input.workflowState.applicationWorkspaceReadyToApply].sort(
    (left, right) =>
      left.company.localeCompare(right.company) ||
      left.role.localeCompare(right.role) ||
      left.recommendationId.localeCompare(right.recommendationId),
  );
  const packages = readyItems.map((stateItem) =>
    packageFor({
      generatedAt: input.generatedAt,
      stateItem,
      record: recommendations.get(stateItem.recommendationId) || null,
      sourceRecord: stateItem.sourceRecordId ? sources.get(stateItem.sourceRecordId) || null : null,
      queueItem: queueItems.get(stateItem.queueItemId) || null,
    }),
  );

  return {
    schemaVersion: READY_TO_APPLY_APPLICATION_PACKAGE_RESULT_SCHEMA_VERSION,
    workflowVersion: READY_TO_APPLY_APPLICATION_PACKAGE_VERSION,
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {
      workflowStateReused: true,
      recommendationReadModelReused: true,
      opportunityQueueReused: true,
      explainableFitReused: true,
      resumeVersionReused: true,
      careerEvidenceReused: true,
      recommendationLogicModified: false,
      discoveryModified: false,
      providerAdded: false,
    },
    packages,
    readModel: packages.map(readModelFor),
    summary: {
      readyToApplyItemsReviewed: readyItems.length,
      packagesCreated: packages.length,
      ready: packages.filter((pkg) => pkg.applicationReadiness === "READY").length,
      needsResumeReview: packages.filter((pkg) => pkg.applicationReadiness === "NEEDS_RESUME_REVIEW").length,
      needsEvidenceReview: packages.filter((pkg) => pkg.applicationReadiness === "NEEDS_EVIDENCE_REVIEW").length,
      blocked: packages.filter((pkg) => pkg.applicationReadiness === "BLOCKED").length,
      humanReviewRequired: true,
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
      noCareerEvidenceMutated: true,
      noCareerFactPromoted: true,
      privatePathVisible: false,
      rawJobTextVisible: false,
      rawResumeTextVisible: false,
    },
  };
}

export function writeReadyToApplyApplicationPackageOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: ReadyToApplyApplicationPackageResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private J003.04 Ready to Apply package output root");
  const runDirectory = path.join(input.outputRoot, `J003_04_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "application_packages.json": input.result.packages,
    "application_package_read_model.json": input.result.readModel,
    "ready_packages.json": input.result.packages.filter((pkg) => pkg.applicationReadiness === "READY"),
    "resume_review_required.json": input.result.packages.filter((pkg) => pkg.applicationReadiness === "NEEDS_RESUME_REVIEW"),
    "evidence_review_required.json": input.result.packages.filter((pkg) => pkg.applicationReadiness === "NEEDS_EVIDENCE_REVIEW"),
    "blocked_packages.json": input.result.packages.filter((pkg) => pkg.applicationReadiness === "BLOCKED"),
    "application_package_audit.json": input.result.auditSummary,
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

export function loadCareerWorkflowStateResultFile(filePath: string): CareerWorkflowStateResult {
  const record = readJson(filePath) as {
    workflowState?: CareerWorkflowStateResult;
    careerWorkflowState?: CareerWorkflowStateResult;
    result?: CareerWorkflowStateResult;
    applicationWorkspaceReadyToApply?: unknown;
    stateItems?: unknown;
  };
  if (record.workflowState) return record.workflowState;
  if (record.careerWorkflowState) return record.careerWorkflowState;
  if (record.result) return record.result;
  if (record.applicationWorkspaceReadyToApply && record.stateItems) return record as unknown as CareerWorkflowStateResult;
  throw new Error("Workflow state file must contain a full J003.03 CareerWorkflowStateResult.");
}

export function loadRecommendationResultFile(filePath: string): OpportunityRecommendationResult {
  return loadOpportunityRecommendationResultFile(filePath);
}

export function loadJobSourceQueueResultFile(filePath: string): PrivateJobSourceImportQueueResult {
  return loadQueueResultFile(filePath);
}

export function buildReadyToApplyPackageCliSummary(result: ReadyToApplyApplicationPackageResult, writtenCount = 0) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    readyToApplyItemsReviewed: result.summary.readyToApplyItemsReviewed,
    packagesCreated: result.summary.packagesCreated,
    ready: result.summary.ready,
    needsResumeReview: result.summary.needsResumeReview,
    needsEvidenceReview: result.summary.needsEvidenceReview,
    blocked: result.summary.blocked,
    humanReviewRequired: result.summary.humanReviewRequired,
    privateArtifactsWritten: writtenCount,
    noRecommendationLogicModified: result.auditSummary.noRecommendationLogicModified,
    noDiscoveryModified: result.auditSummary.noDiscoveryModified,
    noProviderAdded: result.auditSummary.noProviderAdded,
    noApplicationCreated: result.auditSummary.noApplicationCreated,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noResumeGenerated: result.auditSummary.noResumeGenerated,
    noResumeMutated: result.auditSummary.noResumeMutated,
    noCoverLetterGenerated: result.auditSummary.noCoverLetterGenerated,
    noMessageSent: result.auditSummary.noMessageSent,
    noExternalProviderCall: result.auditSummary.noExternalProviderCall,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
    privatePathVisible: false,
  };
}

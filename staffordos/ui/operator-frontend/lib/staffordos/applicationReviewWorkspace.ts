import { createHash } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import type {
  ApplicationPackageReadinessState,
  ReadyToApplyApplicationPackage,
  ReadyToApplyApplicationPackageResult,
} from "./readyToApplyApplicationPackage";

export const APPLICATION_REVIEW_WORKSPACE_VERSION = "J003.05";
export const APPLICATION_REVIEW_DECISION_SCHEMA_VERSION =
  "staffordos.job_search.private_application_review_decision.v1";
export const APPLICATION_REVIEW_WORKSPACE_ITEM_SCHEMA_VERSION =
  "staffordos.job_search.private_application_review_workspace_item.v1";
export const APPLICATION_REVIEW_WORKSPACE_RESULT_SCHEMA_VERSION =
  "staffordos.job_search.private_application_review_workspace_result.v1";
export const APPLICATION_REVIEW_WORKSPACE_READ_MODEL_SCHEMA_VERSION =
  "staffordos.job_search.private_application_review_workspace_read_model.v1";

export const APPLICATION_REVIEW_DECISIONS = [
  "REVIEWED_READY",
  "NEEDS_CHANGES",
  "HOLD",
  "CANCELLED",
] as const;

export type ApplicationReviewDecisionType = (typeof APPLICATION_REVIEW_DECISIONS)[number];

export const APPLICATION_REVIEW_STATES = [
  "PENDING_REVIEW",
  "MANUAL_APPLICATION_READY",
  "NEEDS_CHANGES",
  "HELD",
  "CANCELLED",
] as const;

export type ApplicationReviewState = (typeof APPLICATION_REVIEW_STATES)[number];

export type ApplicationReviewDecisionRecord = {
  schemaVersion: typeof APPLICATION_REVIEW_DECISION_SCHEMA_VERSION;
  workflowVersion: typeof APPLICATION_REVIEW_WORKSPACE_VERSION;
  decisionId: string;
  packageId: string;
  opportunityId: string | null;
  recommendationId: string;
  queueItemId: string;
  sourceRecordId: string | null;
  company: string;
  role: string;
  reviewDecision: ApplicationReviewDecisionType;
  reviewState: Exclude<ApplicationReviewState, "PENDING_REVIEW">;
  reviewedAt: string;
  operatorConfirmed: true;
  sourceAuthority: "ROSS_OPERATOR_REVIEW";
  sourceAuthorityReferences: {
    applicationPackageVersion: ReadyToApplyApplicationPackage["workflowVersion"];
    packageId: string;
    recommendationId: string;
    opportunityId: string | null;
    packageReadiness: ApplicationPackageReadinessState;
  };
  packageBlockingIssues: string[];
  reviewNotes: string | null;
  supersedesDecisionId: string | null;
  completionProof: string;
  manualApplicationReady: boolean;
  humanReviewRequiredBeforeExternalAction: true;
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
  limitations: string[];
};

export type ApplicationReviewWorkspaceItem = {
  schemaVersion: typeof APPLICATION_REVIEW_WORKSPACE_ITEM_SCHEMA_VERSION;
  packageId: string;
  opportunityId: string | null;
  recommendationId: string;
  queueItemId: string;
  sourceRecordId: string | null;
  company: string;
  role: string;
  canonicalJobUrl: string | null;
  recommendation: ReadyToApplyApplicationPackage["recommendationState"]["recommendation"];
  explainableFitSummary: ReadyToApplyApplicationPackage["explainableFitSummary"];
  recommendedResumeVersion: ReadyToApplyApplicationPackage["recommendedResumeVersion"];
  supportingCareerEvidence: ReadyToApplyApplicationPackage["supportingCareerEvidence"];
  relevantStrengths: string[];
  missingSkills: ReadyToApplyApplicationPackage["missingSkills"];
  resumeUpdateRequirements: string[];
  blockingIssues: string[];
  applicationReadiness: ApplicationPackageReadinessState;
  recommendedNextAction: string;
  humanReviewRequired: true;
  latestReviewDecision: {
    decisionId: string;
    reviewDecision: ApplicationReviewDecisionType;
    reviewedAt: string;
    reviewNotes: string | null;
  } | null;
  reviewState: ApplicationReviewState;
  manualApplicationReady: boolean;
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
  limitations: string[];
};

export type ApplicationReviewWorkspaceReadModelRecord = {
  schemaVersion: typeof APPLICATION_REVIEW_WORKSPACE_READ_MODEL_SCHEMA_VERSION;
  packageId: string;
  opportunityId: string | null;
  recommendationId: string;
  company: string;
  role: string;
  canonicalJobUrlKnown: boolean;
  recommendation: ReadyToApplyApplicationPackage["recommendationState"]["recommendation"];
  applicationReadiness: ApplicationPackageReadinessState;
  reviewState: ApplicationReviewState;
  latestReviewDecision: ApplicationReviewDecisionType | null;
  manualApplicationReady: boolean;
  resumeVersionLabel: string | null;
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

export type ApplicationReviewWorkspaceResult = {
  schemaVersion: typeof APPLICATION_REVIEW_WORKSPACE_RESULT_SCHEMA_VERSION;
  workflowVersion: typeof APPLICATION_REVIEW_WORKSPACE_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  sourceAuthority: {
    applicationPackageReused: true;
    workflowStateReused: true;
    recommendationReadModelReused: true;
    explainableFitReused: true;
    resumeVersionReused: true;
    careerEvidenceReused: true;
    packageLogicDuplicated: false;
    recommendationLogicModified: false;
    discoveryModified: false;
    providerAdded: false;
  };
  reviewDecisions: ApplicationReviewDecisionRecord[];
  workspaceItems: ApplicationReviewWorkspaceItem[];
  readModel: ApplicationReviewWorkspaceReadModelRecord[];
  summary: {
    packagesLoaded: number;
    reviewDecisionsRecorded: number;
    pendingReview: number;
    reviewedReady: number;
    needsChanges: number;
    hold: number;
    cancelled: number;
    manualApplicationReady: number;
    applicationsCreated: 0;
    applicationsSubmitted: 0;
    resumesGenerated: 0;
    resumesMutated: 0;
    messagesSent: 0;
  };
  auditSummary: {
    noPackageLogicDuplicated: true;
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

function reviewDecisionType(value: unknown): ApplicationReviewDecisionType {
  if (typeof value === "string" && APPLICATION_REVIEW_DECISIONS.includes(value as ApplicationReviewDecisionType)) {
    return value as ApplicationReviewDecisionType;
  }
  throw new Error(`Unsupported application review decision: ${String(value)}`);
}

function reviewStateFor(decision: ApplicationReviewDecisionType): Exclude<ApplicationReviewState, "PENDING_REVIEW"> {
  if (decision === "REVIEWED_READY") return "MANUAL_APPLICATION_READY";
  if (decision === "NEEDS_CHANGES") return "NEEDS_CHANGES";
  if (decision === "HOLD") return "HELD";
  return "CANCELLED";
}

function completionProofFor(decision: ApplicationReviewDecisionType) {
  if (decision === "REVIEWED_READY") {
    return "Ross reviewed the private package and marked it ready for manual application outside StaffordOS.";
  }
  if (decision === "NEEDS_CHANGES") {
    return "Ross reviewed the private package and recorded that changes are required before manual application.";
  }
  if (decision === "HOLD") {
    return "Ross reviewed the private package and deferred manual application.";
  }
  return "Ross reviewed the private package and cancelled this application-preparation path.";
}

function sortedDecisions(decisions: readonly ApplicationReviewDecisionRecord[]) {
  return [...decisions].sort(
    (left, right) =>
      left.packageId.localeCompare(right.packageId) ||
      left.reviewedAt.localeCompare(right.reviewedAt) ||
      left.decisionId.localeCompare(right.decisionId),
  );
}

function latestDecisionByPackage(decisions: readonly ApplicationReviewDecisionRecord[]) {
  const latest = new Map<string, ApplicationReviewDecisionRecord>();
  for (const decision of sortedDecisions(decisions)) {
    latest.set(decision.packageId, decision);
  }
  return latest;
}

function packageById(result: ReadyToApplyApplicationPackageResult) {
  return new Map(result.packages.map((pkg) => [pkg.packageId, pkg]));
}

function assertDecisionMatchesPackage(decision: ApplicationReviewDecisionRecord, pkg: ReadyToApplyApplicationPackage) {
  if (decision.recommendationId !== pkg.recommendationId || decision.queueItemId !== pkg.queueItemId) {
    throw new Error(`Review decision ${decision.decisionId} does not match its source package.`);
  }
  if (decision.company !== pkg.company || decision.role !== pkg.role) {
    throw new Error(`Review decision ${decision.decisionId} does not match the package company and role.`);
  }
  if (decision.manualApplicationReady && decision.reviewDecision !== "REVIEWED_READY") {
    throw new Error(`Review decision ${decision.decisionId} has an invalid manual-application-ready state.`);
  }
  if (decision.reviewDecision === "REVIEWED_READY" && pkg.applicationReadiness !== "READY") {
    throw new Error("REVIEWED_READY requires a READY application package.");
  }
}

function assertDecisionsReferencePackages(
  packageResult: ReadyToApplyApplicationPackageResult,
  decisions: readonly ApplicationReviewDecisionRecord[],
) {
  const packages = packageById(packageResult);
  for (const decision of decisions) {
    reviewDecisionType(decision.reviewDecision);
    const pkg = packages.get(decision.packageId);
    if (!pkg) throw new Error(`Review decision ${decision.decisionId} references an unknown application package.`);
    assertDecisionMatchesPackage(decision, pkg);
  }
}

export function buildApplicationReviewDecision(input: {
  packageResult: ReadyToApplyApplicationPackageResult;
  packageId: string;
  reviewDecision: ApplicationReviewDecisionType;
  reviewedAt: string;
  operatorConfirmed: boolean;
  reviewNotes?: string | null;
  existingDecisions?: readonly ApplicationReviewDecisionRecord[];
}): ApplicationReviewDecisionRecord {
  if (input.operatorConfirmed !== true) {
    throw new Error("Application package review requires explicit Ross operator confirmation.");
  }
  const parsedDecision = reviewDecisionType(input.reviewDecision);
  const pkg = packageById(input.packageResult).get(input.packageId);
  if (!pkg) throw new Error("Application package not found.");
  const existingDecisions = [...(input.existingDecisions || [])];
  assertDecisionsReferencePackages(input.packageResult, existingDecisions);
  if (parsedDecision === "REVIEWED_READY" && pkg.applicationReadiness !== "READY") {
    throw new Error("REVIEWED_READY requires a READY application package.");
  }
  const latest = latestDecisionByPackage(existingDecisions).get(pkg.packageId) || null;
  const reviewState = reviewStateFor(parsedDecision);
  const notes = typeof input.reviewNotes === "string" && input.reviewNotes.trim() ? input.reviewNotes.trim() : null;

  return {
    schemaVersion: APPLICATION_REVIEW_DECISION_SCHEMA_VERSION,
    workflowVersion: APPLICATION_REVIEW_WORKSPACE_VERSION,
    decisionId: opaqueId("privapplicationreviewdecision", [
      APPLICATION_REVIEW_WORKSPACE_VERSION,
      pkg.packageId,
      parsedDecision,
      input.reviewedAt,
      notes,
    ]),
    packageId: pkg.packageId,
    opportunityId: pkg.opportunityId,
    recommendationId: pkg.recommendationId,
    queueItemId: pkg.queueItemId,
    sourceRecordId: pkg.sourceRecordId,
    company: pkg.company,
    role: pkg.role,
    reviewDecision: parsedDecision,
    reviewState,
    reviewedAt: input.reviewedAt,
    operatorConfirmed: true,
    sourceAuthority: "ROSS_OPERATOR_REVIEW",
    sourceAuthorityReferences: {
      applicationPackageVersion: pkg.workflowVersion,
      packageId: pkg.packageId,
      recommendationId: pkg.recommendationId,
      opportunityId: pkg.opportunityId,
      packageReadiness: pkg.applicationReadiness,
    },
    packageBlockingIssues: [...pkg.blockingIssues],
    reviewNotes: notes,
    supersedesDecisionId: latest?.decisionId || null,
    completionProof: completionProofFor(parsedDecision),
    manualApplicationReady: parsedDecision === "REVIEWED_READY",
    humanReviewRequiredBeforeExternalAction: true,
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
    limitations: [
      "Application review decision records human disposition of an existing J003.04 package only.",
      "REVIEWED_READY means ready for Ross's manual application activity; it does not submit anything.",
      "No Application, resume, cover letter, message, provider action, browser action, external AI, or Ollama action is performed.",
      ...pkg.limitations,
    ],
  };
}

function workspaceItemFor(
  pkg: ReadyToApplyApplicationPackage,
  latestDecision: ApplicationReviewDecisionRecord | null,
): ApplicationReviewWorkspaceItem {
  const reviewState = latestDecision?.reviewState || "PENDING_REVIEW";
  return {
    schemaVersion: APPLICATION_REVIEW_WORKSPACE_ITEM_SCHEMA_VERSION,
    packageId: pkg.packageId,
    opportunityId: pkg.opportunityId,
    recommendationId: pkg.recommendationId,
    queueItemId: pkg.queueItemId,
    sourceRecordId: pkg.sourceRecordId,
    company: pkg.company,
    role: pkg.role,
    canonicalJobUrl: pkg.canonicalJobUrl,
    recommendation: pkg.recommendationState.recommendation,
    explainableFitSummary: pkg.explainableFitSummary,
    recommendedResumeVersion: pkg.recommendedResumeVersion,
    supportingCareerEvidence: pkg.supportingCareerEvidence,
    relevantStrengths: [...pkg.relevantStrengths],
    missingSkills: pkg.missingSkills,
    resumeUpdateRequirements: [...pkg.resumeUpdateRequirements],
    blockingIssues: [...pkg.blockingIssues],
    applicationReadiness: pkg.applicationReadiness,
    recommendedNextAction: latestDecision?.completionProof || pkg.recommendedNextAction,
    humanReviewRequired: true,
    latestReviewDecision: latestDecision
      ? {
          decisionId: latestDecision.decisionId,
          reviewDecision: latestDecision.reviewDecision,
          reviewedAt: latestDecision.reviewedAt,
          reviewNotes: latestDecision.reviewNotes,
        }
      : null,
    reviewState,
    manualApplicationReady: reviewState === "MANUAL_APPLICATION_READY" && pkg.applicationReadiness === "READY",
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
    limitations: [
      "Review workspace displays existing J003.04 package content for owner-private human review.",
      "Manual application ready does not mean submitted.",
      ...pkg.limitations,
      ...(latestDecision?.limitations || []),
    ],
  };
}

function readModelFor(item: ApplicationReviewWorkspaceItem): ApplicationReviewWorkspaceReadModelRecord {
  return {
    schemaVersion: APPLICATION_REVIEW_WORKSPACE_READ_MODEL_SCHEMA_VERSION,
    packageId: item.packageId,
    opportunityId: item.opportunityId,
    recommendationId: item.recommendationId,
    company: item.company,
    role: item.role,
    canonicalJobUrlKnown: Boolean(item.canonicalJobUrl),
    recommendation: item.recommendation,
    applicationReadiness: item.applicationReadiness,
    reviewState: item.reviewState,
    latestReviewDecision: item.latestReviewDecision?.reviewDecision || null,
    manualApplicationReady: item.manualApplicationReady,
    resumeVersionLabel: item.recommendedResumeVersion.safeLabel,
    factSafetyStatus: item.recommendedResumeVersion.factSafetyStatus,
    supportingEvidenceCount: item.supportingCareerEvidence.length,
    missingSkillCount: item.missingSkills.length,
    blockingIssueCount: item.blockingIssues.length,
    resumeUpdateRequirementCount: item.resumeUpdateRequirements.length,
    recommendedNextAction: item.recommendedNextAction,
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
      "Read model excludes canonical job URL value, raw job text, raw resume text, private paths, and execution controls.",
      ...item.limitations,
    ],
  };
}

export function buildApplicationReviewWorkspace(input: {
  generatedAt: string;
  packageResult: ReadyToApplyApplicationPackageResult;
  reviewDecisions?: readonly ApplicationReviewDecisionRecord[];
}): ApplicationReviewWorkspaceResult {
  const decisions = sortedDecisions(input.reviewDecisions || []);
  assertDecisionsReferencePackages(input.packageResult, decisions);
  const latest = latestDecisionByPackage(decisions);
  const workspaceItems = [...input.packageResult.packages]
    .sort(
      (left, right) =>
        left.company.localeCompare(right.company) ||
        left.role.localeCompare(right.role) ||
        left.packageId.localeCompare(right.packageId),
    )
    .map((pkg) => workspaceItemFor(pkg, latest.get(pkg.packageId) || null));

  return {
    schemaVersion: APPLICATION_REVIEW_WORKSPACE_RESULT_SCHEMA_VERSION,
    workflowVersion: APPLICATION_REVIEW_WORKSPACE_VERSION,
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {
      applicationPackageReused: true,
      workflowStateReused: true,
      recommendationReadModelReused: true,
      explainableFitReused: true,
      resumeVersionReused: true,
      careerEvidenceReused: true,
      packageLogicDuplicated: false,
      recommendationLogicModified: false,
      discoveryModified: false,
      providerAdded: false,
    },
    reviewDecisions: decisions,
    workspaceItems,
    readModel: workspaceItems.map(readModelFor),
    summary: {
      packagesLoaded: workspaceItems.length,
      reviewDecisionsRecorded: decisions.length,
      pendingReview: workspaceItems.filter((item) => item.reviewState === "PENDING_REVIEW").length,
      reviewedReady: workspaceItems.filter((item) => item.reviewState === "MANUAL_APPLICATION_READY").length,
      needsChanges: workspaceItems.filter((item) => item.reviewState === "NEEDS_CHANGES").length,
      hold: workspaceItems.filter((item) => item.reviewState === "HELD").length,
      cancelled: workspaceItems.filter((item) => item.reviewState === "CANCELLED").length,
      manualApplicationReady: workspaceItems.filter((item) => item.manualApplicationReady).length,
      applicationsCreated: 0,
      applicationsSubmitted: 0,
      resumesGenerated: 0,
      resumesMutated: 0,
      messagesSent: 0,
    },
    auditSummary: {
      noPackageLogicDuplicated: true,
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

export function writeApplicationReviewDecision(input: {
  decisionRoot: string;
  repositoryRoot: string;
  decision: ApplicationReviewDecisionRecord;
}) {
  assertOutsideRepository(input.decisionRoot, input.repositoryRoot, "Private J003.05 application review decision root");
  ensurePrivateDirectory(input.decisionRoot);
  const decisionLog = path.join(input.decisionRoot, "application_review_decisions.ndjson");
  appendFileSync(decisionLog, `${JSON.stringify(input.decision)}\n`, { encoding: "utf8", mode: 0o600 });
  chmodSync(decisionLog, 0o600);
  return {
    artifactName: "application_review_decisions.ndjson",
    decisionId: input.decision.decisionId,
    privatePathVisible: false as const,
  };
}

export function writeApplicationReviewWorkspaceOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: ApplicationReviewWorkspaceResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private J003.05 application review workspace output root");
  const runDirectory = path.join(input.outputRoot, `J003_05_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "application_review_workspace.json": input.result.workspaceItems,
    "application_review_read_model.json": input.result.readModel,
    "manual_application_ready.json": input.result.workspaceItems.filter((item) => item.manualApplicationReady),
    "pending_review.json": input.result.workspaceItems.filter((item) => item.reviewState === "PENDING_REVIEW"),
    "needs_changes.json": input.result.workspaceItems.filter((item) => item.reviewState === "NEEDS_CHANGES"),
    "held_packages.json": input.result.workspaceItems.filter((item) => item.reviewState === "HELD"),
    "cancelled_packages.json": input.result.workspaceItems.filter((item) => item.reviewState === "CANCELLED"),
    "application_review_decisions.json": input.result.reviewDecisions,
    "application_review_audit.json": input.result.auditSummary,
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

export function loadApplicationPackageResultFile(filePath: string): ReadyToApplyApplicationPackageResult {
  const record = readJson(filePath) as {
    readyToApplyApplicationPackageResult?: ReadyToApplyApplicationPackageResult;
    applicationPackageResult?: ReadyToApplyApplicationPackageResult;
    result?: ReadyToApplyApplicationPackageResult;
    packages?: unknown;
    readModel?: unknown;
  };
  if (record.readyToApplyApplicationPackageResult) return record.readyToApplyApplicationPackageResult;
  if (record.applicationPackageResult) return record.applicationPackageResult;
  if (record.result) return record.result;
  if (record.packages && record.readModel) return record as unknown as ReadyToApplyApplicationPackageResult;
  throw new Error("Package file must contain a full J003.04 ReadyToApplyApplicationPackageResult.");
}

export function loadApplicationReviewDecisionsFile(filePath: string): ApplicationReviewDecisionRecord[] {
  if (!existsSync(filePath)) return [];
  const source = readFileSync(filePath, "utf8").trim();
  if (!source) return [];
  if (filePath.endsWith(".ndjson")) {
    return source
      .split(/\n+/)
      .map((line) => JSON.parse(line) as ApplicationReviewDecisionRecord);
  }
  const record = JSON.parse(source) as unknown;
  if (Array.isArray(record)) return record as ApplicationReviewDecisionRecord[];
  const object = record as {
    reviewDecisions?: ApplicationReviewDecisionRecord[];
    decisions?: ApplicationReviewDecisionRecord[];
    result?: { reviewDecisions?: ApplicationReviewDecisionRecord[] };
  };
  return object.reviewDecisions || object.decisions || object.result?.reviewDecisions || [];
}

export function buildApplicationReviewWorkspaceCliSummary(input: {
  result: ApplicationReviewWorkspaceResult;
  decisionWritten?: ApplicationReviewDecisionRecord | null;
  privateArtifactsWritten?: number;
}) {
  return {
    workflowVersion: input.result.workflowVersion,
    generatedAt: input.result.generatedAt,
    packagesLoaded: input.result.summary.packagesLoaded,
    reviewDecisionsRecorded: input.result.summary.reviewDecisionsRecorded,
    pendingReview: input.result.summary.pendingReview,
    reviewedReady: input.result.summary.reviewedReady,
    needsChanges: input.result.summary.needsChanges,
    hold: input.result.summary.hold,
    cancelled: input.result.summary.cancelled,
    manualApplicationReady: input.result.summary.manualApplicationReady,
    decisionWritten: input.decisionWritten
      ? {
          decisionId: input.decisionWritten.decisionId,
          packageId: input.decisionWritten.packageId,
          opportunityId: input.decisionWritten.opportunityId,
          reviewDecision: input.decisionWritten.reviewDecision,
          reviewState: input.decisionWritten.reviewState,
          manualApplicationReady: input.decisionWritten.manualApplicationReady,
        }
      : null,
    privateArtifactsWritten: input.privateArtifactsWritten || 0,
    noPackageLogicDuplicated: input.result.auditSummary.noPackageLogicDuplicated,
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

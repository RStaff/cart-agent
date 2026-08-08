import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import * as path from "node:path";
import type { PrivateApplicationRecord } from "./manualApplicationEventTracking";
import type { PrivateApplicationPipelineStore } from "./privateApplicationPipelineReview";
import {
  RESUME_ASSET_RECONCILIATION_VERSION,
  type ApplicationLinkageReadiness,
  type PrivateApplicationLinkageReadinessRecord,
  type PrivateExactDuplicateGroupRecord,
  type PrivateFormatDerivativeGroupRecord,
  type PrivateLikelyVersionFamilyRecord,
  type PrivateResumeAssetSourceRecord,
  type PrivateResumeLibraryHealth,
  type PrivateResumeOperatorReviewQueueItem,
  type PrivateResumeSourceIntegrityRecord,
  type PrivateResumeVersionReconciliationRecord,
} from "./resumeAssetReconciliation";
import type { PrivateResumeSourceRecord, PrivateResumeVersionRecord } from "./resumeVersionApplicationLinkage";

export const RESUME_REVIEW_QUEUE_RESOLUTION_VERSION = "J001.06C";
export const RESUME_REVIEW_QUEUE_RESOLUTION_SCHEMA_VERSION =
  "staffordos.job_search.private_resume_review_queue_resolution.v1";
export const RESUME_REVIEW_DECISION_SCHEMA_VERSION =
  "staffordos.job_search.private_resume_review_decision.v1";

export const REVIEW_REASONS = [
  "DUPLICATE_SOURCE_ALIAS",
  "LIKELY_VERSION_FAMILY",
  "MULTIPLE_ROLE_TARGETED_CANDIDATES",
  "FILENAME_VARIATION",
  "TIMESTAMP_AMBIGUITY",
  "SOURCE_NOT_PRESENT",
  "ROLE_CONTEXT_AMBIGUITY",
  "MULTIPLE_FORMATS",
  "INSUFFICIENT_METADATA",
  "OTHER",
] as const;

export const CANDIDATE_ELIMINATION_REASONS = [
  "ROLE_MISMATCH",
  "COMPANY_TARGET_MISMATCH",
  "DATE_AFTER_APPLICATION",
  "DUPLICATE_ALIAS_OF_OTHER_CANDIDATE",
  "DOCUMENT_NOT_RESUME",
  "COVER_LETTER",
  "SOURCE_MISSING",
  "EXACT_DIGEST_ALREADY_REPRESENTED",
  "OTHER_DETERMINISTIC_CONFLICT",
] as const;

export const REVIEW_DECISION_TYPES = [
  "CANDIDATE_PREFERRED",
  "CANDIDATE_REJECTED",
  "UNKNOWN",
  "DEFER",
  "SOURCE_MISSING_CONFIRMED",
] as const;

export type ReviewReason = (typeof REVIEW_REASONS)[number];
export type CandidateEliminationReason = (typeof CANDIDATE_ELIMINATION_REASONS)[number];
export type ReviewDecisionType = (typeof REVIEW_DECISION_TYPES)[number];
export type SourceGapClassification = "CONFIRMED_SOURCE_GAP" | "POSSIBLE_EXISTING_VARIANT" | "NOT_SOURCE_GAP";
export type ResolvedApplicationReadiness =
  | "EXACT_SOURCE_READY"
  | "SINGLE_CANDIDATE_NEEDS_OPERATOR_CONFIRMATION"
  | "MULTIPLE_CANDIDATES"
  | "SOURCE_NOT_PRESENT"
  | "UNRESOLVED";
export type LikelyVersionMemberClassification =
  | "OLDER_VARIANT"
  | "NEWER_VARIANT"
  | "ROLE_TARGETED_VARIANT"
  | "GENERAL_VARIANT"
  | "FORMAT_VARIANT"
  | "UNRESOLVED_FAMILY";

export type ResumeAssetReconciliationArtifacts = {
  sourceInventory: PrivateResumeSourceRecord[];
  assetCompatibleSources: PrivateResumeAssetSourceRecord[];
  resumeVersions: PrivateResumeVersionRecord[];
  resumeVersionReconciliation: PrivateResumeVersionReconciliationRecord[];
  exactDuplicateGroups: PrivateExactDuplicateGroupRecord[];
  formatDerivativeGroups: PrivateFormatDerivativeGroupRecord[];
  likelyVersionFamilies: PrivateLikelyVersionFamilyRecord[];
  sourceIntegrity: PrivateResumeSourceIntegrityRecord[];
  resumeLibraryHealth: PrivateResumeLibraryHealth;
  operatorReviewQueue: PrivateResumeOperatorReviewQueueItem[];
  applicationLinkageReadiness: PrivateApplicationLinkageReadinessRecord[];
  auditSummary: Record<string, unknown>;
  runDirectory: string | null;
};

export type PrivateResumeReviewCandidate = {
  resumeVersionId: string;
  safeLabel: string;
  originalFilename: string;
  normalizedFilenameStem: string;
  documentFormat: string;
  digestPrefix: string;
  observedDate: string;
  modifiedDate: string | null;
  purpose: PrivateResumeVersionRecord["purpose"];
  targetRoleFamily: string | null;
  roleTokenMatches: string[];
  companyTokenMatches: string[];
  exactOriginalFilenameMatch: boolean;
  normalizedFilenameMatch: boolean;
  exactDuplicateGroupIds: string[];
  likelyVersionFamilyIds: string[];
  eliminated: boolean;
  eliminationReason: CandidateEliminationReason | null;
  reasonCandidateRemains: string;
  privatePathVisible: false;
};

export type PrivateResumeCandidateEliminationRecord = {
  applicationId: string;
  resumeVersionId: string | null;
  reason: CandidateEliminationReason;
  explanation: string;
  deterministic: true;
  subjectiveQualityUsed: false;
};

export type PrivateResumeDuplicateCollapseRecord = {
  collapseId: string;
  applicationId: string | null;
  canonicalResumeVersionId: string;
  duplicateGroupId: string;
  sourceAliasCount: number;
  collapsedForOperatorDisplay: true;
  sourceHistoryPreserved: true;
  sourceFilesDeleted: false;
  limitations: string[];
};

export type PrivateLikelyVersionFamilyAnalysis = {
  familyId: string;
  resumeVersionIds: string[];
  memberClassifications: Array<{
    resumeVersionId: string;
    classification: LikelyVersionMemberClassification;
    basis: string;
  }>;
  sourceChronologySupported: boolean;
  semanticSuperiorityInferred: false;
  supersessionCreated: false;
  limitations: string[];
};

export type PrivateSourceGapRecord = {
  applicationId: string;
  classification: SourceGapClassification;
  exactOriginalFilenameMatchExists: boolean;
  normalizedFilenameMatchExists: boolean;
  digestBackedSourceExists: boolean;
  roleCompanyTargetedSourceExists: boolean;
  duplicateAliasResolves: boolean;
  operatorAction: "SOURCE_DOCUMENT_NEEDED" | "NONE";
  futureImportRequiresRossAuthorization: true;
  privatePathVisible: false;
  limitations: string[];
};

export type PrivateResumeReviewExplanation = {
  reviewItemId: string;
  applicationId: string | null;
  reasons: ReviewReason[];
  candidateSafeLabels: string[];
  knownEvidence: string[];
  unknownEvidence: string[];
  eliminatedCandidates: PrivateResumeCandidateEliminationRecord[];
  remainingCandidates: PrivateResumeReviewCandidate[];
  operatorQuestion: string;
  limitations: string[];
  privatePathVisible: false;
  rawResumeContentVisible: false;
};

export type PrivateApplicationResumeReadinessResolution = {
  applicationId: string;
  previousReadiness: ApplicationLinkageReadiness;
  readiness: ResolvedApplicationReadiness;
  reviewItemId: string;
  reasons: ReviewReason[];
  knownHistoricalResumeReference: "PRESENT" | "UNKNOWN";
  exactOriginalFilenameMatchExists: boolean;
  normalizedFilenameMatchExists: boolean;
  duplicateAliasesCollapsed: number;
  eliminatedCandidates: PrivateResumeCandidateEliminationRecord[];
  remainingCandidates: PrivateResumeReviewCandidate[];
  operatorQuestion: string;
  applicationResumeLinkCreated: false;
  usedForSubmissionCreated: false;
  existingUnknownDecisionChanged: false;
  limitations: string[];
  privatePathVisible: false;
};

export type PrivateResumeReviewDecision = {
  schemaVersion: typeof RESUME_REVIEW_DECISION_SCHEMA_VERSION;
  decisionId: string;
  workspaceId: "professional";
  applicationId: string | null;
  reviewItemId: string | null;
  decisionType: ReviewDecisionType;
  selectedResumeVersionId: string | null;
  rejectedResumeVersionIds: string[];
  operatorConfirmed: true;
  createdAt: string;
  sourceAuthority: "ROSS_OPERATOR_REVIEW_DECISION";
  privacy: "Professional owner-private";
  applicationResumeLinkCreated: false;
  usedForSubmissionCreated: false;
  importCreated: false;
  limitations: string[];
};

export type ResumeReviewQueueResolutionResult = {
  schemaVersion: typeof RESUME_REVIEW_QUEUE_RESOLUTION_SCHEMA_VERSION;
  workflowVersion: typeof RESUME_REVIEW_QUEUE_RESOLUTION_VERSION;
  generatedAt: string;
  sourceWorkflowVersion: typeof RESUME_ASSET_RECONCILIATION_VERSION;
  loadedAuthority: {
    sourceRecords: number;
    resumeVersions: number;
    exactDuplicateGroups: number;
    likelyVersionFamilies: number;
    operatorReviewQueueItems: number;
    applicationReadinessRecords: number;
    privatePathVisible: false;
  };
  reviewQueueExplanations: PrivateResumeReviewExplanation[];
  applicationReadiness: PrivateApplicationResumeReadinessResolution[];
  duplicateCollapse: PrivateResumeDuplicateCollapseRecord[];
  likelyVersionFamilyAnalysis: PrivateLikelyVersionFamilyAnalysis[];
  candidateEliminations: PrivateResumeCandidateEliminationRecord[];
  sourceGapRecords: PrivateSourceGapRecord[];
  operatorDecisions: PrivateResumeReviewDecision[];
  regeneratedApplicationLinkageReadiness: Array<{
    applicationId: string;
    readiness: ResolvedApplicationReadiness | "CONFIRMED_SOURCE_GAP";
    candidateResumeVersionIds: string[];
    candidateSafeLabels: string[];
    reason: string;
    applicationResumeLinkCreated: false;
    usedForSubmissionCreated: false;
    existingUnknownDecisionChanged: false;
    privatePathVisible: false;
    limitations: string[];
  }>;
  auditSummary: {
    multipleCandidatesBefore: number;
    sourceNotPresentBefore: number;
    exactSourceReadyBefore: number;
    singleCandidateAfter: number;
    multipleCandidatesAfter: number;
    sourceNotPresentAfter: number;
    confirmedSourceGaps: number;
    exactSourceReadyAfter: number;
    operatorDecisionsLoaded: number;
    operatorDecisionsApplied: number;
    applicationResumeLinksCreated: 0;
    usedForSubmissionLinksCreated: 0;
    resumeLinkConfirmedEventsCreated: 0;
    noOutsideDirectoryScan: true;
    noNewestFileWins: true;
    noFilenameOnlySubmissionProof: true;
    noRoleTargetSubmissionProof: true;
    noResumeGenerated: true;
    noResumeMutated: true;
    noApplicationSubmitted: true;
    noMessageSent: true;
    noCareerFactPromoted: true;
    noExternalProviderCall: true;
    noExternalAi: true;
    noOllama: true;
    noOsConnection: true;
    noOperatorRouteCreated: true;
    privatePathVisibleInNormalOutput: false;
  };
};

type AnyRecord = Record<string, unknown>;

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

function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function appendNdjson(filePath: string, value: unknown) {
  ensurePrivateDirectory(path.dirname(filePath));
  writeFileSync(filePath, `${JSON.stringify(value)}\n`, { encoding: "utf8", flag: "a" });
  chmodSync(filePath, 0o600);
}

function latestRunDirectory(root: string, prefix: string) {
  if (!existsSync(root)) return null;
  const entries = readdirSync(root)
    .map((name) => path.join(root, name))
    .filter((entryPath) => {
      try {
        return path.basename(entryPath).startsWith(prefix) && statSync(entryPath).isDirectory();
      } catch {
        return false;
      }
    })
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  return entries[0] || null;
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function loadLatestResumeAssetReconciliationArtifacts(options: {
  reconciliationRoot: string;
  repositoryRoot: string;
}): ResumeAssetReconciliationArtifacts {
  assertOutsideRepository(options.reconciliationRoot, options.repositoryRoot, "Private J001.06B reconciliation root");
  const runDirectory = latestRunDirectory(options.reconciliationRoot, "j001_06b_");
  if (!runDirectory) {
    throw new Error("No private J001.06B reconciliation run was found.");
  }
  const read = <T>(name: string, fallback: T): T => {
    const filePath = path.join(runDirectory, name);
    return existsSync(filePath) ? readJson<T>(filePath) : fallback;
  };
  return {
    sourceInventory: read("resume_source_inventory.json", [] as PrivateResumeSourceRecord[]),
    assetCompatibleSources: read("asset_compatible_source_records.json", [] as PrivateResumeAssetSourceRecord[]),
    resumeVersions: read("resume_versions.json", [] as PrivateResumeVersionRecord[]),
    resumeVersionReconciliation: read(
      "resume_version_reconciliation.json",
      [] as PrivateResumeVersionReconciliationRecord[],
    ),
    exactDuplicateGroups: read("exact_duplicate_groups.json", [] as PrivateExactDuplicateGroupRecord[]),
    formatDerivativeGroups: read("format_derivative_groups.json", [] as PrivateFormatDerivativeGroupRecord[]),
    likelyVersionFamilies: read("likely_version_families.json", [] as PrivateLikelyVersionFamilyRecord[]),
    sourceIntegrity: read("source_integrity.json", [] as PrivateResumeSourceIntegrityRecord[]),
    resumeLibraryHealth: read("resume_library_health.json", {} as PrivateResumeLibraryHealth),
    operatorReviewQueue: read("operator_review_queue.json", [] as PrivateResumeOperatorReviewQueueItem[]),
    applicationLinkageReadiness: read(
      "application_linkage_readiness.json",
      [] as PrivateApplicationLinkageReadinessRecord[],
    ),
    auditSummary: read("processing_audit_summary.json", {} as Record<string, unknown>),
    runDirectory,
  };
}

export function loadResumeReviewDecisions(options: {
  decisionRoot: string;
  repositoryRoot: string;
}): PrivateResumeReviewDecision[] {
  if (!existsSync(options.decisionRoot)) return [];
  assertOutsideRepository(options.decisionRoot, options.repositoryRoot, "Private resume review decision root");
  const decisions: PrivateResumeReviewDecision[] = [];
  for (const entry of readdirSync(options.decisionRoot).sort()) {
    if (!entry.endsWith(".ndjson")) continue;
    const filePath = path.join(options.decisionRoot, entry);
    const lines = readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as AnyRecord;
        if (parsed.schemaVersion === RESUME_REVIEW_DECISION_SCHEMA_VERSION && parsed.operatorConfirmed === true) {
          decisions.push(parsed as PrivateResumeReviewDecision);
        }
      } catch {
        continue;
      }
    }
  }
  return decisions;
}

export function appendResumeReviewDecision(options: {
  decisionRoot: string;
  repositoryRoot: string;
  decision: PrivateResumeReviewDecision;
}) {
  assertOutsideRepository(options.decisionRoot, options.repositoryRoot, "Private resume review decision root");
  appendNdjson(path.join(options.decisionRoot, "resume_review_decisions.ndjson"), options.decision);
  return { written: true as const, privatePathVisible: false as const };
}

function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizedFilenameStem(filename: string | null | undefined) {
  if (!filename) return "";
  return normalizeText(path.basename(filename, path.extname(filename)))
    .replace(/\b(copy|final|v\d+|version|resume|cv|draft)\b/g, "")
    .replace(/\b20\d{2}[-_ ]?\d{0,2}[-_ ]?\d{0,2}\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenSet(value: string | null | undefined) {
  const stop = new Set(["and", "the", "for", "with", "resume", "final", "manager", "director", "associate"]);
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !stop.has(token));
}

function datePart(value: string | null | undefined) {
  if (!value) return null;
  const candidate = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}

function dateAfter(left: string | null, right: string | null) {
  if (!left || !right) return false;
  return new Date(`${left}T12:00:00Z`).getTime() > new Date(`${right}T12:00:00Z`).getTime();
}

function applicationById(store: PrivateApplicationPipelineStore) {
  return new Map(store.applications.map((application) => [application.applicationId, application]));
}

function sourceById(artifacts: ResumeAssetReconciliationArtifacts) {
  return new Map(artifacts.sourceInventory.map((source) => [source.privateSourceId, source]));
}

function versionById(artifacts: ResumeAssetReconciliationArtifacts) {
  return new Map(artifacts.resumeVersions.map((version) => [version.resumeVersionId, version]));
}

function duplicateGroupsByVersion(artifacts: ResumeAssetReconciliationArtifacts) {
  const groups = new Map<string, PrivateExactDuplicateGroupRecord[]>();
  for (const group of artifacts.exactDuplicateGroups) {
    for (const resumeVersionId of group.memberResumeVersionIds) {
      groups.set(resumeVersionId, [...(groups.get(resumeVersionId) || []), group]);
    }
    groups.set(group.canonicalResumeVersionId, [...(groups.get(group.canonicalResumeVersionId) || []), group]);
  }
  return groups;
}

function likelyFamiliesByVersion(artifacts: ResumeAssetReconciliationArtifacts) {
  const families = new Map<string, PrivateLikelyVersionFamilyRecord[]>();
  for (const family of artifacts.likelyVersionFamilies) {
    for (const resumeVersionId of family.resumeVersionIds) {
      families.set(resumeVersionId, [...(families.get(resumeVersionId) || []), family]);
    }
  }
  return families;
}

function safeResumeLabel(version: PrivateResumeVersionRecord) {
  return `${version.purpose} / ${version.documentFormat} / ${version.factSafetyStatus} / ${version.contentDigest.slice(0, 10)} / ${version.observedAt.slice(0, 10)}`;
}

function candidateFor(input: {
  application: PrivateApplicationRecord | null;
  version: PrivateResumeVersionRecord;
  artifacts: ResumeAssetReconciliationArtifacts;
  submittedDate: string | null;
}): PrivateResumeReviewCandidate {
  const duplicateGroups = duplicateGroupsByVersion(input.artifacts).get(input.version.resumeVersionId) || [];
  const likelyFamilies = likelyFamiliesByVersion(input.artifacts).get(input.version.resumeVersionId) || [];
  const legacyFilename = input.application?.resumeReference?.filename || null;
  const versionStem = normalizedFilenameStem(input.version.originalFilename);
  const legacyStem = normalizedFilenameStem(legacyFilename);
  const roleTokens = tokenSet(input.application?.roleReference?.title || "");
  const companyTokens = tokenSet(input.application?.companyReference?.label || "");
  const versionTokens = new Set(tokenSet(`${input.version.originalFilename} ${input.version.targetRoleFamily || ""} ${input.version.purpose}`));
  const roleTokenMatches = roleTokens.filter((token) => versionTokens.has(token));
  const companyTokenMatches = companyTokens.filter((token) => versionTokens.has(token));
  const modifiedDate = datePart(input.version.modifiedAtObserved);
  const eliminated = dateAfter(modifiedDate, input.submittedDate);
  return {
    resumeVersionId: input.version.resumeVersionId,
    safeLabel: safeResumeLabel(input.version),
    originalFilename: input.version.originalFilename,
    normalizedFilenameStem: versionStem,
    documentFormat: input.version.documentFormat,
    digestPrefix: input.version.contentDigest.slice(0, 12),
    observedDate: input.version.observedAt.slice(0, 10),
    modifiedDate,
    purpose: input.version.purpose,
    targetRoleFamily: input.version.targetRoleFamily,
    roleTokenMatches,
    companyTokenMatches,
    exactOriginalFilenameMatch: Boolean(legacyFilename && legacyFilename.toLowerCase() === input.version.originalFilename.toLowerCase()),
    normalizedFilenameMatch: Boolean(legacyStem && legacyStem === versionStem),
    exactDuplicateGroupIds: duplicateGroups.map((group) => group.duplicateGroupId),
    likelyVersionFamilyIds: likelyFamilies.map((family) => family.familyId),
    eliminated,
    eliminationReason: eliminated ? "DATE_AFTER_APPLICATION" : null,
    reasonCandidateRemains: eliminated
      ? "Eliminated because the source modified date is after the Application submission date."
      : "Candidate remains because deterministic metadata is insufficient to disprove it.",
    privatePathVisible: false,
  };
}

function candidateEliminationFor(
  applicationId: string,
  candidate: PrivateResumeReviewCandidate,
): PrivateResumeCandidateEliminationRecord | null {
  if (!candidate.eliminated || !candidate.eliminationReason) return null;
  return {
    applicationId,
    resumeVersionId: candidate.resumeVersionId,
    reason: candidate.eliminationReason,
    explanation: candidate.reasonCandidateRemains,
    deterministic: true,
    subjectiveQualityUsed: false,
  };
}

function duplicateCollapseForApplication(input: {
  applicationId: string | null;
  candidateIds: readonly string[];
  artifacts: ResumeAssetReconciliationArtifacts;
}) {
  return input.artifacts.exactDuplicateGroups
    .filter((group) => group.memberResumeVersionIds.some((resumeVersionId) => input.candidateIds.includes(resumeVersionId)))
    .map((group) => ({
      collapseId: opaqueId("privresumecollapse", [input.applicationId || "global", group.duplicateGroupId]),
      applicationId: input.applicationId,
      canonicalResumeVersionId: group.canonicalResumeVersionId,
      duplicateGroupId: group.duplicateGroupId,
      sourceAliasCount: group.memberSourceDocumentIds.length,
      collapsedForOperatorDisplay: true as const,
      sourceHistoryPreserved: true as const,
      sourceFilesDeleted: false as const,
      limitations: [
        "Duplicate aliases are collapsed only for operator display.",
        "All source aliases and duplicate history remain private and preserved.",
        "No source file is deleted, renamed, merged, or rewritten.",
      ],
    }));
}

function reasonsForApplication(input: {
  readiness: PrivateApplicationLinkageReadinessRecord;
  candidates: readonly PrivateResumeReviewCandidate[];
  sourceGap: PrivateSourceGapRecord;
}) {
  const reasons = new Set<ReviewReason>();
  if (input.readiness.readiness === "SOURCE_NOT_PRESENT") reasons.add("SOURCE_NOT_PRESENT");
  if (input.readiness.readiness === "MULTIPLE_CANDIDATES") reasons.add("MULTIPLE_ROLE_TARGETED_CANDIDATES");
  if (input.candidates.some((candidate) => candidate.exactDuplicateGroupIds.length > 0)) reasons.add("DUPLICATE_SOURCE_ALIAS");
  if (input.candidates.some((candidate) => candidate.likelyVersionFamilyIds.length > 0)) reasons.add("LIKELY_VERSION_FAMILY");
  if (input.candidates.length > 1 && !input.candidates.some((candidate) => candidate.exactOriginalFilenameMatch)) {
    reasons.add("FILENAME_VARIATION");
  }
  if (input.candidates.length > 1 && input.candidates.every((candidate) => candidate.modifiedDate !== null)) {
    reasons.add("TIMESTAMP_AMBIGUITY");
  }
  if (input.candidates.length > 1 && input.candidates.some((candidate) => candidate.roleTokenMatches.length === 0)) {
    reasons.add("ROLE_CONTEXT_AMBIGUITY");
  }
  if (new Set(input.candidates.map((candidate) => candidate.documentFormat)).size > 1) reasons.add("MULTIPLE_FORMATS");
  if (!reasons.size || input.sourceGap.classification === "POSSIBLE_EXISTING_VARIANT") reasons.add("INSUFFICIENT_METADATA");
  return [...reasons];
}

function sourceGapFor(input: {
  application: PrivateApplicationRecord | null;
  readiness: PrivateApplicationLinkageReadinessRecord;
  artifacts: ResumeAssetReconciliationArtifacts;
  candidates: readonly PrivateResumeReviewCandidate[];
  decisions: readonly PrivateResumeReviewDecision[];
}): PrivateSourceGapRecord {
  const legacyFilename = input.application?.resumeReference?.filename || null;
  const legacyStem = normalizedFilenameStem(legacyFilename);
  const exactOriginalFilenameMatchExists = Boolean(
    legacyFilename &&
      input.artifacts.resumeVersions.some(
        (version) => version.originalFilename.toLowerCase() === legacyFilename.toLowerCase(),
      ),
  );
  const normalizedFilenameMatchExists = Boolean(
    legacyStem && input.artifacts.resumeVersions.some((version) => normalizedFilenameStem(version.originalFilename) === legacyStem),
  );
  const roleCompanyTargetedSourceExists = input.candidates.some(
    (candidate) => candidate.roleTokenMatches.length > 0 || candidate.companyTokenMatches.length > 0,
  );
  const duplicateAliasResolves = input.candidates.some((candidate) => candidate.exactDuplicateGroupIds.length > 0);
  const sourceMissingConfirmed = input.decisions.some(
    (decision) => decision.applicationId === input.readiness.applicationId && decision.decisionType === "SOURCE_MISSING_CONFIRMED",
  );
  let classification: SourceGapClassification = "NOT_SOURCE_GAP";
  if (input.readiness.readiness === "SOURCE_NOT_PRESENT") {
    classification =
      sourceMissingConfirmed ||
      (!exactOriginalFilenameMatchExists &&
        !normalizedFilenameMatchExists &&
        !roleCompanyTargetedSourceExists &&
        !duplicateAliasResolves)
        ? "CONFIRMED_SOURCE_GAP"
        : "POSSIBLE_EXISTING_VARIANT";
  }
  return {
    applicationId: input.readiness.applicationId,
    classification,
    exactOriginalFilenameMatchExists,
    normalizedFilenameMatchExists,
    digestBackedSourceExists: exactOriginalFilenameMatchExists || normalizedFilenameMatchExists,
    roleCompanyTargetedSourceExists,
    duplicateAliasResolves,
    operatorAction: classification === "CONFIRMED_SOURCE_GAP" ? "SOURCE_DOCUMENT_NEEDED" : "NONE",
    futureImportRequiresRossAuthorization: true,
    privatePathVisible: false,
    limitations: [
      "No outside directory was searched.",
      "Future import requires explicit Ross authorization and approved private source authority.",
      "No source document is imported by this workflow.",
    ],
  };
}

function latestDecisionForApplication(decisions: readonly PrivateResumeReviewDecision[], applicationId: string) {
  return [...decisions]
    .filter((decision) => decision.applicationId === applicationId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}

function readinessAfter(input: {
  previous: ApplicationLinkageReadiness;
  candidates: readonly PrivateResumeReviewCandidate[];
  sourceGap: PrivateSourceGapRecord;
  decision: PrivateResumeReviewDecision | undefined;
}) {
  if (input.decision?.decisionType === "SOURCE_MISSING_CONFIRMED") return "SOURCE_NOT_PRESENT";
  if (input.sourceGap.classification === "CONFIRMED_SOURCE_GAP") return "SOURCE_NOT_PRESENT";
  if (input.decision?.decisionType === "CANDIDATE_PREFERRED" && input.decision.selectedResumeVersionId) {
    return "SINGLE_CANDIDATE_NEEDS_OPERATOR_CONFIRMATION";
  }
  if (input.decision?.decisionType === "UNKNOWN" || input.decision?.decisionType === "DEFER") {
    return input.previous === "SOURCE_NOT_PRESENT" ? "SOURCE_NOT_PRESENT" : "UNRESOLVED";
  }
  const remaining = input.candidates.filter((candidate) => !candidate.eliminated);
  if (remaining.length === 1 && remaining[0].exactOriginalFilenameMatch) return "EXACT_SOURCE_READY";
  if (remaining.length === 1) return "SINGLE_CANDIDATE_NEEDS_OPERATOR_CONFIRMATION";
  if (remaining.length > 1) return "MULTIPLE_CANDIDATES";
  if (input.previous === "SOURCE_NOT_PRESENT") return "SOURCE_NOT_PRESENT";
  return "UNRESOLVED";
}

function operatorQuestionFor(readiness: ResolvedApplicationReadiness, sourceGap: PrivateSourceGapRecord) {
  if (sourceGap.classification === "CONFIRMED_SOURCE_GAP" || readiness === "SOURCE_NOT_PRESENT") {
    return "Is the source document for this Application missing from the approved Career intake root, or should this remain unknown/deferred?";
  }
  if (readiness === "SINGLE_CANDIDATE_NEEDS_OPERATOR_CONFIRMATION" || readiness === "EXACT_SOURCE_READY") {
    return "Should this single candidate be carried forward for a later explicit submitted-resume confirmation?";
  }
  return "Which remaining candidate should be carried forward as preferred for later exact submitted-resume confirmation, or should this stay unknown/deferred?";
}

function knownEvidenceFor(input: {
  application: PrivateApplicationRecord | null;
  previousReadiness: ApplicationLinkageReadiness;
  candidates: readonly PrivateResumeReviewCandidate[];
  duplicateAliasesCollapsed: number;
  sourceGap: PrivateSourceGapRecord;
}) {
  const known = [
    `Previous readiness state was ${input.previousReadiness}.`,
    `Remaining candidate count after deterministic elimination is ${input.candidates.filter((candidate) => !candidate.eliminated).length}.`,
    `Duplicate source aliases collapsed for review: ${input.duplicateAliasesCollapsed}.`,
    "Candidate labels are safe labels only; no source paths or raw resume text are required.",
  ];
  if (input.application?.resumeReference?.filename) {
    known.push("A private legacy submitted-resume filename reference exists for this Application.");
  } else {
    known.push("No private legacy submitted-resume filename reference is recorded for this Application.");
  }
  if (input.sourceGap.classification === "CONFIRMED_SOURCE_GAP") {
    known.push("No exact filename, normalized filename, digest-backed source, role/company source, or duplicate alias resolved the source gap.");
  }
  return known;
}

function unknownEvidenceFor(readiness: ResolvedApplicationReadiness) {
  return [
    "Which exact ResumeVersion was submitted remains unknown.",
    "No employer, recruiter, or application outcome evidence is inferred.",
    readiness === "MULTIPLE_CANDIDATES"
      ? "Operator review is needed to prefer one candidate or preserve unknown."
      : "Later explicit confirmation is still required before USED_FOR_SUBMISSION can be recorded.",
  ];
}

function likelyVersionAnalysis(artifacts: ResumeAssetReconciliationArtifacts) {
  const versionMap = versionById(artifacts);
  return artifacts.likelyVersionFamilies.map((family) => {
    const members = family.resumeVersionIds
      .map((resumeVersionId) => versionMap.get(resumeVersionId))
      .filter((version): version is PrivateResumeVersionRecord => version !== undefined);
    const sorted = [...members].sort((left, right) => left.modifiedAtObserved.localeCompare(right.modifiedAtObserved));
    const uniqueDates = new Set(sorted.map((version) => datePart(version.modifiedAtObserved) || "UNKNOWN"));
    return {
      familyId: family.familyId,
      resumeVersionIds: family.resumeVersionIds,
      memberClassifications: members.map((version) => {
        let classification: LikelyVersionMemberClassification = "UNRESOLVED_FAMILY";
        let basis = "Available deterministic metadata does not establish a safe variant classification.";
        if (uniqueDates.size > 1 && version.resumeVersionId === sorted[0]?.resumeVersionId) {
          classification = "OLDER_VARIANT";
          basis = "Source modified timestamp is earlier than another family member.";
        } else if (uniqueDates.size > 1 && version.resumeVersionId === sorted[sorted.length - 1]?.resumeVersionId) {
          classification = "NEWER_VARIANT";
          basis = "Source modified timestamp is later than another family member; this does not imply better or submitted.";
        } else if (version.purpose === "ROLE_TARGETED_RESUME") {
          classification = "ROLE_TARGETED_VARIANT";
          basis = "Deterministic document purpose is role-targeted.";
        } else if (version.purpose === "GENERAL_RESUME") {
          classification = "GENERAL_VARIANT";
          basis = "Deterministic document purpose is general resume.";
        }
        return { resumeVersionId: version.resumeVersionId, classification, basis };
      }),
      sourceChronologySupported: uniqueDates.size > 1,
      semanticSuperiorityInferred: false as const,
      supersessionCreated: false as const,
      limitations: [
        "Modified timestamp may support chronology but not semantic superiority.",
        "No supersession is created by likely-version analysis.",
      ],
    };
  });
}

export function createResumeReviewDecision(input: {
  applicationId: string | null;
  reviewItemId: string | null;
  decisionType: ReviewDecisionType;
  selectedResumeVersionId?: string | null;
  rejectedResumeVersionIds?: readonly string[];
  createdAt: string;
}): PrivateResumeReviewDecision {
  return {
    schemaVersion: RESUME_REVIEW_DECISION_SCHEMA_VERSION,
    decisionId: opaqueId("privresumereviewdecision", [
      input.applicationId || "NONE",
      input.reviewItemId || "NONE",
      input.decisionType,
      input.selectedResumeVersionId || "NONE",
      input.createdAt,
    ]),
    workspaceId: "professional",
    applicationId: input.applicationId,
    reviewItemId: input.reviewItemId,
    decisionType: input.decisionType,
    selectedResumeVersionId: input.selectedResumeVersionId || null,
    rejectedResumeVersionIds: [...(input.rejectedResumeVersionIds || [])],
    operatorConfirmed: true,
    createdAt: input.createdAt,
    sourceAuthority: "ROSS_OPERATOR_REVIEW_DECISION",
    privacy: "Professional owner-private",
    applicationResumeLinkCreated: false,
    usedForSubmissionCreated: false,
    importCreated: false,
    limitations: [
      "Review decision is for candidate narrowing only.",
      "It does not create ApplicationResumeLink or USED_FOR_SUBMISSION.",
      "Resume wording remains downstream representation and does not verify Career facts.",
    ],
  };
}

export function buildResumeReviewQueueResolution(input: {
  artifacts: ResumeAssetReconciliationArtifacts;
  applicationStore: PrivateApplicationPipelineStore;
  generatedAt: string;
  decisions?: readonly PrivateResumeReviewDecision[];
}): ResumeReviewQueueResolutionResult {
  const appsById = applicationById(input.applicationStore);
  const versionsById = versionById(input.artifacts);
  const sourcesById = sourceById(input.artifacts);
  const decisions = [...(input.decisions || [])].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const globalDuplicateCollapse = duplicateCollapseForApplication({
    applicationId: null,
    candidateIds: input.artifacts.resumeVersions.map((version) => version.resumeVersionId),
    artifacts: input.artifacts,
  });
  const applicationReadiness: PrivateApplicationResumeReadinessResolution[] = [];
  const sourceGapRecords: PrivateSourceGapRecord[] = [];
  const allEliminations: PrivateResumeCandidateEliminationRecord[] = [];
  const allDuplicateCollapse: PrivateResumeDuplicateCollapseRecord[] = [...globalDuplicateCollapse];

  for (const readiness of input.artifacts.applicationLinkageReadiness) {
    const application = appsById.get(readiness.applicationId) || null;
    const submittedDate = datePart(application?.submittedAt);
    const candidateVersions = readiness.candidateResumeVersionIds
      .map((resumeVersionId) => versionsById.get(resumeVersionId))
      .filter((version): version is PrivateResumeVersionRecord => version !== undefined);
    const candidates = candidateVersions.map((version) =>
      candidateFor({ application, version, artifacts: input.artifacts, submittedDate }),
    );
    const eliminations = candidates
      .map((candidate) => candidateEliminationFor(readiness.applicationId, candidate))
      .filter((record): record is PrivateResumeCandidateEliminationRecord => record !== null);
    const appDuplicateCollapse = duplicateCollapseForApplication({
      applicationId: readiness.applicationId,
      candidateIds: candidateVersions.map((version) => version.resumeVersionId),
      artifacts: input.artifacts,
    });
    const duplicateAliasesCollapsed = appDuplicateCollapse.reduce((sum, record) => sum + Math.max(0, record.sourceAliasCount - 1), 0);
    const sourceGap = sourceGapFor({
      application,
      readiness,
      artifacts: input.artifacts,
      candidates,
      decisions,
    });
    const decision = latestDecisionForApplication(decisions, readiness.applicationId);
    const postDecisionCandidates =
      decision?.decisionType === "CANDIDATE_PREFERRED" && decision.selectedResumeVersionId
        ? candidates.filter((candidate) => candidate.resumeVersionId === decision.selectedResumeVersionId)
        : decision?.decisionType === "CANDIDATE_REJECTED"
          ? candidates.filter((candidate) => !decision.rejectedResumeVersionIds.includes(candidate.resumeVersionId))
          : candidates;
    const readinessState = readinessAfter({
      previous: readiness.readiness,
      candidates: postDecisionCandidates,
      sourceGap,
      decision,
    });
    const reasons = reasonsForApplication({ readiness, candidates: postDecisionCandidates, sourceGap });
    const operatorQuestion = operatorQuestionFor(readinessState, sourceGap);
    allEliminations.push(...eliminations);
    allDuplicateCollapse.push(...appDuplicateCollapse);
    sourceGapRecords.push(sourceGap);
    applicationReadiness.push({
      applicationId: readiness.applicationId,
      previousReadiness: readiness.readiness,
      readiness: readinessState,
      reviewItemId: opaqueId("privresumereviewitem", [readiness.applicationId, readiness.readiness]),
      reasons,
      knownHistoricalResumeReference: application?.resumeReference?.filename ? "PRESENT" : "UNKNOWN",
      exactOriginalFilenameMatchExists: candidates.some((candidate) => candidate.exactOriginalFilenameMatch),
      normalizedFilenameMatchExists: candidates.some((candidate) => candidate.normalizedFilenameMatch),
      duplicateAliasesCollapsed,
      eliminatedCandidates: eliminations,
      remainingCandidates: postDecisionCandidates.filter((candidate) => !candidate.eliminated),
      operatorQuestion,
      applicationResumeLinkCreated: false,
      usedForSubmissionCreated: false,
      existingUnknownDecisionChanged: false,
      limitations: [
        "Readiness resolution does not prove submitted-resume usage.",
        "No ApplicationResumeLink or RESUME_LINK_CONFIRMED event is created.",
        "Existing UNKNOWN decisions remain preserved.",
      ],
      privatePathVisible: false,
    });
  }

  const reviewQueueExplanations: PrivateResumeReviewExplanation[] = [
    ...applicationReadiness.map((record) => ({
      reviewItemId: record.reviewItemId,
      applicationId: record.applicationId,
      reasons: record.reasons,
      candidateSafeLabels: record.remainingCandidates.map((candidate) => candidate.safeLabel),
      knownEvidence: knownEvidenceFor({
        application: appsById.get(record.applicationId) || null,
        previousReadiness: record.previousReadiness,
        candidates: record.remainingCandidates,
        duplicateAliasesCollapsed: record.duplicateAliasesCollapsed,
        sourceGap: sourceGapRecords.find((sourceGap) => sourceGap.applicationId === record.applicationId) as PrivateSourceGapRecord,
      }),
      unknownEvidence: unknownEvidenceFor(record.readiness),
      eliminatedCandidates: record.eliminatedCandidates,
      remainingCandidates: record.remainingCandidates,
      operatorQuestion: record.operatorQuestion,
      limitations: [
        "No private filesystem path or raw resume content is shown in normal review output.",
        "Deterministic narrowing cannot become USED_FOR_SUBMISSION without a later explicit linkage mission.",
      ],
      privatePathVisible: false as const,
      rawResumeContentVisible: false as const,
    })),
    ...input.artifacts.operatorReviewQueue.map((item) => ({
      reviewItemId: item.reviewItemId,
      applicationId: null,
      reasons:
        item.classification === "EXACT_DUPLICATE"
          ? (["DUPLICATE_SOURCE_ALIAS"] as ReviewReason[])
          : item.classification === "LIKELY_VERSION_FAMILY"
            ? (["LIKELY_VERSION_FAMILY"] as ReviewReason[])
            : (["OTHER"] as ReviewReason[]),
      candidateSafeLabels: [item.safeResumeLabel, ...item.possibleRelatedSafeLabels],
      knownEvidence: [item.reasonForReview, `Classification: ${item.classification}.`],
      unknownEvidence: ["Whether this should become a supersession or cleanup action remains unknown."],
      eliminatedCandidates: [],
      remainingCandidates: [],
      operatorQuestion: "Should this duplicate or likely-version item remain grouped for later review?",
      limitations: [
        "Source aliases are preserved privately.",
        "No source file cleanup or supersession is performed by this mission.",
      ],
      privatePathVisible: false as const,
      rawResumeContentVisible: false as const,
    })),
  ];

  const regeneratedApplicationLinkageReadiness = applicationReadiness.map((record) => {
    const sourceGap = sourceGapRecords.find((item) => item.applicationId === record.applicationId);
    const confirmedGap = sourceGap?.classification === "CONFIRMED_SOURCE_GAP";
    return {
      applicationId: record.applicationId,
      readiness: confirmedGap ? ("CONFIRMED_SOURCE_GAP" as const) : record.readiness,
      candidateResumeVersionIds: record.remainingCandidates.map((candidate) => candidate.resumeVersionId),
      candidateSafeLabels: record.remainingCandidates.map((candidate) => candidate.safeLabel),
      reason: confirmedGap
        ? "No matching source exists under approved private Career intake authority."
        : record.operatorQuestion,
      applicationResumeLinkCreated: false as const,
      usedForSubmissionCreated: false as const,
      existingUnknownDecisionChanged: false as const,
      privatePathVisible: false as const,
      limitations: [
        "Readiness only; no submitted-resume linkage is created.",
        "J001.06D must still require explicit Ross confirmation before USED_FOR_SUBMISSION.",
      ],
    };
  });

  const previousReadinessValues = input.artifacts.applicationLinkageReadiness.map((record) => record.readiness);
  return {
    schemaVersion: RESUME_REVIEW_QUEUE_RESOLUTION_SCHEMA_VERSION,
    workflowVersion: RESUME_REVIEW_QUEUE_RESOLUTION_VERSION,
    generatedAt: input.generatedAt,
    sourceWorkflowVersion: RESUME_ASSET_RECONCILIATION_VERSION,
    loadedAuthority: {
      sourceRecords: input.artifacts.sourceInventory.length,
      resumeVersions: input.artifacts.resumeVersions.length,
      exactDuplicateGroups: input.artifacts.exactDuplicateGroups.length,
      likelyVersionFamilies: input.artifacts.likelyVersionFamilies.length,
      operatorReviewQueueItems: input.artifacts.operatorReviewQueue.length,
      applicationReadinessRecords: input.artifacts.applicationLinkageReadiness.length,
      privatePathVisible: false,
    },
    reviewQueueExplanations,
    applicationReadiness,
    duplicateCollapse: [...new Map(allDuplicateCollapse.map((record) => [record.collapseId, record])).values()],
    likelyVersionFamilyAnalysis: likelyVersionAnalysis(input.artifacts),
    candidateEliminations: allEliminations,
    sourceGapRecords,
    operatorDecisions: decisions,
    regeneratedApplicationLinkageReadiness,
    auditSummary: {
      multipleCandidatesBefore: previousReadinessValues.filter((state) => state === "MULTIPLE_CANDIDATES").length,
      sourceNotPresentBefore: previousReadinessValues.filter((state) => state === "SOURCE_NOT_PRESENT").length,
      exactSourceReadyBefore: previousReadinessValues.filter((state) => state === "EXACT_SOURCE_READY").length,
      singleCandidateAfter: applicationReadiness.filter((record) => record.readiness === "SINGLE_CANDIDATE_NEEDS_OPERATOR_CONFIRMATION").length,
      multipleCandidatesAfter: applicationReadiness.filter((record) => record.readiness === "MULTIPLE_CANDIDATES").length,
      sourceNotPresentAfter: applicationReadiness.filter((record) => record.readiness === "SOURCE_NOT_PRESENT").length,
      confirmedSourceGaps: sourceGapRecords.filter((record) => record.classification === "CONFIRMED_SOURCE_GAP").length,
      exactSourceReadyAfter: applicationReadiness.filter((record) => record.readiness === "EXACT_SOURCE_READY").length,
      operatorDecisionsLoaded: decisions.length,
      operatorDecisionsApplied: decisions.length,
      applicationResumeLinksCreated: 0,
      usedForSubmissionLinksCreated: 0,
      resumeLinkConfirmedEventsCreated: 0,
      noOutsideDirectoryScan: true,
      noNewestFileWins: true,
      noFilenameOnlySubmissionProof: true,
      noRoleTargetSubmissionProof: true,
      noResumeGenerated: true,
      noResumeMutated: true,
      noApplicationSubmitted: true,
      noMessageSent: true,
      noCareerFactPromoted: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noOsConnection: true,
      noOperatorRouteCreated: true,
      privatePathVisibleInNormalOutput: false,
    },
  };
}

export function writeResumeReviewQueueResolutionOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: ResumeReviewQueueResolutionResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private resume review queue output root");
  const runDirectory = path.join(input.outputRoot, `j001_06c_${compactDate(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "review_queue_explanations.json": input.result.reviewQueueExplanations,
    "candidate_eliminations.json": input.result.candidateEliminations,
    "duplicate_collapse.json": input.result.duplicateCollapse,
    "likely_version_family_analysis.json": input.result.likelyVersionFamilyAnalysis,
    "source_gap_records.json": input.result.sourceGapRecords,
    "operator_review_decisions.json": input.result.operatorDecisions,
    "application_linkage_readiness.json": input.result.regeneratedApplicationLinkageReadiness,
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

export function buildResumeReviewQueueResolutionCliSummary(result: ResumeReviewQueueResolutionResult) {
  return {
    workflowVersion: result.workflowVersion,
    sourceRecords: result.loadedAuthority.sourceRecords,
    resumeVersions: result.loadedAuthority.resumeVersions,
    exactDuplicateGroups: result.loadedAuthority.exactDuplicateGroups,
    likelyVersionFamilies: result.loadedAuthority.likelyVersionFamilies,
    reviewQueueItems: result.loadedAuthority.operatorReviewQueueItems,
    applicationReadinessRecords: result.loadedAuthority.applicationReadinessRecords,
    multipleCandidatesBefore: result.auditSummary.multipleCandidatesBefore,
    sourceNotPresentBefore: result.auditSummary.sourceNotPresentBefore,
    singleCandidateAfter: result.auditSummary.singleCandidateAfter,
    multipleCandidatesAfter: result.auditSummary.multipleCandidatesAfter,
    sourceNotPresentAfter: result.auditSummary.sourceNotPresentAfter,
    confirmedSourceGaps: result.auditSummary.confirmedSourceGaps,
    exactSourceReadyAfter: result.auditSummary.exactSourceReadyAfter,
    operatorDecisionsApplied: result.auditSummary.operatorDecisionsApplied,
    applicationResumeLinksCreated: result.auditSummary.applicationResumeLinksCreated,
    usedForSubmissionLinksCreated: result.auditSummary.usedForSubmissionLinksCreated,
    noResumeGenerated: result.auditSummary.noResumeGenerated,
    noResumeMutated: result.auditSummary.noResumeMutated,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noMessageSent: result.auditSummary.noMessageSent,
    noExternalProviderCall: result.auditSummary.noExternalProviderCall,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
    noOsConnection: result.auditSummary.noOsConnection,
    noOperatorRouteCreated: result.auditSummary.noOperatorRouteCreated,
    privatePathVisible: false,
  };
}

export function buildSafeReviewItemsForCli(input: {
  result: ResumeReviewQueueResolutionResult;
  applicationStore: PrivateApplicationPipelineStore;
}) {
  const apps = applicationById(input.applicationStore);
  return input.result.applicationReadiness.map((record) => {
    const application = apps.get(record.applicationId);
    return {
      applicationId: record.applicationId,
      company: application?.companyReference.label || "UNKNOWN",
      role: application?.roleReference.title || "UNKNOWN",
      previousReadiness: record.previousReadiness,
      readiness: record.readiness,
      knownHistoricalResumeReference: record.knownHistoricalResumeReference,
      candidates: record.remainingCandidates.map((candidate, index) => ({
        key: String.fromCharCode(65 + index),
        resumeVersionId: candidate.resumeVersionId,
        safeLabel: candidate.safeLabel,
        reasonCandidateRemains: candidate.reasonCandidateRemains,
      })),
      eliminatedCount: record.eliminatedCandidates.length,
      duplicateAliasesCollapsed: record.duplicateAliasesCollapsed,
      question: record.operatorQuestion,
      privatePathVisible: false,
      rawResumeContentVisible: false,
    };
  });
}

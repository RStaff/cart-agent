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
import {
  buildResumeVersionApplicationLinkage,
  type PrivateApplicationResumeCandidate,
  type PrivateResumeClaimSafetyRecord,
  type PrivateResumeDuplicateVersionRecord,
  type PrivateResumeSourceRecord,
  type PrivateResumeVersionRecord,
  type ResumeFactSafetyStatus,
} from "./resumeVersionApplicationLinkage";
import type { PrivateApplicationPipelineStore } from "./privateApplicationPipelineReview";

export const RESUME_ASSET_RECONCILIATION_VERSION = "J001.06B";
export const RESUME_ASSET_SOURCE_SCHEMA_VERSION =
  "staffordos.job_search.private_resume_asset_source.v1";
export const RESUME_ASSET_RECONCILIATION_AUDIT_SCHEMA_VERSION =
  "staffordos.job_search.private_resume_asset_reconciliation_audit.v1";

export type ResumeVersionReconciliationClassification =
  | "EXISTING_EXACT_RESUMEVERSION"
  | "NEW_RESUMEVERSION"
  | "EXACT_DUPLICATE"
  | "FORMAT_DERIVATIVE"
  | "LIKELY_VERSION"
  | "UNRELATED"
  | "NEEDS_OPERATOR_REVIEW";

export type HistoricalResumeVersionSourceState =
  | "FOUND"
  | "MISSING"
  | "DUPLICATE"
  | "SUPERSEDED_BY_SOURCE_EVIDENCE"
  | "NEEDS_REVIEW";

export type ApplicationLinkageReadiness =
  | "EXACT_SOURCE_READY"
  | "MULTIPLE_CANDIDATES"
  | "SOURCE_NOT_PRESENT"
  | "NEEDS_OPERATOR_REVIEW"
  | "NO_MATCH";

export type PrivateResumeAssetSourceRecord = {
  schemaVersion: typeof RESUME_ASSET_SOURCE_SCHEMA_VERSION;
  assetReferenceId: string;
  sourceDocumentId: string;
  contentDigest: string;
  originalFilename: string;
  documentFormat: PrivateResumeSourceRecord["documentFormat"];
  documentClassification: PrivateResumeSourceRecord["documentClassification"];
  sourceAuthority: "PRIVATE_CAREER_SOURCE_DOCUMENT";
  observedAt: string;
  sourceModifiedAt: string;
  privacy: "Professional owner-private";
  provenance: {
    observedByWorkflow: typeof RESUME_ASSET_RECONCILIATION_VERSION;
    sourceRootAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT";
    sourcePathRedacted: string;
  };
  storageAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT";
  rightsStatus: "OWNER_PROVIDED_PRIVATE_DOCUMENT";
  limitations: string[];
};

export type PrivateResumeVersionReconciliationRecord = {
  reconciliationId: string;
  sourceDocumentId: string;
  assetReferenceId: string;
  resumeVersionId: string;
  contentDigest: string;
  classification: ResumeVersionReconciliationClassification;
  exactDuplicateGroupId: string | null;
  formatDerivativeGroupId: string | null;
  likelyVersionGroupId: string | null;
  reusedHistoricalResumeVersionId: string | null;
  automaticMergeAllowed: false;
  limitations: string[];
};

export type PrivateExactDuplicateGroupRecord = {
  duplicateGroupId: string;
  classification: "EXACT_DUPLICATE";
  canonicalResumeVersionId: string;
  memberSourceDocumentIds: string[];
  memberResumeVersionIds: string[];
  contentDigest: string;
  automaticMergeAllowed: false;
  sourceFilesDeleted: false;
  limitations: string[];
};

export type PrivateFormatDerivativeGroupRecord = {
  derivativeGroupId: string;
  classification: "FORMAT_DERIVATIVE";
  resumeVersionIds: string[];
  sourceDocumentIds: string[];
  documentTextDigest: string;
  documentFormats: string[];
  evidence: "NORMALIZED_TEXT_DIGEST_MATCH";
  automaticMergeAllowed: false;
  limitations: string[];
};

export type PrivateLikelyVersionFamilyRecord = {
  familyId: string;
  classification: "LIKELY_VERSION_FAMILY";
  resumeVersionIds: string[];
  reason: string;
  canonicalSupersessionCreated: false;
  automaticMergeAllowed: false;
  limitations: string[];
};

export type PrivateResumeSourceIntegrityRecord = {
  sourceDocumentId: string;
  beforeDigest: string;
  afterDigest: string | null;
  unchanged: boolean;
  sourceMutated: false;
  sourceRenamed: false;
  sourceDeleted: false;
  limitations: string[];
};

export type PrivateHistoricalResumeVersionStateRecord = {
  resumeVersionId: string;
  contentDigest: string;
  state: HistoricalResumeVersionSourceState;
  matchingCurrentResumeVersionIds: string[];
  limitations: string[];
};

export type PrivateResumeOperatorReviewQueueItem = {
  reviewItemId: string;
  safeResumeLabel: string;
  format: string;
  digestPrefix: string;
  observedDate: string;
  classification:
    | "EXACT_DUPLICATE"
    | "FORMAT_DERIVATIVE"
    | "LIKELY_VERSION_FAMILY"
    | "ORPHAN_RESUMEVERSION"
    | "NEEDS_OPERATOR_REVIEW";
  reasonForReview: string;
  possibleRelatedSafeLabels: string[];
  privatePathVisible: false;
  rawResumeContentVisible: false;
};

export type PrivateApplicationLinkageReadinessRecord = {
  applicationId: string;
  readiness: ApplicationLinkageReadiness;
  candidateResumeVersionIds: string[];
  candidateSafeLabels: string[];
  reason: string;
  applicationResumeLinkCreated: false;
  existingUnknownDecisionChanged: false;
  privatePathVisible: false;
  limitations: string[];
};

export type PrivateResumeLibraryHealth = {
  totalSupportedSourceDocuments: number;
  resumeDocuments: number;
  coverLetters: number;
  careerSources: number;
  unknownDocuments: number;
  nonCareerDocuments: number;
  resumeVersions: number;
  exactDuplicateGroups: number;
  formatDerivativeGroups: number;
  likelyVersionFamilies: number;
  generalResumes: number;
  roleTargetedResumes: number;
  unknownPurposeResumes: number;
  conflictingResumes: number;
  staleResumes: number;
  needsReviewResumes: number;
  orphanResumeVersions: number;
  sourceRecordsLackingResumeVersion: number;
  arbitraryScoreGenerated: false;
  successProbabilityGenerated: false;
  limitations: string[];
};

export type ResumeAssetReconciliationResult = {
  schemaVersion: typeof RESUME_ASSET_RECONCILIATION_AUDIT_SCHEMA_VERSION;
  workflowVersion: typeof RESUME_ASSET_RECONCILIATION_VERSION;
  generatedAt: string;
  approvedSourceAuthority: {
    sourceRootCount: number;
    sourceRootsExist: boolean;
    repositoryRootScanned: false;
    entireHomeDirectoryScanned: false;
    downloadsScanned: false;
    desktopScanned: false;
    iCloudScanned: false;
    privatePathVisibleInNormalOutput: false;
  };
  sourceInventory: PrivateResumeSourceRecord[];
  documentClassification: Record<PrivateResumeSourceRecord["documentClassification"], number>;
  assetCompatibleSources: PrivateResumeAssetSourceRecord[];
  resumeVersions: PrivateResumeVersionRecord[];
  resumeVersionReconciliation: PrivateResumeVersionReconciliationRecord[];
  exactDuplicateGroups: PrivateExactDuplicateGroupRecord[];
  formatDerivativeGroups: PrivateFormatDerivativeGroupRecord[];
  likelyVersionFamilies: PrivateLikelyVersionFamilyRecord[];
  factSafetySummary: {
    statusCounts: Record<ResumeFactSafetyStatus, number>;
    reports: Array<{
      resumeVersionId: string;
      factSafetyStatus: ResumeFactSafetyStatus;
      claims: PrivateResumeClaimSafetyRecord[];
      resumeIsCareerTruth: false;
      careerFactPromoted: false;
    }>;
    pmpSupportsCredentialOnly: true;
    resumeContentVerifiesCareerFacts: false;
  };
  sourceIntegrity: PrivateResumeSourceIntegrityRecord[];
  historicalResumeVersions: PrivateHistoricalResumeVersionStateRecord[];
  resumeLibraryHealth: PrivateResumeLibraryHealth;
  operatorReviewQueue: PrivateResumeOperatorReviewQueueItem[];
  applicationLinkageReadiness: PrivateApplicationLinkageReadinessRecord[];
  auditSummary: {
    sourceRecordsInventoried: number;
    assetCompatibleSourceRecords: number;
    resumeVersions: number;
    exactDuplicateGroups: number;
    formatDerivativeGroups: number;
    likelyVersionFamilies: number;
    operatorReviewQueueItems: number;
    applicationLinkageReadinessRecords: number;
    applicationResumeLinksCreated: 0;
    resumeLinkConfirmedEventsCreated: 0;
    noResumeGenerated: true;
    noResumeMutated: true;
    noResumeRenamed: true;
    noResumeDeleted: true;
    noApplicationSubmitted: true;
    noMessageSent: true;
    noLinkedInMutated: true;
    noCareerFactPromoted: true;
    noCareerEvidenceMutated: true;
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

function sha256Buffer(value: Buffer | string) {
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

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function walkJsonFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(directory).sort()) {
    const filePath = path.join(directory, entry);
    const stat = statSync(filePath);
    if (stat.isDirectory()) files.push(...walkJsonFiles(filePath));
    if (stat.isFile() && entry.endsWith(".json")) files.push(filePath);
  }
  return files;
}

function arrayRecords(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value.filter((entry): entry is AnyRecord => Boolean(entry && typeof entry === "object"));
  if (value && typeof value === "object") {
    const record = value as AnyRecord;
    for (const key of ["resumeVersions", "records"]) {
      if (Array.isArray(record[key])) {
        return (record[key] as unknown[]).filter((entry): entry is AnyRecord => Boolean(entry && typeof entry === "object"));
      }
    }
    return [record];
  }
  return [];
}

function uniqueBy<T>(items: readonly T[], getKey: (item: T) => string | null | undefined) {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = getKey(item);
    if (key && !map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function statusCounts<T extends string>(values: readonly T[], statuses: readonly T[]) {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<T, number>;
  for (const value of values) counts[value] += 1;
  return counts;
}

function safeResumeLabel(version: PrivateResumeVersionRecord) {
  return `${version.purpose} / ${version.documentFormat} / ${version.factSafetyStatus} / ${version.contentDigest.slice(0, 10)}`;
}

function asResumeVersion(record: AnyRecord): PrivateResumeVersionRecord | null {
  if (
    typeof record.resumeVersionId === "string" &&
    typeof record.contentDigest === "string" &&
    typeof record.documentFormat === "string"
  ) {
    return record as PrivateResumeVersionRecord;
  }
  return null;
}

function loadHistoricalResumeVersions(options: {
  existingResumeVersionRoot?: string | null;
  repositoryRoot: string;
}) {
  if (!options.existingResumeVersionRoot || !existsSync(options.existingResumeVersionRoot)) return [];
  assertOutsideRepository(options.existingResumeVersionRoot, options.repositoryRoot, "Private historical ResumeVersion root");
  const versions: PrivateResumeVersionRecord[] = [];
  for (const filePath of walkJsonFiles(options.existingResumeVersionRoot)) {
    if (path.basename(filePath) !== "resume_versions.json") continue;
    let parsed: unknown;
    try {
      parsed = readJson(filePath);
    } catch {
      continue;
    }
    for (const record of arrayRecords(parsed)) {
      const version = asResumeVersion(record);
      if (version) versions.push(version);
    }
  }
  return uniqueBy(versions, (version) => version.resumeVersionId);
}

function canonicalizeResumeVersions(versions: readonly PrivateResumeVersionRecord[]) {
  const byDigest = new Map<string, PrivateResumeVersionRecord[]>();
  for (const version of versions) {
    byDigest.set(version.contentDigest, [...(byDigest.get(version.contentDigest) || []), version]);
  }
  const canonical = [...byDigest.values()].map((group) =>
    [...group].sort((left, right) => left.resumeVersionId.localeCompare(right.resumeVersionId))[0],
  );
  return {
    canonical: canonical.sort((left, right) => left.resumeVersionId.localeCompare(right.resumeVersionId)),
    byDigest,
  };
}

function assetSourceFor(source: PrivateResumeSourceRecord, generatedAt: string): PrivateResumeAssetSourceRecord {
  return {
    schemaVersion: RESUME_ASSET_SOURCE_SCHEMA_VERSION,
    assetReferenceId: opaqueId("privasset", [source.contentDigest]),
    sourceDocumentId: source.privateSourceId,
    contentDigest: source.contentDigest,
    originalFilename: source.originalFilename,
    documentFormat: source.documentFormat,
    documentClassification: source.documentClassification,
    sourceAuthority: "PRIVATE_CAREER_SOURCE_DOCUMENT",
    observedAt: generatedAt,
    sourceModifiedAt: source.modifiedAtObserved,
    privacy: "Professional owner-private",
    provenance: {
      observedByWorkflow: RESUME_ASSET_RECONCILIATION_VERSION,
      sourceRootAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT",
      sourcePathRedacted: source.sourcePathRedacted,
    },
    storageAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT",
    rightsStatus: "OWNER_PROVIDED_PRIVATE_DOCUMENT",
    limitations: [
      "Asset-compatible private source record only; no production Asset database is created.",
      "Source identity is digest-based and independent of filename.",
      "Source file is not moved, renamed, deleted, modified, or copied into Git.",
    ],
  };
}

function exactDuplicateGroups(
  rawDuplicateGroups: readonly PrivateResumeDuplicateVersionRecord[],
  rawVersionsById: ReadonlyMap<string, PrivateResumeVersionRecord>,
  canonicalByDigest: ReadonlyMap<string, PrivateResumeVersionRecord>,
) {
  return rawDuplicateGroups
    .filter((group) => group.classification === "EXACT_DUPLICATE" && group.contentDigest)
    .map((group) => {
      const versions = group.resumeVersionIds
        .map((resumeVersionId) => rawVersionsById.get(resumeVersionId))
        .filter((version): version is PrivateResumeVersionRecord => version !== undefined);
      const digest = group.contentDigest || versions[0]?.contentDigest || "UNKNOWN";
      return {
        duplicateGroupId: group.groupId,
        classification: "EXACT_DUPLICATE" as const,
        canonicalResumeVersionId: canonicalByDigest.get(digest)?.resumeVersionId || versions[0]?.resumeVersionId || "UNKNOWN",
        memberSourceDocumentIds: versions.map((version) => version.sourceDocumentReference.privateSourceId),
        memberResumeVersionIds: group.resumeVersionIds,
        contentDigest: digest,
        automaticMergeAllowed: false as const,
        sourceFilesDeleted: false as const,
        limitations: [
          "Exact duplicate source documents have identical content digests.",
          "Duplicate files are not deleted, renamed, merged, or rewritten.",
          "The reconciliation output uses one canonical ResumeVersion per content digest.",
        ],
      };
    });
}

function formatDerivativeGroups(
  sourcesById: ReadonlyMap<string, PrivateResumeSourceRecord>,
  versions: readonly PrivateResumeVersionRecord[],
) {
  const byTextDigest = new Map<string, PrivateResumeVersionRecord[]>();
  for (const version of versions) {
    const source = sourcesById.get(version.sourceDocumentReference.privateSourceId);
    if (!source?.documentTextDigest) continue;
    byTextDigest.set(source.documentTextDigest, [...(byTextDigest.get(source.documentTextDigest) || []), version]);
  }
  const groups: PrivateFormatDerivativeGroupRecord[] = [];
  for (const [documentTextDigest, members] of byTextDigest.entries()) {
    const formats = [...new Set(members.map((member) => member.documentFormat))];
    const contentDigests = [...new Set(members.map((member) => member.contentDigest))];
    if (members.length < 2 || formats.length < 2 || contentDigests.length < 2) continue;
    groups.push({
      derivativeGroupId: opaqueId("privresumeformatgroup", [documentTextDigest, formats.join("|")]),
      classification: "FORMAT_DERIVATIVE",
      resumeVersionIds: members.map((member) => member.resumeVersionId),
      sourceDocumentIds: members.map((member) => member.sourceDocumentReference.privateSourceId),
      documentTextDigest,
      documentFormats: formats.sort(),
      evidence: "NORMALIZED_TEXT_DIGEST_MATCH",
      automaticMergeAllowed: false,
      limitations: [
        "Format derivative classification requires deterministic local text evidence.",
        "No format conversion, merge, parent-child relationship, or supersession is created.",
      ],
    });
  }
  return groups;
}

function likelyVersionFamilies(rawDuplicateGroups: readonly PrivateResumeDuplicateVersionRecord[]) {
  return rawDuplicateGroups
    .filter((group) => group.classification === "LIKELY_VERSION")
    .map((group) => ({
      familyId: group.groupId,
      classification: "LIKELY_VERSION_FAMILY" as const,
      resumeVersionIds: group.resumeVersionIds,
      reason: group.reason,
      canonicalSupersessionCreated: false as const,
      automaticMergeAllowed: false as const,
      limitations: [
        "Likely versions are grouped conservatively and require operator review.",
        "No ResumeVersion is superseded or merged from filename similarity alone.",
      ],
    }));
}

function reconciliationRecords(input: {
  sources: readonly PrivateResumeSourceRecord[];
  rawVersions: readonly PrivateResumeVersionRecord[];
  canonicalByDigest: ReadonlyMap<string, PrivateResumeVersionRecord>;
  historicalByDigest: ReadonlyMap<string, PrivateResumeVersionRecord[]>;
  exactGroups: readonly PrivateExactDuplicateGroupRecord[];
  formatGroups: readonly PrivateFormatDerivativeGroupRecord[];
  likelyGroups: readonly PrivateLikelyVersionFamilyRecord[];
}) {
  const rawVersionBySourceId = new Map(
    input.rawVersions.map((version) => [version.sourceDocumentReference.privateSourceId, version]),
  );
  const exactGroupByDigest = new Map(input.exactGroups.map((group) => [group.contentDigest, group]));
  const formatGroupByVersionId = new Map<string, PrivateFormatDerivativeGroupRecord>();
  const likelyGroupByVersionId = new Map<string, PrivateLikelyVersionFamilyRecord>();
  for (const group of input.formatGroups) {
    for (const resumeVersionId of group.resumeVersionIds) formatGroupByVersionId.set(resumeVersionId, group);
  }
  for (const group of input.likelyGroups) {
    for (const resumeVersionId of group.resumeVersionIds) likelyGroupByVersionId.set(resumeVersionId, group);
  }

  return input.sources
    .filter((source) => source.documentClassification === "RESUME")
    .map((source) => {
      const rawVersion = rawVersionBySourceId.get(source.privateSourceId);
      const canonicalVersion = input.canonicalByDigest.get(source.contentDigest) || rawVersion;
      if (!canonicalVersion || !rawVersion) {
        throw new Error(`Resume source ${source.privateSourceId} did not produce a ResumeVersion.`);
      }
      const exactGroup = exactGroupByDigest.get(source.contentDigest) || null;
      const formatGroup = formatGroupByVersionId.get(rawVersion.resumeVersionId) || null;
      const likelyGroup = likelyGroupByVersionId.get(rawVersion.resumeVersionId) || null;
      const historicalMatch = input.historicalByDigest.get(source.contentDigest)?.[0] || null;
      let classification: ResumeVersionReconciliationClassification = historicalMatch
        ? "EXISTING_EXACT_RESUMEVERSION"
        : "NEW_RESUMEVERSION";
      if (exactGroup && canonicalVersion.sourceDocumentReference.privateSourceId !== source.privateSourceId) {
        classification = "EXACT_DUPLICATE";
      } else if (formatGroup) {
        classification = "FORMAT_DERIVATIVE";
      } else if (likelyGroup) {
        classification = "LIKELY_VERSION";
      }
      return {
        reconciliationId: opaqueId("privresumereconcile", [source.privateSourceId, canonicalVersion.resumeVersionId]),
        sourceDocumentId: source.privateSourceId,
        assetReferenceId: opaqueId("privasset", [source.contentDigest]),
        resumeVersionId: canonicalVersion.resumeVersionId,
        contentDigest: source.contentDigest,
        classification,
        exactDuplicateGroupId: exactGroup?.duplicateGroupId || null,
        formatDerivativeGroupId: formatGroup?.derivativeGroupId || null,
        likelyVersionGroupId: likelyGroup?.familyId || null,
        reusedHistoricalResumeVersionId: historicalMatch?.resumeVersionId || null,
        automaticMergeAllowed: false as const,
        limitations: [
          "ResumeVersion reconciliation is digest-first and independent of filename identity.",
          "Application linkage is not created by this mission.",
          "Likely relationships and format derivatives do not create supersession without later authority.",
        ],
      };
    });
}

function verifySourceIntegrity(sources: readonly PrivateResumeSourceRecord[]) {
  return sources.map((source) => {
    let afterDigest: string | null = null;
    let unchanged = false;
    if (existsSync(source.sourcePath)) {
      afterDigest = sha256Buffer(readFileSync(source.sourcePath));
      unchanged = afterDigest === source.contentDigest;
    }
    return {
      sourceDocumentId: source.privateSourceId,
      beforeDigest: source.contentDigest,
      afterDigest,
      unchanged,
      sourceMutated: false as const,
      sourceRenamed: false as const,
      sourceDeleted: false as const,
      limitations: [
        "Integrity is verified by comparing before/after content digests.",
        "This workflow does not write, rename, delete, move, or convert source documents.",
      ],
    };
  });
}

function historicalStates(input: {
  historicalVersions: readonly PrivateResumeVersionRecord[];
  currentByDigest: ReadonlyMap<string, PrivateResumeVersionRecord[]>;
  exactDuplicateDigests: ReadonlySet<string>;
}) {
  return input.historicalVersions.map((version) => {
    const matches = input.currentByDigest.get(version.contentDigest) || [];
    let state: HistoricalResumeVersionSourceState = "MISSING";
    if (matches.length > 1 || input.exactDuplicateDigests.has(version.contentDigest)) state = "DUPLICATE";
    else if (matches.length === 1) state = "FOUND";
    return {
      resumeVersionId: version.resumeVersionId,
      contentDigest: version.contentDigest,
      state,
      matchingCurrentResumeVersionIds: matches.map((match) => match.resumeVersionId),
      limitations:
        state === "MISSING"
          ? ["Historical ResumeVersion is preserved; no orphan record is deleted by reconciliation."]
          : ["Historical ResumeVersion remains compatible with current source authority."],
    };
  });
}

function reviewQueue(input: {
  canonicalVersions: readonly PrivateResumeVersionRecord[];
  historicalVersions: readonly PrivateResumeVersionRecord[];
  exactGroups: readonly PrivateExactDuplicateGroupRecord[];
  formatGroups: readonly PrivateFormatDerivativeGroupRecord[];
  likelyFamilies: readonly PrivateLikelyVersionFamilyRecord[];
  historicalStates: readonly PrivateHistoricalResumeVersionStateRecord[];
}) {
  const versionById = new Map(
    [...input.canonicalVersions, ...input.historicalVersions].map((version) => [version.resumeVersionId, version]),
  );
  const queue: PrivateResumeOperatorReviewQueueItem[] = [];
  const push = (
    classification: PrivateResumeOperatorReviewQueueItem["classification"],
    version: PrivateResumeVersionRecord,
    reasonForReview: string,
    related: readonly PrivateResumeVersionRecord[],
  ) => {
    queue.push({
      reviewItemId: opaqueId("privresumereview", [classification, version.resumeVersionId, reasonForReview]),
      safeResumeLabel: safeResumeLabel(version),
      format: version.documentFormat,
      digestPrefix: version.contentDigest.slice(0, 12),
      observedDate: version.observedAt.slice(0, 10),
      classification,
      reasonForReview,
      possibleRelatedSafeLabels: related.map(safeResumeLabel),
      privatePathVisible: false,
      rawResumeContentVisible: false,
    });
  };

  for (const group of input.exactGroups) {
    const canonical = versionById.get(group.canonicalResumeVersionId);
    if (canonical) push("EXACT_DUPLICATE", canonical, "Exact duplicate source documents exist.", []);
  }
  for (const group of input.formatGroups) {
    const members = group.resumeVersionIds.map((id) => versionById.get(id)).filter((version): version is PrivateResumeVersionRecord => Boolean(version));
    if (members[0]) push("FORMAT_DERIVATIVE", members[0], "Possible format derivative requires operator review before supersession.", members.slice(1));
  }
  for (const family of input.likelyFamilies) {
    const members = family.resumeVersionIds.map((id) => versionById.get(id)).filter((version): version is PrivateResumeVersionRecord => Boolean(version));
    if (members[0]) push("LIKELY_VERSION_FAMILY", members[0], family.reason, members.slice(1));
  }
  for (const state of input.historicalStates.filter((item) => item.state === "MISSING")) {
    const version = versionById.get(state.resumeVersionId);
    if (version) push("ORPHAN_RESUMEVERSION", version, "Historical ResumeVersion no longer has matching source authority.", []);
  }
  return uniqueBy(queue, (item) => item.reviewItemId);
}

function applicationReadiness(input: {
  applicationStore: PrivateApplicationPipelineStore;
  candidates: readonly PrivateApplicationResumeCandidate[];
  resumeVersions: readonly PrivateResumeVersionRecord[];
}) {
  const candidatesByApplication = new Map<string, PrivateApplicationResumeCandidate[]>();
  for (const candidate of input.candidates) {
    candidatesByApplication.set(candidate.applicationId, [
      ...(candidatesByApplication.get(candidate.applicationId) || []),
      candidate,
    ]);
  }
  const versionsByFilename = new Map<string, PrivateResumeVersionRecord[]>();
  for (const version of input.resumeVersions) {
    const key = version.originalFilename.toLowerCase();
    versionsByFilename.set(key, [...(versionsByFilename.get(key) || []), version]);
  }

  return input.applicationStore.applications.map((application) => {
    const legacyFilename = application.resumeReference.filename;
    const exactFilenameMatches = legacyFilename ? versionsByFilename.get(legacyFilename.toLowerCase()) || [] : [];
    const candidates = candidatesByApplication.get(application.applicationId) || [];
    let readiness: ApplicationLinkageReadiness = "NO_MATCH";
    let selected = candidates;
    let reason = "No private ResumeVersion candidate is available for later submitted-resume review.";
    if (legacyFilename && exactFilenameMatches.length === 1) {
      readiness = "EXACT_SOURCE_READY";
      selected = exactFilenameMatches.map((version) => ({
        applicationId: application.applicationId,
        resumeVersionId: version.resumeVersionId,
        safeLabel: safeResumeLabel(version),
        confidence: "HIGH_REQUIRES_OPERATOR_CONFIRMATION" as const,
        reasons: ["Private source filename matches the private legacy application reference."],
        limitations: ["Readiness only; Ross must still confirm USED_FOR_SUBMISSION in a later mission."],
      }));
      reason = "One exact private source candidate is ready for later operator-confirmed linkage.";
    } else if (legacyFilename && exactFilenameMatches.length > 1) {
      readiness = "MULTIPLE_CANDIDATES";
      selected = exactFilenameMatches.map((version) => ({
        applicationId: application.applicationId,
        resumeVersionId: version.resumeVersionId,
        safeLabel: safeResumeLabel(version),
        confidence: "HIGH_REQUIRES_OPERATOR_CONFIRMATION" as const,
        reasons: ["Multiple private sources match the private legacy application reference."],
        limitations: ["Readiness only; duplicate ambiguity must be resolved before linkage."],
      }));
      reason = "Multiple private source candidates match the legacy reference; operator review is required.";
    } else if (legacyFilename) {
      readiness = "SOURCE_NOT_PRESENT";
      selected = [];
      reason = "The private legacy application resume reference does not currently match a private source ResumeVersion.";
    } else if (candidates.length > 1) {
      readiness = "MULTIPLE_CANDIDATES";
      reason = "Multiple metadata candidates exist, but no submitted resume can be inferred.";
    } else if (candidates.length === 1) {
      readiness = "NEEDS_OPERATOR_REVIEW";
      reason = "One candidate exists, but submitted-resume linkage still requires Ross confirmation.";
    }
    return {
      applicationId: application.applicationId,
      readiness,
      candidateResumeVersionIds: selected.map((candidate) => candidate.resumeVersionId),
      candidateSafeLabels: selected.map((candidate) => candidate.safeLabel),
      reason,
      applicationResumeLinkCreated: false as const,
      existingUnknownDecisionChanged: false as const,
      privatePathVisible: false as const,
      limitations: [
        "Readiness only; no ApplicationResumeLink is created.",
        "Existing UNKNOWN resume-link decisions remain unchanged.",
        "No submission history is rewritten.",
      ],
    };
  });
}

const FACT_SAFETY_STATUSES: ResumeFactSafetyStatus[] = [
  "SUPPORTED_VERIFIED",
  "SUPPORTED_TRANSFERABLE",
  "PARTIALLY_SUPPORTED",
  "NEEDS_EVIDENCE",
  "CONFLICTING",
  "STALE",
  "UNSUPPORTED",
  "UNKNOWN",
];

const DOCUMENT_CLASSIFICATIONS: PrivateResumeSourceRecord["documentClassification"][] = [
  "RESUME",
  "COVER_LETTER",
  "CAREER_SOURCE",
  "UNKNOWN_DOCUMENT",
  "NON_CAREER_DOCUMENT",
];

function buildHealth(input: {
  sources: readonly PrivateResumeSourceRecord[];
  resumeVersions: readonly PrivateResumeVersionRecord[];
  exactGroups: readonly PrivateExactDuplicateGroupRecord[];
  formatGroups: readonly PrivateFormatDerivativeGroupRecord[];
  likelyFamilies: readonly PrivateLikelyVersionFamilyRecord[];
  historicalStates: readonly PrivateHistoricalResumeVersionStateRecord[];
  reconciliationRecords: readonly PrivateResumeVersionReconciliationRecord[];
}) {
  const sourceRecordsLackingResumeVersion = input.sources.filter(
    (source) =>
      source.documentClassification === "RESUME" &&
      !input.reconciliationRecords.some((record) => record.sourceDocumentId === source.privateSourceId),
  ).length;
  return {
    totalSupportedSourceDocuments: input.sources.length,
    resumeDocuments: input.sources.filter((source) => source.documentClassification === "RESUME").length,
    coverLetters: input.sources.filter((source) => source.documentClassification === "COVER_LETTER").length,
    careerSources: input.sources.filter((source) => source.documentClassification === "CAREER_SOURCE").length,
    unknownDocuments: input.sources.filter((source) => source.documentClassification === "UNKNOWN_DOCUMENT").length,
    nonCareerDocuments: input.sources.filter((source) => source.documentClassification === "NON_CAREER_DOCUMENT").length,
    resumeVersions: input.resumeVersions.length,
    exactDuplicateGroups: input.exactGroups.length,
    formatDerivativeGroups: input.formatGroups.length,
    likelyVersionFamilies: input.likelyFamilies.length,
    generalResumes: input.resumeVersions.filter((version) => version.purpose === "GENERAL_RESUME").length,
    roleTargetedResumes: input.resumeVersions.filter((version) => version.purpose === "ROLE_TARGETED_RESUME").length,
    unknownPurposeResumes: input.resumeVersions.filter((version) => version.purpose === "UNKNOWN_RESUME").length,
    conflictingResumes: input.resumeVersions.filter((version) => version.factSafetyStatus === "CONFLICTING").length,
    staleResumes: input.resumeVersions.filter((version) => version.factSafetyStatus === "STALE").length,
    needsReviewResumes: input.resumeVersions.filter((version) => version.reviewStatus === "NEEDS_OPERATOR_REVIEW").length,
    orphanResumeVersions: input.historicalStates.filter((state) => state.state === "MISSING").length,
    sourceRecordsLackingResumeVersion,
    arbitraryScoreGenerated: false as const,
    successProbabilityGenerated: false as const,
    limitations: [
      "Resume Library Health is descriptive only; no score or success probability is generated.",
      "Exact duplicates, likely versions, and orphan records require operator review before cleanup or linkage.",
    ],
  };
}

export function buildResumeAssetReconciliation(input: {
  sourceRoots: readonly string[];
  careerRoots: readonly string[];
  applicationStore: PrivateApplicationPipelineStore;
  repositoryRoot: string;
  generatedAt: string;
  outputRoot?: string | null;
  existingResumeVersionRoot?: string | null;
}): ResumeAssetReconciliationResult {
  for (const sourceRoot of input.sourceRoots) {
    if (sourceRoot) assertOutsideRepository(sourceRoot, input.repositoryRoot, "Approved private Career source root");
  }
  const linkageResult = buildResumeVersionApplicationLinkage({
    sourceRoots: input.sourceRoots,
    careerRoots: input.careerRoots,
    applicationStore: input.applicationStore,
    repositoryRoot: input.repositoryRoot,
    generatedAt: input.generatedAt,
    outputRoot: input.outputRoot,
    decisions: [],
  });
  const rawVersions = linkageResult.resumeVersions;
  const rawVersionsById = new Map(rawVersions.map((version) => [version.resumeVersionId, version]));
  const sourcesById = new Map(linkageResult.sourceInventory.map((source) => [source.privateSourceId, source]));
  const { canonical: resumeVersions, byDigest: rawVersionsByDigest } = canonicalizeResumeVersions(rawVersions);
  const canonicalByDigest = new Map(resumeVersions.map((version) => [version.contentDigest, version]));
  const historicalVersions = loadHistoricalResumeVersions({
    existingResumeVersionRoot: input.existingResumeVersionRoot,
    repositoryRoot: input.repositoryRoot,
  });
  const historicalByDigest = new Map<string, PrivateResumeVersionRecord[]>();
  for (const version of historicalVersions) {
    historicalByDigest.set(version.contentDigest, [...(historicalByDigest.get(version.contentDigest) || []), version]);
  }
  const exactGroups = exactDuplicateGroups(linkageResult.duplicateVersionAnalysis, rawVersionsById, canonicalByDigest);
  const formatGroups = formatDerivativeGroups(sourcesById, resumeVersions);
  const likelyFamilies = likelyVersionFamilies(linkageResult.duplicateVersionAnalysis);
  const reconciliation = reconciliationRecords({
    sources: linkageResult.sourceInventory,
    rawVersions,
    canonicalByDigest,
    historicalByDigest,
    exactGroups,
    formatGroups,
    likelyGroups: likelyFamilies,
  });
  const exactDuplicateDigests = new Set(exactGroups.map((group) => group.contentDigest));
  const historical = historicalStates({
    historicalVersions,
    currentByDigest: rawVersionsByDigest,
    exactDuplicateDigests,
  });
  const integrity = verifySourceIntegrity(linkageResult.sourceInventory);
  const reviewItems = reviewQueue({
    canonicalVersions: resumeVersions,
    historicalVersions,
    exactGroups,
    formatGroups,
    likelyFamilies,
    historicalStates: historical,
  });
  const classificationCounts = statusCounts(
    linkageResult.sourceInventory.map((source) => source.documentClassification),
    DOCUMENT_CLASSIFICATIONS,
  );
  const safetyCounts = statusCounts(
    resumeVersions.map((version) => version.factSafetyStatus),
    FACT_SAFETY_STATUSES,
  );
  const health = buildHealth({
    sources: linkageResult.sourceInventory,
    resumeVersions,
    exactGroups,
    formatGroups,
    likelyFamilies,
    historicalStates: historical,
    reconciliationRecords: reconciliation,
  });

  return {
    schemaVersion: RESUME_ASSET_RECONCILIATION_AUDIT_SCHEMA_VERSION,
    workflowVersion: RESUME_ASSET_RECONCILIATION_VERSION,
    generatedAt: input.generatedAt,
    approvedSourceAuthority: {
      sourceRootCount: input.sourceRoots.length,
      sourceRootsExist: input.sourceRoots.every((sourceRoot) => existsSync(sourceRoot)),
      repositoryRootScanned: false,
      entireHomeDirectoryScanned: false,
      downloadsScanned: false,
      desktopScanned: false,
      iCloudScanned: false,
      privatePathVisibleInNormalOutput: false,
    },
    sourceInventory: linkageResult.sourceInventory,
    documentClassification: classificationCounts,
    assetCompatibleSources: linkageResult.sourceInventory.map((source) => assetSourceFor(source, input.generatedAt)),
    resumeVersions,
    resumeVersionReconciliation: reconciliation,
    exactDuplicateGroups: exactGroups,
    formatDerivativeGroups: formatGroups,
    likelyVersionFamilies: likelyFamilies,
    factSafetySummary: {
      statusCounts: safetyCounts,
      reports: resumeVersions.map((version) => ({
        resumeVersionId: version.resumeVersionId,
        factSafetyStatus: version.factSafetyStatus,
        claims: version.claimSafety,
        resumeIsCareerTruth: false,
        careerFactPromoted: false,
      })),
      pmpSupportsCredentialOnly: true,
      resumeContentVerifiesCareerFacts: false,
    },
    sourceIntegrity: integrity,
    historicalResumeVersions: historical,
    resumeLibraryHealth: health,
    operatorReviewQueue: reviewItems,
    applicationLinkageReadiness: applicationReadiness({
      applicationStore: input.applicationStore,
      candidates: linkageResult.applicationCandidates,
      resumeVersions,
    }),
    auditSummary: {
      sourceRecordsInventoried: linkageResult.sourceInventory.length,
      assetCompatibleSourceRecords: linkageResult.sourceInventory.length,
      resumeVersions: resumeVersions.length,
      exactDuplicateGroups: exactGroups.length,
      formatDerivativeGroups: formatGroups.length,
      likelyVersionFamilies: likelyFamilies.length,
      operatorReviewQueueItems: reviewItems.length,
      applicationLinkageReadinessRecords: input.applicationStore.applications.length,
      applicationResumeLinksCreated: 0,
      resumeLinkConfirmedEventsCreated: 0,
      noResumeGenerated: true,
      noResumeMutated: true,
      noResumeRenamed: true,
      noResumeDeleted: true,
      noApplicationSubmitted: true,
      noMessageSent: true,
      noLinkedInMutated: true,
      noCareerFactPromoted: true,
      noCareerEvidenceMutated: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noOsConnection: true,
      noOperatorRouteCreated: true,
      privatePathVisibleInNormalOutput: false,
    },
  };
}

export function writeResumeAssetReconciliationOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: ResumeAssetReconciliationResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private resume asset reconciliation output root");
  const runDirectory = path.join(input.outputRoot, `j001_06b_${compactDate(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "resume_source_inventory.json": input.result.sourceInventory,
    "asset_compatible_source_records.json": input.result.assetCompatibleSources,
    "resume_versions.json": input.result.resumeVersions,
    "resume_version_reconciliation.json": input.result.resumeVersionReconciliation,
    "exact_duplicate_groups.json": input.result.exactDuplicateGroups,
    "format_derivative_groups.json": input.result.formatDerivativeGroups,
    "likely_version_families.json": input.result.likelyVersionFamilies,
    "fact_safety_summary.json": input.result.factSafetySummary,
    "source_integrity.json": input.result.sourceIntegrity,
    "historical_resume_versions.json": input.result.historicalResumeVersions,
    "resume_library_health.json": input.result.resumeLibraryHealth,
    "operator_review_queue.json": input.result.operatorReviewQueue,
    "application_linkage_readiness.json": input.result.applicationLinkageReadiness,
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

export function buildResumeAssetReconciliationCliSummary(result: ResumeAssetReconciliationResult) {
  return {
    workflowVersion: result.workflowVersion,
    sourceRootCount: result.approvedSourceAuthority.sourceRootCount,
    sourceRootsExist: result.approvedSourceAuthority.sourceRootsExist,
    sourceRecordsInventoried: result.auditSummary.sourceRecordsInventoried,
    assetCompatibleSourceRecords: result.auditSummary.assetCompatibleSourceRecords,
    documentClassification: result.documentClassification,
    resumeVersions: result.auditSummary.resumeVersions,
    exactDuplicateGroups: result.auditSummary.exactDuplicateGroups,
    formatDerivativeGroups: result.auditSummary.formatDerivativeGroups,
    likelyVersionFamilies: result.auditSummary.likelyVersionFamilies,
    operatorReviewQueueItems: result.auditSummary.operatorReviewQueueItems,
    applicationLinkageReadinessRecords: result.auditSummary.applicationLinkageReadinessRecords,
    sourceIntegrityUnchanged: result.sourceIntegrity.every((record) => record.unchanged),
    applicationResumeLinksCreated: result.auditSummary.applicationResumeLinksCreated,
    noResumeGenerated: result.auditSummary.noResumeGenerated,
    noResumeMutated: result.auditSummary.noResumeMutated,
    noResumeRenamed: result.auditSummary.noResumeRenamed,
    noResumeDeleted: result.auditSummary.noResumeDeleted,
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

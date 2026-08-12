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
import { homedir } from "node:os";
import * as path from "node:path";
import type { CareerEvidence, CareerFact } from "./careerEvidenceContracts";
import {
  type ApplicationIntelligenceClaimDisposition,
  type ApplicationIntelligencePacket,
  type ApplicationIntelligencePacketResult,
  loadApplicationIntelligencePacketResultFile,
  loadLatestApplicationIntelligencePacketResult,
} from "./applicationIntelligencePacket";
import { loadHighValueCareerEvidenceStore } from "./highValueCareerFactVerification";

export const TRUTH_BOUND_RESUME_DRAFT_VERSION =
  "CAREEROS_APPLICATION_INTELLIGENCE_V1_03";
export const APPLICATION_ARTIFACT_VERSION_SCHEMA_VERSION =
  "staffordos.careeros.application_artifact_version.v1";
export const TRUTH_BOUND_RESUME_DRAFT_RESULT_SCHEMA_VERSION =
  "staffordos.careeros.truth_bound_resume_draft_result.v1";
export const TRUTH_BOUND_RESUME_DRAFT_READ_MODEL_SCHEMA_VERSION =
  "staffordos.careeros.truth_bound_resume_draft_read_model.v1";
export const TRUTH_BOUND_RESUME_DRAFT_REVIEW_READ_MODEL_SCHEMA_VERSION =
  "staffordos.careeros.truth_bound_resume_draft_review_read_model.v1";

export const APPLICATION_ARTIFACT_TYPES = [
  "RESUME",
  "COVER_LETTER",
  "NETWORKING_MESSAGE",
] as const;

export const RESUME_DRAFT_SAFETY_STATES = [
  "DRAFT_READY_FOR_REVIEW",
  "DRAFT_NEEDS_EVIDENCE_REVIEW",
  "DRAFT_BLOCKED",
  "APPROVED_FOR_EXPORT",
] as const;

export const APPLICATION_ARTIFACT_OPERATOR_APPROVAL_STATES = [
  "PENDING_REVIEW",
  "APPROVED",
  "REQUEST_CHANGES",
  "REJECTED",
] as const;

export type ApplicationArtifactType = (typeof APPLICATION_ARTIFACT_TYPES)[number];
export type ResumeDraftSafetyState = (typeof RESUME_DRAFT_SAFETY_STATES)[number];
export type ApplicationArtifactOperatorApprovalState =
  (typeof APPLICATION_ARTIFACT_OPERATOR_APPROVAL_STATES)[number];

export type TruthBoundResumeDraftSectionName =
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications";

export type TruthBoundResumeDraftClaim = {
  claimId: string;
  section: TruthBoundResumeDraftSectionName;
  draftText: string;
  disposition: ApplicationIntelligenceClaimDisposition;
  packetRequirementIds: string[];
  careerFactIds: string[];
  careerEvidenceIds: string[];
  sourcePacketId: string;
  generatedFrom:
    | "CAREEROS_SAFE_POSITIONING"
    | "CAREERFACT_STATEMENT"
    | "CAREERFACT_FIELD";
  limitations: string[];
};

export type TruthBoundResumeDraftExperienceEntry = {
  employer: string | null;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  bullets: string[];
  claimIds: string[];
  limitations: string[];
};

export type TruthBoundResumeDraftProjectEntry = {
  label: string;
  bullets: string[];
  claimIds: string[];
  limitations: string[];
};

export type TruthBoundStructuredResumeDraft = {
  summary: string[];
  skills: string[];
  experience: TruthBoundResumeDraftExperienceEntry[];
  projects: TruthBoundResumeDraftProjectEntry[];
  education: string[];
  certifications: string[];
  claimRefs: string[];
};

export type TruthBoundResumeDraftValidationIssue = {
  issueId: string;
  claimId: string | null;
  code:
    | "NO_TRACEABLE_SUPPORTED_CLAIMS"
    | "MISSING_CAREERFACT_REFERENCE"
    | "MISSING_CAREER_EVIDENCE_REFERENCE"
    | "UNSUPPORTED_METRIC_OMITTED"
    | "UNSUPPORTED_REQUIREMENT_REMAINS"
    | "RESUME_CLAIM_BLOCKER_REMAINS"
    | "MISSING_CANONICAL_AUTHORITY_METADATA";
  severity: "BLOCKING" | "REVIEW";
  message: string;
  limitations: string[];
};

export type ApplicationArtifactVersion = {
  schemaVersion: typeof APPLICATION_ARTIFACT_VERSION_SCHEMA_VERSION;
  workflowVersion: typeof TRUTH_BOUND_RESUME_DRAFT_VERSION;
  artifactVersionId: string;
  artifactType: "RESUME";
  version: number;
  createdAt: string;
  workspaceId: "professional";
  applicationIntelligencePacketId: string;
  jobOpportunityId: string;
  company: string;
  role: string;
  sourceCareerAuthorityDigest: string;
  sourcePacketDigest: string;
  draftContentDigest: string;
  generationMethod: {
    method: "DETERMINISTIC_TRUTH_BOUND_ASSEMBLER";
    modelUsed: false;
    modelProvider: null;
    modelName: null;
    instructionVersion: null;
    externalAiUsed: false;
    ollamaUsed: false;
    limitations: string[];
  };
  draft: TruthBoundStructuredResumeDraft;
  claimTraceability: TruthBoundResumeDraftClaim[];
  validationIssues: TruthBoundResumeDraftValidationIssue[];
  omittedUnsupportedClaimCount: number;
  safetyState: ResumeDraftSafetyState;
  operatorApprovalState: ApplicationArtifactOperatorApprovalState;
  humanReviewRequired: true;
  supersedesArtifactVersionId: string | null;
  supersededByArtifactVersionId: string | null;
  fileReferences: Array<{
    fileReferenceId: string;
    fileKind: "STRUCTURED_JSON" | "DOCX" | "PDF";
    created: false;
    privatePathVisible: false;
    limitations: string[];
  }>;
  privacy: "Professional owner-private";
  applicationCreated: false;
  applicationSubmitted: false;
  resumeExported: false;
  resumeUploaded: false;
  coverLetterGenerated: false;
  messageSent: false;
  browserAutomationUsed: false;
  externalProviderCall: false;
  externalAiUsed: false;
  ollamaUsed: false;
  privatePathVisible: false;
  rawCareerEvidenceVisibleInReadModel: false;
  limitations: string[];
};

export type TruthBoundResumeDraftReadModelRecord = {
  schemaVersion: typeof TRUTH_BOUND_RESUME_DRAFT_READ_MODEL_SCHEMA_VERSION;
  artifactVersionId: string;
  packetId: string;
  jobOpportunityId: string;
  company: string;
  role: string;
  artifactType: "RESUME";
  version: number;
  safetyState: ResumeDraftSafetyState;
  operatorApprovalState: ApplicationArtifactOperatorApprovalState;
  humanReviewRequired: true;
  tracedClaimCount: number;
  blockedIssueCount: number;
  reviewIssueCount: number;
  omittedUnsupportedClaimCount: number;
  sectionCount: number;
  draftContentVisible: false;
  privatePathVisible: false;
  sourceAuthorityIdsVisible: false;
  nextAction: "REVIEW_DRAFT" | "REVIEW_EVIDENCE" | "BLOCKED";
  applicationCreated: false;
  applicationSubmitted: false;
  resumeExported: false;
  resumeUploaded: false;
  messageSent: false;
  limitations: string[];
};

export type TruthBoundResumeDraftReviewExperienceEntry = {
  employer: string | null;
  title: string | null;
  dateRange: string | null;
  bullets: string[];
  limitations: string[];
};

export type TruthBoundResumeDraftReviewProjectEntry = {
  label: string;
  bullets: string[];
  limitations: string[];
};

export type TruthBoundResumeDraftReviewReadModelRecord = {
  schemaVersion: typeof TRUTH_BOUND_RESUME_DRAFT_REVIEW_READ_MODEL_SCHEMA_VERSION;
  artifactVersionId: string;
  packetId: string;
  jobOpportunityId: string;
  company: string;
  role: string;
  artifactType: "RESUME";
  version: number;
  safetyState: ResumeDraftSafetyState;
  operatorApprovalState: ApplicationArtifactOperatorApprovalState;
  reviewStatus:
    | "READY_FOR_REVIEW"
    | "NEEDS_EVIDENCE_REVIEW"
    | "BLOCKED"
    | "APPROVED_FOR_EXPORT";
  approvalAllowed: boolean;
  requestChangesAllowed: boolean;
  rejectAllowed: boolean;
  humanReviewRequired: true;
  tracedClaimCount: number;
  blockedIssueCount: number;
  reviewIssueCount: number;
  omittedUnsupportedClaimCount: number;
  sections: {
    summary: string[];
    skills: string[];
    experience: TruthBoundResumeDraftReviewExperienceEntry[];
    projects: TruthBoundResumeDraftReviewProjectEntry[];
    education: string[];
    certifications: string[];
  };
  needsAttention: string[];
  draftContentVisible: true;
  privatePathVisible: false;
  sourceAuthorityIdsVisible: false;
  claimIdsVisible: false;
  careerFactIdsVisible: false;
  careerEvidenceIdsVisible: false;
  privateFilesystemPathVisible: false;
  nextAction: "REVIEW_DRAFT" | "REVIEW_EVIDENCE" | "BLOCKED" | "EXPORT_READY";
  applicationCreated: false;
  applicationSubmitted: false;
  resumeExported: false;
  resumeUploaded: false;
  messageSent: false;
  browserAutomationUsed: false;
  externalAiUsed: false;
  limitations: string[];
};

export type TruthBoundResumeDraftResult = {
  schemaVersion: typeof TRUTH_BOUND_RESUME_DRAFT_RESULT_SCHEMA_VERSION;
  workflowVersion: typeof TRUTH_BOUND_RESUME_DRAFT_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  modelExecutionAuthority: {
    approvedPrivateCareerOsModelPathFound: false;
    modelUsed: false;
    reason: string;
  };
  sourceAuthority: {
    applicationIntelligencePacketReused: true;
    careerFactsReused: true;
    careerEvidenceReused: true;
    resumeVersionsUsedAsCareerTruth: false;
    newCareerProfileCreated: false;
    applicationCreated: false;
  };
  artifactVersions: ApplicationArtifactVersion[];
  readModel: TruthBoundResumeDraftReadModelRecord[];
  summary: {
    packetsReviewed: number;
    resumeDraftsCreated: number;
    draftReadyForReview: number;
    draftNeedsEvidenceReview: number;
    draftBlocked: number;
    approvedForExport: 0;
    tracedClaims: number;
    omittedUnsupportedClaims: number;
    applicationsCreated: 0;
    applicationsSubmitted: 0;
    externalActions: 0;
  };
  auditSummary: {
    noModelCall: true;
    noExternalAi: true;
    noOllama: true;
    noResumeVersionSelfValidation: true;
    noCareerFactPromoted: true;
    noCareerEvidenceMutated: true;
    noApplicationCreated: true;
    noApplicationSubmitted: true;
    noMessageSent: true;
    noBrowserAutomation: true;
    noProviderCall: true;
    noDocxGenerated: true;
    noPdfGenerated: true;
    privatePathVisible: false;
    rawCareerEvidenceVisibleInReadModel: false;
  };
};

export type TruthBoundResumeDraftInput = {
  generatedAt: string;
  packetResult: ApplicationIntelligencePacketResult;
  careerFacts?: readonly Partial<CareerFact>[];
  careerEvidence?: readonly Partial<CareerEvidence>[];
  previousArtifactVersions?: readonly Partial<ApplicationArtifactVersion>[];
  packetIds?: readonly string[];
  limit?: number;
};

export type TruthBoundResumeDraftWriteResult = {
  runDirectory: string;
  artifactNames: string[];
  writtenFiles: string[];
  privatePathVisible: false;
};

const DEFAULT_JOB_SEARCH_PRIVATE_ROOT = path.join(
  homedir(),
  ".staffordos/private/professional/job-search",
);
const DEFAULT_PROFESSIONAL_CAREER_PRIVATE_ROOT = path.join(
  homedir(),
  ".staffordos/private/professional/career",
);

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function opaqueId(prefix: string, parts: readonly unknown[]) {
  return `${prefix}_${sha256Text(parts.map((part) => String(part ?? "")).join("|")).slice(0, 18)}`;
}

function compactTimestamp(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 14);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function uniqueSorted(values: readonly (string | null | undefined)[]) {
  return [...new Set(values.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

function factId(fact: Partial<CareerFact> | Record<string, unknown>) {
  return optionalText((fact as Record<string, unknown>).id);
}

function evidenceId(evidence: Partial<CareerEvidence> | Record<string, unknown>) {
  return optionalText((evidence as Record<string, unknown>).id);
}

function factStatement(fact: Partial<CareerFact> | Record<string, unknown>) {
  return optionalText((fact as Record<string, unknown>).statement);
}

function factType(fact: Partial<CareerFact> | Record<string, unknown>) {
  return optionalText((fact as Record<string, unknown>).factType) || "OTHER";
}

function factTechnology(fact: Partial<CareerFact> | Record<string, unknown>) {
  return optionalText((fact as Record<string, unknown>).technologyOrSkill);
}

function sourceEvidenceIds(fact: Partial<CareerFact> | Record<string, unknown>) {
  return stringArray((fact as Record<string, unknown>).sourceEvidenceIds);
}

function evidenceSupportsFactIds(evidence: Partial<CareerEvidence> | Record<string, unknown>) {
  return stringArray((evidence as Record<string, unknown>).supportsFactIds);
}

function factVerificationStatus(fact: Partial<CareerFact> | Record<string, unknown>) {
  return optionalText((fact as Record<string, unknown>).verificationStatus);
}

function factSupportLevel(fact: Partial<CareerFact> | Record<string, unknown>) {
  return optionalText((fact as Record<string, unknown>).supportLevel);
}

function isSupportedFact(fact: Partial<CareerFact> | Record<string, unknown> | null) {
  if (!fact) return false;
  const status = factVerificationStatus(fact);
  const support = factSupportLevel(fact);
  return (
    (status === "VERIFIED" || status === "PARTIALLY_SUPPORTED") &&
    support !== "CONFLICTING" &&
    support !== "INSUFFICIENT"
  );
}

function isEvidenceBackedLimitedFact(fact: Partial<CareerFact> | Record<string, unknown> | null) {
  if (!fact) return false;
  return factVerificationStatus(fact) === "PROPOSED";
}

function isGenericSafePositioning(text: string) {
  return (
    /^Position as adjacent or transferable experience; do not claim exact same-role experience\.$/i.test(text) ||
    /^Use limited wording that preserves scope, recency, depth, and unresolved limitations\.$/i.test(text) ||
    /^May be used with evidence-cited wording and no expansion beyond the verified fact\.$/i.test(text)
  );
}

function claimTextForSupport(input: {
  safePositioning: string;
  usableFacts: readonly (Partial<CareerFact> | Record<string, unknown>)[];
}) {
  const safePositioning = input.safePositioning.trim();
  if (safePositioning && !isGenericSafePositioning(safePositioning)) return safePositioning;
  return input.usableFacts.map(factStatement).find(Boolean) || safePositioning;
}

function uniqueClaimsByText(claims: readonly TruthBoundResumeDraftClaim[]) {
  const seen = new Set<string>();
  return claims.filter((claim) => {
    const key = claim.draftText.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function factHasMetricAuthority(fact: Partial<CareerFact> | Record<string, unknown> | null) {
  if (!fact) return false;
  const record = fact as Record<string, unknown>;
  return (
    optionalText(record.metricClassification) === "VERIFIED_METRIC" ||
    Boolean(optionalText(record.measurementAuthority))
  );
}

function containsNumericMetricClaim(text: string) {
  return /(\b\d+(?:\.\d+)?\s?%|\$\s?\d|\b\d+\+?\s+(?:years?|yrs?|months?|people|employees|customers|clients|markets|properties|web properties|teams|revenue|dollars)\b)/i.test(text);
}

function sectionForFactTypes(types: readonly string[]): TruthBoundResumeDraftSectionName {
  if (types.some((type) => type === "EDUCATION")) return "education";
  if (types.some((type) => type === "CERTIFICATION")) return "certifications";
  if (types.some((type) => type === "PROJECT" || type === "PRODUCT" || type === "ARCHITECTURE")) return "projects";
  if (types.some((type) => type === "EMPLOYMENT" || type === "ACHIEVEMENT" || type === "LEADERSHIP")) return "experience";
  return "skills";
}

function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function latestDirectory(root: string): string | null {
  if (!existsSync(root)) return null;
  const directories = readdirSync(root)
    .map((entry) => path.join(root, entry))
    .filter((entryPath) => {
      try {
        return statSync(entryPath).isDirectory();
      } catch (_error) {
        return false;
      }
    })
    .sort((left, right) => left.localeCompare(right));
  return directories[directories.length - 1] || null;
}

function latestJson<T>(root: string, filename: string): T | null {
  const directory = latestDirectory(root);
  if (!directory) return null;
  const filePath = path.join(directory, filename);
  if (!existsSync(filePath)) return null;
  return readJson<T>(filePath);
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

function buildAuthorityMaps(input: {
  careerFacts: readonly Partial<CareerFact>[];
  careerEvidence: readonly Partial<CareerEvidence>[];
}) {
  const facts = new Map<string, Partial<CareerFact>>();
  const evidence = new Map<string, Partial<CareerEvidence>>();
  for (const fact of input.careerFacts) {
    const id = factId(fact);
    if (id) facts.set(id, fact);
  }
  for (const item of input.careerEvidence) {
    const id = evidenceId(item);
    if (id) evidence.set(id, item);
  }
  return { facts, evidence };
}

function selectedPacketClaims(input: {
  packet: ApplicationIntelligencePacket;
  careerFacts: Map<string, Partial<CareerFact>>;
  careerEvidence: Map<string, Partial<CareerEvidence>>;
}) {
  const claims: TruthBoundResumeDraftClaim[] = [];
  const issues: TruthBoundResumeDraftValidationIssue[] = [];
  let omittedUnsupportedClaimCount = input.packet.gapsAndRisks.unsupportedRequirements.length +
    input.packet.resume.unsupportedClaims.length;

  for (const support of input.packet.verifiedCareerEvidence.supportingEvidence) {
    if (support.disposition !== "SUPPORTED" && support.disposition !== "SUPPORTED_WITH_LIMITATION") continue;
    const factIds = uniqueSorted(support.careerFactIds);
    const referencedFacts = factIds
      .map((id) => input.careerFacts.get(id) || null)
      .filter((fact): fact is Partial<CareerFact> => Boolean(fact));
    const evidenceIds = uniqueSorted([
      ...support.careerEvidenceIds,
      ...referencedFacts.flatMap(sourceEvidenceIds),
    ]);
    const supportedFacts = referencedFacts.filter(isSupportedFact);
    const linkedEvidence = evidenceIds
      .map((id) => input.careerEvidence.get(id) || null)
      .filter((item): item is Partial<CareerEvidence> => Boolean(item));
    const primaryFact = supportedFacts.find((fact) => Boolean(factStatement(fact))) || supportedFacts[0] || null;
    const usableFacts = primaryFact ? [primaryFact] : [];
    const usableFactIds = uniqueSorted(usableFacts.map(factId));
    const linkedEvidenceForUsableFacts = linkedEvidence.filter((item) =>
      evidenceSupportsFactIds(item).some((id) => usableFactIds.includes(id))
    );
    const linkedEvidenceIds = uniqueSorted(linkedEvidenceForUsableFacts.map(evidenceId).filter(Boolean));
    const factTypes = usableFacts.map((fact) => factType(fact));
    const positioningText = support.safePositioning.trim();
    const claimSeed = positioningText || support.requirementId || factIds.join(":");
    const claimId = opaqueId("privdraftclaim", [input.packet.packetId, support.requirementId, claimSeed]);
    if (!factIds.length) {
      issues.push({
        issueId: opaqueId("privdraftissue", [claimId, "missing_fact"]),
        claimId,
        code: "MISSING_CAREERFACT_REFERENCE",
        severity: "REVIEW",
        message: "A packet support item lacked a CareerFact reference and was not used as resume wording.",
        limitations: ["Resume draft claims require CareerFact traceability."],
      });
      continue;
    }
    if (!usableFacts.length) {
      omittedUnsupportedClaimCount += 1;
      continue;
    }
    if (!evidenceIds.length) {
      issues.push({
        issueId: opaqueId("privdraftissue", [claimId, "missing_evidence"]),
        claimId,
        code: "MISSING_CAREER_EVIDENCE_REFERENCE",
        severity: "REVIEW",
        message: "A packet support item lacked a CareerEvidence reference and was not used as resume wording.",
        limitations: ["Resume draft claims require CareerEvidence traceability."],
      });
      continue;
    }
    if (!linkedEvidenceIds.length) {
      issues.push({
        issueId: opaqueId("privdraftissue", [claimId, "missing_evidence_metadata"]),
        claimId,
        code: "MISSING_CAREER_EVIDENCE_REFERENCE",
        severity: "REVIEW",
        message: "A packet support item did not resolve to loaded CareerEvidence authority and was not used as resume wording.",
        limitations: ["Resume draft claims require loaded CareerEvidence authority, not just copied or stale evidence IDs."],
      });
      continue;
    }
    const text = claimTextForSupport({
      safePositioning: support.safePositioning,
      usableFacts,
    });
    if (!text) continue;
    const supportedByEvidence = new Set(linkedEvidence.flatMap(evidenceSupportsFactIds));
    if (!usableFactIds.some((id) => supportedByEvidence.has(id))) {
      issues.push({
        issueId: opaqueId("privdraftissue", [claimId, "evidence_does_not_support_fact"]),
        claimId,
        code: "MISSING_CANONICAL_AUTHORITY_METADATA",
        severity: "REVIEW",
        message: "Loaded CareerEvidence did not explicitly support the referenced CareerFact and was not used as resume wording.",
        limitations: ["CareerEvidence must explicitly support at least one referenced CareerFact before the wording is draft-ready."],
      });
      continue;
    }
    if (containsNumericMetricClaim(text) && !supportedFacts.some(factHasMetricAuthority)) {
      issues.push({
        issueId: opaqueId("privdraftissue", [claimId, "unsupported_metric"]),
        claimId,
        code: "UNSUPPORTED_METRIC_OMITTED",
        severity: "BLOCKING",
        message: "A numeric metric-like claim was omitted because no verified metric authority was linked.",
        limitations: ["Numbers, percentages, revenue, team sizes, client counts, and years claims require explicit metric authority."],
      });
      continue;
    }
    claims.push({
      claimId,
      section: sectionForFactTypes(factTypes),
      draftText: text,
      disposition: support.disposition,
      packetRequirementIds: [support.requirementId],
      careerFactIds: usableFactIds,
      careerEvidenceIds: linkedEvidenceIds,
      sourcePacketId: input.packet.packetId,
      generatedFrom: "CAREEROS_SAFE_POSITIONING",
      limitations: uniqueSorted([
        "Generated from existing CareerOS safe positioning; not from resume self-validation.",
        ...support.limitations,
      ]),
    });
  }

  if (!claims.length) {
    issues.push({
      issueId: opaqueId("privdraftissue", [input.packet.packetId, "no_traceable_claims"]),
      claimId: null,
      code: "NO_TRACEABLE_SUPPORTED_CLAIMS",
      severity: "BLOCKING",
      message: "No traceable supported CareerFact/CareerEvidence claims were available for a resume draft.",
      limitations: ["The packet can still guide evidence review, but cannot create user-facing resume wording yet."],
    });
  }

  return { claims, issues, omittedUnsupportedClaimCount };
}

function buildSkillClaims(input: {
  claims: readonly TruthBoundResumeDraftClaim[];
  careerFacts: Map<string, Partial<CareerFact>>;
}) {
  return uniqueSorted(
    input.claims.flatMap((claim) =>
      claim.careerFactIds.map((id) => factTechnology(input.careerFacts.get(id) || {})),
    ),
  ).slice(0, 18);
}

function employmentEntries(input: {
  claims: readonly TruthBoundResumeDraftClaim[];
  careerFacts: Map<string, Partial<CareerFact>>;
}): TruthBoundResumeDraftExperienceEntry[] {
  const employmentFacts = new Map<string, Partial<CareerFact>>();
  for (const claim of input.claims) {
    for (const id of claim.careerFactIds) {
      const fact = input.careerFacts.get(id);
      if (fact && factType(fact) === "EMPLOYMENT" && isSupportedFact(fact)) {
        employmentFacts.set(id, fact);
      }
    }
  }
  return [...employmentFacts.entries()]
    .map(([id, fact]) => {
      const factClaims = uniqueClaimsByText(input.claims.filter((claim) => claim.careerFactIds.includes(id)));
      const bullets = factClaims
        .map((claim) => claim.draftText)
        .slice(0, 4);
      return {
        employer: optionalText((fact as Record<string, unknown>).organization),
        title: optionalText((fact as Record<string, unknown>).roleOrTitle),
        startDate: optionalText((fact as Record<string, unknown>).startDate),
        endDate: optionalText((fact as Record<string, unknown>).endDate),
        bullets,
        claimIds: factClaims.slice(0, 4).map((claim) => claim.claimId),
        limitations: [
          "Employer, title, and dates are included only when present on supported CareerFact authority.",
          ...stringArray((fact as Record<string, unknown>).limitations),
        ],
      };
    })
    .filter((entry) => entry.employer || entry.title || entry.bullets.length)
    .slice(0, 6);
}

function projectEntries(claims: readonly TruthBoundResumeDraftClaim[]): TruthBoundResumeDraftProjectEntry[] {
  const projectClaims = uniqueClaimsByText(claims.filter((claim) => claim.section === "projects"));
  return projectClaims.slice(0, 6).map((claim) => ({
    label: "Selected supported project or product evidence",
    bullets: [claim.draftText],
    claimIds: [claim.claimId],
    limitations: [
      "Project wording is generated from traceable CareerOS safe positioning only.",
      ...claim.limitations,
    ],
  }));
}

function fieldFacts(input: {
  claims: readonly TruthBoundResumeDraftClaim[];
  careerFacts: Map<string, Partial<CareerFact>>;
  type: "EDUCATION" | "CERTIFICATION";
}) {
  const facts = new Map<string, Partial<CareerFact>>();
  for (const claim of input.claims) {
    for (const id of claim.careerFactIds) {
      const fact = input.careerFacts.get(id);
      if (fact && factType(fact) === input.type && isSupportedFact(fact)) facts.set(id, fact);
    }
  }
  return [...facts.values()].map((fact) => factStatement(fact)).filter((value): value is string => Boolean(value)).slice(0, 6);
}

function buildDraft(input: {
  packet: ApplicationIntelligencePacket;
  claims: readonly TruthBoundResumeDraftClaim[];
  careerFacts: Map<string, Partial<CareerFact>>;
}): TruthBoundStructuredResumeDraft {
  const uniqueClaims = uniqueClaimsByText(input.claims);
  const summaryClaims = uniqueClaims.slice(0, 3);
  return {
    summary: summaryClaims.map((claim) => claim.draftText),
    skills: buildSkillClaims({ claims: input.claims, careerFacts: input.careerFacts }),
    experience: employmentEntries({ claims: input.claims, careerFacts: input.careerFacts }),
    projects: projectEntries(input.claims),
    education: fieldFacts({ claims: input.claims, careerFacts: input.careerFacts, type: "EDUCATION" }),
    certifications: fieldFacts({ claims: input.claims, careerFacts: input.careerFacts, type: "CERTIFICATION" }),
    claimRefs: input.claims.map((claim) => claim.claimId),
  };
}

function safetyStateFor(input: {
  claims: readonly TruthBoundResumeDraftClaim[];
  issues: readonly TruthBoundResumeDraftValidationIssue[];
}) {
  if (!input.claims.length || input.issues.some((issue) => issue.severity === "BLOCKING")) return "DRAFT_BLOCKED" as const;
  if (input.issues.length > 0) return "DRAFT_NEEDS_EVIDENCE_REVIEW" as const;
  return "DRAFT_READY_FOR_REVIEW" as const;
}

function nextVersion(input: {
  packetId: string;
  previousArtifactVersions: readonly Partial<ApplicationArtifactVersion>[];
}) {
  const previous = input.previousArtifactVersions
    .filter((artifact) =>
      artifact.artifactType === "RESUME" &&
      artifact.applicationIntelligencePacketId === input.packetId &&
      typeof artifact.version === "number",
    )
    .sort((left, right) => (left.version || 0) - (right.version || 0));
  const latest = previous[previous.length - 1] || null;
  return {
    version: (latest?.version || 0) + 1,
    supersedesArtifactVersionId: optionalText(latest?.artifactVersionId),
  };
}

function sourceCareerAuthorityDigest(input: {
  claims: readonly TruthBoundResumeDraftClaim[];
  careerFacts: Map<string, Partial<CareerFact>>;
  careerEvidence: Map<string, Partial<CareerEvidence>>;
}) {
  const authority = input.claims.map((claim) => ({
    claimId: claim.claimId,
    careerFactIds: claim.careerFactIds,
    careerEvidenceIds: claim.careerEvidenceIds,
    facts: claim.careerFactIds.map((id) => {
      const fact = input.careerFacts.get(id);
      return fact
        ? {
            id,
            statement: factStatement(fact),
            verificationStatus: factVerificationStatus(fact),
            supportLevel: factSupportLevel(fact),
            sourceEvidenceIds: sourceEvidenceIds(fact),
          }
        : { id, missing: true };
    }),
    evidence: claim.careerEvidenceIds.map((id) => {
      const evidence = input.careerEvidence.get(id);
      return evidence
        ? {
            id,
            authorityClassification: optionalText((evidence as Record<string, unknown>).authorityClassification),
            supportsFactIds: stringArray((evidence as Record<string, unknown>).supportsFactIds),
            challengesFactIds: stringArray((evidence as Record<string, unknown>).challengesFactIds),
          }
        : { id, missing: true };
    }),
  }));
  return `sha256:${sha256Text(stableJson(authority))}`;
}

function artifactForPacket(input: {
  packet: ApplicationIntelligencePacket;
  generatedAt: string;
  careerFacts: Map<string, Partial<CareerFact>>;
  careerEvidence: Map<string, Partial<CareerEvidence>>;
  previousArtifactVersions: readonly Partial<ApplicationArtifactVersion>[];
}): ApplicationArtifactVersion {
  const selected = selectedPacketClaims({
    packet: input.packet,
    careerFacts: input.careerFacts,
    careerEvidence: input.careerEvidence,
  });
  const draft = buildDraft({
    packet: input.packet,
    claims: selected.claims,
    careerFacts: input.careerFacts,
  });
  const state = safetyStateFor({ claims: selected.claims, issues: selected.issues });
  const version = nextVersion({
    packetId: input.packet.packetId,
    previousArtifactVersions: input.previousArtifactVersions,
  });
  const sourceDigest = sourceCareerAuthorityDigest({
    claims: selected.claims,
    careerFacts: input.careerFacts,
    careerEvidence: input.careerEvidence,
  });
  const packetDigest = `sha256:${sha256Text(stableJson(input.packet))}`;
  const draftDigest = `sha256:${sha256Text(stableJson(draft))}`;
  const artifactVersionId = opaqueId("privappartifact", [
    input.packet.packetId,
    input.packet.identity.jobOpportunityId,
    version.version,
    sourceDigest,
    draftDigest,
  ]);

  return {
    schemaVersion: APPLICATION_ARTIFACT_VERSION_SCHEMA_VERSION,
    workflowVersion: TRUTH_BOUND_RESUME_DRAFT_VERSION,
    artifactVersionId,
    artifactType: "RESUME",
    version: version.version,
    createdAt: input.generatedAt,
    workspaceId: "professional",
    applicationIntelligencePacketId: input.packet.packetId,
    jobOpportunityId: input.packet.identity.jobOpportunityId,
    company: input.packet.identity.company,
    role: input.packet.identity.role,
    sourceCareerAuthorityDigest: sourceDigest,
    sourcePacketDigest: packetDigest,
    draftContentDigest: draftDigest,
    generationMethod: {
      method: "DETERMINISTIC_TRUTH_BOUND_ASSEMBLER",
      modelUsed: false,
      modelProvider: null,
      modelName: null,
      instructionVersion: null,
      externalAiUsed: false,
      ollamaUsed: false,
      limitations: [
        "No approved Professional CareerOS model execution path was found for private resume drafting.",
        "The draft is assembled deterministically from existing packet, CareerFact, and CareerEvidence authority.",
      ],
    },
    draft,
    claimTraceability: selected.claims,
    validationIssues: selected.issues,
    omittedUnsupportedClaimCount:
      selected.omittedUnsupportedClaimCount +
      selected.issues.filter((issue) => issue.code === "UNSUPPORTED_METRIC_OMITTED").length,
    safetyState: state,
    operatorApprovalState: "PENDING_REVIEW",
    humanReviewRequired: true,
    supersedesArtifactVersionId: version.supersedesArtifactVersionId,
    supersededByArtifactVersionId: null,
    fileReferences: [
      {
        fileReferenceId: opaqueId("privappartifactfile", [artifactVersionId, "structured_json"]),
        fileKind: "STRUCTURED_JSON",
        created: false,
        privatePathVisible: false,
        limitations: ["The structured draft is stored in owner-private JSON; no DOCX or PDF export is created in V1.03."],
      },
    ],
    privacy: "Professional owner-private",
    applicationCreated: false,
    applicationSubmitted: false,
    resumeExported: false,
    resumeUploaded: false,
    coverLetterGenerated: false,
    messageSent: false,
    browserAutomationUsed: false,
    externalProviderCall: false,
    externalAiUsed: false,
    ollamaUsed: false,
    privatePathVisible: false,
    rawCareerEvidenceVisibleInReadModel: false,
    limitations: [
      "Generated draft content is not automatically approved for export.",
      "Historical ResumeVersions are not used to verify career truth.",
      `Unsupported claims omitted: ${selected.omittedUnsupportedClaimCount}.`,
      "No Application, submission, upload, browser action, provider call, message, external AI, or Ollama action occurred.",
    ],
  };
}

function readModelFor(artifact: ApplicationArtifactVersion): TruthBoundResumeDraftReadModelRecord {
  const blockedIssueCount = artifact.validationIssues.filter((issue) => issue.severity === "BLOCKING").length;
  const reviewIssueCount = artifact.validationIssues.filter((issue) => issue.severity === "REVIEW").length;
  const nextAction =
    artifact.safetyState === "DRAFT_BLOCKED"
      ? "BLOCKED"
      : artifact.safetyState === "DRAFT_NEEDS_EVIDENCE_REVIEW"
        ? "REVIEW_EVIDENCE"
        : "REVIEW_DRAFT";
  const sectionCount = [
    artifact.draft.summary.length,
    artifact.draft.skills.length,
    artifact.draft.experience.length,
    artifact.draft.projects.length,
    artifact.draft.education.length,
    artifact.draft.certifications.length,
  ].filter((count) => count > 0).length;
  const omittedUnsupportedClaimCount = artifact.omittedUnsupportedClaimCount || 0;
  return {
    schemaVersion: TRUTH_BOUND_RESUME_DRAFT_READ_MODEL_SCHEMA_VERSION,
    artifactVersionId: artifact.artifactVersionId,
    packetId: artifact.applicationIntelligencePacketId,
    jobOpportunityId: artifact.jobOpportunityId,
    company: artifact.company,
    role: artifact.role,
    artifactType: "RESUME",
    version: artifact.version,
    safetyState: artifact.safetyState,
    operatorApprovalState: artifact.operatorApprovalState,
    humanReviewRequired: true,
    tracedClaimCount: artifact.claimTraceability.length,
    blockedIssueCount,
    reviewIssueCount,
    omittedUnsupportedClaimCount,
    sectionCount,
    draftContentVisible: false,
    privatePathVisible: false,
    sourceAuthorityIdsVisible: false,
    nextAction,
    applicationCreated: false,
    applicationSubmitted: false,
    resumeExported: false,
    resumeUploaded: false,
    messageSent: false,
    limitations: [
      "Read model excludes generated resume content, private paths, raw CareerEvidence, and source authority IDs.",
      "Review the owner-private draft artifact before any export or external use.",
    ],
  };
}

const INTERNAL_REFERENCE_PATTERN =
  /\b(?:priv|comb|career)[a-z0-9_]*(?:fact|evidence|artifact|packet|claim|source|digest)[a-z0-9_]*\b|sha256:[a-f0-9]+/gi;

function sanitizeReviewText(value: string) {
  return value.replace(INTERNAL_REFERENCE_PATTERN, "[private reference]").trim();
}

function sanitizeReviewTextList(values: readonly string[]) {
  return values
    .map((value) => sanitizeReviewText(value))
    .filter((value) => value.length > 0);
}

function dateRangeFor(entry: TruthBoundResumeDraftExperienceEntry) {
  if (!entry.startDate && !entry.endDate) return null;
  if (entry.startDate && entry.endDate) return `${entry.startDate} - ${entry.endDate}`;
  if (entry.startDate) return entry.startDate;
  return entry.endDate;
}

function reviewStatusFor(artifact: ApplicationArtifactVersion): TruthBoundResumeDraftReviewReadModelRecord["reviewStatus"] {
  if (artifact.safetyState === "APPROVED_FOR_EXPORT") return "APPROVED_FOR_EXPORT";
  if (artifact.safetyState === "DRAFT_READY_FOR_REVIEW") return "READY_FOR_REVIEW";
  if (artifact.safetyState === "DRAFT_NEEDS_EVIDENCE_REVIEW") return "NEEDS_EVIDENCE_REVIEW";
  return "BLOCKED";
}

function reviewNextActionFor(artifact: ApplicationArtifactVersion): TruthBoundResumeDraftReviewReadModelRecord["nextAction"] {
  if (artifact.safetyState === "APPROVED_FOR_EXPORT") return "EXPORT_READY";
  if (artifact.safetyState === "DRAFT_READY_FOR_REVIEW") return "REVIEW_DRAFT";
  if (artifact.safetyState === "DRAFT_NEEDS_EVIDENCE_REVIEW") return "REVIEW_EVIDENCE";
  return "BLOCKED";
}

function reviewNeedsAttention(artifact: ApplicationArtifactVersion) {
  const issueMessages = artifact.validationIssues.map((issue) => issue.message);
  const issueLimitations = artifact.validationIssues.flatMap((issue) => issue.limitations);
  return uniqueSorted([
    artifact.omittedUnsupportedClaimCount > 0
      ? `Unsupported claims omitted: ${artifact.omittedUnsupportedClaimCount}.`
      : null,
    ...issueMessages,
    ...issueLimitations,
  ]).map((item) => sanitizeReviewText(item));
}

function reviewReadModelFor(artifact: ApplicationArtifactVersion): TruthBoundResumeDraftReviewReadModelRecord {
  const blockedIssueCount = artifact.validationIssues.filter((issue) => issue.severity === "BLOCKING").length;
  const reviewIssueCount = artifact.validationIssues.filter((issue) => issue.severity === "REVIEW").length;
  const approvalAllowed =
    artifact.safetyState === "DRAFT_READY_FOR_REVIEW" &&
    artifact.operatorApprovalState === "PENDING_REVIEW" &&
    blockedIssueCount === 0;
  return {
    schemaVersion: TRUTH_BOUND_RESUME_DRAFT_REVIEW_READ_MODEL_SCHEMA_VERSION,
    artifactVersionId: artifact.artifactVersionId,
    packetId: artifact.applicationIntelligencePacketId,
    jobOpportunityId: artifact.jobOpportunityId,
    company: artifact.company,
    role: artifact.role,
    artifactType: "RESUME",
    version: artifact.version,
    safetyState: artifact.safetyState,
    operatorApprovalState: artifact.operatorApprovalState,
    reviewStatus: reviewStatusFor(artifact),
    approvalAllowed,
    requestChangesAllowed: artifact.operatorApprovalState === "PENDING_REVIEW",
    rejectAllowed: artifact.operatorApprovalState === "PENDING_REVIEW",
    humanReviewRequired: true,
    tracedClaimCount: artifact.claimTraceability.length,
    blockedIssueCount,
    reviewIssueCount,
    omittedUnsupportedClaimCount: artifact.omittedUnsupportedClaimCount || 0,
    sections: {
      summary: sanitizeReviewTextList(artifact.draft.summary),
      skills: sanitizeReviewTextList(artifact.draft.skills),
      experience: artifact.draft.experience.map((entry) => ({
        employer: entry.employer ? sanitizeReviewText(entry.employer) : null,
        title: entry.title ? sanitizeReviewText(entry.title) : null,
        dateRange: dateRangeFor(entry),
        bullets: sanitizeReviewTextList(entry.bullets),
        limitations: sanitizeReviewTextList(entry.limitations),
      })),
      projects: artifact.draft.projects.map((project) => ({
        label: sanitizeReviewText(project.label),
        bullets: sanitizeReviewTextList(project.bullets),
        limitations: sanitizeReviewTextList(project.limitations),
      })),
      education: sanitizeReviewTextList(artifact.draft.education),
      certifications: sanitizeReviewTextList(artifact.draft.certifications),
    },
    needsAttention: reviewNeedsAttention(artifact),
    draftContentVisible: true,
    privatePathVisible: false,
    sourceAuthorityIdsVisible: false,
    claimIdsVisible: false,
    careerFactIdsVisible: false,
    careerEvidenceIdsVisible: false,
    privateFilesystemPathVisible: false,
    nextAction: reviewNextActionFor(artifact),
    applicationCreated: false,
    applicationSubmitted: false,
    resumeExported: false,
    resumeUploaded: false,
    messageSent: false,
    browserAutomationUsed: false,
    externalAiUsed: false,
    limitations: [
      "Human-readable draft content is projected from the existing private ApplicationArtifactVersion.",
      "Claim IDs, CareerFact IDs, CareerEvidence IDs, source digests, packet internals, and filesystem paths remain private.",
      "The review view does not regenerate, rewrite, submit, message, browse, or call an external AI provider.",
      ...sanitizeReviewTextList(artifact.limitations),
    ],
  };
}

export function buildTruthBoundResumeDraftReviewReadModel(
  artifacts: readonly ApplicationArtifactVersion[],
): TruthBoundResumeDraftReviewReadModelRecord[] {
  return artifacts.map(reviewReadModelFor);
}

export function buildTruthBoundResumeDrafts(input: TruthBoundResumeDraftInput): TruthBoundResumeDraftResult {
  const maps = buildAuthorityMaps({
    careerFacts: input.careerFacts || [],
    careerEvidence: input.careerEvidence || [],
  });
  const filterIds = input.packetIds?.length ? new Set(input.packetIds) : null;
  const limit = typeof input.limit === "number" && input.limit > 0 ? input.limit : input.packetResult.packets.length;
  const selectedPackets = input.packetResult.packets
    .filter((packet) =>
      !filterIds ||
      filterIds.has(packet.packetId) ||
      filterIds.has(packet.identity.jobOpportunityId) ||
      filterIds.has(packet.identity.recommendationId),
    )
    .slice(0, limit);
  const artifactVersions = selectedPackets.map((packet) =>
    artifactForPacket({
      packet,
      generatedAt: input.generatedAt,
      careerFacts: maps.facts,
      careerEvidence: maps.evidence,
      previousArtifactVersions: input.previousArtifactVersions || [],
    }),
  );

  return {
    schemaVersion: TRUTH_BOUND_RESUME_DRAFT_RESULT_SCHEMA_VERSION,
    workflowVersion: TRUTH_BOUND_RESUME_DRAFT_VERSION,
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    modelExecutionAuthority: {
      approvedPrivateCareerOsModelPathFound: false,
      modelUsed: false,
      reason:
        "Existing model authority is limited to read-only Chief of Staff fixtures/proofs and does not authorize owner-private Professional resume drafting.",
    },
    sourceAuthority: {
      applicationIntelligencePacketReused: true,
      careerFactsReused: true,
      careerEvidenceReused: true,
      resumeVersionsUsedAsCareerTruth: false,
      newCareerProfileCreated: false,
      applicationCreated: false,
    },
    artifactVersions,
    readModel: artifactVersions.map(readModelFor),
    summary: {
      packetsReviewed: selectedPackets.length,
      resumeDraftsCreated: artifactVersions.length,
      draftReadyForReview: artifactVersions.filter((artifact) => artifact.safetyState === "DRAFT_READY_FOR_REVIEW").length,
      draftNeedsEvidenceReview: artifactVersions.filter((artifact) => artifact.safetyState === "DRAFT_NEEDS_EVIDENCE_REVIEW").length,
      draftBlocked: artifactVersions.filter((artifact) => artifact.safetyState === "DRAFT_BLOCKED").length,
      approvedForExport: 0,
      tracedClaims: artifactVersions.reduce((sum, artifact) => sum + artifact.claimTraceability.length, 0),
      omittedUnsupportedClaims: artifactVersions.reduce(
        (sum, artifact) => sum + (artifact.omittedUnsupportedClaimCount || 0),
        0,
      ),
      applicationsCreated: 0,
      applicationsSubmitted: 0,
      externalActions: 0,
    },
    auditSummary: {
      noModelCall: true,
      noExternalAi: true,
      noOllama: true,
      noResumeVersionSelfValidation: true,
      noCareerFactPromoted: true,
      noCareerEvidenceMutated: true,
      noApplicationCreated: true,
      noApplicationSubmitted: true,
      noMessageSent: true,
      noBrowserAutomation: true,
      noProviderCall: true,
      noDocxGenerated: true,
      noPdfGenerated: true,
      privatePathVisible: false,
      rawCareerEvidenceVisibleInReadModel: false,
    },
  };
}

export function applyApplicationArtifactReviewDecision(input: {
  artifact: ApplicationArtifactVersion;
  decision: Exclude<ApplicationArtifactOperatorApprovalState, "PENDING_REVIEW">;
  decidedAt: string;
}): ApplicationArtifactVersion {
  const approved =
    input.decision === "APPROVED" &&
    input.artifact.safetyState === "DRAFT_READY_FOR_REVIEW";
  return {
    ...input.artifact,
    operatorApprovalState: input.decision,
    safetyState: approved ? "APPROVED_FOR_EXPORT" : input.artifact.safetyState,
    limitations: uniqueSorted([
      ...input.artifact.limitations,
      `Operator review decision recorded at ${input.decidedAt}: ${input.decision}.`,
      approved ? "Approved for export means ready for a future export workflow only; no file was exported here." : null,
    ]),
    applicationCreated: false,
    applicationSubmitted: false,
    resumeExported: false,
    resumeUploaded: false,
    messageSent: false,
    browserAutomationUsed: false,
    externalProviderCall: false,
  };
}

export function writeTruthBoundResumeDraftOutputs(input: {
  outputRoot?: string;
  jobSearchRoot?: string;
  repositoryRoot: string;
  result: TruthBoundResumeDraftResult;
}): TruthBoundResumeDraftWriteResult {
  const outputRoot = input.outputRoot || path.join(
    input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT,
    "application-artifacts",
  );
  assertOutsideRepository(outputRoot, input.repositoryRoot, "Private Application Artifact output root");
  const runDirectory = path.join(outputRoot, `${TRUTH_BOUND_RESUME_DRAFT_VERSION}_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "truth_bound_resume_draft_result.json": input.result,
    "application_artifact_versions.json": input.result.artifactVersions,
    "resume_drafts.private.json": input.result.artifactVersions.map((artifact) => ({
      artifactVersionId: artifact.artifactVersionId,
      packetId: artifact.applicationIntelligencePacketId,
      jobOpportunityId: artifact.jobOpportunityId,
      draft: artifact.draft,
      draftContentDigest: artifact.draftContentDigest,
      privacy: artifact.privacy,
    })),
    "resume_draft_read_model.json": input.result.readModel,
    "claim_traceability.private.json": input.result.artifactVersions.flatMap((artifact) =>
      artifact.claimTraceability.map((claim) => ({
        artifactVersionId: artifact.artifactVersionId,
        ...claim,
      })),
    ),
    "draft_validation.private.json": input.result.artifactVersions.flatMap((artifact) =>
      artifact.validationIssues.map((issue) => ({
        artifactVersionId: artifact.artifactVersionId,
        packetId: artifact.applicationIntelligencePacketId,
        ...issue,
      })),
    ),
    "application_artifact_audit.json": input.result.auditSummary,
  };
  const writtenFiles: string[] = [];
  for (const [filename, value] of Object.entries(artifacts)) {
    const filePath = path.join(runDirectory, filename);
    writeJson(filePath, value);
    writtenFiles.push(filePath);
  }
  return {
    runDirectory,
    artifactNames: Object.keys(artifacts),
    writtenFiles,
    privatePathVisible: false,
  };
}

export function loadLatestApplicationArtifactVersions(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return latestJson<ApplicationArtifactVersion[]>(
    path.join(jobSearchRoot, "application-artifacts"),
    "application_artifact_versions.json",
  ) || [];
}

export function loadLatestTruthBoundResumeDraftReadModel(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return latestJson<TruthBoundResumeDraftReadModelRecord[]>(
    path.join(jobSearchRoot, "application-artifacts"),
    "resume_draft_read_model.json",
  ) || [];
}

export function loadLatestTruthBoundResumeDraftReviewReadModel(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return buildTruthBoundResumeDraftReviewReadModel(loadLatestApplicationArtifactVersions(jobSearchRoot));
}

export function loadLatestTruthBoundResumeDraftResult(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return latestJson<TruthBoundResumeDraftResult>(
    path.join(jobSearchRoot, "application-artifacts"),
    "truth_bound_resume_draft_result.json",
  );
}

export function loadPrivateCareerAuthorityForDrafts(input: {
  jobSearchRoot?: string;
  repositoryRoot?: string;
  careerRoots?: readonly string[];
}) {
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  const repositoryRoot = input.repositoryRoot || process.cwd();
  const careerRoots = input.careerRoots || uniqueSorted([
    DEFAULT_PROFESSIONAL_CAREER_PRIVATE_ROOT,
    jobSearchRoot,
  ]);
  return loadHighValueCareerEvidenceStore({
    careerRoots,
    repositoryRoot,
  });
}

export function buildTruthBoundResumeDraftCliSummary(
  result: TruthBoundResumeDraftResult,
  writtenCount = 0,
) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    packetsReviewed: result.summary.packetsReviewed,
    resumeDraftsCreated: result.summary.resumeDraftsCreated,
    draftReadyForReview: result.summary.draftReadyForReview,
    draftNeedsEvidenceReview: result.summary.draftNeedsEvidenceReview,
    draftBlocked: result.summary.draftBlocked,
    approvedForExport: result.summary.approvedForExport,
    tracedClaims: result.summary.tracedClaims,
    omittedUnsupportedClaims: result.summary.omittedUnsupportedClaims,
    privateArtifactsWritten: writtenCount,
    modelUsed: result.modelExecutionAuthority.modelUsed,
    noModelCall: result.auditSummary.noModelCall,
    noApplicationCreated: result.auditSummary.noApplicationCreated,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noMessageSent: result.auditSummary.noMessageSent,
    noDocxGenerated: result.auditSummary.noDocxGenerated,
    noPdfGenerated: result.auditSummary.noPdfGenerated,
    privatePathVisible: false,
  };
}

export function runTruthBoundResumeDraftsFromPrivateArtifacts(input: {
  generatedAt?: string;
  jobSearchRoot?: string;
  repositoryRoot?: string;
  writeOutputs?: boolean;
  packetIds?: readonly string[];
  limit?: number;
}) {
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  const repositoryRoot = input.repositoryRoot || process.cwd();
  const packetResult = loadLatestApplicationIntelligencePacketResult(jobSearchRoot);
  if (!packetResult) throw new Error("No latest Application Intelligence Packet result is available.");
  const careerStore = loadPrivateCareerAuthorityForDrafts({ jobSearchRoot, repositoryRoot });
  const result = buildTruthBoundResumeDrafts({
    generatedAt: input.generatedAt || new Date().toISOString(),
    packetResult,
    careerFacts: careerStore.facts as Partial<CareerFact>[],
    careerEvidence: careerStore.evidence as Partial<CareerEvidence>[],
    previousArtifactVersions: loadLatestApplicationArtifactVersions(jobSearchRoot),
    packetIds: input.packetIds,
    limit: input.limit ?? 1,
  });
  const writeResult = input.writeOutputs
    ? writeTruthBoundResumeDraftOutputs({
        jobSearchRoot,
        repositoryRoot,
        result,
      })
    : null;
  return { result, writeResult };
}

export function buildTruthBoundResumeDraftsFromFiles(input: {
  generatedAt: string;
  packetResultFile: string;
  careerFactsFile?: string | null;
  careerEvidenceFile?: string | null;
  outputRoot?: string | null;
  repositoryRoot: string;
  writeOutputs?: boolean;
  packetIds?: readonly string[];
  limit?: number;
}) {
  const result = buildTruthBoundResumeDrafts({
    generatedAt: input.generatedAt,
    packetResult: loadApplicationIntelligencePacketResultFile(input.packetResultFile),
    careerFacts: input.careerFactsFile ? readJson<Partial<CareerFact>[]>(input.careerFactsFile) : [],
    careerEvidence: input.careerEvidenceFile ? readJson<Partial<CareerEvidence>[]>(input.careerEvidenceFile) : [],
    packetIds: input.packetIds,
    limit: input.limit,
  });
  const writeResult = input.writeOutputs
    ? writeTruthBoundResumeDraftOutputs({
        outputRoot: input.outputRoot || undefined,
        repositoryRoot: input.repositoryRoot,
        result,
      })
    : null;
  return { result, writeResult };
}

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
import type { PrivateJobAnalysisBundle } from "./privateJobAnalysisWorkflow";
import type { PrivateNormalizedJobOpportunity } from "./privateJobOpportunityIntake";
import type {
  JobSourceImportQueueItem,
  NormalizedJobSourceRecord,
  PrivateJobSourceImportQueueResult,
} from "./privateJobSourceImportQueue";
import {
  loadQueueResultFile,
  type MissingSkillRecord,
  type OpportunityApplicationRecommendation,
  type OpportunityExplainableFitInput,
  type OpportunityRecommendationRecord,
  type OpportunityRecommendationResult,
  type ResumeReuseStatus,
  type SupportingCareerEvidenceRecord,
} from "./opportunityRecommendationEngine";
import { loadOpportunityRecommendationResultFile } from "./careerWorkflowActions";
import type {
  PrivateResumeClaimSafetyRecord,
  PrivateResumeVersionRecord,
  ResumeFactSafetyStatus,
} from "./resumeVersionApplicationLinkage";

export const APPLICATION_INTELLIGENCE_PACKET_VERSION =
  "CAREEROS_APPLICATION_INTELLIGENCE_V1_02";
export const APPLICATION_INTELLIGENCE_PACKET_SCHEMA_VERSION =
  "staffordos.careeros.application_intelligence_packet.v1";
export const APPLICATION_INTELLIGENCE_PACKET_RESULT_SCHEMA_VERSION =
  "staffordos.careeros.application_intelligence_packet_result.v1";
export const APPLICATION_INTELLIGENCE_PACKET_READ_MODEL_SCHEMA_VERSION =
  "staffordos.careeros.application_intelligence_packet_read_model.v1";

export const APPLICATION_INTELLIGENCE_CLAIM_DISPOSITIONS = [
  "SUPPORTED",
  "SUPPORTED_WITH_LIMITATION",
  "AMBIGUOUS",
  "UNSUPPORTED",
  "CONFLICTING",
  "NEEDS_OPERATOR_REVIEW",
] as const;

export const APPLICATION_INTELLIGENCE_NEXT_ACTIONS = [
  "REVIEW_RESUME",
  "REVIEW_EVIDENCE",
  "REVIEW_APPLICATION_PACKAGE",
  "READY_TO_APPLY",
  "SKIP",
  "HOLD",
] as const;

export type ApplicationIntelligenceClaimDisposition =
  (typeof APPLICATION_INTELLIGENCE_CLAIM_DISPOSITIONS)[number];
export type ApplicationIntelligenceNextAction =
  (typeof APPLICATION_INTELLIGENCE_NEXT_ACTIONS)[number];

export type ApplicationIntelligencePacketRequirement = {
  requirementId: string;
  requirementText: string;
  category: string;
  level: string;
  classification: string;
  disposition: ApplicationIntelligenceClaimDisposition;
  careerFactIds: string[];
  careerEvidenceIds: string[];
  safePositioning: string;
  limitations: string[];
};

export type ApplicationIntelligenceEvidenceReference = {
  requirementId: string;
  careerFactIds: string[];
  careerEvidenceIds: string[];
  disposition: ApplicationIntelligenceClaimDisposition;
  safePositioning: string;
  factAuthority: Array<{
    careerFactId: string;
    factType: string | null;
    verificationStatus: string | null;
    authorityClassification: string | null;
    disposition: ApplicationIntelligenceClaimDisposition;
    limitations: string[];
  }>;
  evidenceAuthority: Array<{
    careerEvidenceId: string;
    evidenceType: string | null;
    authorityClassification: string | null;
    supportLevel: string | null;
    disposition: ApplicationIntelligenceClaimDisposition;
    limitations: string[];
  }>;
  limitations: string[];
};

export type ApplicationIntelligenceResumeCandidate = {
  status: ResumeReuseStatus;
  resumeVersionId: string | null;
  safeLabel: string | null;
  factSafetyStatus: ResumeFactSafetyStatus | null;
  reviewStatus: PrivateResumeVersionRecord["reviewStatus"] | null;
  safetyState:
    | "SAFE_TO_REUSE"
    | "SAFE_WITH_LIMITATIONS"
    | "NEEDS_OPERATOR_REVIEW"
    | "NOT_SAFE_TO_REUSE"
    | "NO_RESUMEVERSION_AVAILABLE";
  safeToReuse: boolean;
  canReuseAsIs: boolean;
  whyBestCandidate: string[];
  claimSafetyLimitations: string[];
  unsupportedClaims: Array<{
    claimId: string;
    claimType: PrivateResumeClaimSafetyRecord["claimType"];
    safeClaimSummary: string;
    disposition: ApplicationIntelligenceClaimDisposition;
    limitations: string[];
  }>;
  evidenceGaps: string[];
  evaluatedResumeVersionCount: number;
  privatePathVisible: false;
  rawResumeTextVisible: false;
  resumeGenerated: false;
  resumeMutated: false;
};

export type ApplicationIntelligencePacket = {
  schemaVersion: typeof APPLICATION_INTELLIGENCE_PACKET_SCHEMA_VERSION;
  workflowVersion: typeof APPLICATION_INTELLIGENCE_PACKET_VERSION;
  packetId: string;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  identity: {
    jobOpportunityId: string;
    queueItemId: string;
    sourceRecordId: string;
    recommendationId: string;
    company: string;
    role: string;
    location: string | null;
    employmentType: string | null;
    compensation: string | null;
    canonicalSourceUrl: string | null;
    sourceUrlAuthority: "J002_SOURCE_RECORD" | "UNKNOWN";
    observedAt: string | null;
  };
  sourceProvenance: {
    providerName: string | null;
    providerId: string | null;
    providerType: string | null;
    sourceSnapshotId: string | null;
    sourceDigest: string | null;
    descriptionDigest: string | null;
    sourceAuthority: string | null;
    rawDescriptionStoredPrivately: boolean;
    limitations: string[];
  };
  fit: {
    explainableFitReused: true;
    recommendationReused: true;
    fitRecommendation: string | null;
    recommendationExplanation: string | null;
    coverage: OpportunityRecommendationRecord["explainableFit"]["coverage"];
    rankedLanes: Array<{
      label: string;
      weight: number;
      weightedScore: number;
      matchedTerms: string[];
    }>;
    fitRationale: string[];
    matchedRequirements: ApplicationIntelligencePacketRequirement[];
    unmatchedRequirements: ApplicationIntelligencePacketRequirement[];
    majorBlockers: string[];
    limitations: string[];
  };
  gapsAndRisks: {
    skillGaps: MissingSkillRecord[];
    evidenceGaps: ApplicationIntelligencePacketRequirement[];
    unsupportedRequirements: ApplicationIntelligencePacketRequirement[];
    seniorityConcerns: string[];
    geographicConcerns: string[];
    compensationConcerns: string[];
    overqualificationConcerns: string[];
    limitations: string[];
  };
  verifiedCareerEvidence: {
    supportingEvidence: ApplicationIntelligenceEvidenceReference[];
    supportedCapabilities: string[];
    supportedProjectsOrProducts: string[];
    supportedEnterpriseExperience: string[];
    careerFactReferenceCount: number;
    careerEvidenceReferenceCount: number;
    limitations: string[];
  };
  resume: ApplicationIntelligenceResumeCandidate;
  applicationDecision: {
    recommendation: OpportunityApplicationRecommendation;
    applicationReadiness: string;
    recommendedNextAction: string;
    deterministicNextAction: ApplicationIntelligenceNextAction;
    authorityRequired: "ROSS_APPROVAL_BEFORE_APPLICATION";
    humanReviewRequired: true;
  };
  claimDispositions: Array<{
    claimId: string;
    claimType: "JOB_REQUIREMENT_SUPPORT" | "RESUME_CLAIM_SAFETY";
    sourceReferenceId: string;
    disposition: ApplicationIntelligenceClaimDisposition;
    limitations: string[];
  }>;
  truthBoundary: {
    careerFactsAreAuthority: true;
    careerEvidenceSupportsFacts: true;
    resumesAreDownstreamArtifacts: true;
    resumeWordingDoesNotVerifyCareerTruth: true;
    unsupportedClaimsPromoted: false;
    limitations: string[];
  };
  applicationCreated: false;
  applicationSubmitted: false;
  resumeGenerated: false;
  resumeMutated: false;
  coverLetterGenerated: false;
  messageSent: false;
  externalProviderCall: false;
  browserAutomationUsed: false;
  externalAiUsed: false;
  ollamaUsed: false;
  privatePathVisible: false;
  rawJobTextVisible: false;
  rawResumeTextVisible: false;
  limitations: string[];
};

export type ApplicationIntelligencePacketReadModelRecord = {
  schemaVersion: typeof APPLICATION_INTELLIGENCE_PACKET_READ_MODEL_SCHEMA_VERSION;
  packetId: string;
  jobOpportunityId: string;
  company: string;
  role: string;
  recommendation: OpportunityApplicationRecommendation;
  fitRecommendation: string | null;
  fitSummary: string;
  rankedLaneLabels: string[];
  matchedRequirementCount: number;
  unmatchedRequirementCount: number;
  skillGapCount: number;
  evidenceGapCount: number;
  unsupportedRequirementCount: number;
  supportingEvidenceCount: number;
  careerFactReferenceCount: number;
  resumeVersionLabel: string | null;
  resumeVersionStatus: ResumeReuseStatus;
  resumeSafetyState: ApplicationIntelligenceResumeCandidate["safetyState"];
  resumeSafeToReuse: boolean;
  blockerCount: number;
  nextAction: ApplicationIntelligenceNextAction;
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

export type ApplicationIntelligencePacketResult = {
  schemaVersion: typeof APPLICATION_INTELLIGENCE_PACKET_RESULT_SCHEMA_VERSION;
  workflowVersion: typeof APPLICATION_INTELLIGENCE_PACKET_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  sourceAuthority: {
    jobOpportunityContractReused: true;
    opportunityQueueReused: true;
    explainableFitReused: true;
    recommendationEngineReused: true;
    careerEvidenceReused: true;
    resumeVersionAuthorityReused: true;
    applicationTrackingReusedForPrevention: true;
    newFitEngineCreated: false;
    newRecommendationEngineCreated: false;
    newResumeVersionModelCreated: false;
    newApplicationTrackerCreated: false;
  };
  packets: ApplicationIntelligencePacket[];
  readModel: ApplicationIntelligencePacketReadModelRecord[];
  skippedRecommendations: Array<{
    recommendationId: string;
    queueItemId: string;
    reason: "NORMALIZED_OPPORTUNITY_AUTHORITY_MISSING" | "FILTERED_BY_INPUT";
    limitations: string[];
  }>;
  summary: {
    recommendationsReviewed: number;
    packetsCreated: number;
    skippedWithoutNormalizedOpportunity: number;
    applyNow: number;
    review: number;
    wait: number;
    skip: number;
    packetsWithSafeResume: number;
    packetsWithResumeBlockers: number;
    packetsWithEvidenceGaps: number;
    unsupportedClaimsPromoted: 0;
    applicationsCreated: 0;
    applicationsSubmitted: 0;
    resumesGenerated: 0;
    resumesMutated: 0;
    messagesSent: 0;
  };
  auditSummary: {
    noFitEngineCreated: true;
    noRecommendationEngineCreated: true;
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
    unsupportedClaimsPromoted: false;
    privatePathVisible: false;
    rawJobTextVisible: false;
    rawResumeTextVisible: false;
  };
};

export type ApplicationIntelligencePacketInput = {
  generatedAt: string;
  queueResult: PrivateJobSourceImportQueueResult;
  recommendationResult: OpportunityRecommendationResult;
  explainableFitArtifacts?: readonly OpportunityExplainableFitInput[];
  analysisBundles?: readonly PrivateJobAnalysisBundle[];
  normalizedOpportunities?: readonly PrivateNormalizedJobOpportunity[];
  resumeVersions?: readonly Partial<PrivateResumeVersionRecord>[];
  careerFacts?: readonly Partial<CareerFact>[];
  careerEvidence?: readonly Partial<CareerEvidence>[];
  opportunityIds?: readonly string[];
};

export type ApplicationIntelligencePacketWriteResult = {
  runDirectory: string;
  artifactNames: string[];
  writtenFiles: string[];
  privatePathVisible: false;
};

const DEFAULT_JOB_SEARCH_PRIVATE_ROOT = path.join(
  homedir(),
  ".staffordos/private/professional/job-search",
);

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function opaqueId(prefix: string, parts: readonly unknown[]) {
  return `${prefix}_${sha256Text(parts.map((part) => String(part ?? "")).join("|")).slice(0, 18)}`;
}

function compactTimestamp(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 14);
}

function uniqueSorted(values: readonly (string | null | undefined)[]) {
  return [...new Set(values.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

function recordId(record: { id?: unknown }) {
  return typeof record.id === "string" && record.id ? record.id : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function mappingDisposition(classification: string): ApplicationIntelligenceClaimDisposition {
  if (classification === "PROVEN") return "SUPPORTED";
  if (classification === "PARTIAL" || classification === "TRANSFERABLE") return "SUPPORTED_WITH_LIMITATION";
  if (classification === "MISSING") return "UNSUPPORTED";
  return "NEEDS_OPERATOR_REVIEW";
}

function factDisposition(fact: Partial<CareerFact> | null): ApplicationIntelligenceClaimDisposition {
  if (!fact) return "NEEDS_OPERATOR_REVIEW";
  if (fact.verificationStatus === "VERIFIED") return "SUPPORTED";
  if (fact.verificationStatus === "PARTIALLY_SUPPORTED") return "SUPPORTED_WITH_LIMITATION";
  if (fact.verificationStatus === "CONFLICTING") return "CONFLICTING";
  if (fact.verificationStatus === "NEEDS_EVIDENCE") return "NEEDS_OPERATOR_REVIEW";
  if (fact.verificationStatus === "REJECTED") return "UNSUPPORTED";
  if (fact.verificationStatus === "HISTORICAL_ONLY" || fact.verificationStatus === "SUPERSEDED") return "AMBIGUOUS";
  return "NEEDS_OPERATOR_REVIEW";
}

function evidenceDisposition(evidence: Partial<CareerEvidence> | null): ApplicationIntelligenceClaimDisposition {
  if (!evidence) return "NEEDS_OPERATOR_REVIEW";
  if (evidence.authorityClassification === "NEEDS_VERIFICATION") return "NEEDS_OPERATOR_REVIEW";
  if (Array.isArray(evidence.challengesFactIds) && evidence.challengesFactIds.length > 0) return "CONFLICTING";
  if (evidence.authorityClassification === "GENERATED_DOCUMENT") return "AMBIGUOUS";
  return "SUPPORTED_WITH_LIMITATION";
}

function resumeClaimDisposition(classification: ResumeFactSafetyStatus): ApplicationIntelligenceClaimDisposition {
  if (classification === "SUPPORTED_VERIFIED") return "SUPPORTED";
  if (classification === "SUPPORTED_TRANSFERABLE" || classification === "PARTIALLY_SUPPORTED") return "SUPPORTED_WITH_LIMITATION";
  if (classification === "CONFLICTING") return "CONFLICTING";
  if (classification === "UNSUPPORTED") return "UNSUPPORTED";
  if (classification === "STALE") return "AMBIGUOUS";
  return "NEEDS_OPERATOR_REVIEW";
}

function analysisArtifactFromBundle(bundle: PrivateJobAnalysisBundle): OpportunityExplainableFitInput {
  return {
    opportunityId: bundle.opportunity.id,
    fitAssessment: bundle.fitAssessment,
    requirements: bundle.requirements,
    mappings: bundle.mappings,
    limitations: [
      "Existing private job analysis bundle was reused for packet assembly.",
      ...(bundle.auditSummary.summary.finalRecommendation ? [] : ["Fit recommendation summary was unavailable."]),
    ],
  };
}

function fitKeys(artifact: OpportunityExplainableFitInput) {
  return [
    artifact.queueItemId,
    artifact.sourceRecordId,
    artifact.opportunityId,
    artifact.fitAssessment?.opportunityId,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);
}

function buildFitLookup(input: ApplicationIntelligencePacketInput) {
  const lookup = new Map<string, OpportunityExplainableFitInput>();
  const artifacts = [
    ...(input.explainableFitArtifacts || []),
    ...(input.analysisBundles || []).map(analysisArtifactFromBundle),
  ];
  for (const artifact of artifacts) {
    for (const key of fitKeys(artifact)) {
      if (!lookup.has(key)) lookup.set(key, artifact);
    }
  }
  return lookup;
}

function findFit(record: OpportunityRecommendationRecord, lookup: Map<string, OpportunityExplainableFitInput>) {
  return (
    lookup.get(record.queueItemId) ||
    lookup.get(record.sourceRecordId) ||
    lookup.get(record.opportunityId) ||
    null
  );
}

function normalizedOpportunityId(input: {
  record: OpportunityRecommendationRecord;
  queueItem: JobSourceImportQueueItem | null;
  normalizedIds: ReadonlySet<string>;
}) {
  if (input.normalizedIds.has(input.record.opportunityId)) return input.record.opportunityId;
  if (input.queueItem?.normalizedOpportunityCandidateId) return input.queueItem.normalizedOpportunityCandidateId;
  return null;
}

function requirementMap(fit: OpportunityExplainableFitInput | null) {
  return new Map((fit?.requirements || []).map((requirement) => [requirement.id, requirement]));
}

function packetRequirement(input: {
  mapping: SupportingCareerEvidenceRecord | MissingSkillRecord;
  fit: OpportunityExplainableFitInput | null;
}): ApplicationIntelligencePacketRequirement {
  const requirements = requirementMap(input.fit);
  const requirement = requirements.get(input.mapping.requirementId);
  const supporting = input.mapping as SupportingCareerEvidenceRecord;
  const missing = input.mapping as MissingSkillRecord;
  const classification = "classification" in input.mapping ? input.mapping.classification : "UNKNOWN";
  return {
    requirementId: input.mapping.requirementId,
    requirementText: requirement?.requirementText || missing.requirementText || "UNKNOWN_REQUIREMENT",
    category: requirement?.requirementCategory || "Unknown",
    level: requirement?.requirementLevel || "UNCLEAR",
    classification,
    disposition: mappingDisposition(classification),
    careerFactIds: [...(supporting.careerFactIds || [])].sort(),
    careerEvidenceIds: [...(supporting.careerEvidenceIds || [])].sort(),
    safePositioning: supporting.safePositioning || "No supported positioning is available for this requirement.",
    limitations: [
      "Requirement disposition is inherited from existing CareerOS evidence mapping.",
      ...("limitations" in input.mapping ? input.mapping.limitations : []),
    ],
  };
}

function allRequirementPackets(input: {
  record: OpportunityRecommendationRecord;
  fit: OpportunityExplainableFitInput | null;
}) {
  const requirements = requirementMap(input.fit);
  const byRequirement = new Map<string, ApplicationIntelligencePacketRequirement>();
  for (const support of input.record.supportingCareerEvidence) {
    byRequirement.set(support.requirementId, packetRequirement({ mapping: support, fit: input.fit }));
  }
  for (const missing of input.record.missingSkills) {
    byRequirement.set(missing.requirementId, packetRequirement({ mapping: missing, fit: input.fit }));
  }
  for (const mapping of input.fit?.mappings || []) {
    if (!byRequirement.has(mapping.requirementId)) {
      const requirement = requirements.get(mapping.requirementId);
      byRequirement.set(mapping.requirementId, {
        requirementId: mapping.requirementId,
        requirementText: requirement?.requirementText || "UNKNOWN_REQUIREMENT",
        category: requirement?.requirementCategory || "Unknown",
        level: requirement?.requirementLevel || "UNCLEAR",
        classification: mapping.classification,
        disposition: mappingDisposition(mapping.classification),
        careerFactIds: [...mapping.careerFactIds].sort(),
        careerEvidenceIds: [...mapping.careerEvidenceIds].sort(),
        safePositioning: mapping.safePositioning,
        limitations: [
          "Requirement disposition is inherited from existing CareerOS evidence mapping.",
          ...mapping.supportLimitations,
        ],
      });
    }
  }
  return [...byRequirement.values()].sort((left, right) =>
    left.requirementId.localeCompare(right.requirementId),
  );
}

function evidenceReferences(input: {
  supporting: readonly SupportingCareerEvidenceRecord[];
  careerFacts: readonly Partial<CareerFact>[];
  careerEvidence: readonly Partial<CareerEvidence>[];
}): ApplicationIntelligenceEvidenceReference[] {
  const factById = new Map(input.careerFacts.map((fact) => [recordId(fact), fact]).filter((entry): entry is [string, Partial<CareerFact>] => Boolean(entry[0])));
  const evidenceById = new Map(input.careerEvidence.map((evidence) => [recordId(evidence), evidence]).filter((entry): entry is [string, Partial<CareerEvidence>] => Boolean(entry[0])));

  return input.supporting.map((support) => ({
    requirementId: support.requirementId,
    careerFactIds: [...support.careerFactIds].sort(),
    careerEvidenceIds: [...support.careerEvidenceIds].sort(),
    disposition: mappingDisposition(support.classification),
    safePositioning: support.safePositioning,
    factAuthority: [...support.careerFactIds].sort().map((careerFactId) => {
      const fact = factById.get(careerFactId) || null;
      return {
        careerFactId,
        factType: fact?.factType || null,
        verificationStatus: fact?.verificationStatus || null,
        authorityClassification: fact?.authorityClassification || null,
        disposition: factDisposition(fact),
        limitations: [
          fact ? "CareerFact authority metadata was supplied to packet assembly." : "CareerFact ID is referenced by mapping, but full fact metadata was not supplied.",
          ...(fact?.limitations || []),
        ],
      };
    }),
    evidenceAuthority: [...support.careerEvidenceIds].sort().map((careerEvidenceId) => {
      const evidence = evidenceById.get(careerEvidenceId) || null;
      return {
        careerEvidenceId,
        evidenceType: evidence?.evidenceType || evidence?.sourceType || null,
        authorityClassification: evidence?.authorityClassification || null,
        supportLevel: null,
        disposition: evidenceDisposition(evidence),
        limitations: [
          evidence ? "CareerEvidence authority metadata was supplied to packet assembly." : "CareerEvidence ID is referenced by mapping, but full evidence metadata was not supplied.",
          ...(evidence?.limitations || []),
        ],
      };
    }),
    limitations: [
      "Evidence is attached by reference; raw evidence text is not duplicated in the packet read model.",
      ...support.limitations,
    ],
  }));
}

function selectedOrBestEvaluation(record: OpportunityRecommendationRecord) {
  return (
    record.recommendedResumeVersion.evaluatedResumeVersions.find((evaluation) => evaluation.selectedAsRecommendation) ||
    record.recommendedResumeVersion.evaluatedResumeVersions[0] ||
    null
  );
}

function safetyState(input: {
  recommendationStatus: ResumeReuseStatus;
  factSafetyStatus: ResumeFactSafetyStatus | null;
  reviewStatus: PrivateResumeVersionRecord["reviewStatus"] | null;
}): ApplicationIntelligenceResumeCandidate["safetyState"] {
  if (input.recommendationStatus === "NO_RESUMEVERSION_AVAILABLE") return "NO_RESUMEVERSION_AVAILABLE";
  if (input.recommendationStatus === "NO_SAFE_EXISTING_RESUMEVERSION") return "NOT_SAFE_TO_REUSE";
  if (input.recommendationStatus === "REVIEW_BEFORE_REUSE") return "NEEDS_OPERATOR_REVIEW";
  if (input.factSafetyStatus === "SUPPORTED_VERIFIED" && input.reviewStatus === "OPERATOR_CONFIRMED") return "SAFE_TO_REUSE";
  if (input.factSafetyStatus === "SUPPORTED_TRANSFERABLE" && input.reviewStatus === "OPERATOR_CONFIRMED") return "SAFE_WITH_LIMITATIONS";
  return "NEEDS_OPERATOR_REVIEW";
}

function unsafeResumeClaims(version: Partial<PrivateResumeVersionRecord> | null) {
  return (version?.claimSafety || [])
    .filter((claim) => !["SUPPORTED_VERIFIED", "SUPPORTED_TRANSFERABLE"].includes(claim.classification))
    .map((claim) => ({
      claimId: claim.claimId,
      claimType: claim.claimType,
      safeClaimSummary: claim.safeClaimSummary,
      disposition: resumeClaimDisposition(claim.classification),
      limitations: [...claim.limitations],
    }));
}

function resumeCandidate(input: {
  record: OpportunityRecommendationRecord;
  resumeVersions: readonly Partial<PrivateResumeVersionRecord>[];
}): ApplicationIntelligenceResumeCandidate {
  const recommendation = input.record.recommendedResumeVersion;
  const evaluation = selectedOrBestEvaluation(input.record);
  const resumeVersionId = recommendation.resumeVersionId || evaluation?.resumeVersionId || null;
  const version = resumeVersionId
    ? input.resumeVersions.find((item) => item.resumeVersionId === resumeVersionId) || null
    : null;
  const factSafetyStatus =
    evaluation?.factSafetyStatus ||
    version?.factSafetyStatus ||
    null;
  const reviewStatus =
    evaluation?.reviewStatus ||
    version?.reviewStatus ||
    null;
  const state = safetyState({
    recommendationStatus: recommendation.status,
    factSafetyStatus,
    reviewStatus,
  });
  const unsupportedClaims = unsafeResumeClaims(version);
  const claimSafetyLimitations = uniqueSorted([
    ...recommendation.limitations,
    ...(evaluation?.safetyWarnings || []),
    ...(version?.limitations || []),
    version ? null : "Full ResumeVersion claim-safety metadata was not supplied; using existing recommendation evaluation only.",
  ]);
  const evidenceGaps = uniqueSorted([
    ...unsupportedClaims.flatMap((claim) => claim.limitations),
    state === "NEEDS_OPERATOR_REVIEW" ? "ResumeVersion requires operator or evidence review before reuse." : null,
    state === "NOT_SAFE_TO_REUSE" ? "ResumeVersion is not safe to reuse under current claim-safety authority." : null,
  ]);

  return {
    status: recommendation.status,
    resumeVersionId,
    safeLabel: recommendation.safeLabel || evaluation?.safeLabel || null,
    factSafetyStatus,
    reviewStatus,
    safetyState: state,
    safeToReuse: state === "SAFE_TO_REUSE" || state === "SAFE_WITH_LIMITATIONS",
    canReuseAsIs: state === "SAFE_TO_REUSE" && unsupportedClaims.length === 0,
    whyBestCandidate: uniqueSorted([
      recommendation.reason,
      ...(evaluation?.deterministicMatchReasons || []),
    ]),
    claimSafetyLimitations,
    unsupportedClaims,
    evidenceGaps,
    evaluatedResumeVersionCount: recommendation.evaluatedResumeVersions.length,
    privatePathVisible: false,
    rawResumeTextVisible: false,
    resumeGenerated: false,
    resumeMutated: false,
  };
}

function deterministicNextAction(input: {
  recommendation: OpportunityRecommendationRecord;
  resume: ApplicationIntelligenceResumeCandidate;
  unmatchedRequirements: readonly ApplicationIntelligencePacketRequirement[];
}) {
  if (input.recommendation.recommendation === "SKIP") return "SKIP" as const;
  if (input.recommendation.recommendation === "WAIT") return "HOLD" as const;
  if (!input.resume.safeToReuse) return "REVIEW_RESUME" as const;
  if (input.unmatchedRequirements.length > 0 || input.recommendation.missingSkills.length > 0) return "REVIEW_EVIDENCE" as const;
  if (input.recommendation.recommendation === "APPLY_NOW") return "READY_TO_APPLY" as const;
  return "REVIEW_APPLICATION_PACKAGE" as const;
}

function sourceProvenance(sourceRecord: NormalizedJobSourceRecord | null, queueItem: JobSourceImportQueueItem | null) {
  return {
    providerName: sourceRecord?.providerName || queueItem?.providerName || null,
    providerId: sourceRecord?.providerId || null,
    providerType: sourceRecord?.providerType || null,
    sourceSnapshotId: queueItem?.sourceSnapshotId || null,
    sourceDigest: sourceRecord?.sourceDigest || null,
    descriptionDigest: sourceRecord?.descriptionDigest || null,
    sourceAuthority: sourceRecord?.sourceAuthority || null,
    rawDescriptionStoredPrivately: Boolean(sourceRecord?.rawDescriptionStoredPrivately),
    limitations: [
      "Source provenance is reused from the existing Job Source Import Queue.",
      ...(sourceRecord?.limitations || []),
      ...(queueItem?.limitations || []),
    ],
  };
}

function concernRequirements(input: {
  requirements: readonly ApplicationIntelligencePacketRequirement[];
  categoryPattern: RegExp;
}) {
  return input.requirements
    .filter((requirement) => input.categoryPattern.test(requirement.category))
    .filter((requirement) => requirement.disposition !== "SUPPORTED")
    .map((requirement) => requirement.requirementText);
}

function packetFor(input: {
  generatedAt: string;
  record: OpportunityRecommendationRecord;
  queueItem: JobSourceImportQueueItem;
  sourceRecord: NormalizedJobSourceRecord | null;
  fit: OpportunityExplainableFitInput | null;
  jobOpportunityId: string;
  resumeVersions: readonly Partial<PrivateResumeVersionRecord>[];
  careerFacts: readonly Partial<CareerFact>[];
  careerEvidence: readonly Partial<CareerEvidence>[];
}): ApplicationIntelligencePacket {
  const requirements = allRequirementPackets({ record: input.record, fit: input.fit });
  const matchedRequirements = requirements.filter((requirement) =>
    requirement.disposition === "SUPPORTED" ||
    requirement.disposition === "SUPPORTED_WITH_LIMITATION",
  );
  const unmatchedRequirements = requirements.filter((requirement) =>
    requirement.disposition === "AMBIGUOUS" ||
    requirement.disposition === "UNSUPPORTED" ||
    requirement.disposition === "CONFLICTING" ||
    requirement.disposition === "NEEDS_OPERATOR_REVIEW",
  );
  const resume = resumeCandidate({ record: input.record, resumeVersions: input.resumeVersions });
  const evidence = evidenceReferences({
    supporting: input.record.supportingCareerEvidence,
    careerFacts: input.careerFacts,
    careerEvidence: input.careerEvidence,
  });
  const nextAction = deterministicNextAction({
    recommendation: input.record,
    resume,
    unmatchedRequirements,
  });
  const unsupportedRequirements = unmatchedRequirements.filter((requirement) => requirement.disposition === "UNSUPPORTED");
  const evidenceGaps = unmatchedRequirements.filter((requirement) =>
    requirement.disposition === "UNSUPPORTED" ||
    requirement.disposition === "NEEDS_OPERATOR_REVIEW" ||
    requirement.disposition === "AMBIGUOUS",
  );

  return {
    schemaVersion: APPLICATION_INTELLIGENCE_PACKET_SCHEMA_VERSION,
    workflowVersion: APPLICATION_INTELLIGENCE_PACKET_VERSION,
    packetId: opaqueId("privappintelpacket", [
      APPLICATION_INTELLIGENCE_PACKET_VERSION,
      input.record.recommendationId,
      input.jobOpportunityId,
      input.generatedAt,
    ]),
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    identity: {
      jobOpportunityId: input.jobOpportunityId,
      queueItemId: input.record.queueItemId,
      sourceRecordId: input.record.sourceRecordId,
      recommendationId: input.record.recommendationId,
      company: input.record.company,
      role: input.record.role,
      location: input.sourceRecord?.location || null,
      employmentType: input.sourceRecord?.employmentType || null,
      compensation: input.sourceRecord?.compensationText || null,
      canonicalSourceUrl: input.sourceRecord?.sourceUrl || null,
      sourceUrlAuthority: input.sourceRecord?.sourceUrl ? "J002_SOURCE_RECORD" : "UNKNOWN",
      observedAt: input.sourceRecord?.observedAt || input.queueItem.publicationDate || null,
    },
    sourceProvenance: sourceProvenance(input.sourceRecord, input.queueItem),
    fit: {
      explainableFitReused: true,
      recommendationReused: true,
      fitRecommendation: input.record.explainableFit.fitRecommendation,
      recommendationExplanation: input.record.explainableFit.fitAssessment?.recommendationExplanation || null,
      coverage: input.record.explainableFit.coverage,
      rankedLanes: input.queueItem.rankingSummary.categoryContributions.map((component) => ({
        label: component.label,
        weight: component.weight,
        weightedScore: component.weightedScore,
        matchedTerms: [...component.matchedTerms].sort(),
      })),
      fitRationale: uniqueSorted([
        ...input.record.recommendationReasons,
        ...input.queueItem.rankingSummary.whyRecommended,
        input.record.explainableFit.fitAssessment?.recommendationExplanation || null,
      ]),
      matchedRequirements,
      unmatchedRequirements,
      majorBlockers: [...input.record.explainableFit.majorBlockers],
      limitations: [
        "Fit details are reused from existing Explainable Fit and recommendation artifacts.",
        ...(input.fit?.limitations || []),
        ...input.record.explainableFit.limitations,
      ],
    },
    gapsAndRisks: {
      skillGaps: input.record.missingSkills,
      evidenceGaps,
      unsupportedRequirements,
      seniorityConcerns: [],
      geographicConcerns: concernRequirements({ requirements: unmatchedRequirements, categoryPattern: /location/i }),
      compensationConcerns: concernRequirements({ requirements: unmatchedRequirements, categoryPattern: /compensation/i }),
      overqualificationConcerns: [],
      limitations: [
        "Gap and risk output is deterministic and evidence-bound.",
        "No hiring, interview, or offer probability is generated.",
        "No deterministic seniority or overqualification authority is connected in this packet version.",
      ],
    },
    verifiedCareerEvidence: {
      supportingEvidence: evidence,
      supportedCapabilities: uniqueSorted(input.record.supportingCareerEvidence.map((item) => item.safePositioning)),
      supportedProjectsOrProducts: uniqueSorted(
        evidence.flatMap((item) =>
          item.factAuthority
            .filter((fact) => fact.factType === "PROJECT" || fact.factType === "PRODUCT")
            .map((fact) => fact.careerFactId),
        ),
      ),
      supportedEnterpriseExperience: uniqueSorted(
        evidence
          .filter((item) => /enterprise|stakeholder|platform|program|business technology/i.test(item.safePositioning))
          .flatMap((item) => item.careerFactIds),
      ),
      careerFactReferenceCount: uniqueSorted(input.record.supportingCareerEvidence.flatMap((item) => item.careerFactIds)).length,
      careerEvidenceReferenceCount: uniqueSorted(input.record.supportingCareerEvidence.flatMap((item) => item.careerEvidenceIds)).length,
      limitations: [
        "Career Evidence and CareerFact records are attached by reference.",
        "Raw Career Evidence text is not duplicated in the redacted packet read model.",
        "A resume remains downstream from CareerFact and CareerEvidence authority.",
      ],
    },
    resume,
    applicationDecision: {
      recommendation: input.record.recommendation,
      applicationReadiness: input.record.applicationReadiness,
      recommendedNextAction: input.record.recommendedNextAction,
      deterministicNextAction: nextAction,
      authorityRequired: "ROSS_APPROVAL_BEFORE_APPLICATION",
      humanReviewRequired: true,
    },
    claimDispositions: [
      ...requirements.map((requirement) => ({
        claimId: opaqueId("privappintelclaim", [input.record.recommendationId, requirement.requirementId]),
        claimType: "JOB_REQUIREMENT_SUPPORT" as const,
        sourceReferenceId: requirement.requirementId,
        disposition: requirement.disposition,
        limitations: [...requirement.limitations],
      })),
      ...resume.unsupportedClaims.map((claim) => ({
        claimId: claim.claimId,
        claimType: "RESUME_CLAIM_SAFETY" as const,
        sourceReferenceId: resume.resumeVersionId || "NO_RESUMEVERSION",
        disposition: claim.disposition,
        limitations: [...claim.limitations],
      })),
    ],
    truthBoundary: {
      careerFactsAreAuthority: true,
      careerEvidenceSupportsFacts: true,
      resumesAreDownstreamArtifacts: true,
      resumeWordingDoesNotVerifyCareerTruth: true,
      unsupportedClaimsPromoted: false,
      limitations: [
        "The packet can emphasize supported evidence but cannot create new Career truth.",
        "Unsupported metrics, dates, employers, titles, technologies, customer adoption, production use, revenue impact, and years of experience remain blocked.",
      ],
    },
    applicationCreated: false,
    applicationSubmitted: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    externalProviderCall: false,
    browserAutomationUsed: false,
    externalAiUsed: false,
    ollamaUsed: false,
    privatePathVisible: false,
    rawJobTextVisible: false,
    rawResumeTextVisible: false,
    limitations: [
      "Application Intelligence Packet is private planning output only.",
      "No application, resume, cover letter, message, provider action, browser action, external AI, or Ollama action is performed.",
      ...input.record.limitations,
    ],
  };
}

function readModelFor(packet: ApplicationIntelligencePacket): ApplicationIntelligencePacketReadModelRecord {
  const blockerCount =
    packet.fit.majorBlockers.length +
    packet.gapsAndRisks.evidenceGaps.length +
    packet.resume.evidenceGaps.length +
    packet.resume.unsupportedClaims.length;
  return {
    schemaVersion: APPLICATION_INTELLIGENCE_PACKET_READ_MODEL_SCHEMA_VERSION,
    packetId: packet.packetId,
    jobOpportunityId: packet.identity.jobOpportunityId,
    company: packet.identity.company,
    role: packet.identity.role,
    recommendation: packet.applicationDecision.recommendation,
    fitRecommendation: packet.fit.fitRecommendation,
    fitSummary: packet.fit.recommendationExplanation || packet.fit.fitRationale[0] || "Fit summary requires existing Explainable Fit authority.",
    rankedLaneLabels: packet.fit.rankedLanes
      .filter((lane) => lane.weightedScore > 0)
      .map((lane) => lane.label),
    matchedRequirementCount: packet.fit.matchedRequirements.length,
    unmatchedRequirementCount: packet.fit.unmatchedRequirements.length,
    skillGapCount: packet.gapsAndRisks.skillGaps.length,
    evidenceGapCount: packet.gapsAndRisks.evidenceGaps.length,
    unsupportedRequirementCount: packet.gapsAndRisks.unsupportedRequirements.length,
    supportingEvidenceCount: packet.verifiedCareerEvidence.supportingEvidence.length,
    careerFactReferenceCount: packet.verifiedCareerEvidence.careerFactReferenceCount,
    resumeVersionLabel: packet.resume.safeLabel,
    resumeVersionStatus: packet.resume.status,
    resumeSafetyState: packet.resume.safetyState,
    resumeSafeToReuse: packet.resume.safeToReuse,
    blockerCount,
    nextAction: packet.applicationDecision.deterministicNextAction,
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
      "Read model excludes raw job text, source URL value, private paths, raw resume text, and execution controls.",
      ...packet.limitations,
    ],
  };
}

export function buildApplicationIntelligencePackets(
  input: ApplicationIntelligencePacketInput,
): ApplicationIntelligencePacketResult {
  const queueById = new Map(input.queueResult.importQueue.map((item) => [item.queueItemId, item]));
  const sourceById = new Map(input.queueResult.normalizedSourceRecords.map((item) => [item.jobSourceRecordId, item]));
  const normalizedIds = new Set([
    ...input.queueResult.importedOpportunities.map((item) => item.id),
    ...(input.normalizedOpportunities || []).map((item) => item.id),
  ]);
  const filterIds = input.opportunityIds?.length ? new Set(input.opportunityIds) : null;
  const fitLookup = buildFitLookup(input);
  const skippedRecommendations: ApplicationIntelligencePacketResult["skippedRecommendations"] = [];
  const packets: ApplicationIntelligencePacket[] = [];

  for (const record of input.recommendationResult.recommendations) {
    const queueItem = queueById.get(record.queueItemId) || null;
    if (!queueItem) {
      skippedRecommendations.push({
        recommendationId: record.recommendationId,
        queueItemId: record.queueItemId,
        reason: "NORMALIZED_OPPORTUNITY_AUTHORITY_MISSING",
        limitations: ["Recommendation does not map to an existing Opportunity Queue item."],
      });
      continue;
    }
    const jobOpportunityId = normalizedOpportunityId({ record, queueItem, normalizedIds });
    if (!jobOpportunityId) {
      skippedRecommendations.push({
        recommendationId: record.recommendationId,
        queueItemId: record.queueItemId,
        reason: "NORMALIZED_OPPORTUNITY_AUTHORITY_MISSING",
        limitations: ["Packet generation requires an existing normalized JobOpportunity candidate or imported opportunity identity."],
      });
      continue;
    }
    if (filterIds && !filterIds.has(jobOpportunityId) && !filterIds.has(record.opportunityId) && !filterIds.has(record.queueItemId)) {
      skippedRecommendations.push({
        recommendationId: record.recommendationId,
        queueItemId: record.queueItemId,
        reason: "FILTERED_BY_INPUT",
        limitations: ["Recommendation was outside the requested opportunity filter."],
      });
      continue;
    }

    packets.push(packetFor({
      generatedAt: input.generatedAt,
      record,
      queueItem,
      sourceRecord: sourceById.get(record.sourceRecordId) || null,
      fit: findFit(record, fitLookup),
      jobOpportunityId,
      resumeVersions: input.resumeVersions || [],
      careerFacts: input.careerFacts || [],
      careerEvidence: input.careerEvidence || [],
    }));
  }

  return {
    schemaVersion: APPLICATION_INTELLIGENCE_PACKET_RESULT_SCHEMA_VERSION,
    workflowVersion: APPLICATION_INTELLIGENCE_PACKET_VERSION,
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {
      jobOpportunityContractReused: true,
      opportunityQueueReused: true,
      explainableFitReused: true,
      recommendationEngineReused: true,
      careerEvidenceReused: true,
      resumeVersionAuthorityReused: true,
      applicationTrackingReusedForPrevention: true,
      newFitEngineCreated: false,
      newRecommendationEngineCreated: false,
      newResumeVersionModelCreated: false,
      newApplicationTrackerCreated: false,
    },
    packets,
    readModel: packets.map(readModelFor),
    skippedRecommendations,
    summary: {
      recommendationsReviewed: input.recommendationResult.recommendations.length,
      packetsCreated: packets.length,
      skippedWithoutNormalizedOpportunity: skippedRecommendations.filter((item) => item.reason === "NORMALIZED_OPPORTUNITY_AUTHORITY_MISSING").length,
      applyNow: packets.filter((packet) => packet.applicationDecision.recommendation === "APPLY_NOW").length,
      review: packets.filter((packet) => packet.applicationDecision.recommendation === "REVIEW").length,
      wait: packets.filter((packet) => packet.applicationDecision.recommendation === "WAIT").length,
      skip: packets.filter((packet) => packet.applicationDecision.recommendation === "SKIP").length,
      packetsWithSafeResume: packets.filter((packet) => packet.resume.safeToReuse).length,
      packetsWithResumeBlockers: packets.filter((packet) => packet.resume.evidenceGaps.length || packet.resume.unsupportedClaims.length).length,
      packetsWithEvidenceGaps: packets.filter((packet) => packet.gapsAndRisks.evidenceGaps.length).length,
      unsupportedClaimsPromoted: 0,
      applicationsCreated: 0,
      applicationsSubmitted: 0,
      resumesGenerated: 0,
      resumesMutated: 0,
      messagesSent: 0,
    },
    auditSummary: {
      noFitEngineCreated: true,
      noRecommendationEngineCreated: true,
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
      unsupportedClaimsPromoted: false,
      privatePathVisible: false,
      rawJobTextVisible: false,
      rawResumeTextVisible: false,
    },
  };
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

export function writeApplicationIntelligencePacketOutputs(input: {
  outputRoot?: string;
  jobSearchRoot?: string;
  repositoryRoot: string;
  result: ApplicationIntelligencePacketResult;
}): ApplicationIntelligencePacketWriteResult {
  const outputRoot = input.outputRoot || path.join(
    input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT,
    "application-intelligence-packets",
  );
  assertOutsideRepository(outputRoot, input.repositoryRoot, "Private Application Intelligence Packet output root");
  const runDirectory = path.join(outputRoot, `${APPLICATION_INTELLIGENCE_PACKET_VERSION}_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "application_intelligence_packet_result.json": input.result,
    "application_intelligence_packets.json": input.result.packets,
    "application_intelligence_packet_read_model.json": input.result.readModel,
    "resume_blockers.json": input.result.packets.map((packet) => ({
      packetId: packet.packetId,
      jobOpportunityId: packet.identity.jobOpportunityId,
      resume: packet.resume,
      privatePathVisible: false,
      rawResumeTextVisible: false,
    })),
    "unsupported_claims.json": input.result.packets.flatMap((packet) =>
      packet.claimDispositions
        .filter((claim) => claim.disposition === "UNSUPPORTED" || claim.disposition === "CONFLICTING")
        .map((claim) => ({
          packetId: packet.packetId,
          jobOpportunityId: packet.identity.jobOpportunityId,
          ...claim,
        })),
    ),
    "application_intelligence_packet_audit.json": input.result.auditSummary,
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

export function loadApplicationIntelligencePacketResultFile(filePath: string): ApplicationIntelligencePacketResult {
  const record = readJson<{
    applicationIntelligencePacketResult?: ApplicationIntelligencePacketResult;
    result?: ApplicationIntelligencePacketResult;
    packets?: unknown;
    readModel?: unknown;
  }>(filePath);
  if (record.applicationIntelligencePacketResult) return record.applicationIntelligencePacketResult;
  if (record.result) return record.result;
  if (Array.isArray(record.packets) && Array.isArray(record.readModel)) {
    return record as unknown as ApplicationIntelligencePacketResult;
  }
  throw new Error("Application Intelligence Packet result file must contain a full packet result.");
}

export function loadApplicationIntelligencePacketReadModelFile(filePath: string): ApplicationIntelligencePacketReadModelRecord[] {
  const value = readJson<unknown>(filePath);
  if (Array.isArray(value)) return value as ApplicationIntelligencePacketReadModelRecord[];
  if (isRecord(value) && Array.isArray(value.readModel)) return value.readModel as ApplicationIntelligencePacketReadModelRecord[];
  return [];
}

export function loadLatestApplicationIntelligencePacketReadModel(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return latestJson<ApplicationIntelligencePacketReadModelRecord[]>(
    path.join(jobSearchRoot, "application-intelligence-packets"),
    "application_intelligence_packet_read_model.json",
  ) || [];
}

export function loadLatestApplicationIntelligencePacketResult(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return latestJson<ApplicationIntelligencePacketResult>(
    path.join(jobSearchRoot, "application-intelligence-packets"),
    "application_intelligence_packet_result.json",
  );
}

function loadLatestQueueResult(jobSearchRoot: string) {
  return (
    latestJson<PrivateJobSourceImportQueueResult>(
      path.join(jobSearchRoot, "greenhouse-discovery"),
      "job_source_import_queue_result.json",
    ) ||
    latestJson<PrivateJobSourceImportQueueResult>(
      path.join(jobSearchRoot, "job-source-import"),
      "job_source_import_queue_result.json",
    )
  );
}

function loadLatestFitArtifacts(jobSearchRoot: string) {
  return latestJson<OpportunityExplainableFitInput[]>(
    path.join(jobSearchRoot, "greenhouse-discovery"),
    "explainable_fit_artifacts.json",
  ) || [];
}

function loadLatestRecommendationResult(jobSearchRoot: string) {
  return latestJson<OpportunityRecommendationResult>(
    path.join(jobSearchRoot, "opportunity-recommendations"),
    "opportunity_recommendation_result.json",
  );
}

function loadLatestResumeVersions(jobSearchRoot: string) {
  return latestJson<PrivateResumeVersionRecord[]>(
    path.join(jobSearchRoot, "resume-asset-reconciliation"),
    "resume_versions.json",
  ) || [];
}

export function loadJobDescriptionIntakeResultFile(filePath: string): {
  queueResult: PrivateJobSourceImportQueueResult;
  recommendationResult: OpportunityRecommendationResult;
  analysisBundle?: PrivateJobAnalysisBundle | null;
  normalizedOpportunity?: PrivateNormalizedJobOpportunity | null;
  generatedAt?: string;
} {
  const value = readJson<{
    queueResult?: PrivateJobSourceImportQueueResult | null;
    recommendationResult?: OpportunityRecommendationResult | null;
    analysisBundle?: PrivateJobAnalysisBundle | null;
    normalizedOpportunity?: PrivateNormalizedJobOpportunity | null;
    generatedAt?: string;
  }>(filePath);
  if (!value.queueResult || !value.recommendationResult) {
    throw new Error("Job description intake result must include queueResult and recommendationResult.");
  }
  return {
    queueResult: value.queueResult,
    recommendationResult: value.recommendationResult,
    analysisBundle: value.analysisBundle,
    normalizedOpportunity: value.normalizedOpportunity,
    generatedAt: value.generatedAt,
  };
}

export function buildApplicationIntelligencePacketCliSummary(
  result: ApplicationIntelligencePacketResult,
  writtenCount = 0,
) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    recommendationsReviewed: result.summary.recommendationsReviewed,
    packetsCreated: result.summary.packetsCreated,
    skippedWithoutNormalizedOpportunity: result.summary.skippedWithoutNormalizedOpportunity,
    applyNow: result.summary.applyNow,
    review: result.summary.review,
    wait: result.summary.wait,
    skip: result.summary.skip,
    packetsWithSafeResume: result.summary.packetsWithSafeResume,
    packetsWithResumeBlockers: result.summary.packetsWithResumeBlockers,
    packetsWithEvidenceGaps: result.summary.packetsWithEvidenceGaps,
    privateArtifactsWritten: writtenCount,
    noApplicationCreated: result.auditSummary.noApplicationCreated,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noResumeGenerated: result.auditSummary.noResumeGenerated,
    noResumeMutated: result.auditSummary.noResumeMutated,
    noCoverLetterGenerated: result.auditSummary.noCoverLetterGenerated,
    noMessageSent: result.auditSummary.noMessageSent,
    noExternalProviderCall: result.auditSummary.noExternalProviderCall,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
    unsupportedClaimsPromoted: result.auditSummary.unsupportedClaimsPromoted,
    privatePathVisible: false,
  };
}

export function runApplicationIntelligencePacketsFromPrivateArtifacts(input: {
  generatedAt?: string;
  jobSearchRoot?: string;
  repositoryRoot?: string;
  writeOutputs?: boolean;
  opportunityIds?: readonly string[];
}) {
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  const repositoryRoot = input.repositoryRoot || process.cwd();
  const queueResult = loadLatestQueueResult(jobSearchRoot);
  const recommendationResult = loadLatestRecommendationResult(jobSearchRoot);
  if (!queueResult) throw new Error("No latest Job Source Import Queue result is available.");
  if (!recommendationResult) throw new Error("No latest Opportunity Recommendation result is available.");
  const result = buildApplicationIntelligencePackets({
    generatedAt: input.generatedAt || new Date().toISOString(),
    queueResult,
    recommendationResult,
    explainableFitArtifacts: loadLatestFitArtifacts(jobSearchRoot),
    resumeVersions: loadLatestResumeVersions(jobSearchRoot),
    opportunityIds: input.opportunityIds,
  });
  const writeResult = input.writeOutputs
    ? writeApplicationIntelligencePacketOutputs({
        jobSearchRoot,
        repositoryRoot,
        result,
      })
    : null;
  return { result, writeResult };
}

export function runApplicationIntelligencePacketFromIntakeResult(input: {
  intakeResultFile: string;
  generatedAt?: string;
  jobSearchRoot?: string;
  repositoryRoot?: string;
  resumeVersions?: readonly Partial<PrivateResumeVersionRecord>[];
  writeOutputs?: boolean;
}) {
  const intake = loadJobDescriptionIntakeResultFile(input.intakeResultFile);
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  const repositoryRoot = input.repositoryRoot || process.cwd();
  const result = buildApplicationIntelligencePackets({
    generatedAt: input.generatedAt || intake.generatedAt || new Date().toISOString(),
    queueResult: intake.queueResult,
    recommendationResult: intake.recommendationResult,
    analysisBundles: intake.analysisBundle ? [intake.analysisBundle] : [],
    normalizedOpportunities: intake.normalizedOpportunity ? [intake.normalizedOpportunity] : [],
    resumeVersions: input.resumeVersions || loadLatestResumeVersions(jobSearchRoot),
  });
  const writeResult = input.writeOutputs
    ? writeApplicationIntelligencePacketOutputs({
        jobSearchRoot,
        repositoryRoot,
        result,
      })
    : null;
  return { result, writeResult };
}

export function buildApplicationIntelligencePacketsFromFiles(input: {
  generatedAt: string;
  queueResultFile: string;
  recommendationResultFile: string;
  fitArtifactsFile?: string | null;
  resumeVersionsFile?: string | null;
  outputRoot?: string | null;
  repositoryRoot: string;
  writeOutputs?: boolean;
}) {
  const result = buildApplicationIntelligencePackets({
    generatedAt: input.generatedAt,
    queueResult: loadQueueResultFile(input.queueResultFile),
    recommendationResult: loadOpportunityRecommendationResultFile(input.recommendationResultFile),
    explainableFitArtifacts: input.fitArtifactsFile ? readJson<OpportunityExplainableFitInput[]>(input.fitArtifactsFile) : [],
    resumeVersions: input.resumeVersionsFile ? readJson<PrivateResumeVersionRecord[]>(input.resumeVersionsFile) : [],
  });
  const writeResult = input.writeOutputs
    ? writeApplicationIntelligencePacketOutputs({
        outputRoot: input.outputRoot || undefined,
        repositoryRoot: input.repositoryRoot,
        result,
      })
    : null;
  return { result, writeResult };
}

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
    label: string | null;
    statement: string | null;
    organization: string | null;
    roleOrTitle: string | null;
    technologyOrSkill: string | null;
    factType: string | null;
    verificationStatus: string | null;
    authorityClassification: string | null;
    disposition: ApplicationIntelligenceClaimDisposition;
    limitations: string[];
  }>;
  evidenceAuthority: Array<{
    careerEvidenceId: string;
    title: string | null;
    summary: string | null;
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

export type ApplicationIntelligenceHumanReviewProjection = {
  whyThisFits: string[];
  supportingExperience: Array<{
    label: string;
    detail: string;
    supportLevel: "Verified" | "Supported with limitation";
    limitations: string[];
  }>;
  gapsAndRisks: Array<{
    kind: "Clear gap" | "Needs verification" | "Uncertain" | "Conflicting evidence" | "Resume representation issue";
    requirement: string;
    detail: string;
  }>;
  resumeReadiness: {
    label: "Ready to tailor" | "Needs review" | "Blocked";
    detail: string;
    blockers: string[];
  };
  nextAction: string;
};

export type ApplicationIntelligencePacketReadModelRecord = {
  schemaVersion: typeof APPLICATION_INTELLIGENCE_PACKET_READ_MODEL_SCHEMA_VERSION;
  packetId: string;
  jobOpportunityId: string;
  recommendationId: string;
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
  humanReview: ApplicationIntelligenceHumanReviewProjection;
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

function uniqueInOrder(values: readonly (string | null | undefined)[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
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

const INTERNAL_REVIEW_TEXT_PATTERN =
  /\b(CareerFact|CareerEvidence|ApplicationArtifactVersion|ResumeVersion|authority digest|source digest|description digest|packet ID|claim ID)\b|career_fact|career_evidence|priv[a-z0-9_]+|sha256:|\/Users\//i;

const NON_ACTIONABLE_REQUIREMENT_PATTERN =
  /accommodation|medical condition|religious belief|privacy|collection statement|personal data|VEVRAA|federal contractor|equal opportunity|benefits|restricted stock|salary range|base salary range|compensation package|compensation awarded|successful candidates|applicant|application process|job scam|stay safe|official communication|sensitive information|purchase equipment|if in doubt|learn more|department:|requisition:|who you are|@/i;

function cleanOperatorText(value: string | null | undefined) {
  let text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  text = text
    .replace(/\bResumeVersion\b/g, "resume")
    .replace(/\bExplainable Fit\b/g, "fit review")
    .replace(/\boperator\b/gi, "Ross")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || INTERNAL_REVIEW_TEXT_PATTERN.test(text)) return null;
  return text;
}

function shortOperatorText(value: string | null | undefined, maxLength = 220) {
  const text = cleanOperatorText(value);
  if (!text) return null;
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}...`;
}

function actionableRequirementText(requirement: ApplicationIntelligencePacketRequirement) {
  const text = shortOperatorText(requirement.requirementText, 240);
  if (!text || NON_ACTIONABLE_REQUIREMENT_PATTERN.test(text)) return null;
  return text;
}

function factHumanLabel(fact: Partial<CareerFact> | null) {
  if (!fact) return null;
  const organization = cleanOperatorText(fact.organization);
  const role = cleanOperatorText(fact.roleOrTitle);
  const skill = cleanOperatorText(fact.technologyOrSkill);
  const statement = shortOperatorText(fact.statement, 180);
  const label = [organization, role || skill].filter(Boolean).join(" - ");
  return label || statement;
}

function evidenceHumanTitle(evidence: Partial<CareerEvidence> | null) {
  if (!evidence) return null;
  return cleanOperatorText(evidence.title) || shortOperatorText(evidence.summary, 180);
}

function evidenceHumanSummary(evidence: Partial<CareerEvidence> | null) {
  if (!evidence) return null;
  return shortOperatorText(evidence.summary, 220);
}

function supportLevelFor(disposition: ApplicationIntelligenceClaimDisposition) {
  return disposition === "SUPPORTED" ? "Verified" as const : "Supported with limitation" as const;
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
        label: factHumanLabel(fact),
        statement: shortOperatorText(fact?.statement, 220),
        organization: cleanOperatorText(fact?.organization),
        roleOrTitle: cleanOperatorText(fact?.roleOrTitle),
        technologyOrSkill: cleanOperatorText(fact?.technologyOrSkill),
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
        title: evidenceHumanTitle(evidence),
        summary: evidenceHumanSummary(evidence),
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

function factLookup(records: readonly Partial<CareerFact>[] = []) {
  return new Map(records.map((fact) => [recordId(fact), fact]).filter((entry): entry is [string, Partial<CareerFact>] => Boolean(entry[0])));
}

function evidenceLookup(records: readonly Partial<CareerEvidence>[] = []) {
  return new Map(records.map((evidence) => [recordId(evidence), evidence]).filter((entry): entry is [string, Partial<CareerEvidence>] => Boolean(entry[0])));
}

function requirementById(packet: ApplicationIntelligencePacket) {
  return new Map(
    [...packet.fit.matchedRequirements, ...packet.fit.unmatchedRequirements]
      .map((requirement) => [requirement.requirementId, requirement] as const),
  );
}

function whyFitReasons(packet: ApplicationIntelligencePacket) {
  const supportedRequirementReasons = packet.fit.matchedRequirements
    .filter((requirement) => requirement.disposition === "SUPPORTED" || requirement.disposition === "SUPPORTED_WITH_LIMITATION")
    .map((requirement) => {
      const requirementText = actionableRequirementText(requirement)?.replace(/[.]+$/, "");
      const positioning = cleanOperatorText(requirement.safePositioning);
      if (!requirementText || !positioning) return null;
      return `The role asks for ${requirementText}. ${positioning}`;
    });
  const fitRationale = packet.fit.fitRationale
    .map((reason) => shortOperatorText(reason, 220))
    .filter((reason): reason is string =>
      Boolean(reason && !/^\w[\w /-]+:\s*\d/i.test(reason) && !/\b(missing|unresolved|review|required|resume)\b/i.test(reason)),
    );

  return uniqueInOrder([...supportedRequirementReasons, ...fitRationale]).slice(0, 4);
}

function enrichedFactFor(
  factId: string,
  packetFact: ApplicationIntelligenceEvidenceReference["factAuthority"][number] | null,
  canonicalFacts: Map<string, Partial<CareerFact>>,
) {
  const fact = canonicalFacts.get(factId) || null;
  return {
    label: factHumanLabel(fact) || packetFact?.label || packetFact?.statement || null,
    statement: shortOperatorText(fact?.statement, 220) || packetFact?.statement || null,
    disposition: fact ? factDisposition(fact) : packetFact?.disposition || "NEEDS_OPERATOR_REVIEW" as const,
  };
}

function enrichedEvidenceFor(
  evidenceId: string,
  packetEvidence: ApplicationIntelligenceEvidenceReference["evidenceAuthority"][number] | null,
  canonicalEvidence: Map<string, Partial<CareerEvidence>>,
) {
  const evidence = canonicalEvidence.get(evidenceId) || null;
  return {
    title: evidenceHumanTitle(evidence) || packetEvidence?.title || null,
    summary: evidenceHumanSummary(evidence) || packetEvidence?.summary || null,
    disposition: evidence ? evidenceDisposition(evidence) : packetEvidence?.disposition || "NEEDS_OPERATOR_REVIEW" as const,
  };
}

function supportingExperience(
  packet: ApplicationIntelligencePacket,
  enrichment: { careerFacts?: readonly Partial<CareerFact>[]; careerEvidence?: readonly Partial<CareerEvidence>[] } = {},
): ApplicationIntelligenceHumanReviewProjection["supportingExperience"] {
  const requirements = requirementById(packet);
  const facts = factLookup(enrichment.careerFacts || []);
  const evidence = evidenceLookup(enrichment.careerEvidence || []);
  const rows = packet.verifiedCareerEvidence.supportingEvidence
    .filter((support) => support.disposition === "SUPPORTED" || support.disposition === "SUPPORTED_WITH_LIMITATION")
    .map((support) => {
      const packetFacts = new Map(support.factAuthority.map((fact) => [fact.careerFactId, fact]));
      const packetEvidence = new Map(support.evidenceAuthority.map((item) => [item.careerEvidenceId, item]));
      const factSummaries = support.careerFactIds
        .map((factId) => enrichedFactFor(factId, packetFacts.get(factId) || null, facts))
        .filter((fact) => fact.disposition === "SUPPORTED" || fact.disposition === "SUPPORTED_WITH_LIMITATION");
      const evidenceSummaries = support.careerEvidenceIds
        .map((evidenceId) => enrichedEvidenceFor(evidenceId, packetEvidence.get(evidenceId) || null, evidence))
        .filter((item) => item.disposition === "SUPPORTED" || item.disposition === "SUPPORTED_WITH_LIMITATION");
      const requirement = requirements.get(support.requirementId) || null;
      const requirementText = requirement ? actionableRequirementText(requirement) : null;
      const label =
        factSummaries.map((fact) => fact.label).find(Boolean) ||
        evidenceSummaries.map((item) => item.title).find(Boolean) ||
        (requirementText ? `Support for: ${requirementText}` : "Supporting experience");
      const summary =
        factSummaries.map((fact) => fact.statement).find(Boolean) ||
        evidenceSummaries.map((item) => item.summary).find(Boolean) ||
        cleanOperatorText(support.safePositioning) ||
        "Evidence is attached in the private record, but only a limited safe summary is available here.";
      const limitations = [
        support.disposition === "SUPPORTED_WITH_LIMITATION" ? "Treat this as adjacent or transferable, not exact same-role proof." : null,
        factSummaries.length || evidenceSummaries.length ? null : "Named evidence details are not included in this packet; the private record still contains the linked support.",
      ].filter((item): item is string => Boolean(item));

      return {
        label,
        detail: summary,
        supportLevel: supportLevelFor(support.disposition),
        limitations,
      };
    });

  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.label}|${row.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

function gapKind(disposition: ApplicationIntelligenceClaimDisposition): ApplicationIntelligenceHumanReviewProjection["gapsAndRisks"][number]["kind"] {
  if (disposition === "UNSUPPORTED") return "Clear gap";
  if (disposition === "AMBIGUOUS") return "Uncertain";
  if (disposition === "CONFLICTING") return "Conflicting evidence";
  return "Needs verification";
}

function gapDetail(disposition: ApplicationIntelligenceClaimDisposition) {
  if (disposition === "UNSUPPORTED") {
    return "No verified support is currently mapped. This is not proof Ross lacks it.";
  }
  if (disposition === "AMBIGUOUS") return "Some related experience may exist, but the current evidence is not clear enough to use confidently.";
  if (disposition === "CONFLICTING") return "Existing evidence conflicts and needs Ross's review before it is used.";
  return "The requirement needs evidence review before it can be used as a positive claim.";
}

function gapsAndRisks(packet: ApplicationIntelligencePacket): ApplicationIntelligenceHumanReviewProjection["gapsAndRisks"] {
  const requirementGaps = packet.gapsAndRisks.evidenceGaps
    .map((requirement) => {
      const requirementText = actionableRequirementText(requirement);
      if (!requirementText) return null;
      return {
        kind: gapKind(requirement.disposition),
        requirement: requirementText,
        detail: gapDetail(requirement.disposition),
      };
    })
    .filter((item): item is ApplicationIntelligenceHumanReviewProjection["gapsAndRisks"][number] => Boolean(item));
  const resumeGaps = packet.resume.unsupportedClaims
    .map((claim) => shortOperatorText(claim.safeClaimSummary, 220))
    .filter((claim): claim is string => Boolean(claim))
    .map((claim) => ({
      kind: "Resume representation issue" as const,
      requirement: claim,
      detail: "This resume wording is not safe to use until Ross reviews or removes it.",
    }));

  const seen = new Set<string>();
  return [...requirementGaps, ...resumeGaps].filter((gap) => {
    const key = `${gap.kind}|${gap.requirement}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

function resumeReadiness(packet: ApplicationIntelligencePacket): ApplicationIntelligenceHumanReviewProjection["resumeReadiness"] {
  const nonBlockingResumeNote =
    /\b(no resume was generated|generated, modified, copied, submitted, or uploaded|reuse candidate only|metadata was not supplied)\b/i;
  const blockers = uniqueInOrder([
    ...packet.resume.evidenceGaps,
    ...packet.resume.unsupportedClaims.map((claim) => claim.safeClaimSummary),
    ...packet.resume.claimSafetyLimitations,
  ].map((item) => shortOperatorText(item, 220)))
    .filter((item) => !nonBlockingResumeNote.test(item))
    .map((item) => item.replace(/^resume\b/, "The resume"))
    .slice(0, 5);

  if (packet.resume.safetyState === "SAFE_TO_REUSE" || packet.resume.safetyState === "SAFE_WITH_LIMITATIONS") {
    return {
      label: "Ready to tailor",
      detail: packet.resume.canReuseAsIs
        ? "The selected resume is safe to tailor from the current evidence."
        : "The selected resume can be used with the listed limitations reviewed.",
      blockers,
    };
  }
  if (packet.resume.safetyState === "NOT_SAFE_TO_REUSE" || packet.resume.safetyState === "NO_RESUMEVERSION_AVAILABLE") {
    return {
      label: "Blocked",
      detail: "CareerOS should not use this resume for the opportunity until Ross resolves the listed issue.",
      blockers: blockers.length ? blockers : ["No safe resume candidate is available for this opportunity."],
    };
  }
  return {
    label: "Needs review",
    detail: "The selected resume may be useful, but Ross needs to review evidence or wording before using it.",
    blockers: blockers.length ? blockers : ["Resume evidence or wording needs Ross's review before use."],
  };
}

function nextActionText(packet: ApplicationIntelligencePacket) {
  return cleanOperatorText(packet.applicationDecision.recommendedNextAction) ||
    "Review the opportunity and decide whether to continue.";
}

function humanReviewProjection(
  packet: ApplicationIntelligencePacket,
  enrichment: { careerFacts?: readonly Partial<CareerFact>[]; careerEvidence?: readonly Partial<CareerEvidence>[] } = {},
): ApplicationIntelligenceHumanReviewProjection {
  return {
    whyThisFits: whyFitReasons(packet),
    supportingExperience: supportingExperience(packet, enrichment),
    gapsAndRisks: gapsAndRisks(packet),
    resumeReadiness: resumeReadiness(packet),
    nextAction: nextActionText(packet),
  };
}

function readModelFor(
  packet: ApplicationIntelligencePacket,
  enrichment: { careerFacts?: readonly Partial<CareerFact>[]; careerEvidence?: readonly Partial<CareerEvidence>[] } = {},
): ApplicationIntelligencePacketReadModelRecord {
  const blockerCount =
    packet.fit.majorBlockers.length +
    packet.gapsAndRisks.evidenceGaps.length +
    packet.resume.evidenceGaps.length +
    packet.resume.unsupportedClaims.length;
  return {
    schemaVersion: APPLICATION_INTELLIGENCE_PACKET_READ_MODEL_SCHEMA_VERSION,
    packetId: packet.packetId,
    jobOpportunityId: packet.identity.jobOpportunityId,
    recommendationId: packet.identity.recommendationId,
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
    humanReview: humanReviewProjection(packet, enrichment),
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
    readModel: packets.map((packet) => readModelFor(packet)),
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
  const runId = createHash("sha256").update(JSON.stringify(input.result)).digest("hex").slice(0, 10);
  const runDirectory = path.join(outputRoot, `${APPLICATION_INTELLIGENCE_PACKET_VERSION}_${compactTimestamp(input.result.generatedAt)}_${runId}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "run_lineage.json": {
      workflowVersion: APPLICATION_INTELLIGENCE_PACKET_VERSION,
      generatedAt: input.result.generatedAt,
      runId,
      supersedesRunDirectory: readdirSync(outputRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${APPLICATION_INTELLIGENCE_PACKET_VERSION}_`) && entry.name !== path.basename(runDirectory))
        .map((entry) => entry.name)
        .sort()
        .at(-1) || null,
      privatePathVisible: false,
    },
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
    .sort((left, right) => statSync(left).mtimeMs - statSync(right).mtimeMs || left.localeCompare(right));
  return directories[directories.length - 1] || null;
}

function latestJson<T>(root: string, filename: string): T | null {
  const directory = latestDirectory(root);
  if (!directory) return null;
  const filePath = path.join(directory, filename);
  if (!existsSync(filePath)) return null;
  return readJson<T>(filePath);
}

function matchingFiles(root: string, filename: string, maxDepth = 5): string[] {
  if (!existsSync(root) || maxDepth < 0) return [];
  let entries: string[] = [];
  try {
    entries = readdirSync(root);
  } catch {
    return [];
  }
  const matches: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(root, entry);
    let stat = null;
    try {
      stat = statSync(entryPath);
    } catch {
      continue;
    }
    if (stat.isFile() && entry === filename) matches.push(entryPath);
    if (stat.isDirectory()) matches.push(...matchingFiles(entryPath, filename, maxDepth - 1));
  }
  return matches.sort((left, right) => left.localeCompare(right));
}

function safeJsonArray<T>(filePath: string): T[] {
  if (!existsSync(filePath)) return [];
  try {
    const value = readJson<unknown>(filePath);
    if (Array.isArray(value)) return value as T[];
    if (isRecord(value) && Array.isArray(value.records)) return value.records as T[];
    if (isRecord(value) && Array.isArray(value.careerFacts)) return value.careerFacts as T[];
    if (isRecord(value) && Array.isArray(value.careerEvidence)) return value.careerEvidence as T[];
  } catch {
    return [];
  }
  return [];
}

function uniqueRecordsById<T extends { id?: unknown }>(records: readonly T[]) {
  const byId = new Map<string, T>();
  for (const record of records) {
    const id = recordId(record);
    if (!id) continue;
    byId.set(id, record);
  }
  return [...byId.values()];
}

function lastItem<T>(items: readonly T[]) {
  return items.length ? items[items.length - 1] : undefined;
}

function loadLatestCanonicalCareerFacts(jobSearchRoot: string): Partial<CareerFact>[] {
  const professionalRoot = path.dirname(jobSearchRoot);
  const directFiles = [
    path.join(professionalRoot, "career/s010_02c/candidate_career_facts.private.json"),
    path.join(professionalRoot, "career/s010_02c2/combined_candidate_career_facts.private.json"),
  ];
  const latestFiles = [
    lastItem(matchingFiles(path.join(jobSearchRoot, "application-intelligence-evidence-unblock"), "canonical_career_facts.private.json")),
    lastItem(matchingFiles(path.join(professionalRoot, "career-evidence"), "canonical_career_facts.private.json")),
  ].filter((file): file is string => Boolean(file));
  return uniqueRecordsById([...directFiles, ...latestFiles].flatMap((file) => safeJsonArray<Partial<CareerFact>>(file)));
}

function loadLatestCanonicalCareerEvidence(jobSearchRoot: string): Partial<CareerEvidence>[] {
  const professionalRoot = path.dirname(jobSearchRoot);
  const directFiles = [
    path.join(professionalRoot, "career/s010_02c/career_evidence.private.json"),
    path.join(professionalRoot, "career/s010_02c2/combined_career_evidence.private.json"),
  ];
  const latestFiles = [
    lastItem(matchingFiles(path.join(jobSearchRoot, "application-intelligence-evidence-unblock"), "canonical_career_evidence.private.json")),
    lastItem(matchingFiles(path.join(jobSearchRoot, "operator-confirmed-evidence-promotion"), "career_evidence_promoted.private.json")),
    lastItem(matchingFiles(path.join(professionalRoot, "career-evidence"), "canonical_career_evidence.private.json")),
  ].filter((file): file is string => Boolean(file));
  return uniqueRecordsById([...directFiles, ...latestFiles].flatMap((file) => safeJsonArray<Partial<CareerEvidence>>(file)));
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
  const root = path.join(jobSearchRoot, "application-intelligence-packets");
  const result = latestJson<ApplicationIntelligencePacketResult>(root, "application_intelligence_packet_result.json");
  if (result?.packets?.length) {
    return result.packets.map((packet) => readModelFor(packet, {
      careerFacts: loadLatestCanonicalCareerFacts(jobSearchRoot),
      careerEvidence: loadLatestCanonicalCareerEvidence(jobSearchRoot),
    }));
  }
  return latestJson<ApplicationIntelligencePacketReadModelRecord[]>(
    root,
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

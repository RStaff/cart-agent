import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import type { PrivateRequirementEvidenceMapping } from "./candidateEvidenceMapper";
import type { PrivateJobFitAssessment } from "./jobFitAssessment";
import type { PrivateJobRequirementRecord } from "./jobRequirementExtractor";
import type {
  JobSourceImportQueueItem,
  PrivateJobSourceImportQueueResult,
} from "./privateJobSourceImportQueue";
import type {
  PrivateResumeVersionRecord,
  ResumeFactSafetyStatus,
} from "./resumeVersionApplicationLinkage";

export const OPPORTUNITY_RECOMMENDATION_ENGINE_VERSION = "J003.01";
export const OPPORTUNITY_RECOMMENDATION_SCHEMA_VERSION =
  "staffordos.job_search.private_opportunity_recommendation.v1";
export const OPPORTUNITY_RECOMMENDATION_RESULT_SCHEMA_VERSION =
  "staffordos.job_search.private_opportunity_recommendation_result.v1";
export const OPPORTUNITY_RECOMMENDATION_READ_MODEL_SCHEMA_VERSION =
  "staffordos.job_search.private_opportunity_recommendation_read_model.v1";

export const OPPORTUNITY_APPLICATION_RECOMMENDATIONS = [
  "APPLY_NOW",
  "REVIEW",
  "WAIT",
  "SKIP",
] as const;

export const APPLICATION_READINESS_STATES = [
  "READY_FOR_OPERATOR_APPROVED_APPLICATION",
  "NEEDS_EVIDENCE_REVIEW",
  "NEEDS_RESUME_REVIEW",
  "WAITING_FOR_SOURCE_OR_DUPLICATE_REVIEW",
  "BLOCKED_EXISTING_APPLICATION",
  "SKIP_RECOMMENDED",
] as const;

export const RESUME_REUSE_STATUSES = [
  "SELECTED_EXISTING_RESUMEVERSION",
  "REVIEW_BEFORE_REUSE",
  "NO_SAFE_EXISTING_RESUMEVERSION",
  "NO_RESUMEVERSION_AVAILABLE",
] as const;

export const RESUME_UPDATE_EFFORTS = [
  "NONE",
  "LOW",
  "MODERATE",
  "HIGH",
  "UNKNOWN",
] as const;

export type OpportunityApplicationRecommendation = (typeof OPPORTUNITY_APPLICATION_RECOMMENDATIONS)[number];
export type ApplicationReadinessState = (typeof APPLICATION_READINESS_STATES)[number];
export type ResumeReuseStatus = (typeof RESUME_REUSE_STATUSES)[number];
export type ResumeUpdateEffort = (typeof RESUME_UPDATE_EFFORTS)[number];

export type OpportunityExplainableFitInput = {
  queueItemId?: string | null;
  sourceRecordId?: string | null;
  opportunityId?: string | null;
  fitAssessment: PrivateJobFitAssessment;
  requirements?: readonly PrivateJobRequirementRecord[];
  mappings?: readonly PrivateRequirementEvidenceMapping[];
  limitations?: readonly string[];
};

export type ResumeVersionEvaluationRecord = {
  resumeVersionId: string;
  safeLabel: string;
  purpose: PrivateResumeVersionRecord["purpose"];
  documentFormat: PrivateResumeVersionRecord["documentFormat"];
  factSafetyStatus: ResumeFactSafetyStatus;
  reviewStatus: PrivateResumeVersionRecord["reviewStatus"];
  reuseStatus: "READY_TO_REUSE" | "REVIEW_BEFORE_REUSE" | "NOT_SAFE_TO_REUSE";
  deterministicMatchReasons: string[];
  safetyWarnings: string[];
  selectedAsRecommendation: boolean;
  limitations: string[];
  privatePathVisible: false;
  rawResumeTextVisible: false;
};

export type RecommendedResumeVersion = {
  status: ResumeReuseStatus;
  resumeVersionId: string | null;
  safeLabel: string | null;
  reason: string;
  evaluatedResumeVersions: ResumeVersionEvaluationRecord[];
  limitations: string[];
  privatePathVisible: false;
  rawResumeTextVisible: false;
  resumeGenerated: false;
  resumeMutated: false;
};

export type SupportingCareerEvidenceRecord = {
  requirementId: string;
  classification: PrivateRequirementEvidenceMapping["classification"];
  careerFactIds: string[];
  careerEvidenceIds: string[];
  safePositioning: string;
  limitations: string[];
};

export type MissingSkillRecord = {
  requirementId: string;
  requirementText: string;
  technologyOrSkill: string | null;
  classification: "MISSING" | "UNKNOWN";
  reason: string;
  limitations: string[];
};

export type OpportunityGapAnalysis = {
  missingSkills: MissingSkillRecord[];
  supportingCareerEvidence: SupportingCareerEvidenceRecord[];
  estimatedResumeUpdateEffort: ResumeUpdateEffort;
  limitations: string[];
};

export type OpportunityRecommendationRecord = {
  schemaVersion: typeof OPPORTUNITY_RECOMMENDATION_SCHEMA_VERSION;
  recommendationId: string;
  queueItemId: string;
  sourceRecordId: string;
  opportunityId: string;
  company: string;
  role: string;
  recommendation: OpportunityApplicationRecommendation;
  explainableFit: {
    available: boolean;
    fitAssessment: PrivateJobFitAssessment | null;
    fitRecommendation: string | null;
    coverage: PrivateJobFitAssessment["coverage"] | null;
    majorBlockers: string[];
    limitations: string[];
  };
  recommendedResumeVersion: RecommendedResumeVersion;
  supportingCareerEvidence: SupportingCareerEvidenceRecord[];
  missingSkills: MissingSkillRecord[];
  estimatedResumeUpdateEffort: ResumeUpdateEffort;
  applicationReadiness: ApplicationReadinessState;
  recommendedNextAction: string;
  recommendationReasons: string[];
  authorityRequired: "ROSS_APPROVAL_BEFORE_APPLICATION";
  completionProof: string;
  deterministicRulesOnly: true;
  hiringProbabilityGenerated: false;
  interviewProbabilityGenerated: false;
  aiConfidenceScoreGenerated: false;
  applicationSubmitted: false;
  applicationCreated: false;
  resumeGenerated: false;
  resumeMutated: false;
  coverLetterGenerated: false;
  messageSent: false;
  externalAiUsed: false;
  limitations: string[];
};

export type OpportunityRecommendationReadModelRecord = {
  schemaVersion: typeof OPPORTUNITY_RECOMMENDATION_READ_MODEL_SCHEMA_VERSION;
  recommendationId: string;
  queueItemId: string;
  company: string;
  role: string;
  recommendation: OpportunityApplicationRecommendation;
  applicationReadiness: ApplicationReadinessState;
  recommendedResumeVersion: {
    status: ResumeReuseStatus;
    safeLabel: string | null;
    factSafetyStatus: ResumeFactSafetyStatus | null;
  };
  missingSkillCount: number;
  supportingEvidenceCount: number;
  estimatedResumeUpdateEffort: ResumeUpdateEffort;
  recommendedNextAction: string;
  capturedAsOf: string;
  limitations: string[];
  privatePathVisible: false;
  rawResumeTextVisible: false;
  sourceUrlVisible: false;
  applicationActionAvailable: false;
  messageActionAvailable: false;
  resumeMutationAvailable: false;
};

export type OpportunityRecommendationResult = {
  schemaVersion: typeof OPPORTUNITY_RECOMMENDATION_RESULT_SCHEMA_VERSION;
  workflowVersion: typeof OPPORTUNITY_RECOMMENDATION_ENGINE_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  sourceAuthority: {
    opportunityQueueReused: true;
    explainableFitReused: true;
    resumeVersionAuthorityReused: true;
    discoveryRebuilt: false;
    providerAdded: false;
  };
  recommendations: OpportunityRecommendationRecord[];
  readModel: OpportunityRecommendationReadModelRecord[];
  summary: {
    queueItemsReviewed: number;
    recommendationsCreated: number;
    applyNow: number;
    review: number;
    wait: number;
    skip: number;
    resumeVersionsEvaluated: number;
    opportunitiesWithRecommendedResumeVersion: number;
    opportunitiesMissingSkills: number;
    readinessReadyForOperatorApprovedApplication: number;
    hiringProbabilityGenerated: false;
    interviewProbabilityGenerated: false;
    aiConfidenceScoreGenerated: false;
  };
  auditSummary: {
    noApplicationSubmitted: true;
    noApplicationCreated: true;
    noResumeGenerated: true;
    noResumeMutated: true;
    noCoverLetterGenerated: true;
    noMessageSent: true;
    noLinkedInMutated: true;
    noBrowserAutomation: true;
    noProviderAdded: true;
    noExternalProviderCall: true;
    noExternalAi: true;
    noOllama: true;
    noOsConnection: true;
    noOperatorConnection: true;
    noCareerFactPromoted: true;
    noCareerEvidenceMutated: true;
    privatePathVisible: false;
  };
};

export type OpportunityRecommendationEngineInput = {
  generatedAt: string;
  queueResult: PrivateJobSourceImportQueueResult;
  explainableFitArtifacts?: readonly OpportunityExplainableFitInput[];
  resumeVersions?: readonly PrivateResumeVersionRecord[];
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

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

const STOPWORDS = new Set([
  "and",
  "business",
  "for",
  "job",
  "lead",
  "manager",
  "of",
  "role",
  "senior",
  "staff",
  "the",
  "to",
  "with",
]);

function tokenize(value: unknown) {
  if (typeof value !== "string") return [];
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function normalized(value: unknown) {
  return tokenize(value).join(" ");
}

function queueOpportunityId(queueItem: JobSourceImportQueueItem) {
  return queueItem.normalizedOpportunityCandidateId || queueItem.queueItemId;
}

function safeResumeLabel(version: PrivateResumeVersionRecord) {
  const observed = version.observedAt ? version.observedAt.slice(0, 10) : "UNKNOWN_DATE";
  const suffix = version.resumeVersionId.slice(-8);
  return `${version.purpose} / ${version.documentFormat} / ${version.factSafetyStatus} / ${observed} / ${suffix}`;
}

function safetyFor(version: PrivateResumeVersionRecord): ResumeVersionEvaluationRecord["reuseStatus"] {
  if (version.factSafetyStatus === "CONFLICTING" || version.factSafetyStatus === "STALE" || version.factSafetyStatus === "UNSUPPORTED") {
    return "NOT_SAFE_TO_REUSE";
  }
  if (version.reviewStatus !== "OPERATOR_CONFIRMED") return "REVIEW_BEFORE_REUSE";
  if (version.factSafetyStatus === "SUPPORTED_VERIFIED" || version.factSafetyStatus === "SUPPORTED_TRANSFERABLE") {
    return "READY_TO_REUSE";
  }
  return "REVIEW_BEFORE_REUSE";
}

function safetyWarnings(version: PrivateResumeVersionRecord) {
  const warnings: string[] = [];
  if (version.reviewStatus !== "OPERATOR_CONFIRMED") {
    warnings.push("ResumeVersion still requires operator review before reuse.");
  }
  if (version.factSafetyStatus === "CONFLICTING") warnings.push("ResumeVersion has conflicting claim safety.");
  if (version.factSafetyStatus === "STALE") warnings.push("ResumeVersion is stale.");
  if (version.factSafetyStatus === "UNSUPPORTED") warnings.push("ResumeVersion contains unsupported claims.");
  if (version.factSafetyStatus === "NEEDS_EVIDENCE") warnings.push("ResumeVersion contains claims needing evidence.");
  if (version.factSafetyStatus === "UNKNOWN") warnings.push("ResumeVersion fact safety remains unknown.");
  if (version.factSafetyStatus === "PARTIALLY_SUPPORTED") warnings.push("ResumeVersion is only partially supported.");
  return warnings;
}

function roleSignals(queueItem: JobSourceImportQueueItem) {
  return unique([
    ...tokenize(queueItem.company),
    ...tokenize(queueItem.role),
    ...queueItem.rankingSummary.categoryContributions.flatMap((component) => component.matchedTerms.flatMap(tokenize)),
  ]);
}

function deterministicMatch(version: PrivateResumeVersionRecord, queueItem: JobSourceImportQueueItem) {
  const signals = new Set(roleSignals(queueItem));
  const company = normalized(queueItem.company);
  const role = normalized(queueItem.role);
  const targetCompany = normalized(version.targetCompanyReference);
  const targetRole = normalized(version.targetRoleReference);
  const targetFamily = normalized(version.targetRoleFamily);
  const reasons: string[] = [];
  let sortWeight = 0;

  if (targetCompany && company && targetCompany === company) {
    sortWeight += 50;
    reasons.push("Target company matches the opportunity company.");
  }
  if (targetRole && role && (role.includes(targetRole) || targetRole.includes(role))) {
    sortWeight += 40;
    reasons.push("Target role reference matches the opportunity role.");
  }
  const familyTokens = tokenize(targetFamily);
  const matchedFamilyTokens = familyTokens.filter((token) => signals.has(token) || role.includes(token));
  if (matchedFamilyTokens.length) {
    sortWeight += 10 + matchedFamilyTokens.length;
    reasons.push(`Target role family shares deterministic terms: ${matchedFamilyTokens.sort().join(", ")}.`);
  }
  if (version.purpose === "ROLE_TARGETED_RESUME") {
    sortWeight += 8;
    reasons.push("ResumeVersion is role-targeted.");
  }
  if (version.purpose === "GENERAL_RESUME") {
    sortWeight += 2;
    reasons.push("General ResumeVersion is available as a fallback.");
  }
  if (!reasons.length) {
    reasons.push("No deterministic company, role, or role-family match was found.");
  }

  return { sortWeight, reasons };
}

function evaluateResumeVersions(
  queueItem: JobSourceImportQueueItem,
  resumeVersions: readonly PrivateResumeVersionRecord[],
): { selected: PrivateResumeVersionRecord | null; evaluations: ResumeVersionEvaluationRecord[]; status: ResumeReuseStatus; reason: string } {
  if (!resumeVersions.length) {
    return {
      selected: null,
      evaluations: [],
      status: "NO_RESUMEVERSION_AVAILABLE",
      reason: "No existing ResumeVersion records were supplied to the recommendation engine.",
    };
  }

  const ranked = resumeVersions
    .map((version) => {
      const match = deterministicMatch(version, queueItem);
      const reuseStatus = safetyFor(version);
      const safetyWeight = reuseStatus === "READY_TO_REUSE" ? 100 : reuseStatus === "REVIEW_BEFORE_REUSE" ? 25 : -100;
      return { version, match, reuseStatus, orderWeight: safetyWeight + match.sortWeight };
    })
    .sort((left, right) => right.orderWeight - left.orderWeight || left.version.resumeVersionId.localeCompare(right.version.resumeVersionId));

  const selectedEntry = ranked.find((entry) => entry.reuseStatus !== "NOT_SAFE_TO_REUSE") || null;
  const selected = selectedEntry?.version || null;
  const evaluations = ranked.map((entry): ResumeVersionEvaluationRecord => ({
    resumeVersionId: entry.version.resumeVersionId,
    safeLabel: safeResumeLabel(entry.version),
    purpose: entry.version.purpose,
    documentFormat: entry.version.documentFormat,
    factSafetyStatus: entry.version.factSafetyStatus,
    reviewStatus: entry.version.reviewStatus,
    reuseStatus: entry.reuseStatus,
    deterministicMatchReasons: entry.match.reasons,
    safetyWarnings: safetyWarnings(entry.version),
    selectedAsRecommendation: selected?.resumeVersionId === entry.version.resumeVersionId,
    limitations: [
      "Selection uses deterministic ResumeVersion metadata only.",
      "ResumeVersion selection does not prove the resume should be reused without Ross approval.",
      "Resume content is not treated as Career truth.",
    ],
    privatePathVisible: false,
    rawResumeTextVisible: false,
  }));

  if (!selectedEntry || !selected) {
    return {
      selected: null,
      evaluations,
      status: "NO_SAFE_EXISTING_RESUMEVERSION",
      reason: "All supplied ResumeVersions are stale, conflicting, unsupported, or otherwise unsafe for reuse.",
    };
  }
  if (selectedEntry.reuseStatus === "READY_TO_REUSE") {
    return {
      selected,
      evaluations,
      status: "SELECTED_EXISTING_RESUMEVERSION",
      reason: "A reviewed ResumeVersion with supported fact safety is the best deterministic metadata match.",
    };
  }
  return {
    selected,
    evaluations,
    status: "REVIEW_BEFORE_REUSE",
    reason: "The best deterministic ResumeVersion candidate still needs operator or fact-safety review before reuse.",
  };
}

function fitKeyValues(artifact: OpportunityExplainableFitInput) {
  return [artifact.queueItemId, artifact.sourceRecordId, artifact.opportunityId, artifact.fitAssessment?.opportunityId]
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

function buildFitLookup(artifacts: readonly OpportunityExplainableFitInput[]) {
  const byKey = new Map<string, OpportunityExplainableFitInput>();
  for (const artifact of artifacts) {
    for (const key of fitKeyValues(artifact)) {
      if (!byKey.has(key)) byKey.set(key, artifact);
    }
  }
  return byKey;
}

function fitForQueueItem(queueItem: JobSourceImportQueueItem, lookup: Map<string, OpportunityExplainableFitInput>) {
  return lookup.get(queueItem.queueItemId) || lookup.get(queueItem.sourceRecordId) || lookup.get(queueOpportunityId(queueItem)) || null;
}

function supportingEvidence(mappings: readonly PrivateRequirementEvidenceMapping[] = []) {
  return mappings
    .filter((mapping) => ["PROVEN", "PARTIAL", "TRANSFERABLE"].includes(mapping.classification))
    .filter((mapping) => mapping.careerFactIds.length || mapping.careerEvidenceIds.length || mapping.safePositioning)
    .map((mapping): SupportingCareerEvidenceRecord => ({
      requirementId: mapping.requirementId,
      classification: mapping.classification,
      careerFactIds: [...mapping.careerFactIds].sort(),
      careerEvidenceIds: [...mapping.careerEvidenceIds].sort(),
      safePositioning: mapping.safePositioning,
      limitations: [
        "Supporting evidence is reused from existing CareerOS mapping output.",
        "A job posting does not verify Career facts.",
        ...mapping.supportLimitations,
      ],
    }));
}

function isMissingSkillMapping(
  mapping: PrivateRequirementEvidenceMapping,
): mapping is PrivateRequirementEvidenceMapping & { classification: "MISSING" | "UNKNOWN" } {
  return mapping.classification === "MISSING" || mapping.classification === "UNKNOWN";
}

function missingSkills(
  requirements: readonly PrivateJobRequirementRecord[] = [],
  mappings: readonly PrivateRequirementEvidenceMapping[] = [],
) {
  const requirementById = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  return mappings
    .filter(isMissingSkillMapping)
    .map((mapping): MissingSkillRecord => {
      const requirement = requirementById.get(mapping.requirementId);
      return {
        requirementId: mapping.requirementId,
        requirementText: requirement?.requirementText || "UNKNOWN_REQUIREMENT",
        technologyOrSkill: requirement?.technologyOrSkill || null,
        classification: mapping.classification,
        reason:
          mapping.classification === "MISSING"
            ? "Existing CareerOS evidence has no mapped support for this requirement."
            : "Existing CareerOS evidence mapping remains unresolved or requires Ross review.",
        limitations: [
          "Missing skill output is a review queue, not a statement that Ross lacks the skill.",
          "Career facts are not promoted by this recommendation engine.",
        ],
      };
    });
}

function estimateResumeUpdateEffort(input: {
  fit: OpportunityExplainableFitInput | null;
  selectedResume: RecommendedResumeVersion;
  missingSkills: readonly MissingSkillRecord[];
}): ResumeUpdateEffort {
  if (!input.fit) return "UNKNOWN";
  if (
    input.selectedResume.status === "NO_RESUMEVERSION_AVAILABLE" ||
    input.selectedResume.status === "NO_SAFE_EXISTING_RESUMEVERSION" ||
    input.missingSkills.length >= 6
  ) {
    return "HIGH";
  }
  if (input.selectedResume.status === "REVIEW_BEFORE_REUSE" || input.missingSkills.length >= 3) {
    return "MODERATE";
  }
  if (input.missingSkills.length > 0 || input.fit.fitAssessment.applicationEffort === "MODERATE") {
    return "LOW";
  }
  return "NONE";
}

function recommendedResumeVersion(queueItem: JobSourceImportQueueItem, resumeVersions: readonly PrivateResumeVersionRecord[]) {
  const evaluation = evaluateResumeVersions(queueItem, resumeVersions);
  return {
    status: evaluation.status,
    resumeVersionId: evaluation.selected?.resumeVersionId || null,
    safeLabel: evaluation.selected ? safeResumeLabel(evaluation.selected) : null,
    reason: evaluation.reason,
    evaluatedResumeVersions: evaluation.evaluations,
    limitations: [
      "Recommended ResumeVersion is a reuse candidate only.",
      "Ross must approve exact resume use before applying.",
      "No resume was generated, modified, copied, submitted, or uploaded.",
    ],
    privatePathVisible: false as const,
    rawResumeTextVisible: false as const,
    resumeGenerated: false as const,
    resumeMutated: false as const,
  };
}

function hasFitBlocker(fit: OpportunityExplainableFitInput | null) {
  if (!fit) return true;
  return (
    fit.fitAssessment.finalRecommendation === "REVIEW_REQUIRED" ||
    fit.fitAssessment.finalRecommendation === "INSUFFICIENT_EVIDENCE" ||
    fit.fitAssessment.coverage.MISSING > 0 ||
    fit.fitAssessment.coverage.UNKNOWN > 0
  );
}

function recommendationFor(input: {
  queueItem: JobSourceImportQueueItem;
  fit: OpportunityExplainableFitInput | null;
  resume: RecommendedResumeVersion;
  gaps: MissingSkillRecord[];
}): {
  recommendation: OpportunityApplicationRecommendation;
  readiness: ApplicationReadinessState;
  nextAction: string;
  reasons: string[];
} {
  const reasons: string[] = [];
  const item = input.queueItem;

  if (item.state === "EXISTING_APPLICATION" || item.existingApplicationStatus === "EXISTING_APPLICATION_MATCH" || item.duplicateResult === "EXISTING_APPLICATION") {
    return {
      recommendation: "SKIP",
      readiness: "BLOCKED_EXISTING_APPLICATION",
      nextAction: "Do not apply again; review the existing Application record instead.",
      reasons: ["Existing Application prevention is active for this opportunity."],
    };
  }

  if (item.duplicateResult === "CONFIRMED_DUPLICATE") {
    return {
      recommendation: "SKIP",
      readiness: "SKIP_RECOMMENDED",
      nextAction: "Skip this duplicate queue item and preserve the duplicate review history.",
      reasons: ["Existing duplicate detection classified this item as a confirmed duplicate."],
    };
  }

  if (
    item.state === "DUPLICATE" ||
    item.state === "STALE" ||
    item.state === "NEEDS_OPERATOR_REVIEW" ||
    item.duplicateResult === "POSSIBLE_DUPLICATE" ||
    item.duplicateResult === "NEEDS_OPERATOR_REVIEW"
  ) {
    return {
      recommendation: "WAIT",
      readiness: "WAITING_FOR_SOURCE_OR_DUPLICATE_REVIEW",
      nextAction: "Resolve source freshness, duplicate, or operator-review status before application planning.",
      reasons: ["The queue item is not yet clean enough for application planning."],
    };
  }

  if (!input.fit) {
    return {
      recommendation: "REVIEW",
      readiness: "NEEDS_EVIDENCE_REVIEW",
      nextAction: "Run or attach an existing Explainable Fit artifact before deciding whether to apply.",
      reasons: ["No Explainable Fit artifact was supplied for this queue item."],
    };
  }

  if (hasFitBlocker(input.fit) || input.gaps.length > 0) {
    reasons.push("Explainable Fit has missing or unresolved requirement evidence.");
  }

  if (input.resume.status === "NO_RESUMEVERSION_AVAILABLE" || input.resume.status === "NO_SAFE_EXISTING_RESUMEVERSION") {
    reasons.push("No safe existing ResumeVersion is available for this role.");
  } else if (input.resume.status === "REVIEW_BEFORE_REUSE") {
    reasons.push("The best existing ResumeVersion still requires review before reuse.");
  }

  if (reasons.length) {
    return {
      recommendation: "REVIEW",
      readiness: input.resume.status === "REVIEW_BEFORE_REUSE" ? "NEEDS_RESUME_REVIEW" : "NEEDS_EVIDENCE_REVIEW",
      nextAction: "Review missing evidence and ResumeVersion safety before approving an application.",
      reasons,
    };
  }

  if (item.priorityTier === "LOW_PRIORITY_REVIEW" || item.rankingSummary.totalScore < 30) {
    return {
      recommendation: "WAIT",
      readiness: "WAITING_FOR_SOURCE_OR_DUPLICATE_REVIEW",
      nextAction: "Keep this opportunity in the queue, but prioritize stronger CareerOS matches first.",
      reasons: ["Existing J002 ranking placed this opportunity below the immediate application threshold."],
    };
  }

  if (
    item.state === "READY_FOR_OPPORTUNITY_IMPORT" &&
    input.resume.status === "SELECTED_EXISTING_RESUMEVERSION" &&
    (input.fit.fitAssessment.finalRecommendation === "APPLY_WITH_POSITIONING" ||
      input.fit.fitAssessment.finalRecommendation === "STRONG_APPLY")
  ) {
    return {
      recommendation: "APPLY_NOW",
      readiness: "READY_FOR_OPERATOR_APPROVED_APPLICATION",
      nextAction: "Approve application planning, confirm the selected ResumeVersion, then apply manually outside StaffordOS.",
      reasons: [
        "Queue item is ready for Opportunity import.",
        "Explainable Fit supports applying with positioning.",
        "A reviewed existing ResumeVersion is available.",
      ],
    };
  }

  return {
    recommendation: "REVIEW",
    readiness: "NEEDS_EVIDENCE_REVIEW",
    nextAction: "Review the opportunity and fit artifacts before deciding whether to apply.",
    reasons: ["The opportunity is relevant, but the existing fit recommendation is not APPLY_WITH_POSITIONING or STRONG_APPLY."],
  };
}

function recommendationRecord(input: {
  queueItem: JobSourceImportQueueItem;
  fit: OpportunityExplainableFitInput | null;
  resumeVersions: readonly PrivateResumeVersionRecord[];
  generatedAt: string;
}): OpportunityRecommendationRecord {
  const resume = recommendedResumeVersion(input.queueItem, input.resumeVersions);
  const supporting = supportingEvidence(input.fit?.mappings || []);
  const missing = missingSkills(input.fit?.requirements || [], input.fit?.mappings || []);
  const effort = estimateResumeUpdateEffort({
    fit: input.fit,
    selectedResume: resume,
    missingSkills: missing,
  });
  const decision = recommendationFor({
    queueItem: input.queueItem,
    fit: input.fit,
    resume,
    gaps: missing,
  });
  const opportunityId = queueOpportunityId(input.queueItem);

  return {
    schemaVersion: OPPORTUNITY_RECOMMENDATION_SCHEMA_VERSION,
    recommendationId: opaqueId("privopprec", [
      OPPORTUNITY_RECOMMENDATION_ENGINE_VERSION,
      input.queueItem.queueItemId,
      resume.resumeVersionId,
      decision.recommendation,
      input.generatedAt,
    ]),
    queueItemId: input.queueItem.queueItemId,
    sourceRecordId: input.queueItem.sourceRecordId,
    opportunityId,
    company: input.queueItem.company,
    role: input.queueItem.role,
    recommendation: decision.recommendation,
    explainableFit: {
      available: Boolean(input.fit),
      fitAssessment: input.fit?.fitAssessment || null,
      fitRecommendation: input.fit?.fitAssessment.finalRecommendation || null,
      coverage: input.fit?.fitAssessment.coverage || null,
      majorBlockers: [...(input.fit?.fitAssessment.majorBlockers || [])],
      limitations: [
        ...(input.fit?.limitations || []),
        input.fit ? "Existing Explainable Fit artifact was reused." : "No Explainable Fit artifact was supplied.",
      ],
    },
    recommendedResumeVersion: resume,
    supportingCareerEvidence: supporting,
    missingSkills: missing,
    estimatedResumeUpdateEffort: effort,
    applicationReadiness: decision.readiness,
    recommendedNextAction: decision.nextAction,
    recommendationReasons: decision.reasons,
    authorityRequired: "ROSS_APPROVAL_BEFORE_APPLICATION",
    completionProof: "Ross records Apply Now, Review, Wait, or Skip decision in a separately authorized workflow.",
    deterministicRulesOnly: true,
    hiringProbabilityGenerated: false,
    interviewProbabilityGenerated: false,
    aiConfidenceScoreGenerated: false,
    applicationSubmitted: false,
    applicationCreated: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    externalAiUsed: false,
    limitations: [
      "Recommendation is private planning output only.",
      "No Application, resume, cover letter, message, provider action, or browser automation is performed.",
      "Ross remains the authority for any external representation.",
      ...input.queueItem.limitations,
    ],
  };
}

function readModel(record: OpportunityRecommendationRecord, generatedAt: string): OpportunityRecommendationReadModelRecord {
  const selected = record.recommendedResumeVersion.evaluatedResumeVersions.find((evaluation) => evaluation.selectedAsRecommendation) || null;
  return {
    schemaVersion: OPPORTUNITY_RECOMMENDATION_READ_MODEL_SCHEMA_VERSION,
    recommendationId: record.recommendationId,
    queueItemId: record.queueItemId,
    company: record.company,
    role: record.role,
    recommendation: record.recommendation,
    applicationReadiness: record.applicationReadiness,
    recommendedResumeVersion: {
      status: record.recommendedResumeVersion.status,
      safeLabel: record.recommendedResumeVersion.safeLabel,
      factSafetyStatus: selected?.factSafetyStatus || null,
    },
    missingSkillCount: record.missingSkills.length,
    supportingEvidenceCount: record.supportingCareerEvidence.length,
    estimatedResumeUpdateEffort: record.estimatedResumeUpdateEffort,
    recommendedNextAction: record.recommendedNextAction,
    capturedAsOf: generatedAt,
    limitations: [
      "Read model excludes private paths, raw resume text, source URLs, and application controls.",
      ...record.limitations,
    ],
    privatePathVisible: false,
    rawResumeTextVisible: false,
    sourceUrlVisible: false,
    applicationActionAvailable: false,
    messageActionAvailable: false,
    resumeMutationAvailable: false,
  };
}

export function buildOpportunityRecommendationEngine(input: OpportunityRecommendationEngineInput): OpportunityRecommendationResult {
  const fitLookup = buildFitLookup(input.explainableFitArtifacts || []);
  const queueItems = [...input.queueResult.importQueue].sort(
    (left, right) =>
      right.rankingSummary.totalScore - left.rankingSummary.totalScore ||
      left.company.localeCompare(right.company) ||
      left.role.localeCompare(right.role) ||
      left.queueItemId.localeCompare(right.queueItemId),
  );
  const resumeVersions = [...(input.resumeVersions || [])];
  const recommendations = queueItems.map((queueItem) =>
    recommendationRecord({
      queueItem,
      fit: fitForQueueItem(queueItem, fitLookup),
      resumeVersions,
      generatedAt: input.generatedAt,
    }),
  );

  return {
    schemaVersion: OPPORTUNITY_RECOMMENDATION_RESULT_SCHEMA_VERSION,
    workflowVersion: OPPORTUNITY_RECOMMENDATION_ENGINE_VERSION,
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
    recommendations,
    readModel: recommendations.map((record) => readModel(record, input.generatedAt)),
    summary: {
      queueItemsReviewed: queueItems.length,
      recommendationsCreated: recommendations.length,
      applyNow: recommendations.filter((record) => record.recommendation === "APPLY_NOW").length,
      review: recommendations.filter((record) => record.recommendation === "REVIEW").length,
      wait: recommendations.filter((record) => record.recommendation === "WAIT").length,
      skip: recommendations.filter((record) => record.recommendation === "SKIP").length,
      resumeVersionsEvaluated: resumeVersions.length,
      opportunitiesWithRecommendedResumeVersion: recommendations.filter((record) => Boolean(record.recommendedResumeVersion.resumeVersionId)).length,
      opportunitiesMissingSkills: recommendations.filter((record) => record.missingSkills.length > 0).length,
      readinessReadyForOperatorApprovedApplication: recommendations.filter(
        (record) => record.applicationReadiness === "READY_FOR_OPERATOR_APPROVED_APPLICATION",
      ).length,
      hiringProbabilityGenerated: false,
      interviewProbabilityGenerated: false,
      aiConfidenceScoreGenerated: false,
    },
    auditSummary: {
      noApplicationSubmitted: true,
      noApplicationCreated: true,
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

export function writeOpportunityRecommendationOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: OpportunityRecommendationResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private J003.01 opportunity recommendation output root");
  const runDirectory = path.join(input.outputRoot, `J003_01_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "opportunity_recommendation_result.json": input.result,
    "opportunity_recommendations.json": input.result.recommendations,
    "application_readiness.json": input.result.recommendations.map((record) => ({
      recommendationId: record.recommendationId,
      queueItemId: record.queueItemId,
      recommendation: record.recommendation,
      applicationReadiness: record.applicationReadiness,
      recommendedNextAction: record.recommendedNextAction,
      completionProof: record.completionProof,
    })),
    "resume_selection.json": input.result.recommendations.map((record) => ({
      recommendationId: record.recommendationId,
      queueItemId: record.queueItemId,
      recommendedResumeVersion: record.recommendedResumeVersion,
    })),
    "gap_analysis.json": input.result.recommendations.map((record) => ({
      recommendationId: record.recommendationId,
      queueItemId: record.queueItemId,
      missingSkills: record.missingSkills,
      supportingCareerEvidence: record.supportingCareerEvidence,
      estimatedResumeUpdateEffort: record.estimatedResumeUpdateEffort,
    })),
    "future_read_model.json": input.result.readModel,
    "recommendation_audit.json": input.result.auditSummary,
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

export function loadQueueResultFile(filePath: string): PrivateJobSourceImportQueueResult {
  const record = readJson(filePath) as {
    jobSourceImportQueue?: PrivateJobSourceImportQueueResult;
    importQueue?: unknown;
    prioritization?: unknown;
  };
  if (record.jobSourceImportQueue) return record.jobSourceImportQueue;
  if (record.importQueue && record.prioritization) return record as unknown as PrivateJobSourceImportQueueResult;
  throw new Error("Queue result file must contain a full J002.02 jobSourceImportQueue result.");
}

export function loadExplainableFitArtifactsFile(filePath: string): OpportunityExplainableFitInput[] {
  const record = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  if (Array.isArray(record)) return record as OpportunityExplainableFitInput[];
  const object = record as { explainableFitArtifacts?: OpportunityExplainableFitInput[] };
  return object.explainableFitArtifacts || [];
}

export function loadResumeVersionsFile(filePath: string): PrivateResumeVersionRecord[] {
  const record = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  if (Array.isArray(record)) return record as PrivateResumeVersionRecord[];
  const object = record as { resumeVersions?: PrivateResumeVersionRecord[] };
  return object.resumeVersions || [];
}

export function buildOpportunityRecommendationCliSummary(result: OpportunityRecommendationResult, writtenCount = 0) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    queueItemsReviewed: result.summary.queueItemsReviewed,
    recommendationsCreated: result.summary.recommendationsCreated,
    applyNow: result.summary.applyNow,
    review: result.summary.review,
    wait: result.summary.wait,
    skip: result.summary.skip,
    resumeVersionsEvaluated: result.summary.resumeVersionsEvaluated,
    opportunitiesWithRecommendedResumeVersion: result.summary.opportunitiesWithRecommendedResumeVersion,
    opportunitiesMissingSkills: result.summary.opportunitiesMissingSkills,
    readinessReadyForOperatorApprovedApplication: result.summary.readinessReadyForOperatorApprovedApplication,
    privateArtifactsWritten: writtenCount,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noApplicationCreated: result.auditSummary.noApplicationCreated,
    noResumeGenerated: result.auditSummary.noResumeGenerated,
    noResumeMutated: result.auditSummary.noResumeMutated,
    noCoverLetterGenerated: result.auditSummary.noCoverLetterGenerated,
    noMessageSent: result.auditSummary.noMessageSent,
    noProviderAdded: result.auditSummary.noProviderAdded,
    noExternalProviderCall: result.auditSummary.noExternalProviderCall,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
    privatePathVisible: false,
  };
}

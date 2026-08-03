export const CAREER_EVIDENCE_CONTRACT_VERSION = "S010.02B";

export const CAREER_EVIDENCE_WORKSPACE_ID = "professional";

export const CAREER_FACT_TYPES = [
  "EMPLOYMENT",
  "EDUCATION",
  "CERTIFICATION",
  "SKILL",
  "TECHNOLOGY",
  "PROJECT",
  "PRODUCT",
  "ARCHITECTURE",
  "ACHIEVEMENT",
  "LEADERSHIP",
  "PRESENTATION",
  "PUBLICATION",
  "INTERVIEW_STORY",
  "REFERENCE",
  "OTHER",
] as const;

export const CAREER_EVIDENCE_TYPES = [
  "RESUME",
  "EMPLOYMENT_RECORD",
  "EDUCATION_RECORD",
  "CERTIFICATION_RECORD",
  "PROJECT_ARTIFACT",
  "PRODUCT_ARTIFACT",
  "ARCHITECTURE_ARTIFACT",
  "PRESENTATION",
  "PUBLICATION",
  "INTERVIEW_NOTE",
  "OPERATOR_ATTESTATION",
  "PROVIDER_CONFIRMATION",
  "HISTORICAL_DOCUMENT",
  "OTHER",
] as const;

export const CAREER_VERIFICATION_STATUSES = [
  "PROPOSED",
  "NEEDS_EVIDENCE",
  "PARTIALLY_SUPPORTED",
  "VERIFIED",
  "CONFLICTING",
  "REJECTED",
  "SUPERSEDED",
  "HISTORICAL_ONLY",
] as const;

export const CAREER_VERIFICATION_STATUS_LABELS = {
  PROPOSED: "Proposed fact",
  NEEDS_EVIDENCE: "Needs evidence",
  PARTIALLY_SUPPORTED: "Partly supported",
  VERIFIED: "Verified",
  CONFLICTING: "Conflicting evidence",
  REJECTED: "Rejected",
  SUPERSEDED: "Replaced by a newer fact",
  HISTORICAL_ONLY: "Historical only",
} as const;

export const CAREER_AUTHORITY_CLASSIFICATIONS = [
  "PROVIDER_CONFIRMED",
  "OFFICIAL_DOCUMENT",
  "OPERATOR_CONFIRMED",
  "REPOSITORY_BACKED",
  "PUBLIC_ARTIFACT",
  "IMPORTED_DOCUMENT",
  "GENERATED_DOCUMENT",
  "THIRD_PARTY_STATEMENT",
  "HISTORICAL_CONTINUITY",
  "NEEDS_VERIFICATION",
] as const;

export const CAREER_PRIVACY_CLASSIFICATIONS = [
  "Professional owner-private",
  "Public artifact with Professional handling",
  "Professional test fixture",
] as const;

export const CAREER_FRESHNESS_CLASSIFICATIONS = [
  "Current",
  "Recent",
  "Historical",
  "Unknown",
  "Stale",
  "Needs review",
] as const;

export const CAREER_EVIDENCE_SUPPORT_LEVELS = [
  "DIRECT",
  "PARTIAL",
  "TRANSFERABLE",
  "CONFLICTING",
  "INSUFFICIENT",
  "UNKNOWN",
] as const;

export const CAREER_POSITIONING_STATES = [
  "DRAFT",
  "READY_FOR_REVIEW",
  "APPROVED_FOR_USE",
  "SUPERSEDED",
  "REJECTED",
] as const;

export const CAREER_METRIC_CLASSIFICATIONS = [
  "VERIFIED_METRIC",
  "OPERATOR_ESTIMATE",
  "DERIVED_ESTIMATE",
  "THIRD_PARTY_REPORTED",
  "UNSUPPORTED",
  "NOT_APPLICABLE",
] as const;

export const CAREER_EXPERIENCE_CLASSIFICATIONS = [
  "USED_IN_PRODUCTION",
  "USED_IN_CONTROLLED_PROJECT",
  "USED_IN_TRAINING",
  "STUDIED",
  "FAMILIAR",
  "TRANSFERABLE",
  "NEEDS_VERIFICATION",
] as const;

export const CAREER_PROJECT_DEPLOYMENT_CLAIMS = [
  "NOT_APPLICABLE",
  "LOCAL_ONLY",
  "CONTROLLED_PROJECT",
  "DEPLOYED",
  "NEEDS_EVIDENCE",
] as const;

export const CAREER_CUSTOMER_USE_CLAIMS = [
  "NONE",
  "CONTROLLED_TEST",
  "CUSTOMER_USED",
  "NEEDS_EVIDENCE",
] as const;

export const CAREER_OPERATOR_REVIEW_STATUSES = [
  "Not reviewed",
  "Needs Ross's review",
  "Ross confirmed",
  "Rejected by Ross",
] as const;

export const CAREER_CONFLICT_TYPES = [
  "EMPLOYER_CONFLICT",
  "TITLE_CONFLICT",
  "START_DATE_CONFLICT",
  "END_DATE_CONFLICT",
  "EDUCATION_CONFLICT",
  "CERTIFICATION_CONFLICT",
  "METRIC_CONFLICT",
  "PROJECT_STATUS_CONFLICT",
  "SKILL_CONTEXT_CONFLICT",
  "SOURCE_AUTHORITY_CONFLICT",
  "OTHER",
] as const;

export const CAREER_VERIFICATION_ELIGIBILITY_STATUSES = [
  "ELIGIBLE_FOR_OPERATOR_VERIFICATION",
  "NEEDS_MORE_EVIDENCE",
  "CONFLICT_REQUIRES_REVIEW",
  "NOT_ELIGIBLE",
  "HISTORICAL_ONLY",
] as const;

export const CAREER_CHIEF_OF_STAFF_SOURCE_TYPES = [
  "career_fact_snapshot",
  "career_evidence_snapshot",
  "career_conflict_snapshot",
] as const;

export const CAREER_CHIEF_OF_STAFF_SOURCE_FIELDS = [
  "source ID",
  "Professional workspace",
  "authority",
  "verification status",
  "privacy",
  "freshness",
  "exact source reference",
  "limitations",
  "permission requirement",
] as const;

export const CAREER_JOB_REQUIREMENT_COMPATIBILITY_FIELDS = [
  "fact type",
  "statement",
  "technology or skill context",
  "authority",
  "verification status",
  "source references",
  "limitations",
  "workspace",
  "privacy",
] as const;

export const CAREER_FACT_EVIDENCE_POSITIONING_BOUNDARY =
  "Career facts assert truth, supporting evidence supports or challenges truth, and positioning may only present verified or explicitly approved facts without changing their meaning.";

export const CAREER_RESUME_BOUNDARY =
  "A resume is a generated or curated presentation artifact. It is downstream from verified CareerFact and CareerEvidence records and is not primary authority.";

export const CAREER_SAFE_FALLBACK =
  "I cannot verify that from the current Career Evidence sources.";

export type CareerWorkspaceId = typeof CAREER_EVIDENCE_WORKSPACE_ID;
export type CareerFactType = (typeof CAREER_FACT_TYPES)[number];
export type CareerEvidenceType = (typeof CAREER_EVIDENCE_TYPES)[number];
export type CareerVerificationStatus = (typeof CAREER_VERIFICATION_STATUSES)[number];
export type CareerAuthorityClassification = (typeof CAREER_AUTHORITY_CLASSIFICATIONS)[number];
export type CareerPrivacyClassification = (typeof CAREER_PRIVACY_CLASSIFICATIONS)[number];
export type CareerFreshnessClassification = (typeof CAREER_FRESHNESS_CLASSIFICATIONS)[number];
export type CareerEvidenceSupportLevel = (typeof CAREER_EVIDENCE_SUPPORT_LEVELS)[number];
export type CareerPositioningState = (typeof CAREER_POSITIONING_STATES)[number];
export type CareerMetricClassification = (typeof CAREER_METRIC_CLASSIFICATIONS)[number];
export type CareerExperienceClassification = (typeof CAREER_EXPERIENCE_CLASSIFICATIONS)[number];
export type CareerProjectDeploymentClaim = (typeof CAREER_PROJECT_DEPLOYMENT_CLAIMS)[number];
export type CareerCustomerUseClaim = (typeof CAREER_CUSTOMER_USE_CLAIMS)[number];
export type CareerOperatorReviewStatus = (typeof CAREER_OPERATOR_REVIEW_STATUSES)[number];
export type CareerConflictType = (typeof CAREER_CONFLICT_TYPES)[number];
export type CareerVerificationEligibilityStatus = (typeof CAREER_VERIFICATION_ELIGIBILITY_STATUSES)[number];

export type CareerPositioningBoundary = {
  statement: string;
  sourceFactIds: string[];
  positioningState: CareerPositioningState;
  changesMeaning: boolean;
  limitation: string;
};

export type CareerFact = {
  id: string;
  workspaceId: CareerWorkspaceId;
  factType: CareerFactType;
  subject: string;
  statement: string;
  normalizedStatement: string;
  startDate: string | null;
  endDate: string | null;
  current: boolean | null;
  organization: string | null;
  roleOrTitle: string | null;
  location: string | null;
  classification: string;
  supportLevel: CareerEvidenceSupportLevel;
  verificationStatus: CareerVerificationStatus;
  authorityClassification: CareerAuthorityClassification;
  privacyClassification: CareerPrivacyClassification;
  sourceEvidenceIds: string[];
  conflictingEvidenceIds: string[];
  conflictTypes: CareerConflictType[];
  metricClassification: CareerMetricClassification;
  measurementAuthority: string | null;
  experienceClassification: CareerExperienceClassification | null;
  proficiencyLabel: string | null;
  yearsOfExperience: number | null;
  yearsAuthority: string | null;
  deploymentClaim: CareerProjectDeploymentClaim;
  customerUseClaim: CareerCustomerUseClaim;
  technologyOrSkill: string | null;
  limitations: string[];
  operatorNotes: string | null;
  positioningBoundaries: CareerPositioningBoundary[];
  createdAt: string;
  updatedAt: string;
  testOnly: true;
};

export type CareerEvidence = {
  id: string;
  workspaceId: CareerWorkspaceId;
  evidenceType: CareerEvidenceType;
  title: string;
  summary: string;
  sourceType: CareerEvidenceType;
  sourceReference: string;
  sourceArtifact: string | null;
  sourceOwner: string;
  observedAt: string;
  sourceCreatedAt: string | null;
  authorityClassification: CareerAuthorityClassification;
  privacyClassification: CareerPrivacyClassification;
  freshness: CareerFreshnessClassification;
  supportsFactIds: string[];
  challengesFactIds: string[];
  contentDigest: string;
  excerptReference: string;
  limitations: string[];
  operatorReviewStatus: CareerOperatorReviewStatus;
  testOnly: true;
};

export type CareerEvidenceValidationErrorCode =
  | "WORKSPACE_NOT_PROFESSIONAL"
  | "DURABLE_ID_REQUIRED"
  | "URL_USED_AS_PRIMARY_ID"
  | "FIELD_REQUIRED"
  | "UNSUPPORTED_FACT_TYPE"
  | "UNSUPPORTED_EVIDENCE_TYPE"
  | "UNSUPPORTED_VERIFICATION_STATUS"
  | "UNSUPPORTED_AUTHORITY_CLASSIFICATION"
  | "UNSUPPORTED_PRIVACY_CLASSIFICATION"
  | "UNSUPPORTED_FRESHNESS"
  | "UNSUPPORTED_SUPPORT_LEVEL"
  | "UNSUPPORTED_METRIC_CLASSIFICATION"
  | "UNSUPPORTED_EXPERIENCE_CLASSIFICATION"
  | "UNSUPPORTED_PROFICIENCY_LABEL"
  | "TEST_ONLY_REQUIRED"
  | "SOURCE_REFERENCE_REQUIRED"
  | "VERIFIED_REQUIRES_EVIDENCE"
  | "SOURCE_EVIDENCE_NOT_FOUND"
  | "EVIDENCE_DOES_NOT_SUPPORT_FACT"
  | "GENERATED_RESUME_CANNOT_VERIFY_FACT"
  | "PARTIALLY_SUPPORTED_PRESENTED_VERIFIED"
  | "CONFLICT_SILENTLY_RESOLVED"
  | "TITLE_CONFLICT_SILENTLY_RESOLVED"
  | "DATE_CONFLICT_SILENTLY_RESOLVED"
  | "UNSUPPORTED_METRIC"
  | "UNSUPPORTED_YEARS_OF_EXPERIENCE"
  | "PRODUCTION_USE_UNSUPPORTED"
  | "PROJECT_DEPLOYMENT_UNSUPPORTED"
  | "CUSTOMER_USE_UNSUPPORTED"
  | "CERTIFICATION_WITHOUT_AUTHORITY"
  | "GENERATED_DOCUMENT_TREATED_AS_OFFICIAL_RECORD"
  | "HISTORICAL_WORDING_PRESENTED_CURRENT"
  | "POSITIONING_CHANGES_FACT"
  | "BUSINESS_OR_PERSONAL_LEAKAGE";

export type CareerEvidenceValidationError = {
  code: CareerEvidenceValidationErrorCode;
  path: string;
  message: string;
  technicalDetail: string;
  relatedFactId?: string;
  relatedEvidenceId?: string;
};

export type CareerEvidenceValidationResult = {
  valid: boolean;
  validationStatus: "passed" | "failed";
  errors: CareerEvidenceValidationError[];
  warnings: string[];
  checkedRecordCount: number;
};

export type CareerFactConflict = {
  factId: string;
  conflictTypes: CareerConflictType[];
  evidenceIds: string[];
  operatorSafeMessage: string;
};

export type CareerVerificationEligibility = {
  factId: string;
  eligibilityStatus: CareerVerificationEligibilityStatus;
  reasons: string[];
  verificationStatusUnchanged: CareerVerificationStatus;
};

type AnyRecord = Record<string, any>;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as AnyRecord)) {
      deepFreeze(nested);
    }
  }
  return value;
}

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function includesValue<const T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

function hasOpaquePrefix(value: unknown, prefix: string) {
  return typeof value === "string" && value.startsWith(prefix) && value.length > prefix.length;
}

function isUrlLike(value: unknown) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function addError(
  errors: CareerEvidenceValidationError[],
  code: CareerEvidenceValidationErrorCode,
  path: string,
  message: string,
  technicalDetail: string,
  related: { factId?: string; evidenceId?: string } = {},
) {
  errors.push({
    code,
    path,
    message,
    technicalDetail,
    relatedFactId: related.factId,
    relatedEvidenceId: related.evidenceId,
  });
}

function result(errors: CareerEvidenceValidationError[], warnings: string[] = [], checkedRecordCount = 1): CareerEvidenceValidationResult {
  return {
    valid: errors.length === 0,
    validationStatus: errors.length === 0 ? "passed" : "failed",
    errors,
    warnings,
    checkedRecordCount,
  };
}

function evidenceById(evidenceRecords: readonly CareerEvidence[], evidenceId: string) {
  return evidenceRecords.find((evidence) => evidence.id === evidenceId) || null;
}

function supportingEvidenceForFact(fact: AnyRecord, evidenceRecords: readonly CareerEvidence[]) {
  if (!isStringArray(fact.sourceEvidenceIds)) {
    return [];
  }

  return fact.sourceEvidenceIds
    .map((evidenceId) => evidenceById(evidenceRecords, evidenceId))
    .filter((evidence): evidence is CareerEvidence => Boolean(evidence));
}

function evidenceChallengesFact(factId: string, evidenceRecords: readonly CareerEvidence[]) {
  return evidenceRecords.filter((evidence) => evidence.challengesFactIds.includes(factId));
}

function hasStrongVerificationAuthority(evidence: CareerEvidence) {
  return evidence.authorityClassification === "OFFICIAL_DOCUMENT" || evidence.authorityClassification === "PROVIDER_CONFIRMED";
}

function hasGeneratedResumeOnly(evidenceRecords: CareerEvidence[]) {
  return (
    evidenceRecords.length > 0 &&
    evidenceRecords.every(
      (evidence) =>
        evidence.sourceType === "RESUME" || evidence.authorityClassification === "GENERATED_DOCUMENT",
    )
  );
}

function hasDeploymentEvidence(evidenceRecords: CareerEvidence[]) {
  return evidenceRecords.some(
    (evidence) =>
      (hasStrongVerificationAuthority(evidence) || evidence.authorityClassification === "REPOSITORY_BACKED") &&
      /\b(deployed|deployment|production)\b/i.test(`${evidence.title} ${evidence.summary} ${evidence.excerptReference}`),
  );
}

function hasCustomerUseEvidence(evidenceRecords: CareerEvidence[]) {
  return evidenceRecords.some(
    (evidence) =>
      (hasStrongVerificationAuthority(evidence) ||
        evidence.authorityClassification === "THIRD_PARTY_STATEMENT" ||
        evidence.authorityClassification === "OPERATOR_CONFIRMED") &&
      /\b(customer|client|user|merchant)\b/i.test(`${evidence.title} ${evidence.summary} ${evidence.excerptReference}`),
  );
}

function validateSharedFields(record: AnyRecord, idPrefix: string, pathPrefix: string, errors: CareerEvidenceValidationError[]) {
  if (record.workspaceId !== CAREER_EVIDENCE_WORKSPACE_ID) {
    addError(
      errors,
      "WORKSPACE_NOT_PROFESSIONAL",
      `${pathPrefix}.workspaceId`,
      "Career evidence belongs in the Professional workspace.",
      `Expected workspaceId professional, got ${String(record.workspaceId) || "missing"}.`,
    );
    if (record.workspaceId === "stafford-media" || record.workspaceId === "personal") {
      addError(
        errors,
        "BUSINESS_OR_PERSONAL_LEAKAGE",
        `${pathPrefix}.workspaceId`,
        "This record belongs to another workspace.",
        `Career evidence cannot use workspaceId ${String(record.workspaceId)}.`,
      );
    }
  }

  if (!hasOpaquePrefix(record.id, idPrefix)) {
    addError(
      errors,
      "DURABLE_ID_REQUIRED",
      `${pathPrefix}.id`,
      "This record needs a durable StaffordOS ID.",
      `Expected opaque ID prefix ${idPrefix}.`,
    );
  }

  if (isUrlLike(record.id)) {
    addError(
      errors,
      "URL_USED_AS_PRIMARY_ID",
      `${pathPrefix}.id`,
      "A source URL cannot be the primary StaffordOS ID.",
      "URLs can change and must remain source references or aliases.",
    );
  }

  if (record.testOnly !== true) {
    addError(
      errors,
      "TEST_ONLY_REQUIRED",
      `${pathPrefix}.testOnly`,
      "This fixture must be clearly marked as test-only.",
      "S010.02B does not authorize real career facts.",
    );
  }
}

export function validateCareerEvidenceFixture(evidence: unknown): CareerEvidenceValidationResult {
  const errors: CareerEvidenceValidationError[] = [];
  const warnings: string[] = [];

  if (!isRecord(evidence)) {
    addError(errors, "FIELD_REQUIRED", "evidence", "Supporting evidence must be a record.", "Expected object input.");
    return result(errors);
  }

  validateSharedFields(evidence, "careerev_", "evidence", errors);

  if (!includesValue(CAREER_EVIDENCE_TYPES, evidence.evidenceType)) {
    addError(errors, "UNSUPPORTED_EVIDENCE_TYPE", "evidence.evidenceType", "This evidence type is not supported.", "Evidence type is outside S010.02B.");
  }

  if (!includesValue(CAREER_EVIDENCE_TYPES, evidence.sourceType)) {
    addError(errors, "UNSUPPORTED_EVIDENCE_TYPE", "evidence.sourceType", "This source type is not supported.", "Source type is outside S010.02B.");
  }

  for (const field of ["title", "summary", "sourceReference", "sourceOwner", "observedAt", "contentDigest", "excerptReference"]) {
    if (!isNonEmptyString(evidence[field])) {
      addError(errors, "FIELD_REQUIRED", `evidence.${field}`, "This evidence needs a source-backed value.", `${field} is missing or empty.`);
    }
  }

  if (!isNonEmptyString(evidence.sourceReference)) {
    addError(
      errors,
      "SOURCE_REFERENCE_REQUIRED",
      "evidence.sourceReference",
      "Supporting evidence must show where it came from.",
      "sourceReference is required.",
    );
  }

  if (!includesValue(CAREER_AUTHORITY_CLASSIFICATIONS, evidence.authorityClassification)) {
    addError(
      errors,
      "UNSUPPORTED_AUTHORITY_CLASSIFICATION",
      "evidence.authorityClassification",
      "This evidence authority is not supported.",
      "Authority classification is outside S010.02B.",
    );
  }

  if (!includesValue(CAREER_PRIVACY_CLASSIFICATIONS, evidence.privacyClassification)) {
    addError(
      errors,
      "UNSUPPORTED_PRIVACY_CLASSIFICATION",
      "evidence.privacyClassification",
      "This evidence privacy classification is not supported.",
      "Privacy classification is outside S010.02B.",
    );
  }

  if (!includesValue(CAREER_FRESHNESS_CLASSIFICATIONS, evidence.freshness)) {
    addError(errors, "UNSUPPORTED_FRESHNESS", "evidence.freshness", "This evidence freshness value is not supported.", "Freshness is outside S010.02B.");
  }

  if (!isStringArray(evidence.supportsFactIds)) {
    addError(errors, "FIELD_REQUIRED", "evidence.supportsFactIds", "Supporting fact links must be explicit.", "supportsFactIds must be a string array.");
  }

  if (!isStringArray(evidence.challengesFactIds)) {
    addError(errors, "FIELD_REQUIRED", "evidence.challengesFactIds", "Challenging fact links must be explicit.", "challengesFactIds must be a string array.");
  }

  if (!Array.isArray(evidence.limitations) || evidence.limitations.length === 0) {
    addError(errors, "FIELD_REQUIRED", "evidence.limitations", "Supporting evidence must say what it does not prove.", "limitations must be a non-empty array.");
  }

  if (
    evidence.authorityClassification === "GENERATED_DOCUMENT" &&
    (evidence.sourceType === "EMPLOYMENT_RECORD" ||
      evidence.sourceType === "EDUCATION_RECORD" ||
      evidence.sourceType === "CERTIFICATION_RECORD" ||
      evidence.sourceType === "PROVIDER_CONFIRMATION")
  ) {
    addError(
      errors,
      "GENERATED_DOCUMENT_TREATED_AS_OFFICIAL_RECORD",
      "evidence.authorityClassification",
      "A generated document cannot be treated as an official record.",
      "Generated evidence may preserve wording, but it cannot become official authority.",
    );
  }

  if (evidence.sourceType === "RESUME" && evidence.authorityClassification === "OFFICIAL_DOCUMENT") {
    addError(
      errors,
      "GENERATED_DOCUMENT_TREATED_AS_OFFICIAL_RECORD",
      "evidence.sourceType",
      "A resume is not the official source of career truth.",
      "Resume records are downstream wording unless separately verified by underlying evidence.",
    );
  }

  if (evidence.freshness === "Historical") {
    warnings.push("Historical evidence can preserve wording, but it cannot create a current fact by itself.");
  }

  return result(errors, warnings);
}

export function validateCareerFactFixture(
  fact: unknown,
  evidenceRecords: readonly CareerEvidence[] = CAREER_EVIDENCE_FIXTURES,
): CareerEvidenceValidationResult {
  const errors: CareerEvidenceValidationError[] = [];
  const warnings: string[] = [];

  if (!isRecord(fact)) {
    addError(errors, "FIELD_REQUIRED", "fact", "Career fact must be a record.", "Expected object input.");
    return result(errors);
  }

  validateSharedFields(fact, "careerfact_", "fact", errors);

  if (!includesValue(CAREER_FACT_TYPES, fact.factType)) {
    addError(errors, "UNSUPPORTED_FACT_TYPE", "fact.factType", "This career fact type is not supported.", "Fact type is outside S010.02B.");
  }

  for (const field of ["subject", "statement", "normalizedStatement", "classification", "createdAt", "updatedAt"]) {
    if (!isNonEmptyString(fact[field])) {
      addError(errors, "FIELD_REQUIRED", `fact.${field}`, "This career fact needs a clear value.", `${field} is missing or empty.`);
    }
  }

  if (!includesValue(CAREER_EVIDENCE_SUPPORT_LEVELS, fact.supportLevel)) {
    addError(errors, "UNSUPPORTED_SUPPORT_LEVEL", "fact.supportLevel", "This support level is not supported.", "Support level is outside S010.02B.");
  }

  if (!includesValue(CAREER_VERIFICATION_STATUSES, fact.verificationStatus)) {
    addError(
      errors,
      "UNSUPPORTED_VERIFICATION_STATUS",
      "fact.verificationStatus",
      "This verification status is not supported.",
      "Verification status is outside S010.02B.",
    );
  }

  if (!includesValue(CAREER_AUTHORITY_CLASSIFICATIONS, fact.authorityClassification)) {
    addError(
      errors,
      "UNSUPPORTED_AUTHORITY_CLASSIFICATION",
      "fact.authorityClassification",
      "This fact authority is not supported.",
      "Authority classification is outside S010.02B.",
    );
  }

  if (!includesValue(CAREER_PRIVACY_CLASSIFICATIONS, fact.privacyClassification)) {
    addError(
      errors,
      "UNSUPPORTED_PRIVACY_CLASSIFICATION",
      "fact.privacyClassification",
      "This fact privacy classification is not supported.",
      "Privacy classification is outside S010.02B.",
    );
  }

  if (!includesValue(CAREER_METRIC_CLASSIFICATIONS, fact.metricClassification)) {
    addError(
      errors,
      "UNSUPPORTED_METRIC_CLASSIFICATION",
      "fact.metricClassification",
      "This metric classification is not supported.",
      "Metric classification is outside S010.02B.",
    );
  }

  if (fact.experienceClassification !== null && !includesValue(CAREER_EXPERIENCE_CLASSIFICATIONS, fact.experienceClassification)) {
    addError(
      errors,
      "UNSUPPORTED_EXPERIENCE_CLASSIFICATION",
      "fact.experienceClassification",
      "This experience classification is not supported.",
      "Experience classification is outside S010.02B.",
    );
  }

  if (!isStringArray(fact.sourceEvidenceIds)) {
    addError(errors, "FIELD_REQUIRED", "fact.sourceEvidenceIds", "Career facts must cite evidence IDs explicitly.", "sourceEvidenceIds must be a string array.");
  }

  if (!isStringArray(fact.conflictingEvidenceIds)) {
    addError(errors, "FIELD_REQUIRED", "fact.conflictingEvidenceIds", "Conflicting evidence must be explicit.", "conflictingEvidenceIds must be a string array.");
  }

  if (!Array.isArray(fact.conflictTypes) || !fact.conflictTypes.every((conflictType) => includesValue(CAREER_CONFLICT_TYPES, conflictType))) {
    addError(errors, "FIELD_REQUIRED", "fact.conflictTypes", "Conflict types must use the Career Evidence conflict model.", "conflictTypes must be supported values.");
  }

  if (!Array.isArray(fact.limitations) || fact.limitations.length === 0) {
    addError(errors, "FIELD_REQUIRED", "fact.limitations", "Career facts must say what they do not prove.", "limitations must be a non-empty array.");
  }

  const sourceEvidenceIds = isStringArray(fact.sourceEvidenceIds) ? fact.sourceEvidenceIds : [];
  const supportingEvidence = supportingEvidenceForFact(fact, evidenceRecords);

  for (const evidenceId of sourceEvidenceIds) {
    const evidence = evidenceById(evidenceRecords, evidenceId);
    if (!evidence) {
      addError(
        errors,
        "SOURCE_EVIDENCE_NOT_FOUND",
        "fact.sourceEvidenceIds",
        "This career fact cites evidence that is not present.",
        `Missing evidence ID ${evidenceId}.`,
        { factId: fact.id },
      );
      continue;
    }

    if (!evidence.supportsFactIds.includes(fact.id)) {
      addError(
        errors,
        "EVIDENCE_DOES_NOT_SUPPORT_FACT",
        "fact.sourceEvidenceIds",
        "This evidence does not explicitly support the career fact.",
        `${evidence.id} does not include ${fact.id} in supportsFactIds.`,
        { factId: fact.id, evidenceId: evidence.id },
      );
    }
  }

  if (fact.verificationStatus === "VERIFIED" && sourceEvidenceIds.length === 0) {
    addError(
      errors,
      "VERIFIED_REQUIRES_EVIDENCE",
      "fact.sourceEvidenceIds",
      "Verified career facts require supporting evidence.",
      "VERIFIED status cannot be used without sourceEvidenceIds.",
      { factId: fact.id },
    );
  }

  if (fact.verificationStatus === "VERIFIED" && hasGeneratedResumeOnly(supportingEvidence)) {
    addError(
      errors,
      "GENERATED_RESUME_CANNOT_VERIFY_FACT",
      "fact.sourceEvidenceIds",
      "A generated resume cannot verify a career fact by itself.",
      "Generated or resume-only evidence preserves prior wording, not career truth.",
      { factId: fact.id },
    );
  }

  if (fact.verificationStatus === "VERIFIED" && fact.supportLevel !== "DIRECT") {
    addError(
      errors,
      "PARTIALLY_SUPPORTED_PRESENTED_VERIFIED",
      "fact.supportLevel",
      "Partly supported evidence cannot be shown as verified.",
      `VERIFIED requires DIRECT support, got ${String(fact.supportLevel)}.`,
      { factId: fact.id },
    );
  }

  const conflictingEvidence = evidenceChallengesFact(fact.id, evidenceRecords);
  const hasConflicts =
    (Array.isArray(fact.conflictingEvidenceIds) && fact.conflictingEvidenceIds.length > 0) ||
    (Array.isArray(fact.conflictTypes) && fact.conflictTypes.length > 0) ||
    conflictingEvidence.length > 0;

  if (hasConflicts && fact.verificationStatus !== "CONFLICTING") {
    addError(
      errors,
      "CONFLICT_SILENTLY_RESOLVED",
      "fact.verificationStatus",
      "Conflicting evidence needs Ross's review.",
      "Conflicting evidence cannot be reduced to one verified fact.",
      { factId: fact.id },
    );
  }

  if (Array.isArray(fact.conflictTypes) && fact.conflictTypes.includes("TITLE_CONFLICT") && fact.verificationStatus !== "CONFLICTING") {
    addError(
      errors,
      "TITLE_CONFLICT_SILENTLY_RESOLVED",
      "fact.conflictTypes",
      "Conflicting titles must remain unresolved until reviewed.",
      "TITLE_CONFLICT requires CONFLICTING status.",
      { factId: fact.id },
    );
  }

  if (
    Array.isArray(fact.conflictTypes) &&
    (fact.conflictTypes.includes("START_DATE_CONFLICT") || fact.conflictTypes.includes("END_DATE_CONFLICT")) &&
    fact.verificationStatus !== "CONFLICTING"
  ) {
    addError(
      errors,
      "DATE_CONFLICT_SILENTLY_RESOLVED",
      "fact.conflictTypes",
      "Conflicting dates must remain unresolved until reviewed.",
      "Date conflicts require CONFLICTING status.",
      { factId: fact.id },
    );
  }

  if (fact.metricClassification === "UNSUPPORTED") {
    addError(
      errors,
      "UNSUPPORTED_METRIC",
      "fact.metricClassification",
      "Unsupported metrics cannot be used as career facts.",
      "Metrics require measurement authority before resume or accomplishment use.",
      { factId: fact.id },
    );
  }

  if (
    fact.factType === "ACHIEVEMENT" &&
    /\b(\d+%|\$\d|\d+\s*(customers?|users?|projects?|stores?|merchants?|percent|x)\b)/i.test(fact.statement || "") &&
    !["VERIFIED_METRIC", "OPERATOR_ESTIMATE", "DERIVED_ESTIMATE", "THIRD_PARTY_REPORTED"].includes(fact.metricClassification)
  ) {
    addError(
      errors,
      "UNSUPPORTED_METRIC",
      "fact.statement",
      "This accomplishment contains a metric without authority.",
      "Numeric results need a metric classification and measurement source.",
      { factId: fact.id },
    );
  }

  if (typeof fact.yearsOfExperience === "number" && !isNonEmptyString(fact.yearsAuthority)) {
    addError(
      errors,
      "UNSUPPORTED_YEARS_OF_EXPERIENCE",
      "fact.yearsOfExperience",
      "Years of experience cannot be inferred.",
      "yearsAuthority is required when yearsOfExperience is set.",
      { factId: fact.id },
    );
  }

  if (isNonEmptyString(fact.proficiencyLabel) && /\b(expert|advanced|master|senior)\b/i.test(fact.proficiencyLabel)) {
    addError(
      errors,
      "UNSUPPORTED_PROFICIENCY_LABEL",
      "fact.proficiencyLabel",
      "Skill level language needs explicit authority.",
      "Expert, Advanced, Master, or Senior labels are not allowed without a governed proficiency authority.",
      { factId: fact.id },
    );
  }

  if (fact.experienceClassification === "USED_IN_PRODUCTION" && !hasDeploymentEvidence(supportingEvidence)) {
    addError(
      errors,
      "PRODUCTION_USE_UNSUPPORTED",
      "fact.experienceClassification",
      "Controlled or studied use cannot be shown as production experience.",
      "USED_IN_PRODUCTION requires production-use evidence.",
      { factId: fact.id },
    );
  }

  if (fact.deploymentClaim === "DEPLOYED" && !hasDeploymentEvidence(supportingEvidence)) {
    addError(
      errors,
      "PROJECT_DEPLOYMENT_UNSUPPORTED",
      "fact.deploymentClaim",
      "Deployment claims need supporting evidence.",
      "Repository or project evidence must explicitly support deployment before DEPLOYED can be used.",
      { factId: fact.id },
    );
  }

  if (fact.customerUseClaim === "CUSTOMER_USED" && !hasCustomerUseEvidence(supportingEvidence)) {
    addError(
      errors,
      "CUSTOMER_USE_UNSUPPORTED",
      "fact.customerUseClaim",
      "Customer-use claims need supporting evidence.",
      "Customer, client, user, or merchant use requires explicit source authority.",
      { factId: fact.id },
    );
  }

  if (
    fact.factType === "CERTIFICATION" &&
    (fact.verificationStatus === "VERIFIED" || fact.current === true) &&
    !supportingEvidence.some((evidence) => evidence.authorityClassification === "PROVIDER_CONFIRMED" || evidence.authorityClassification === "OFFICIAL_DOCUMENT")
  ) {
    addError(
      errors,
      "CERTIFICATION_WITHOUT_AUTHORITY",
      "fact.sourceEvidenceIds",
      "Certification claims need provider or official-document authority.",
      "Certification facts cannot be verified from generated or unconfirmed material.",
      { factId: fact.id },
    );
  }

  if (
    (fact.authorityClassification === "GENERATED_DOCUMENT" || fact.authorityClassification === "HISTORICAL_CONTINUITY") &&
    (fact.verificationStatus === "VERIFIED" || fact.current === true)
  ) {
    addError(
      errors,
      "HISTORICAL_WORDING_PRESENTED_CURRENT",
      "fact.authorityClassification",
      "Historical wording cannot become current career truth automatically.",
      "Generated or historical continuity sources need separate verification.",
      { factId: fact.id },
    );
  }

  if (Array.isArray(fact.positioningBoundaries)) {
    for (const [index, positioning] of fact.positioningBoundaries.entries()) {
      if (positioning?.changesMeaning === true) {
        addError(
          errors,
          "POSITIONING_CHANGES_FACT",
          `fact.positioningBoundaries.${index}`,
          "Positioning cannot change the underlying career fact.",
          "Positioning may adjust wording, but it cannot add or change facts.",
          { factId: fact.id },
        );
      }
    }
  }

  if (fact.verificationStatus === "HISTORICAL_ONLY") {
    warnings.push("Historical-only facts can preserve prior wording but cannot be used as current truth.");
  }

  return result(errors, warnings);
}

export function getEvidenceForFact(
  factId: string,
  evidenceRecords: readonly CareerEvidence[] = CAREER_EVIDENCE_FIXTURES,
) {
  return evidenceRecords.filter(
    (evidence) => evidence.supportsFactIds.includes(factId) || evidence.challengesFactIds.includes(factId),
  );
}

export function getFactsSupportedByEvidence(
  evidenceId: string,
  facts: readonly CareerFact[] = CAREER_FACT_FIXTURES,
  evidenceRecords: readonly CareerEvidence[] = CAREER_EVIDENCE_FIXTURES,
) {
  const evidence = evidenceById(evidenceRecords, evidenceId);
  if (!evidence) {
    return [];
  }

  return facts.filter((fact) => evidence.supportsFactIds.includes(fact.id));
}

export function identifyFactConflicts(
  facts: readonly CareerFact[] = CAREER_FACT_FIXTURES,
  evidenceRecords: readonly CareerEvidence[] = CAREER_EVIDENCE_FIXTURES,
): CareerFactConflict[] {
  return facts
    .map((fact) => {
      const challengingEvidenceIds = evidenceChallengesFact(fact.id, evidenceRecords).map((evidence) => evidence.id);
      const evidenceIds = Array.from(new Set([...fact.conflictingEvidenceIds, ...challengingEvidenceIds]));
      const conflictTypes = fact.conflictTypes.length > 0 ? fact.conflictTypes : evidenceIds.length > 0 ? (["OTHER"] as CareerConflictType[]) : [];

      if (evidenceIds.length === 0 && conflictTypes.length === 0) {
        return null;
      }

      return {
        factId: fact.id,
        conflictTypes,
        evidenceIds,
        operatorSafeMessage: "Conflicting evidence needs Ross's review before StaffordOS treats this as career truth.",
      };
    })
    .filter((conflict): conflict is CareerFactConflict => Boolean(conflict));
}

export function determineVerificationEligibility(
  fact: CareerFact,
  evidenceRecords: readonly CareerEvidence[] = CAREER_EVIDENCE_FIXTURES,
): CareerVerificationEligibility {
  const beforeStatus = fact.verificationStatus;
  const validation = validateCareerFactFixture(fact, evidenceRecords);
  const supportingEvidence = supportingEvidenceForFact(fact, evidenceRecords);
  const reasons: string[] = [];

  if (fact.verificationStatus === "HISTORICAL_ONLY") {
    return {
      factId: fact.id,
      eligibilityStatus: "HISTORICAL_ONLY",
      reasons: ["Historical-only facts cannot become current truth without a new review source."],
      verificationStatusUnchanged: beforeStatus,
    };
  }

  if (identifyFactConflicts([fact], evidenceRecords).length > 0 || fact.verificationStatus === "CONFLICTING") {
    return {
      factId: fact.id,
      eligibilityStatus: "CONFLICT_REQUIRES_REVIEW",
      reasons: ["Conflicting evidence must be reviewed before verification."],
      verificationStatusUnchanged: beforeStatus,
    };
  }

  if (supportingEvidence.length === 0) {
    return {
      factId: fact.id,
      eligibilityStatus: "NEEDS_MORE_EVIDENCE",
      reasons: ["No supporting evidence is present."],
      verificationStatusUnchanged: beforeStatus,
    };
  }

  const blockingCodes = validation.errors
    .map((error) => error.code)
    .filter(
      (code) =>
        code !== "PARTIALLY_SUPPORTED_PRESENTED_VERIFIED" &&
        code !== "VERIFIED_REQUIRES_EVIDENCE",
    );

  if (blockingCodes.length > 0) {
    return {
      factId: fact.id,
      eligibilityStatus: "NOT_ELIGIBLE",
      reasons: blockingCodes,
      verificationStatusUnchanged: beforeStatus,
    };
  }

  if (fact.factType === "CERTIFICATION" && !supportingEvidence.some(hasStrongVerificationAuthority)) {
    return {
      factId: fact.id,
      eligibilityStatus: "NOT_ELIGIBLE",
      reasons: ["Certification needs provider confirmation or an official document."],
      verificationStatusUnchanged: beforeStatus,
    };
  }

  if (fact.supportLevel === "INSUFFICIENT" || fact.supportLevel === "UNKNOWN") {
    return {
      factId: fact.id,
      eligibilityStatus: "NEEDS_MORE_EVIDENCE",
      reasons: ["The current evidence does not sufficiently support the fact."],
      verificationStatusUnchanged: beforeStatus,
    };
  }

  return {
    factId: fact.id,
    eligibilityStatus: "ELIGIBLE_FOR_OPERATOR_VERIFICATION",
    reasons: ["The fact has supporting evidence and no unresolved blocking issue."],
    verificationStatusUnchanged: beforeStatus,
  };
}

export const CAREER_FACT_FIXTURES: readonly CareerFact[] = deepFreeze([
  {
    id: "careerfact_prof_education_aurora_college_degree",
    workspaceId: "professional",
    factType: "EDUCATION",
    subject: "Synthetic candidate",
    statement: "Synthetic candidate completed a Bachelor of Science program at Aurora College.",
    normalizedStatement: "Bachelor of Science, Aurora College.",
    startDate: null,
    endDate: "2017-05",
    current: false,
    organization: "Aurora College",
    roleOrTitle: null,
    location: "Fictional City",
    classification: "Education credential",
    supportLevel: "DIRECT",
    verificationStatus: "VERIFIED",
    authorityClassification: "OFFICIAL_DOCUMENT",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: ["careerev_prof_education_official_record"],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: "NOT_APPLICABLE",
    measurementAuthority: null,
    experienceClassification: null,
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "NOT_APPLICABLE",
    customerUseClaim: "NONE",
    technologyOrSkill: null,
    limitations: ["Synthetic fixture only; no real education record is created."],
    operatorNotes: null,
    positioningBoundaries: [],
    createdAt: "2026-08-03T00:00:00Z",
    updatedAt: "2026-08-03T00:00:00Z",
    testOnly: true,
  },
  {
    id: "careerfact_prof_cert_cloud_bridge_needs_provider",
    workspaceId: "professional",
    factType: "CERTIFICATION",
    subject: "Synthetic candidate",
    statement: "Synthetic candidate may hold a Cloud Bridge Practitioner certification.",
    normalizedStatement: "Cloud Bridge Practitioner certification needs provider confirmation.",
    startDate: null,
    endDate: null,
    current: null,
    organization: "Cloud Bridge Institute",
    roleOrTitle: null,
    location: null,
    classification: "Certification needing authority",
    supportLevel: "UNKNOWN",
    verificationStatus: "NEEDS_EVIDENCE",
    authorityClassification: "NEEDS_VERIFICATION",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: ["careerev_prof_historical_resume_wording"],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: "NOT_APPLICABLE",
    measurementAuthority: null,
    experienceClassification: null,
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "NOT_APPLICABLE",
    customerUseClaim: "NONE",
    technologyOrSkill: null,
    limitations: ["Historical wording is not provider confirmation."],
    operatorNotes: null,
    positioningBoundaries: [],
    createdAt: "2026-08-03T00:00:00Z",
    updatedAt: "2026-08-03T00:00:00Z",
    testOnly: true,
  },
  {
    id: "careerfact_prof_project_cedar_console",
    workspaceId: "professional",
    factType: "PROJECT",
    subject: "Synthetic candidate",
    statement: "Synthetic candidate designed a governed operations console for the Cedar Console controlled project.",
    normalizedStatement: "Designed governed operations console for Cedar Console controlled project.",
    startDate: "2026-01",
    endDate: "2026-02",
    current: false,
    organization: "Cedar Console Lab",
    roleOrTitle: "Project designer",
    location: null,
    classification: "Controlled project",
    supportLevel: "DIRECT",
    verificationStatus: "PARTIALLY_SUPPORTED",
    authorityClassification: "REPOSITORY_BACKED",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: ["careerev_prof_repository_project_artifact"],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: "NOT_APPLICABLE",
    measurementAuthority: null,
    experienceClassification: null,
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "LOCAL_ONLY",
    customerUseClaim: "NONE",
    technologyOrSkill: null,
    limitations: ["Repository-backed project evidence does not prove deployment or customer use."],
    operatorNotes: null,
    positioningBoundaries: [],
    createdAt: "2026-08-03T00:00:00Z",
    updatedAt: "2026-08-03T00:00:00Z",
    testOnly: true,
  },
  {
    id: "careerfact_prof_technology_typescript_controlled",
    workspaceId: "professional",
    factType: "TECHNOLOGY",
    subject: "Synthetic candidate",
    statement: "Synthetic candidate used TypeScript in a controlled project fixture.",
    normalizedStatement: "TypeScript used in a controlled project fixture.",
    startDate: null,
    endDate: null,
    current: null,
    organization: "Cedar Console Lab",
    roleOrTitle: null,
    location: null,
    classification: "Technology context",
    supportLevel: "DIRECT",
    verificationStatus: "PARTIALLY_SUPPORTED",
    authorityClassification: "REPOSITORY_BACKED",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: ["careerev_prof_controlled_project_artifact"],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: "NOT_APPLICABLE",
    measurementAuthority: null,
    experienceClassification: "USED_IN_CONTROLLED_PROJECT",
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "CONTROLLED_PROJECT",
    customerUseClaim: "CONTROLLED_TEST",
    technologyOrSkill: "TypeScript",
    limitations: ["Controlled project use is not production use and does not prove proficiency level."],
    operatorNotes: null,
    positioningBoundaries: [],
    createdAt: "2026-08-03T00:00:00Z",
    updatedAt: "2026-08-03T00:00:00Z",
    testOnly: true,
  },
  {
    id: "careerfact_prof_technology_riverdb_studied",
    workspaceId: "professional",
    factType: "TECHNOLOGY",
    subject: "Synthetic candidate",
    statement: "Synthetic candidate studied RiverDB concepts in a test-only learning note.",
    normalizedStatement: "RiverDB studied in a test-only learning note.",
    startDate: null,
    endDate: null,
    current: null,
    organization: null,
    roleOrTitle: null,
    location: null,
    classification: "Studied technology",
    supportLevel: "DIRECT",
    verificationStatus: "PARTIALLY_SUPPORTED",
    authorityClassification: "OPERATOR_CONFIRMED",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: ["careerev_prof_study_note"],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: "NOT_APPLICABLE",
    measurementAuthority: null,
    experienceClassification: "STUDIED",
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "NOT_APPLICABLE",
    customerUseClaim: "NONE",
    technologyOrSkill: "RiverDB",
    limitations: ["Studied technology does not prove professional or production experience."],
    operatorNotes: null,
    positioningBoundaries: [],
    createdAt: "2026-08-03T00:00:00Z",
    updatedAt: "2026-08-03T00:00:00Z",
    testOnly: true,
  },
  {
    id: "careerfact_prof_employment_blue_ridge_conflict",
    workspaceId: "professional",
    factType: "EMPLOYMENT",
    subject: "Synthetic candidate",
    statement: "Synthetic candidate has conflicting title and date evidence for Blue Ridge Systems.",
    normalizedStatement: "Blue Ridge Systems employment title and dates require review.",
    startDate: null,
    endDate: null,
    current: null,
    organization: "Blue Ridge Systems",
    roleOrTitle: null,
    location: "Fictional City",
    classification: "Employment conflict",
    supportLevel: "CONFLICTING",
    verificationStatus: "CONFLICTING",
    authorityClassification: "IMPORTED_DOCUMENT",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: ["careerev_prof_employment_title_a"],
    conflictingEvidenceIds: ["careerev_prof_employment_title_b"],
    conflictTypes: ["TITLE_CONFLICT", "START_DATE_CONFLICT", "END_DATE_CONFLICT"],
    metricClassification: "NOT_APPLICABLE",
    measurementAuthority: null,
    experienceClassification: null,
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "NOT_APPLICABLE",
    customerUseClaim: "NONE",
    technologyOrSkill: null,
    limitations: ["Conflicting title and date evidence must be reviewed before any resume use."],
    operatorNotes: "Synthetic conflict fixture.",
    positioningBoundaries: [],
    createdAt: "2026-08-03T00:00:00Z",
    updatedAt: "2026-08-03T00:00:00Z",
    testOnly: true,
  },
  {
    id: "careerfact_prof_achievement_unsupported_metric",
    workspaceId: "professional",
    factType: "ACHIEVEMENT",
    subject: "Synthetic candidate",
    statement: "Synthetic candidate improved onboarding by 40%.",
    normalizedStatement: "Onboarding improvement metric needs authority.",
    startDate: null,
    endDate: null,
    current: null,
    organization: "Example Studio",
    roleOrTitle: null,
    location: null,
    classification: "Unsupported accomplishment metric",
    supportLevel: "INSUFFICIENT",
    verificationStatus: "PROPOSED",
    authorityClassification: "GENERATED_DOCUMENT",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: ["careerev_prof_accomplishment_generated_claim"],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: "UNSUPPORTED",
    measurementAuthority: null,
    experienceClassification: null,
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "NOT_APPLICABLE",
    customerUseClaim: "NONE",
    technologyOrSkill: null,
    limitations: ["Generated metric has no baseline or measurement authority."],
    operatorNotes: null,
    positioningBoundaries: [],
    createdAt: "2026-08-03T00:00:00Z",
    updatedAt: "2026-08-03T00:00:00Z",
    testOnly: true,
  },
  {
    id: "careerfact_prof_leadership_operator_limited",
    workspaceId: "professional",
    factType: "LEADERSHIP",
    subject: "Synthetic candidate",
    statement: "Synthetic candidate coordinated a weekly review ritual for a test-only project group.",
    normalizedStatement: "Coordinated weekly review ritual for test-only project group.",
    startDate: null,
    endDate: null,
    current: null,
    organization: "Example Studio",
    roleOrTitle: null,
    location: null,
    classification: "Operator-confirmed leadership example with limitation",
    supportLevel: "DIRECT",
    verificationStatus: "PARTIALLY_SUPPORTED",
    authorityClassification: "OPERATOR_CONFIRMED",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: ["careerev_prof_operator_attestation_limited"],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: "NOT_APPLICABLE",
    measurementAuthority: null,
    experienceClassification: "TRANSFERABLE",
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "NOT_APPLICABLE",
    customerUseClaim: "NONE",
    technologyOrSkill: null,
    limitations: ["Operator attestation supports coordination only; it does not prove people-management authority."],
    operatorNotes: "Synthetic operator-confirmed example.",
    positioningBoundaries: [
      {
        statement: "Coordinated a recurring project review ritual.",
        sourceFactIds: ["careerfact_prof_leadership_operator_limited"],
        positioningState: "READY_FOR_REVIEW",
        changesMeaning: false,
        limitation: "Does not claim formal management responsibility.",
      },
    ],
    createdAt: "2026-08-03T00:00:00Z",
    updatedAt: "2026-08-03T00:00:00Z",
    testOnly: true,
  },
]);

export const CAREER_EVIDENCE_FIXTURES: readonly CareerEvidence[] = deepFreeze([
  {
    id: "careerev_prof_education_official_record",
    workspaceId: "professional",
    evidenceType: "EDUCATION_RECORD",
    title: "Aurora College official completion fixture",
    summary: "Synthetic official-document fixture supporting a completed education fact.",
    sourceType: "EDUCATION_RECORD",
    sourceReference: "fixture://career/education/aurora-college-degree",
    sourceArtifact: "fixture://career/education/aurora-college-degree.pdf",
    sourceOwner: "Aurora College synthetic registrar",
    observedAt: "2026-08-03T00:00:00Z",
    sourceCreatedAt: "2017-05-15",
    authorityClassification: "OFFICIAL_DOCUMENT",
    privacyClassification: "Professional test fixture",
    freshness: "Historical",
    supportsFactIds: ["careerfact_prof_education_aurora_college_degree"],
    challengesFactIds: [],
    contentDigest: "sha256:fixture-education-aurora-degree",
    excerptReference: "Fixture education record states Bachelor of Science completion.",
    limitations: ["Synthetic fixture only; not a real education document."],
    operatorReviewStatus: "Ross confirmed",
    testOnly: true,
  },
  {
    id: "careerev_prof_historical_resume_wording",
    workspaceId: "professional",
    evidenceType: "RESUME",
    title: "Historical generated resume wording fixture",
    summary: "Synthetic generated resume wording that mentions a certification but does not prove it.",
    sourceType: "RESUME",
    sourceReference: "fixture://career/resume/generated-cert-wording",
    sourceArtifact: "fixture://career/resume/generated-cert-wording.md",
    sourceOwner: "Synthetic resume generator",
    observedAt: "2026-08-03T00:00:00Z",
    sourceCreatedAt: null,
    authorityClassification: "GENERATED_DOCUMENT",
    privacyClassification: "Professional test fixture",
    freshness: "Historical",
    supportsFactIds: ["careerfact_prof_cert_cloud_bridge_needs_provider"],
    challengesFactIds: [],
    contentDigest: "sha256:fixture-generated-resume-wording",
    excerptReference: "Generated wording says certification may exist.",
    limitations: ["Generated resume wording is evidence of wording only, not career truth."],
    operatorReviewStatus: "Needs Ross's review",
    testOnly: true,
  },
  {
    id: "careerev_prof_repository_project_artifact",
    workspaceId: "professional",
    evidenceType: "PROJECT_ARTIFACT",
    title: "Cedar Console repository architecture fixture",
    summary: "Synthetic repository-backed architecture artifact for a controlled local project.",
    sourceType: "PROJECT_ARTIFACT",
    sourceReference: "fixture://career/projects/cedar-console/architecture",
    sourceArtifact: "fixture://career/projects/cedar-console/architecture.md",
    sourceOwner: "Synthetic project repository",
    observedAt: "2026-08-03T00:00:00Z",
    sourceCreatedAt: "2026-02-10",
    authorityClassification: "REPOSITORY_BACKED",
    privacyClassification: "Professional test fixture",
    freshness: "Historical",
    supportsFactIds: ["careerfact_prof_project_cedar_console"],
    challengesFactIds: [],
    contentDigest: "sha256:fixture-cedar-console-architecture",
    excerptReference: "Architecture fixture documents a governed operations console design.",
    limitations: ["Repository artifact proves only scoped controlled-project design, not deployment or customer use."],
    operatorReviewStatus: "Needs Ross's review",
    testOnly: true,
  },
  {
    id: "careerev_prof_controlled_project_artifact",
    workspaceId: "professional",
    evidenceType: "PROJECT_ARTIFACT",
    title: "Cedar Console TypeScript fixture",
    summary: "Synthetic project artifact showing TypeScript use in a controlled project.",
    sourceType: "PROJECT_ARTIFACT",
    sourceReference: "fixture://career/projects/cedar-console/typescript-use",
    sourceArtifact: "fixture://career/projects/cedar-console/source.ts",
    sourceOwner: "Synthetic project repository",
    observedAt: "2026-08-03T00:00:00Z",
    sourceCreatedAt: "2026-02-11",
    authorityClassification: "REPOSITORY_BACKED",
    privacyClassification: "Professional test fixture",
    freshness: "Historical",
    supportsFactIds: ["careerfact_prof_technology_typescript_controlled"],
    challengesFactIds: [],
    contentDigest: "sha256:fixture-typescript-controlled-project",
    excerptReference: "Fixture source contains TypeScript in a controlled project.",
    limitations: ["Does not prove production use, proficiency level, or years of experience."],
    operatorReviewStatus: "Needs Ross's review",
    testOnly: true,
  },
  {
    id: "careerev_prof_study_note",
    workspaceId: "professional",
    evidenceType: "OPERATOR_ATTESTATION",
    title: "RiverDB study note fixture",
    summary: "Synthetic operator-attestation fixture for studied technology.",
    sourceType: "OPERATOR_ATTESTATION",
    sourceReference: "fixture://career/study/riverdb-note",
    sourceArtifact: null,
    sourceOwner: "Synthetic operator",
    observedAt: "2026-08-03T00:00:00Z",
    sourceCreatedAt: "2026-03-01",
    authorityClassification: "OPERATOR_CONFIRMED",
    privacyClassification: "Professional test fixture",
    freshness: "Historical",
    supportsFactIds: ["careerfact_prof_technology_riverdb_studied"],
    challengesFactIds: [],
    contentDigest: "sha256:fixture-riverdb-study-note",
    excerptReference: "Operator note says the technology was studied.",
    limitations: ["Studied technology does not prove professional use."],
    operatorReviewStatus: "Ross confirmed",
    testOnly: true,
  },
  {
    id: "careerev_prof_employment_title_a",
    workspaceId: "professional",
    evidenceType: "EMPLOYMENT_RECORD",
    title: "Blue Ridge title fixture A",
    summary: "Synthetic employment record fixture listing Product Coordinator from 2020-01 to 2021-12.",
    sourceType: "EMPLOYMENT_RECORD",
    sourceReference: "fixture://career/employment/blue-ridge/title-a",
    sourceArtifact: "fixture://career/employment/blue-ridge/title-a.pdf",
    sourceOwner: "Blue Ridge Systems synthetic HR",
    observedAt: "2026-08-03T00:00:00Z",
    sourceCreatedAt: "2022-01-05",
    authorityClassification: "IMPORTED_DOCUMENT",
    privacyClassification: "Professional test fixture",
    freshness: "Historical",
    supportsFactIds: ["careerfact_prof_employment_blue_ridge_conflict"],
    challengesFactIds: [],
    contentDigest: "sha256:fixture-blue-ridge-title-a",
    excerptReference: "Fixture A says Product Coordinator from 2020-01 to 2021-12.",
    limitations: ["Conflicts with another title and date fixture."],
    operatorReviewStatus: "Needs Ross's review",
    testOnly: true,
  },
  {
    id: "careerev_prof_employment_title_b",
    workspaceId: "professional",
    evidenceType: "EMPLOYMENT_RECORD",
    title: "Blue Ridge title fixture B",
    summary: "Synthetic employment record fixture listing Program Coordinator from 2020-06 to 2022-03.",
    sourceType: "EMPLOYMENT_RECORD",
    sourceReference: "fixture://career/employment/blue-ridge/title-b",
    sourceArtifact: "fixture://career/employment/blue-ridge/title-b.pdf",
    sourceOwner: "Blue Ridge Systems synthetic HR",
    observedAt: "2026-08-03T00:00:00Z",
    sourceCreatedAt: "2022-02-01",
    authorityClassification: "IMPORTED_DOCUMENT",
    privacyClassification: "Professional test fixture",
    freshness: "Historical",
    supportsFactIds: [],
    challengesFactIds: ["careerfact_prof_employment_blue_ridge_conflict"],
    contentDigest: "sha256:fixture-blue-ridge-title-b",
    excerptReference: "Fixture B says Program Coordinator from 2020-06 to 2022-03.",
    limitations: ["Conflicts with another title and date fixture."],
    operatorReviewStatus: "Needs Ross's review",
    testOnly: true,
  },
  {
    id: "careerev_prof_operator_attestation_limited",
    workspaceId: "professional",
    evidenceType: "OPERATOR_ATTESTATION",
    title: "Limited leadership attestation fixture",
    summary: "Synthetic operator attestation supporting coordination, not management authority.",
    sourceType: "OPERATOR_ATTESTATION",
    sourceReference: "fixture://career/operator-attestation/leadership-limited",
    sourceArtifact: null,
    sourceOwner: "Synthetic operator",
    observedAt: "2026-08-03T00:00:00Z",
    sourceCreatedAt: "2026-08-03",
    authorityClassification: "OPERATOR_CONFIRMED",
    privacyClassification: "Professional test fixture",
    freshness: "Current",
    supportsFactIds: ["careerfact_prof_leadership_operator_limited"],
    challengesFactIds: [],
    contentDigest: "sha256:fixture-leadership-attestation-limited",
    excerptReference: "Attestation supports coordination only.",
    limitations: ["Does not prove people-management authority or team size."],
    operatorReviewStatus: "Ross confirmed",
    testOnly: true,
  },
  {
    id: "careerev_prof_accomplishment_generated_claim",
    workspaceId: "professional",
    evidenceType: "RESUME",
    title: "Generated metric wording fixture",
    summary: "Synthetic generated wording containing a 40% improvement claim without measurement authority.",
    sourceType: "RESUME",
    sourceReference: "fixture://career/resume/generated-metric-claim",
    sourceArtifact: "fixture://career/resume/generated-metric-claim.md",
    sourceOwner: "Synthetic resume generator",
    observedAt: "2026-08-03T00:00:00Z",
    sourceCreatedAt: null,
    authorityClassification: "GENERATED_DOCUMENT",
    privacyClassification: "Professional test fixture",
    freshness: "Historical",
    supportsFactIds: ["careerfact_prof_achievement_unsupported_metric"],
    challengesFactIds: [],
    contentDigest: "sha256:fixture-generated-metric-claim",
    excerptReference: "Generated wording says improved onboarding by 40%.",
    limitations: ["No baseline, measurement authority, or observed outcome is present."],
    operatorReviewStatus: "Needs Ross's review",
    testOnly: true,
  },
]);

export function getCareerChiefOfStaffCompatibility() {
  return {
    sourceTypes: [...CAREER_CHIEF_OF_STAFF_SOURCE_TYPES],
    requiredFields: [...CAREER_CHIEF_OF_STAFF_SOURCE_FIELDS],
    authorizedForModelUseNow: false,
    limitation: "Professional Career Evidence source snapshots are defined for future use only.",
  };
}

export function getCareerJobRequirementCompatibility() {
  return {
    mapping: "JobRequirement -> CandidateEvidence -> CareerFact -> CareerEvidence -> Fit classification",
    candidateEvidenceImplemented: false,
    fitMappingImplemented: false,
    availableFields: [...CAREER_JOB_REQUIREMENT_COMPATIBILITY_FIELDS],
    limitation: "S010.02B does not implement CandidateEvidence or fit classification.",
  };
}

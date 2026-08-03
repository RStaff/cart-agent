export const JOB_SEARCH_CONTRACT_VERSION = "S010.01";

export const JOB_SEARCH_WORKSPACE_ID = "professional";

export const JOB_SEARCH_SOURCE_TYPES = [
  "Employer career site",
  "Recruiter-provided",
  "Professional network",
  "Job board",
  "Operator-entered",
  "Imported document",
  "Historical continuity context",
  "Needs verification",
] as const;

export const JOB_SEARCH_FRESHNESS = [
  "Current",
  "Recent",
  "Historical",
  "Unknown",
  "Stale",
  "Closed by source",
  "Needs verification",
] as const;

export const JOB_SOURCE_STATUSES = [
  "Recently observed",
  "Needs verification",
  "Historical context",
  "Superseded",
  "Unavailable",
] as const;

export const JOB_OPPORTUNITY_STATUSES = [
  "DISCOVERED",
  "UNDER_REVIEW",
  "QUALIFIED",
  "LOW_PRIORITY",
  "REJECTED_BY_ROSS",
  "CLOSED",
  "NEEDS_VERIFICATION",
] as const;

export const JOB_OPPORTUNITY_STATUS_MODEL = [
  {
    status: "DISCOVERED",
    label: "Found",
    entryCondition: "Role source captured.",
    permittedNextStates: ["UNDER_REVIEW", "NEEDS_VERIFICATION", "LOW_PRIORITY", "REJECTED_BY_ROSS", "CLOSED"],
    rossApprovalRequired: false,
    terminal: false,
    auditEventExpectedLater: "opportunity_discovered",
  },
  {
    status: "UNDER_REVIEW",
    label: "Reviewing fit",
    entryCondition: "Ross or StaffordOS is evaluating the role source and extracted requirements.",
    permittedNextStates: ["QUALIFIED", "LOW_PRIORITY", "REJECTED_BY_ROSS", "NEEDS_VERIFICATION", "CLOSED"],
    rossApprovalRequired: false,
    terminal: false,
    auditEventExpectedLater: "opportunity_review_started",
  },
  {
    status: "QUALIFIED",
    label: "Worth applying",
    entryCondition: "The role appears worth pursuing after source and requirement review.",
    permittedNextStates: ["LOW_PRIORITY", "REJECTED_BY_ROSS", "CLOSED"],
    rossApprovalRequired: true,
    terminal: false,
    auditEventExpectedLater: "opportunity_qualified",
  },
  {
    status: "LOW_PRIORITY",
    label: "Low priority",
    entryCondition: "The role remains possible but is less important than other reviewed opportunities.",
    permittedNextStates: ["UNDER_REVIEW", "QUALIFIED", "REJECTED_BY_ROSS", "CLOSED"],
    rossApprovalRequired: false,
    terminal: false,
    auditEventExpectedLater: "opportunity_lowered",
  },
  {
    status: "REJECTED_BY_ROSS",
    label: "Passed on this role",
    entryCondition: "Ross chose not to pursue the role.",
    permittedNextStates: [],
    rossApprovalRequired: true,
    terminal: true,
    auditEventExpectedLater: "opportunity_rejected_by_ross",
  },
  {
    status: "CLOSED",
    label: "Closed",
    entryCondition: "No further review is planned for this role.",
    permittedNextStates: [],
    rossApprovalRequired: true,
    terminal: true,
    auditEventExpectedLater: "opportunity_closed",
  },
  {
    status: "NEEDS_VERIFICATION",
    label: "Needs verification",
    entryCondition: "The source, listing status, or extracted details need review before use.",
    permittedNextStates: ["UNDER_REVIEW", "LOW_PRIORITY", "REJECTED_BY_ROSS", "CLOSED"],
    rossApprovalRequired: false,
    terminal: false,
    auditEventExpectedLater: "opportunity_verification_needed",
  },
] as const;

export const JOB_DUPLICATE_STATUSES = [
  "NOT_EVALUATED",
  "POSSIBLE_DUPLICATE",
  "CONFIRMED_DUPLICATE",
  "DISTINCT_LISTING",
  "SUPERSEDED_LISTING",
] as const;

export const JOB_REQUIREMENT_CATEGORIES = [
  "Required skill",
  "Preferred skill",
  "Experience",
  "Leadership",
  "Domain",
  "Education",
  "Certification",
  "Responsibility",
  "Location or work arrangement",
  "Compensation",
  "Travel",
  "Legal or employment eligibility",
  "Other",
  "Unknown",
] as const;

export const JOB_REQUIREMENT_LEVELS = [
  "REQUIRED",
  "PREFERRED",
  "DESIRED",
  "RESPONSIBILITY",
  "INFORMATIONAL",
  "UNCLEAR",
] as const;

export const JOB_EXTRACTION_METHODS = [
  "SOURCE_EXPLICIT",
  "OPERATOR_ENTERED",
  "DETERMINISTIC_EXTRACTION",
  "AI_PROPOSED",
  "IMPORTED",
  "NEEDS_REVIEW",
] as const;

export const JOB_REQUIREMENT_REVIEW_STATUSES = [
  "Not reviewed",
  "Needs review",
  "Operator confirmed",
  "Rejected by operator",
] as const;

export const JOB_AUTHORITY_CLASSIFICATIONS = [
  "Source explicit",
  "Operator confirmed",
  "Derived normalization",
  "Imported",
  "AI proposed",
  "Historical continuity context",
  "Needs verification",
] as const;

export const JOB_SEARCH_PRIVACY_CLASSIFICATIONS = [
  "Professional owner-private",
  "Public listing with Professional handling",
  "Professional test fixture",
] as const;

export const JOB_SEARCH_CHIEF_OF_STAFF_SOURCE_TYPES = [
  "job_opportunity_snapshot",
  "job_requirement_snapshot",
] as const;

export const JOB_SEARCH_CHIEF_OF_STAFF_COMPATIBILITY_FIELDS = [
  "source ID",
  "workspace",
  "authority",
  "freshness",
  "privacy",
  "exact source reference",
  "limitations",
  "excluded fields",
  "permission requirement",
] as const;

export const JOB_SEARCH_APPLICATION_BOUNDARY =
  "A JobOpportunity is not an Application. Ross has not applied unless a later Application record exists.";

export const JOB_SEARCH_FIT_ASSESSMENT_BOUNDARY =
  "A JobRequirement does not say whether Ross has or lacks that requirement. Candidate evidence and fit assessment come later.";

export type JobSearchWorkspaceId = typeof JOB_SEARCH_WORKSPACE_ID;
export type JobSourceType = (typeof JOB_SEARCH_SOURCE_TYPES)[number];
export type JobSearchFreshness = (typeof JOB_SEARCH_FRESHNESS)[number];
export type JobSourceStatus = (typeof JOB_SOURCE_STATUSES)[number];
export type JobOpportunityStatus = (typeof JOB_OPPORTUNITY_STATUSES)[number];
export type JobDuplicateStatus = (typeof JOB_DUPLICATE_STATUSES)[number];
export type JobRequirementCategory = (typeof JOB_REQUIREMENT_CATEGORIES)[number];
export type JobRequirementLevel = (typeof JOB_REQUIREMENT_LEVELS)[number];
export type JobExtractionMethod = (typeof JOB_EXTRACTION_METHODS)[number];
export type JobRequirementReviewStatus = (typeof JOB_REQUIREMENT_REVIEW_STATUSES)[number];
export type JobAuthorityClassification = (typeof JOB_AUTHORITY_CLASSIFICATIONS)[number];
export type JobSearchPrivacyClassification = (typeof JOB_SEARCH_PRIVACY_CLASSIFICATIONS)[number];

export type JobSource = {
  id: string;
  workspaceId: JobSearchWorkspaceId;
  sourceType: JobSourceType;
  providerName: string | null;
  providerRecordId: string | null;
  sourceUrl: string | null;
  canonicalUrl: string | null;
  observedAt: string;
  publishedAt: string | null;
  updatedAt: string | null;
  retrievedBy: string;
  authorityClassification: JobAuthorityClassification;
  freshness: JobSearchFreshness;
  privacyClassification: JobSearchPrivacyClassification;
  termsOrAccessLimitation: string;
  rawContentReference: string;
  contentDigest: string;
  duplicateGroupId: string | null;
  status: JobSourceStatus;
  limitations: string[];
  testOnly: true;
};

export type JobOpportunity = {
  id: string;
  workspaceId: JobSearchWorkspaceId;
  sourceId: string;
  companyId: string | null;
  companyName: string;
  roleTitle: string;
  roleTitleNormalized: string;
  employmentType: string | null;
  seniority: string | null;
  locationText: string | null;
  workArrangement: string | null;
  compensationText: string | null;
  compensationMinimum: number | null;
  compensationMaximum: number | null;
  compensationCurrency: string | null;
  compensationPeriod: string | null;
  description: string;
  responsibilities: string[];
  qualificationsSummary: string | null;
  applicationUrl: string | null;
  discoveredAt: string;
  publishedAt: string | null;
  sourceUpdatedAt: string | null;
  listingFreshness: JobSearchFreshness;
  opportunityStatus: JobOpportunityStatus;
  operatorInterest: "Not evaluated" | "Interested" | "Low interest" | "Not interested" | "Needs review";
  privacyClassification: "Professional owner-private";
  authorityClassification: JobAuthorityClassification;
  sourceReference: string;
  duplicateStatus: JobDuplicateStatus;
  duplicateGroupId: string | null;
  limitations: string[];
  createdAt: string;
  updatedAt: string;
  testOnly: true;
};

export type JobRequirement = {
  id: string;
  workspaceId: JobSearchWorkspaceId;
  jobOpportunityId: string;
  sourceId: string;
  requirementText: string;
  normalizedRequirement: string;
  requirementCategory: JobRequirementCategory;
  requirementLevel: JobRequirementLevel;
  importanceClassification: "Required" | "Preferred" | "Informational" | "Unclear";
  evidenceExpectation: string;
  yearsMentioned: number | null;
  degreeMentioned: string | null;
  certificationMentioned: string | null;
  technologyOrSkill: string | null;
  responsibilityOrQualification: string | null;
  extractionMethod: JobExtractionMethod;
  extractionConfidence: "High" | "Moderate" | "Low" | "Needs review";
  sourceExcerptReference: string;
  operatorReviewStatus: JobRequirementReviewStatus;
  ambiguity: string | null;
  limitations: string[];
  createdAt: string;
  testOnly: true;
};

export type JobSearchValidationErrorCode =
  | "WORKSPACE_REQUIRED"
  | "WORKSPACE_NOT_PROFESSIONAL"
  | "TEST_FIXTURE_REQUIRED"
  | "DURABLE_ID_REQUIRED"
  | "URL_USED_AS_PRIMARY_ID"
  | "PROVIDER_ID_USED_AS_PRIMARY_ID"
  | "FIELD_REQUIRED"
  | "URL_MALFORMED"
  | "SOURCE_NOT_FOUND"
  | "SOURCE_STATUS_UNSUPPORTED"
  | "SOURCE_STATUS_FALSELY_OPEN"
  | "SOURCE_DATE_MUST_REMAIN_UNKNOWN"
  | "HISTORICAL_CONTEXT_PRESENTED_CURRENT"
  | "AUTHORITY_CLASSIFICATION_UNSUPPORTED"
  | "AUTHORITY_MISSING"
  | "PRIVACY_CLASSIFICATION_UNSUPPORTED"
  | "PROFESSIONAL_PRIVACY_REQUIRED"
  | "FRESHNESS_UNSUPPORTED"
  | "OPPORTUNITY_STATUS_UNSUPPORTED"
  | "OPPORTUNITY_STATUS_MISSING"
  | "DUPLICATE_STATUS_UNSUPPORTED"
  | "DUPLICATE_SILENTLY_MERGED"
  | "APPLICATION_FIELD_NOT_ALLOWED"
  | "FIT_ASSESSMENT_FIELD_NOT_ALLOWED"
  | "REQUIREMENT_CATEGORY_UNSUPPORTED"
  | "REQUIREMENT_LEVEL_UNSUPPORTED"
  | "REQUIREMENT_LEVEL_CONFLICT"
  | "REQUIREMENT_AMBIGUITY_NOT_PRESERVED"
  | "EXTRACTION_METHOD_UNSUPPORTED"
  | "AI_PROPOSED_NOT_CONFIRMED"
  | "SOURCE_TRACE_REQUIRED"
  | "YEARS_INVENTED"
  | "EQUIVALENT_WORDING_NOT_PRESERVED";

export type JobSearchValidationError = {
  code: JobSearchValidationErrorCode;
  path: string;
  operatorSafeMessage: string;
  technicalDetail: string;
  relatedId?: string;
};

export type JobSearchValidationResult = {
  valid: boolean;
  validationStatus: "Accepted" | "Needs review";
  errors: JobSearchValidationError[];
  warnings: JobSearchValidationError[];
  checkedRecordCount: number;
};

type AnyRecord = Record<string, unknown>;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as AnyRecord)) {
      if (child && typeof child === "object") deepFreeze(child);
    }
  }
  return value;
}

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasValue(value: unknown) {
  return text(value).length > 0;
}

function includesValue<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

function isValidTimestamp(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function isValidUrl(value: unknown) {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function sourceById(sources: readonly JobSource[], sourceId: string) {
  return sources.find((source) => source.id === sourceId) || null;
}

function opportunityById(opportunities: readonly JobOpportunity[], opportunityId: string) {
  return opportunities.find((opportunity) => opportunity.id === opportunityId) || null;
}

function addError(
  errors: JobSearchValidationError[],
  code: JobSearchValidationErrorCode,
  path: string,
  operatorSafeMessage: string,
  technicalDetail: string,
  relatedId?: string
) {
  errors.push({ code, path, operatorSafeMessage, technicalDetail, relatedId });
}

function idIsOpaque(value: unknown, prefix: string) {
  return typeof value === "string" && new RegExp(`^${prefix}_[a-z0-9][a-z0-9_-]*$`).test(value);
}

function idEqualsAlias(id: string, aliases: unknown[]) {
  return aliases.some((alias) => typeof alias === "string" && alias.trim() === id);
}

function validateProfessionalFixtureShell(record: AnyRecord, errors: JobSearchValidationError[], idPrefix: string) {
  if (!hasValue(record.workspaceId)) {
    addError(
      errors,
      "WORKSPACE_REQUIRED",
      "workspaceId",
      "This record needs a Professional workspace.",
      "workspaceId is missing."
    );
  } else if (record.workspaceId !== JOB_SEARCH_WORKSPACE_ID) {
    addError(
      errors,
      "WORKSPACE_NOT_PROFESSIONAL",
      "workspaceId",
      "This record belongs outside Professional.",
      `workspaceId was ${String(record.workspaceId)}.`
    );
  }

  if (record.testOnly !== true) {
    addError(
      errors,
      "TEST_FIXTURE_REQUIRED",
      "testOnly",
      "This record must be marked as a test fixture.",
      "testOnly must be true for S010.01 fixtures."
    );
  }

  if (!idIsOpaque(record.id, idPrefix)) {
    addError(
      errors,
      "DURABLE_ID_REQUIRED",
      "id",
      "This record needs a durable StaffordOS ID.",
      `Expected opaque ID prefix ${idPrefix}_.`
    );
  }
}

function validateAuthority(
  value: unknown,
  errors: JobSearchValidationError[],
  path = "authorityClassification"
) {
  if (!hasValue(value)) {
    addError(
      errors,
      "AUTHORITY_MISSING",
      path,
      "This record needs source authority.",
      "authorityClassification is missing."
    );
    return;
  }
  if (!includesValue(JOB_AUTHORITY_CLASSIFICATIONS, value)) {
    addError(
      errors,
      "AUTHORITY_CLASSIFICATION_UNSUPPORTED",
      path,
      "This source authority needs review.",
      `Unsupported authorityClassification: ${String(value)}.`
    );
  }
}

function validateFreshness(value: unknown, errors: JobSearchValidationError[], path = "freshness") {
  if (!includesValue(JOB_SEARCH_FRESHNESS, value)) {
    addError(
      errors,
      "FRESHNESS_UNSUPPORTED",
      path,
      "This freshness label needs review.",
      `Unsupported freshness: ${String(value)}.`
    );
  }
}

function validatePrivacy(value: unknown, errors: JobSearchValidationError[], path = "privacyClassification") {
  if (!includesValue(JOB_SEARCH_PRIVACY_CLASSIFICATIONS, value)) {
    addError(
      errors,
      "PRIVACY_CLASSIFICATION_UNSUPPORTED",
      path,
      "This privacy label needs review.",
      `Unsupported privacyClassification: ${String(value)}.`
    );
  }
}

function findDisallowedFields(record: AnyRecord, fields: string[]) {
  return fields.filter((field) => Object.prototype.hasOwnProperty.call(record, field));
}

function validateNoApplicationFields(record: AnyRecord, errors: JobSearchValidationError[]) {
  const fields = findDisallowedFields(record, [
    "applicationStatus",
    "applicationDate",
    "submittedAt",
    "recruiterResponse",
    "interviewState",
    "rejectionReason",
    "employerRejectionStatus",
    "offerState",
  ]);

  for (const field of fields) {
    addError(
      errors,
      "APPLICATION_FIELD_NOT_ALLOWED",
      field,
      "Ross has not applied in this contract.",
      `${field} belongs to a later Application contract.`
    );
  }
}

function validateNoFitFields(record: AnyRecord, errors: JobSearchValidationError[]) {
  const fields = findDisallowedFields(record, [
    "fitPercentage",
    "fitScore",
    "matchScore",
    "skillMatch",
    "yearsMatch",
    "resumeRecommendation",
    "likelihoodOfInterview",
    "likelihoodOfOffer",
    "candidateEvidence",
    "evidenceClassification",
  ]);

  for (const field of fields) {
    addError(
      errors,
      "FIT_ASSESSMENT_FIELD_NOT_ALLOWED",
      field,
      "Fit assessment comes later.",
      `${field} belongs to a later Candidate Evidence or Job Fit Assessment contract.`
    );
  }
}

export function validateJobSourceFixture(source: unknown): JobSearchValidationResult {
  const errors: JobSearchValidationError[] = [];
  const warnings: JobSearchValidationError[] = [];

  if (!isRecord(source)) {
    addError(errors, "FIELD_REQUIRED", "source", "This source needs review.", "JobSource fixture must be an object.");
    return { valid: false, validationStatus: "Needs review", errors, warnings, checkedRecordCount: 0 };
  }

  validateProfessionalFixtureShell(source, errors, "jobsrc");
  validateAuthority(source.authorityClassification, errors);
  validateFreshness(source.freshness, errors);
  validatePrivacy(source.privacyClassification, errors);

  for (const field of ["observedAt", "retrievedBy", "rawContentReference", "contentDigest", "termsOrAccessLimitation"]) {
    if (!hasValue(source[field])) {
      addError(errors, "FIELD_REQUIRED", field, "This source is missing required context.", `${field} is required.`);
    }
  }

  if (!includesValue(JOB_SEARCH_SOURCE_TYPES, source.sourceType)) {
    addError(
      errors,
      "FIELD_REQUIRED",
      "sourceType",
      "This source type needs review.",
      `Unsupported sourceType: ${String(source.sourceType)}.`
    );
  }

  if (!includesValue(JOB_SOURCE_STATUSES, source.status)) {
    const code = source.status === "Open" ? "SOURCE_STATUS_FALSELY_OPEN" : "SOURCE_STATUS_UNSUPPORTED";
    addError(
      errors,
      code,
      "status",
      "The listing status needs verification.",
      `Unsupported source status: ${String(source.status)}.`
    );
  }

  if (source.status === "Open") {
    addError(
      errors,
      "SOURCE_STATUS_FALSELY_OPEN",
      "status",
      "A source URL does not prove the listing is open.",
      "Use Recently observed or Needs verification instead of Open."
    );
  }

  if (!isValidTimestamp(source.observedAt)) {
    addError(errors, "FIELD_REQUIRED", "observedAt", "This source needs an observed date.", "observedAt is missing or invalid.");
  }

  for (const field of ["sourceUrl", "canonicalUrl"]) {
    if (!isValidUrl(source[field])) {
      addError(errors, "URL_MALFORMED", field, "This source link needs review.", `${field} is not a valid http or https URL.`);
    }
  }

  if (typeof source.id === "string" && idEqualsAlias(source.id, [source.sourceUrl, source.canonicalUrl])) {
    addError(errors, "URL_USED_AS_PRIMARY_ID", "id", "A source link cannot be the StaffordOS ID.", "The primary ID must be opaque.");
  }

  if (typeof source.id === "string" && idEqualsAlias(source.id, [source.providerRecordId])) {
    addError(
      errors,
      "PROVIDER_ID_USED_AS_PRIMARY_ID",
      "id",
      "A provider record cannot be the StaffordOS ID.",
      "Provider IDs are aliases only."
    );
  }

  if (!source.publishedAt && !source.updatedAt && !["Unknown", "Needs verification"].includes(String(source.freshness))) {
    addError(
      errors,
      "SOURCE_DATE_MUST_REMAIN_UNKNOWN",
      "freshness",
      "Source date unknown.",
      "Freshness must remain Unknown or Needs verification when publishedAt and updatedAt are missing."
    );
  }

  if (
    source.sourceType === "Historical continuity context" &&
    (source.freshness === "Current" || source.freshness === "Recent" || source.status !== "Historical context")
  ) {
    addError(
      errors,
      "HISTORICAL_CONTEXT_PRESENTED_CURRENT",
      "sourceType",
      "Historical context cannot appear current.",
      "Historical continuity context must not be treated as a current opportunity source."
    );
  }

  return {
    valid: errors.length === 0,
    validationStatus: errors.length === 0 ? "Accepted" : "Needs review",
    errors,
    warnings,
    checkedRecordCount: 1,
  };
}

export function validateJobOpportunityFixture(
  opportunity: unknown,
  sources: readonly JobSource[] = JOB_SOURCE_FIXTURES
): JobSearchValidationResult {
  const errors: JobSearchValidationError[] = [];
  const warnings: JobSearchValidationError[] = [];

  if (!isRecord(opportunity)) {
    addError(errors, "FIELD_REQUIRED", "opportunity", "This opportunity needs review.", "JobOpportunity fixture must be an object.");
    return { valid: false, validationStatus: "Needs review", errors, warnings, checkedRecordCount: 0 };
  }

  validateProfessionalFixtureShell(opportunity, errors, "jobopp");
  validateAuthority(opportunity.authorityClassification, errors);
  validateFreshness(opportunity.listingFreshness, errors, "listingFreshness");
  validateNoApplicationFields(opportunity, errors);
  validateNoFitFields(opportunity, errors);

  if (opportunity.privacyClassification !== "Professional owner-private") {
    addError(
      errors,
      "PROFESSIONAL_PRIVACY_REQUIRED",
      "privacyClassification",
      "Ross's evaluation stays Professional and private.",
      "JobOpportunity privacyClassification must be Professional owner-private."
    );
  }

  for (const field of ["sourceId", "companyName", "roleTitle", "roleTitleNormalized", "description", "discoveredAt", "sourceReference", "createdAt", "updatedAt"]) {
    if (!hasValue(opportunity[field])) {
      addError(errors, "FIELD_REQUIRED", field, "This opportunity is missing required context.", `${field} is required.`);
    }
  }

  if (!includesValue(JOB_OPPORTUNITY_STATUSES, opportunity.opportunityStatus)) {
    addError(
      errors,
      hasValue(opportunity.opportunityStatus) ? "OPPORTUNITY_STATUS_UNSUPPORTED" : "OPPORTUNITY_STATUS_MISSING",
      "opportunityStatus",
      "This opportunity status needs review.",
      `Unsupported opportunityStatus: ${String(opportunity.opportunityStatus)}.`
    );
  }

  if (!includesValue(JOB_DUPLICATE_STATUSES, opportunity.duplicateStatus)) {
    addError(
      errors,
      "DUPLICATE_STATUS_UNSUPPORTED",
      "duplicateStatus",
      "This duplicate status needs review.",
      `Unsupported duplicateStatus: ${String(opportunity.duplicateStatus)}.`
    );
  }

  if (opportunity.duplicateStatus === "CONFIRMED_DUPLICATE" && !hasValue(opportunity.duplicateGroupId)) {
    addError(
      errors,
      "DUPLICATE_SILENTLY_MERGED",
      "duplicateGroupId",
      "Possible duplicate listings must stay visible for review.",
      "Confirmed duplicates require a duplicate group instead of silent merge."
    );
  }

  if (!isValidTimestamp(opportunity.discoveredAt)) {
    addError(errors, "FIELD_REQUIRED", "discoveredAt", "This opportunity needs a discovered date.", "discoveredAt is missing or invalid.");
  }

  if (!isValidUrl(opportunity.applicationUrl)) {
    addError(errors, "URL_MALFORMED", "applicationUrl", "This application link needs review.", "applicationUrl is not a valid http or https URL.");
  }

  if (typeof opportunity.id === "string" && idEqualsAlias(opportunity.id, [opportunity.applicationUrl, opportunity.sourceId])) {
    addError(errors, "URL_USED_AS_PRIMARY_ID", "id", "The opportunity needs a StaffordOS ID.", "The opportunity ID cannot be a URL or source ID.");
  }

  const source = sourceById(sources, text(opportunity.sourceId));
  if (!source) {
    addError(
      errors,
      "SOURCE_NOT_FOUND",
      "sourceId",
      "This opportunity needs a supporting source.",
      `No source fixture found for ${String(opportunity.sourceId)}.`,
      text(opportunity.id)
    );
  } else {
    if (
      source.sourceType === "Historical continuity context" &&
      (opportunity.listingFreshness === "Current" || opportunity.listingFreshness === "Recent")
    ) {
      addError(
        errors,
        "HISTORICAL_CONTEXT_PRESENTED_CURRENT",
        "listingFreshness",
        "Historical context cannot appear current.",
        "A historical source cannot support a current opportunity claim.",
        text(opportunity.id)
      );
    }
  }

  if ((opportunity.compensationMinimum !== null || opportunity.compensationMaximum !== null) && !hasValue(opportunity.compensationText)) {
    addError(
      errors,
      "AUTHORITY_MISSING",
      "compensationText",
      "Compensation needs source support.",
      "Numeric compensation cannot appear without source compensation text."
    );
  }

  return {
    valid: errors.length === 0,
    validationStatus: errors.length === 0 ? "Accepted" : "Needs review",
    errors,
    warnings,
    checkedRecordCount: 1,
  };
}

export function validateJobRequirementFixture(
  requirement: unknown,
  opportunities: readonly JobOpportunity[] = JOB_OPPORTUNITY_FIXTURES,
  sources: readonly JobSource[] = JOB_SOURCE_FIXTURES
): JobSearchValidationResult {
  const errors: JobSearchValidationError[] = [];
  const warnings: JobSearchValidationError[] = [];

  if (!isRecord(requirement)) {
    addError(errors, "FIELD_REQUIRED", "requirement", "This requirement needs review.", "JobRequirement fixture must be an object.");
    return { valid: false, validationStatus: "Needs review", errors, warnings, checkedRecordCount: 0 };
  }

  validateProfessionalFixtureShell(requirement, errors, "jobreq");
  validateNoApplicationFields(requirement, errors);
  validateNoFitFields(requirement, errors);

  for (const field of [
    "jobOpportunityId",
    "sourceId",
    "requirementText",
    "normalizedRequirement",
    "importanceClassification",
    "evidenceExpectation",
    "sourceExcerptReference",
    "createdAt",
  ]) {
    if (!hasValue(requirement[field])) {
      addError(errors, "FIELD_REQUIRED", field, "This requirement is missing required context.", `${field} is required.`);
    }
  }

  if (!includesValue(JOB_REQUIREMENT_CATEGORIES, requirement.requirementCategory)) {
    addError(
      errors,
      "REQUIREMENT_CATEGORY_UNSUPPORTED",
      "requirementCategory",
      "This requirement category needs review.",
      `Unsupported requirementCategory: ${String(requirement.requirementCategory)}.`
    );
  }

  if (!includesValue(JOB_REQUIREMENT_LEVELS, requirement.requirementLevel)) {
    addError(
      errors,
      "REQUIREMENT_LEVEL_UNSUPPORTED",
      "requirementLevel",
      "This requirement level needs review.",
      `Unsupported requirementLevel: ${String(requirement.requirementLevel)}.`
    );
  }

  if (!includesValue(JOB_EXTRACTION_METHODS, requirement.extractionMethod)) {
    addError(
      errors,
      "EXTRACTION_METHOD_UNSUPPORTED",
      "extractionMethod",
      "This extraction method needs review.",
      `Unsupported extractionMethod: ${String(requirement.extractionMethod)}.`
    );
  }

  if (!sourceById(sources, text(requirement.sourceId))) {
    addError(
      errors,
      "SOURCE_NOT_FOUND",
      "sourceId",
      "This requirement needs a supporting source.",
      `No source fixture found for ${String(requirement.sourceId)}.`,
      text(requirement.id)
    );
  }

  if (!opportunityById(opportunities, text(requirement.jobOpportunityId))) {
    addError(
      errors,
      "FIELD_REQUIRED",
      "jobOpportunityId",
      "This requirement needs a matching opportunity.",
      `No opportunity fixture found for ${String(requirement.jobOpportunityId)}.`,
      text(requirement.id)
    );
  }

  if (!hasValue(requirement.sourceExcerptReference)) {
    addError(
      errors,
      "SOURCE_TRACE_REQUIRED",
      "sourceExcerptReference",
      "This requirement needs a source passage.",
      "sourceExcerptReference is required."
    );
  }

  const rawText = text(requirement.requirementText).toLowerCase();
  const normalizedText = text(requirement.normalizedRequirement).toLowerCase();
  const preferredLanguage = /\b(preferred|nice to have|plus|desired)\b/.test(rawText);
  const requiredLanguage = /\b(required|must|minimum|need to|authorization to work)\b/.test(rawText);

  if (preferredLanguage && requirement.requirementLevel === "REQUIRED") {
    addError(
      errors,
      "REQUIREMENT_LEVEL_CONFLICT",
      "requirementLevel",
      "Preferred and required requirements must stay distinct.",
      "Preferred source language was labeled REQUIRED.",
      text(requirement.id)
    );
  }

  if (requiredLanguage && (requirement.requirementLevel === "PREFERRED" || requirement.requirementLevel === "DESIRED")) {
    addError(
      errors,
      "REQUIREMENT_LEVEL_CONFLICT",
      "requirementLevel",
      "Required and preferred requirements must stay distinct.",
      "Required source language was labeled preferred or desired.",
      text(requirement.id)
    );
  }

  if (hasValue(requirement.ambiguity) && requirement.requirementLevel !== "UNCLEAR") {
    addError(
      errors,
      "REQUIREMENT_AMBIGUITY_NOT_PRESERVED",
      "ambiguity",
      "This requirement needs review.",
      "Ambiguous requirements must remain UNCLEAR.",
      text(requirement.id)
    );
  }

  if (/or equivalent/.test(rawText) && !/or equivalent/.test(normalizedText)) {
    addError(
      errors,
      "EQUIVALENT_WORDING_NOT_PRESERVED",
      "normalizedRequirement",
      "Equivalent wording must be preserved.",
      "The normalized requirement removed or equivalent language.",
      text(requirement.id)
    );
  }

  if (requirement.yearsMentioned !== null && requirement.yearsMentioned !== undefined) {
    const years = Number(requirement.yearsMentioned);
    const yearsPattern = new RegExp(`\\b${years}\\+?\\s*(years?|yrs?)\\b`, "i");
    if (!Number.isFinite(years) || !yearsPattern.test(text(requirement.requirementText))) {
      addError(
        errors,
        "YEARS_INVENTED",
        "yearsMentioned",
        "Years of experience need exact source support.",
        "yearsMentioned does not appear in the source requirement text.",
        text(requirement.id)
      );
    }
  }

  if (requirement.extractionMethod === "AI_PROPOSED" && requirement.operatorReviewStatus === "Operator confirmed") {
    addError(
      errors,
      "AI_PROPOSED_NOT_CONFIRMED",
      "operatorReviewStatus",
      "AI-proposed requirements still need Ross review.",
      "AI_PROPOSED extraction cannot be operator-confirmed in this contract.",
      text(requirement.id)
    );
  }

  return {
    valid: errors.length === 0,
    validationStatus: errors.length === 0 ? "Accepted" : "Needs review",
    errors,
    warnings,
    checkedRecordCount: 1,
  };
}

export function getRequirementsForOpportunity(
  jobOpportunityId: string,
  requirements: readonly JobRequirement[] = JOB_REQUIREMENT_FIXTURES
) {
  return requirements.filter((requirement) => requirement.jobOpportunityId === jobOpportunityId);
}

export function getOpportunityById(
  opportunityId: string | null | undefined,
  opportunities: readonly JobOpportunity[] = JOB_OPPORTUNITY_FIXTURES
) {
  if (!opportunityId) return null;
  return opportunities.find((opportunity) => opportunity.id === opportunityId) || null;
}

export function getJobSearchChiefOfStaffCompatibility() {
  return {
    futureSourceTypes: [...JOB_SEARCH_CHIEF_OF_STAFF_SOURCE_TYPES],
    requiredFields: [...JOB_SEARCH_CHIEF_OF_STAFF_COMPATIBILITY_FIELDS],
    workspaceId: JOB_SEARCH_WORKSPACE_ID,
    permissionRequirement: "Future Professional runtime use requires S007 identity, workspace membership, and server authorization.",
    limitations: [
      "S010.01 does not authorize model use.",
      "S010.01 does not create model snapshots.",
      "S009 validator rules are unchanged.",
    ],
  };
}

export const JOB_SOURCE_FIXTURES: readonly JobSource[] = deepFreeze([
  {
    id: "jobsrc_prof_northstar_platform_program_manager_2026_08_03",
    workspaceId: "professional",
    sourceType: "Employer career site",
    providerName: "Northstar Systems Lab Careers",
    providerRecordId: "northstar-fixture-001",
    sourceUrl: "https://careers.example.test/northstar/platform-program-manager",
    canonicalUrl: "https://careers.example.test/northstar/platform-program-manager",
    observedAt: "2026-08-03T09:00:00-04:00",
    publishedAt: "2026-07-28T09:00:00-04:00",
    updatedAt: null,
    retrievedBy: "Ross test fixture",
    authorityClassification: "Source explicit",
    freshness: "Recent",
    privacyClassification: "Public listing with Professional handling",
    termsOrAccessLimitation: "Synthetic fixture; no external source was accessed.",
    rawContentReference: "s010_01_fixture_source_northstar#listing",
    contentDigest: "sha256:s01001northstarfixture",
    duplicateGroupId: null,
    status: "Recently observed",
    limitations: [
      "Synthetic test-only listing.",
      "No source URL proves the listing is still open.",
      "Ross has not applied.",
    ],
    testOnly: true,
  },
  {
    id: "jobsrc_prof_example_board_platform_program_manager_2026_08_03",
    workspaceId: "professional",
    sourceType: "Job board",
    providerName: "Example Job Board",
    providerRecordId: "example-board-fixture-7788",
    sourceUrl: "https://jobs.example.test/roles/fixture-7788",
    canonicalUrl: null,
    observedAt: "2026-08-03T09:30:00-04:00",
    publishedAt: null,
    updatedAt: null,
    retrievedBy: "Ross test fixture",
    authorityClassification: "Needs verification",
    freshness: "Unknown",
    privacyClassification: "Public listing with Professional handling",
    termsOrAccessLimitation: "Synthetic fixture; date and source status are incomplete.",
    rawContentReference: "s010_01_fixture_source_example_board#listing",
    contentDigest: "sha256:s01001exampleboardfixture",
    duplicateGroupId: "dupgrp_prof_platform_program_manager",
    status: "Needs verification",
    limitations: [
      "Synthetic test-only listing.",
      "Source date unknown.",
      "Possible duplicate of another fixture; do not merge silently.",
    ],
    testOnly: true,
  },
]);

export const JOB_OPPORTUNITY_FIXTURES: readonly JobOpportunity[] = deepFreeze([
  {
    id: "jobopp_prof_northstar_platform_program_manager",
    workspaceId: "professional",
    sourceId: "jobsrc_prof_northstar_platform_program_manager_2026_08_03",
    companyId: "company_fixture_northstar_systems_lab",
    companyName: "Northstar Systems Lab",
    roleTitle: "Platform Program Manager",
    roleTitleNormalized: "platform program manager",
    employmentType: "Full-time",
    seniority: "Mid-senior",
    locationText: "Boston, Massachusetts area",
    workArrangement: "Hybrid",
    compensationText: null,
    compensationMinimum: null,
    compensationMaximum: null,
    compensationCurrency: null,
    compensationPeriod: null,
    description: "Synthetic role for operating cadence, automation programs, and delivery reporting.",
    responsibilities: [
      "Own operating cadence, decision logs, and delivery reporting.",
      "Coordinate cross-functional automation work with technical and business stakeholders.",
    ],
    qualificationsSummary: "Leadership, automation program delivery, and operating-system discipline.",
    applicationUrl: "https://careers.example.test/northstar/platform-program-manager/apply",
    discoveredAt: "2026-08-03T09:05:00-04:00",
    publishedAt: "2026-07-28T09:00:00-04:00",
    sourceUpdatedAt: null,
    listingFreshness: "Recent",
    opportunityStatus: "UNDER_REVIEW",
    operatorInterest: "Needs review",
    privacyClassification: "Professional owner-private",
    authorityClassification: "Source explicit",
    sourceReference: "s010_01_fixture_source_northstar#opportunity",
    duplicateStatus: "NOT_EVALUATED",
    duplicateGroupId: null,
    limitations: [
      "Synthetic test-only opportunity.",
      "Ross has not applied.",
      "No fit assessment exists in this slice.",
      "Compensation is not stated by the source.",
    ],
    createdAt: "2026-08-03T09:05:00-04:00",
    updatedAt: "2026-08-03T09:05:00-04:00",
    testOnly: true,
  },
  {
    id: "jobopp_prof_example_board_platform_program_manager",
    workspaceId: "professional",
    sourceId: "jobsrc_prof_example_board_platform_program_manager_2026_08_03",
    companyId: "company_fixture_northstar_systems_lab",
    companyName: "Northstar Systems Lab",
    roleTitle: "Program Manager, Automation Platform",
    roleTitleNormalized: "program manager automation platform",
    employmentType: null,
    seniority: null,
    locationText: "Boston area",
    workArrangement: null,
    compensationText: "Not listed",
    compensationMinimum: null,
    compensationMaximum: null,
    compensationCurrency: null,
    compensationPeriod: null,
    description: "Synthetic board listing with unknown source date and incomplete compensation.",
    responsibilities: [
      "Coordinate automation delivery across teams.",
    ],
    qualificationsSummary: null,
    applicationUrl: null,
    discoveredAt: "2026-08-03T09:35:00-04:00",
    publishedAt: null,
    sourceUpdatedAt: null,
    listingFreshness: "Unknown",
    opportunityStatus: "NEEDS_VERIFICATION",
    operatorInterest: "Not evaluated",
    privacyClassification: "Professional owner-private",
    authorityClassification: "Needs verification",
    sourceReference: "s010_01_fixture_source_example_board#opportunity",
    duplicateStatus: "POSSIBLE_DUPLICATE",
    duplicateGroupId: "dupgrp_prof_platform_program_manager",
    limitations: [
      "Synthetic test-only opportunity.",
      "Source date unknown.",
      "Listing may be stale.",
      "Possible duplicate; do not merge silently.",
    ],
    createdAt: "2026-08-03T09:35:00-04:00",
    updatedAt: "2026-08-03T09:35:00-04:00",
    testOnly: true,
  },
]);

export const JOB_REQUIREMENT_FIXTURES: readonly JobRequirement[] = deepFreeze([
  {
    id: "jobreq_prof_northstar_cross_functional_automation",
    workspaceId: "professional",
    jobOpportunityId: "jobopp_prof_northstar_platform_program_manager",
    sourceId: "jobsrc_prof_northstar_platform_program_manager_2026_08_03",
    requirementText: "Must have experience leading cross-functional automation programs.",
    normalizedRequirement: "Must have experience leading cross-functional automation programs.",
    requirementCategory: "Leadership",
    requirementLevel: "REQUIRED",
    importanceClassification: "Required",
    evidenceExpectation: "Later Candidate Evidence must cite verified program leadership work.",
    yearsMentioned: null,
    degreeMentioned: null,
    certificationMentioned: null,
    technologyOrSkill: "automation programs",
    responsibilityOrQualification: "leading cross-functional automation programs",
    extractionMethod: "SOURCE_EXPLICIT",
    extractionConfidence: "High",
    sourceExcerptReference: "s010_01_fixture_source_northstar#requirements[0]",
    operatorReviewStatus: "Not reviewed",
    ambiguity: null,
    limitations: ["No Ross fit classification exists in this slice."],
    createdAt: "2026-08-03T09:10:00-04:00",
    testOnly: true,
  },
  {
    id: "jobreq_prof_northstar_ai_workflow_preferred",
    workspaceId: "professional",
    jobOpportunityId: "jobopp_prof_northstar_platform_program_manager",
    sourceId: "jobsrc_prof_northstar_platform_program_manager_2026_08_03",
    requirementText: "Experience with AI-assisted workflow design is preferred.",
    normalizedRequirement: "Experience with AI-assisted workflow design is preferred.",
    requirementCategory: "Preferred skill",
    requirementLevel: "PREFERRED",
    importanceClassification: "Preferred",
    evidenceExpectation: "Later Candidate Evidence must cite verified AI-assisted workflow design only if approved.",
    yearsMentioned: null,
    degreeMentioned: null,
    certificationMentioned: null,
    technologyOrSkill: "AI-assisted workflow design",
    responsibilityOrQualification: null,
    extractionMethod: "SOURCE_EXPLICIT",
    extractionConfidence: "High",
    sourceExcerptReference: "s010_01_fixture_source_northstar#requirements[1]",
    operatorReviewStatus: "Not reviewed",
    ambiguity: null,
    limitations: ["Preferred must not be treated as Required."],
    createdAt: "2026-08-03T09:10:00-04:00",
    testOnly: true,
  },
  {
    id: "jobreq_prof_northstar_cloud_familiarity_unclear",
    workspaceId: "professional",
    jobOpportunityId: "jobopp_prof_northstar_platform_program_manager",
    sourceId: "jobsrc_prof_northstar_platform_program_manager_2026_08_03",
    requirementText: "Familiarity with modern cloud platforms.",
    normalizedRequirement: "Familiarity with modern cloud platforms.",
    requirementCategory: "Unknown",
    requirementLevel: "UNCLEAR",
    importanceClassification: "Unclear",
    evidenceExpectation: "Later review must determine whether this is required, preferred, or informational.",
    yearsMentioned: null,
    degreeMentioned: null,
    certificationMentioned: null,
    technologyOrSkill: "modern cloud platforms",
    responsibilityOrQualification: null,
    extractionMethod: "SOURCE_EXPLICIT",
    extractionConfidence: "Moderate",
    sourceExcerptReference: "s010_01_fixture_source_northstar#requirements[2]",
    operatorReviewStatus: "Needs review",
    ambiguity: "The listing does not say whether this is required or preferred.",
    limitations: ["Ambiguity is preserved."],
    createdAt: "2026-08-03T09:10:00-04:00",
    testOnly: true,
  },
  {
    id: "jobreq_prof_northstar_degree_or_equivalent",
    workspaceId: "professional",
    jobOpportunityId: "jobopp_prof_northstar_platform_program_manager",
    sourceId: "jobsrc_prof_northstar_platform_program_manager_2026_08_03",
    requirementText: "Bachelor's degree in computer science, business, or equivalent practical experience.",
    normalizedRequirement: "Bachelor's degree in computer science, business, or equivalent practical experience.",
    requirementCategory: "Education",
    requirementLevel: "REQUIRED",
    importanceClassification: "Required",
    evidenceExpectation: "Later Candidate Evidence must preserve education or equivalent wording.",
    yearsMentioned: null,
    degreeMentioned: "Bachelor's degree in computer science, business, or equivalent practical experience.",
    certificationMentioned: null,
    technologyOrSkill: null,
    responsibilityOrQualification: null,
    extractionMethod: "SOURCE_EXPLICIT",
    extractionConfidence: "High",
    sourceExcerptReference: "s010_01_fixture_source_northstar#requirements[3]",
    operatorReviewStatus: "Not reviewed",
    ambiguity: null,
    limitations: ["Or equivalent wording is preserved."],
    createdAt: "2026-08-03T09:10:00-04:00",
    testOnly: true,
  },
  {
    id: "jobreq_prof_northstar_hybrid_boston",
    workspaceId: "professional",
    jobOpportunityId: "jobopp_prof_northstar_platform_program_manager",
    sourceId: "jobsrc_prof_northstar_platform_program_manager_2026_08_03",
    requirementText: "Hybrid role based near Boston with periodic onsite collaboration.",
    normalizedRequirement: "Hybrid role based near Boston with periodic onsite collaboration.",
    requirementCategory: "Location or work arrangement",
    requirementLevel: "INFORMATIONAL",
    importanceClassification: "Informational",
    evidenceExpectation: "Later review must compare location and work arrangement preferences.",
    yearsMentioned: null,
    degreeMentioned: null,
    certificationMentioned: null,
    technologyOrSkill: null,
    responsibilityOrQualification: "periodic onsite collaboration",
    extractionMethod: "SOURCE_EXPLICIT",
    extractionConfidence: "High",
    sourceExcerptReference: "s010_01_fixture_source_northstar#requirements[4]",
    operatorReviewStatus: "Not reviewed",
    ambiguity: null,
    limitations: ["Work arrangement is source text, not an inferred remote policy."],
    createdAt: "2026-08-03T09:10:00-04:00",
    testOnly: true,
  },
  {
    id: "jobreq_prof_northstar_operating_cadence",
    workspaceId: "professional",
    jobOpportunityId: "jobopp_prof_northstar_platform_program_manager",
    sourceId: "jobsrc_prof_northstar_platform_program_manager_2026_08_03",
    requirementText: "Own operating cadence, decision logs, and delivery reporting.",
    normalizedRequirement: "Own operating cadence, decision logs, and delivery reporting.",
    requirementCategory: "Responsibility",
    requirementLevel: "RESPONSIBILITY",
    importanceClassification: "Informational",
    evidenceExpectation: "Later Candidate Evidence must cite verified operating cadence and reporting work.",
    yearsMentioned: null,
    degreeMentioned: null,
    certificationMentioned: null,
    technologyOrSkill: null,
    responsibilityOrQualification: "operating cadence, decision logs, and delivery reporting",
    extractionMethod: "SOURCE_EXPLICIT",
    extractionConfidence: "High",
    sourceExcerptReference: "s010_01_fixture_source_northstar#responsibilities[0]",
    operatorReviewStatus: "Not reviewed",
    ambiguity: null,
    limitations: ["Responsibility is not a Ross fit claim."],
    createdAt: "2026-08-03T09:10:00-04:00",
    testOnly: true,
  },
  {
    id: "jobreq_prof_board_pmp_or_equivalent",
    workspaceId: "professional",
    jobOpportunityId: "jobopp_prof_example_board_platform_program_manager",
    sourceId: "jobsrc_prof_example_board_platform_program_manager_2026_08_03",
    requirementText: "PMP or equivalent program management certification is a plus.",
    normalizedRequirement: "PMP or equivalent program management certification is a plus.",
    requirementCategory: "Certification",
    requirementLevel: "PREFERRED",
    importanceClassification: "Preferred",
    evidenceExpectation: "Later Candidate Evidence must preserve PMP or equivalent wording.",
    yearsMentioned: null,
    degreeMentioned: null,
    certificationMentioned: "PMP or equivalent program management certification",
    technologyOrSkill: null,
    responsibilityOrQualification: null,
    extractionMethod: "SOURCE_EXPLICIT",
    extractionConfidence: "Moderate",
    sourceExcerptReference: "s010_01_fixture_source_example_board#requirements[0]",
    operatorReviewStatus: "Needs review",
    ambiguity: null,
    limitations: ["Source date unknown; requirement needs review."],
    createdAt: "2026-08-03T09:40:00-04:00",
    testOnly: true,
  },
  {
    id: "jobreq_prof_board_us_work_authorization",
    workspaceId: "professional",
    jobOpportunityId: "jobopp_prof_example_board_platform_program_manager",
    sourceId: "jobsrc_prof_example_board_platform_program_manager_2026_08_03",
    requirementText: "Authorization to work in the United States is required.",
    normalizedRequirement: "Authorization to work in the United States is required.",
    requirementCategory: "Legal or employment eligibility",
    requirementLevel: "REQUIRED",
    importanceClassification: "Required",
    evidenceExpectation: "Later review must preserve exact legal eligibility wording.",
    yearsMentioned: null,
    degreeMentioned: null,
    certificationMentioned: null,
    technologyOrSkill: null,
    responsibilityOrQualification: null,
    extractionMethod: "SOURCE_EXPLICIT",
    extractionConfidence: "Moderate",
    sourceExcerptReference: "s010_01_fixture_source_example_board#requirements[1]",
    operatorReviewStatus: "Needs review",
    ambiguity: null,
    limitations: ["Source date unknown; requirement needs review."],
    createdAt: "2026-08-03T09:40:00-04:00",
    testOnly: true,
  },
]);

import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import type {
  JobAuthorityClassification,
  JobDuplicateStatus,
  JobOpportunityStatus,
  JobSearchFreshness,
} from "./jobSearchContracts";

export const PRIVATE_JOB_OPPORTUNITY_INTAKE_VERSION = "J001.02";
export const PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION =
  "staffordos.job_search.private_opportunity_intake.v1";
export const PRIVATE_JOB_OPPORTUNITY_NORMALIZED_SCHEMA_VERSION =
  "staffordos.job_search.private_opportunity.normalized.v1";
export const PRIVATE_JOB_SEARCH_WORKSPACE_ID = "professional";

export const PRIVATE_JOB_SEARCH_STORAGE = {
  intakeDirectory: "~/.staffordos/private/professional/job-search/intake/",
  normalizedOpportunityDirectory: "~/.staffordos/private/professional/job-search/opportunities/",
} as const;

export const PRIVATE_JOB_SOURCE_AUTHORITIES = [
  "Source explicit",
  "Operator confirmed",
  "Imported",
  "Historical continuity context",
  "Needs verification",
] as const;

export const PRIVATE_JOB_PRIVACY_CLASSIFICATIONS = [
  "Professional owner-private",
] as const;

export const PRIVATE_JOB_DUPLICATE_CLASSIFICATIONS = [
  "EXACT_SOURCE_DUPLICATE",
  "SAME_PROVIDER_ALIAS",
  "POSSIBLE_CONTENT_DUPLICATE",
  "POSSIBLE_ROLE_VARIANT",
  "DISTINCT_OPPORTUNITY",
  "NEEDS_OPERATOR_REVIEW",
] as const;

export const PRIVATE_JOB_LISTING_FRESHNESS = [
  "CURRENT",
  "RECENT",
  "HISTORICAL",
  "STALE",
  "UNKNOWN",
] as const;

export type PrivateJobSourceAuthority = (typeof PRIVATE_JOB_SOURCE_AUTHORITIES)[number];
export type PrivateJobPrivacyClassification = (typeof PRIVATE_JOB_PRIVACY_CLASSIFICATIONS)[number];
export type PrivateJobDuplicateClassification = (typeof PRIVATE_JOB_DUPLICATE_CLASSIFICATIONS)[number];
export type PrivateJobListingFreshness = (typeof PRIVATE_JOB_LISTING_FRESHNESS)[number];

export type PrivateJobOpportunityIntakeRecord = {
  schemaVersion: typeof PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION;
  workspaceId: typeof PRIVATE_JOB_SEARCH_WORKSPACE_ID;
  sourceUrl: string;
  sourceProvider: string;
  sourceProviderRecordId?: string | null;
  sourceObservedAt: string;
  sourceSummary?: string | null;
  listingText?: string | null;
  roleTitle: string;
  companyName: string;
  location?: string | null;
  workArrangement?: string | null;
  compensationText?: string | null;
  employmentType?: string | null;
  listingPublishedAt?: string | null;
  listingExpiresAt?: string | null;
  operatorNotes?: string | null;
  privacy: PrivateJobPrivacyClassification;
  sourceAuthority: PrivateJobSourceAuthority;
  limitations: string[];
};

export type PrivateJobOpportunitySourceRecord = {
  id: string;
  workspaceId: typeof PRIVATE_JOB_SEARCH_WORKSPACE_ID;
  sourceUrl: string;
  sourceProvider: string;
  sourceProviderRecordId: string | null;
  sourceObservedAt: string;
  listingPublishedAt: string | null;
  listingExpiresAt: string | null;
  sourceReference: string;
  rawContentReference: string;
  contentDigest: string;
  authorityClassification: PrivateJobSourceAuthority;
  privacyClassification: PrivateJobPrivacyClassification;
  sourceFetchedByStaffordOS: false;
  sourceTextRetainedInIntake: true;
  limitations: string[];
};

export type PrivateNormalizedJobOpportunity = {
  schemaVersion: typeof PRIVATE_JOB_OPPORTUNITY_NORMALIZED_SCHEMA_VERSION;
  id: string;
  workspaceId: typeof PRIVATE_JOB_SEARCH_WORKSPACE_ID;
  sourceId: string;
  sourceRecord: PrivateJobOpportunitySourceRecord;
  sourceAliases: {
    sourceUrl: string;
    sourceProvider: string;
    sourceProviderRecordId: string | null;
  };
  roleTitle: string;
  roleTitleNormalized: string;
  companyName: string;
  companyNameNormalized: string;
  locationText: string | null;
  workArrangement: string | null;
  compensationText: string | null;
  employmentType: string | null;
  listingFreshness: PrivateJobListingFreshness;
  s010ListingFreshness: JobSearchFreshness;
  opportunityStatus: JobOpportunityStatus;
  authorityClassification: JobAuthorityClassification;
  privacyClassification: "Professional owner-private";
  duplicateStatus: PrivateJobDuplicateClassification;
  s010DuplicateStatus: JobDuplicateStatus;
  nextAction: "Review opportunity";
  reviewStatus: "Needs Ross's review";
  approvalStatus: "Ross must decide whether to pursue this role.";
  intakeTimestamp: string;
  sourceReference: string;
  originalSourceReference: string;
  limitations: string[];
  operatorNotesPresent: boolean;
  noncanonical: true;
  noApplicationCreated: true;
  noFitAssessmentCreated: true;
};

export type PrivateJobOpportunityValidationErrorCode =
  | "EXPLICIT_PRIVATE_INTAKE_PATH_REQUIRED"
  | "EXPLICIT_PRIVATE_OUTPUT_PATH_REQUIRED"
  | "PRIVATE_INTAKE_PATH_INSIDE_REPOSITORY"
  | "PRIVATE_OUTPUT_PATH_INSIDE_REPOSITORY"
  | "PRIVATE_INTAKE_FILE_NOT_FOUND"
  | "PRIVATE_INTAKE_JSON_REQUIRED"
  | "PRIVATE_INTAKE_JSON_MALFORMED"
  | "SCHEMA_VERSION_UNSUPPORTED"
  | "WORKSPACE_REQUIRED"
  | "WORKSPACE_NOT_PROFESSIONAL"
  | "SOURCE_URL_REQUIRED"
  | "SOURCE_URL_MALFORMED"
  | "SOURCE_URL_SCHEME_UNSUPPORTED"
  | "SOURCE_PROVIDER_REQUIRED"
  | "SOURCE_OBSERVED_AT_REQUIRED"
  | "SOURCE_OBSERVED_AT_INVALID"
  | "SOURCE_PROVENANCE_REQUIRED"
  | "SOURCE_TEXT_OR_SUMMARY_REQUIRED"
  | "SOURCE_AUTHORITY_REQUIRED"
  | "SOURCE_AUTHORITY_UNSUPPORTED"
  | "PROFESSIONAL_PRIVACY_REQUIRED"
  | "ROLE_TITLE_REQUIRED"
  | "COMPANY_NAME_REQUIRED"
  | "PRIMARY_ID_NOT_ACCEPTED"
  | "APPLICATION_FIELD_NOT_ALLOWED"
  | "INTERVIEW_FIELD_NOT_ALLOWED"
  | "OFFER_FIELD_NOT_ALLOWED"
  | "FIT_FIELD_NOT_ALLOWED"
  | "MODEL_CERTAINTY_FIELD_NOT_ALLOWED"
  | "UNSUPPORTED_COMPENSATION_NORMALIZATION"
  | "UNSUPPORTED_OPEN_STATUS"
  | "UNSUPPORTED_STATUS"
  | "TIMESTAMP_INVALID";

export type PrivateJobOpportunityValidationError = {
  code: PrivateJobOpportunityValidationErrorCode;
  path: string;
  operatorSafeMessage: string;
  technicalDetail: string;
};

export type PrivateJobOpportunityValidationResult = {
  valid: boolean;
  validationStatus: "Accepted" | "Needs review";
  errors: PrivateJobOpportunityValidationError[];
  warnings: PrivateJobOpportunityValidationError[];
  checkedRecordCount: number;
};

export type PrivateJobOpportunityNormalizationResult = PrivateJobOpportunityValidationResult & {
  normalizedOpportunity: PrivateNormalizedJobOpportunity | null;
};

export type PrivateJobOpportunityBridgeRunResult = {
  metadata: {
    schemaVersion: typeof PRIVATE_JOB_OPPORTUNITY_INTAKE_VERSION;
    canonical: false;
    generatedAt: string;
    sourceDirectoryRedacted: string;
    outputDirectoryRedacted: string | null;
    noExternalNetwork: true;
    noModelInvocation: true;
    noApplicationCreated: true;
  };
  status: "completed" | "failed";
  failureCode: PrivateJobOpportunityValidationErrorCode | null;
  validationResults: PrivateJobOpportunityNormalizationResult[];
  normalizedOpportunities: PrivateNormalizedJobOpportunity[];
  privateArtifacts: string[];
  sourceFilesModified: boolean;
  summary: {
    intakeFileCount: number;
    validOpportunityCount: number;
    invalidOpportunityCount: number;
    writtenPrivateArtifactCount: number;
  };
};

type AnyRecord = Record<string, unknown>;

type NormalizeOptions = {
  intakeTimestamp: string;
  existingOpportunities?: readonly PrivateNormalizedJobOpportunity[];
};

type BridgeRunOptions = {
  intakeDirectory: string;
  outputDirectory?: string | null;
  repositoryRoot: string;
  generatedAt: string;
  writePrivateArtifacts?: boolean;
};

type SourceState = {
  filePath: string;
  sizeBytes: number;
  modifiedMs: number;
  contentDigest: string;
};

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const normalized = text(value);
  return normalized ? normalized : null;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForComparison(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^\w\s.-]/g, "")
    .replace(/\b(inc|llc|ltd|corp|corporation|company)\b/g, "")
    .trim();
}

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function shortHash(value: string) {
  return sha256Text(value).slice(0, 18);
}

function digestFile(filePath: string) {
  return `sha256:${createHash("sha256").update(readFileSync(filePath)).digest("hex")}`;
}

function includesValue<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

function addError(
  errors: PrivateJobOpportunityValidationError[],
  code: PrivateJobOpportunityValidationErrorCode,
  pathName: string,
  operatorSafeMessage: string,
  technicalDetail: string,
) {
  errors.push({ code, path: pathName, operatorSafeMessage, technicalDetail });
}

function isValidTimestamp(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function isInsideDirectory(candidatePath: string, parentPath: string) {
  const resolvedCandidate = path.resolve(candidatePath);
  const resolvedParent = path.resolve(parentPath);
  return resolvedCandidate === resolvedParent || resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`);
}

export function isPrivateJobSearchPathInsideRepository(candidatePath: string, repositoryRoot: string) {
  if (!candidatePath || !repositoryRoot) {
    return false;
  }
  return isInsideDirectory(candidatePath, repositoryRoot);
}

function redactPathForReport(filePath: string) {
  return filePath.replace(/^\/Users\/[^/]+/, "~");
}

export function validatePrivateJobSearchStoragePath(
  candidatePath: string | null | undefined,
  repositoryRoot: string,
  kind: "intake" | "output",
): PrivateJobOpportunityValidationResult {
  const errors: PrivateJobOpportunityValidationError[] = [];
  const warnings: PrivateJobOpportunityValidationError[] = [];

  if (!candidatePath) {
    addError(
      errors,
      kind === "intake" ? "EXPLICIT_PRIVATE_INTAKE_PATH_REQUIRED" : "EXPLICIT_PRIVATE_OUTPUT_PATH_REQUIRED",
      kind === "intake" ? "intakeDirectory" : "outputDirectory",
      kind === "intake" ? "A private intake folder is required." : "A private output folder is required.",
      "The path must be supplied explicitly and must be outside the repository.",
    );
  } else if (isPrivateJobSearchPathInsideRepository(candidatePath, repositoryRoot)) {
    addError(
      errors,
      kind === "intake" ? "PRIVATE_INTAKE_PATH_INSIDE_REPOSITORY" : "PRIVATE_OUTPUT_PATH_INSIDE_REPOSITORY",
      kind === "intake" ? "intakeDirectory" : "outputDirectory",
      "Private job-search records must stay outside Git.",
      `${redactPathForReport(candidatePath)} is inside the repository root.`,
    );
  }

  return {
    valid: errors.length === 0,
    validationStatus: errors.length === 0 ? "Accepted" : "Needs review",
    errors,
    warnings,
    checkedRecordCount: 0,
  };
}

function validateDisallowedFields(record: AnyRecord, errors: PrivateJobOpportunityValidationError[]) {
  const fieldGroups: Array<{
    code: PrivateJobOpportunityValidationErrorCode;
    fields: string[];
    message: string;
  }> = [
    {
      code: "APPLICATION_FIELD_NOT_ALLOWED",
      fields: ["applicationStatus", "applicationDate", "submittedAt", "applicationId", "resumeVersionId"],
      message: "A job opportunity is not an application.",
    },
    {
      code: "INTERVIEW_FIELD_NOT_ALLOWED",
      fields: ["interviewStatus", "interviewDate", "interviewer", "screeningStatus"],
      message: "Interview records are not part of this intake.",
    },
    {
      code: "OFFER_FIELD_NOT_ALLOWED",
      fields: ["offerStatus", "offerAmount", "offerDeadline"],
      message: "Offer records are not part of this intake.",
    },
    {
      code: "FIT_FIELD_NOT_ALLOWED",
      fields: ["fitScore", "matchScore", "fitPercentage", "candidateEvidence", "resumeRecommendation"],
      message: "Fit assessment comes later.",
    },
    {
      code: "MODEL_CERTAINTY_FIELD_NOT_ALLOWED",
      fields: ["aiRecommendation", "modelRecommendation", "generatedCertainty", "likelihoodOfInterview"],
      message: "Model recommendations are not connected here.",
    },
  ];

  for (const group of fieldGroups) {
    for (const field of group.fields) {
      if (Object.prototype.hasOwnProperty.call(record, field)) {
        addError(errors, group.code, field, group.message, `${field} belongs to a later governed record.`);
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(record, "id") || Object.prototype.hasOwnProperty.call(record, "jobOpportunityId")) {
    addError(
      errors,
      "PRIMARY_ID_NOT_ACCEPTED",
      "id",
      "StaffordOS assigns the private opportunity ID.",
      "The intake record must not provide the StaffordOS primary ID.",
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(record, "compensationMinimum") ||
    Object.prototype.hasOwnProperty.call(record, "compensationMaximum") ||
    Object.prototype.hasOwnProperty.call(record, "compensationCurrency") ||
    Object.prototype.hasOwnProperty.call(record, "compensationPeriod")
  ) {
    addError(
      errors,
      "UNSUPPORTED_COMPENSATION_NORMALIZATION",
      "compensation",
      "Compensation must stay as source text in this intake.",
      "Numeric compensation normalization is not authorized in J001.02.",
    );
  }

  for (const statusField of ["status", "listingStatus", "opportunityStatus"]) {
    if (!Object.prototype.hasOwnProperty.call(record, statusField)) {
      continue;
    }

    const status = text(record[statusField]).toUpperCase();
    if (status === "OPEN" || status === "ACTIVE" || status === "CURRENT") {
      addError(
        errors,
        "UNSUPPORTED_OPEN_STATUS",
        statusField,
        "StaffordOS cannot verify that this listing is open from intake alone.",
        `${statusField} cannot claim open or active status in J001.02.`,
      );
    } else {
      addError(
        errors,
        "UNSUPPORTED_STATUS",
        statusField,
        "This status belongs to a later governed workflow.",
        `${statusField} is not accepted by the private intake contract.`,
      );
    }
  }
}

export function validatePrivateJobOpportunityIntake(
  record: unknown,
): PrivateJobOpportunityValidationResult {
  const errors: PrivateJobOpportunityValidationError[] = [];
  const warnings: PrivateJobOpportunityValidationError[] = [];

  if (!isRecord(record)) {
    addError(errors, "SOURCE_PROVENANCE_REQUIRED", "record", "This opportunity needs review.", "Intake record must be an object.");
    return { valid: false, validationStatus: "Needs review", errors, warnings, checkedRecordCount: 0 };
  }

  validateDisallowedFields(record, errors);

  if (record.schemaVersion !== PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION) {
    addError(
      errors,
      "SCHEMA_VERSION_UNSUPPORTED",
      "schemaVersion",
      "This intake format needs review.",
      `Expected ${PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION}.`,
    );
  }

  if (!text(record.workspaceId)) {
    addError(errors, "WORKSPACE_REQUIRED", "workspaceId", "This record needs a Professional workspace.", "workspaceId is missing.");
  } else if (record.workspaceId !== PRIVATE_JOB_SEARCH_WORKSPACE_ID) {
    addError(
      errors,
      "WORKSPACE_NOT_PROFESSIONAL",
      "workspaceId",
      "This record belongs outside Professional.",
      `workspaceId was ${String(record.workspaceId)}.`,
    );
  }

  if (!text(record.sourceUrl)) {
    addError(errors, "SOURCE_URL_REQUIRED", "sourceUrl", "This opportunity needs a source link.", "sourceUrl is missing.");
  } else {
    try {
      const parsed = new URL(text(record.sourceUrl));
      if (parsed.protocol !== "https:") {
        addError(
          errors,
          "SOURCE_URL_SCHEME_UNSUPPORTED",
          "sourceUrl",
          "This source link needs a secure web address.",
          `Unsupported sourceUrl protocol: ${parsed.protocol}.`,
        );
      }
    } catch {
      addError(errors, "SOURCE_URL_MALFORMED", "sourceUrl", "This source link needs review.", "sourceUrl is not a valid URL.");
    }
  }

  if (!text(record.sourceProvider)) {
    addError(
      errors,
      "SOURCE_PROVIDER_REQUIRED",
      "sourceProvider",
      "This opportunity needs a source.",
      "sourceProvider is missing.",
    );
  }

  if (!text(record.sourceObservedAt)) {
    addError(
      errors,
      "SOURCE_OBSERVED_AT_REQUIRED",
      "sourceObservedAt",
      "This opportunity needs an observed date.",
      "sourceObservedAt is missing.",
    );
  } else if (!isValidTimestamp(record.sourceObservedAt)) {
    addError(
      errors,
      "SOURCE_OBSERVED_AT_INVALID",
      "sourceObservedAt",
      "This observed date needs review.",
      "sourceObservedAt is not a valid timestamp.",
    );
  }

  for (const timestampField of ["listingPublishedAt", "listingExpiresAt"]) {
    const value = record[timestampField];
    if (value !== null && value !== undefined && text(value) && !isValidTimestamp(value)) {
      addError(
        errors,
        "TIMESTAMP_INVALID",
        timestampField,
        "This source date needs review.",
        `${timestampField} is not a valid timestamp.`,
      );
    }
  }

  if (!text(record.roleTitle)) {
    addError(errors, "ROLE_TITLE_REQUIRED", "roleTitle", "This opportunity needs a role.", "roleTitle is missing.");
  }

  if (!text(record.companyName)) {
    addError(errors, "COMPANY_NAME_REQUIRED", "companyName", "This opportunity needs a company.", "companyName is missing.");
  }

  if (!text(record.listingText) && !text(record.sourceSummary)) {
    addError(
      errors,
      "SOURCE_TEXT_OR_SUMMARY_REQUIRED",
      "listingText",
      "This opportunity needs source wording or a source-backed summary.",
      "Either listingText or sourceSummary is required.",
    );
  }

  if (!text(record.sourceAuthority)) {
    addError(
      errors,
      "SOURCE_AUTHORITY_REQUIRED",
      "sourceAuthority",
      "This opportunity needs source authority.",
      "sourceAuthority is missing.",
    );
  } else if (!includesValue(PRIVATE_JOB_SOURCE_AUTHORITIES, record.sourceAuthority)) {
    addError(
      errors,
      "SOURCE_AUTHORITY_UNSUPPORTED",
      "sourceAuthority",
      "This source authority needs review.",
      `Unsupported sourceAuthority: ${String(record.sourceAuthority)}.`,
    );
  }

  if (record.privacy !== "Professional owner-private") {
    addError(
      errors,
      "PROFESSIONAL_PRIVACY_REQUIRED",
      "privacy",
      "Ross's job-search records stay Professional and private.",
      "privacy must be Professional owner-private.",
    );
  }

  if (!text(record.sourceProvider) || !text(record.sourceObservedAt) || !text(record.sourceAuthority)) {
    addError(
      errors,
      "SOURCE_PROVENANCE_REQUIRED",
      "source",
      "This opportunity needs source provenance.",
      "sourceProvider, sourceObservedAt, and sourceAuthority are required.",
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

export function classifyPrivateJobOpportunityFreshness(
  record: PrivateJobOpportunityIntakeRecord,
): PrivateJobListingFreshness {
  if (record.sourceAuthority === "Historical continuity context") {
    return "HISTORICAL";
  }

  if (record.listingExpiresAt && isValidTimestamp(record.listingExpiresAt) && isValidTimestamp(record.sourceObservedAt)) {
    const expiresAt = Date.parse(record.listingExpiresAt);
    const observedAt = Date.parse(record.sourceObservedAt);
    if (expiresAt < observedAt) {
      return "STALE";
    }
  }

  if (record.listingPublishedAt) {
    return "RECENT";
  }

  return "UNKNOWN";
}

function toS010Freshness(value: PrivateJobListingFreshness): JobSearchFreshness {
  if (value === "CURRENT") return "Current";
  if (value === "RECENT") return "Recent";
  if (value === "HISTORICAL") return "Historical";
  if (value === "STALE") return "Stale";
  return "Unknown";
}

function toS010DuplicateStatus(value: PrivateJobDuplicateClassification): JobDuplicateStatus {
  if (value === "DISTINCT_OPPORTUNITY") return "DISTINCT_LISTING";
  if (value === "EXACT_SOURCE_DUPLICATE" || value === "SAME_PROVIDER_ALIAS" || value === "POSSIBLE_CONTENT_DUPLICATE" || value === "POSSIBLE_ROLE_VARIANT") {
    return "POSSIBLE_DUPLICATE";
  }
  return "NOT_EVALUATED";
}

function opportunityStatusForFreshness(freshness: PrivateJobListingFreshness): JobOpportunityStatus {
  if (freshness === "STALE" || freshness === "HISTORICAL" || freshness === "UNKNOWN") {
    return "NEEDS_VERIFICATION";
  }
  return "UNDER_REVIEW";
}

function authorityForSource(sourceAuthority: PrivateJobSourceAuthority): JobAuthorityClassification {
  if (sourceAuthority === "Historical continuity context") {
    return "Historical continuity context";
  }
  if (sourceAuthority === "Operator confirmed") {
    return "Operator confirmed";
  }
  if (sourceAuthority === "Imported") {
    return "Imported";
  }
  if (sourceAuthority === "Source explicit") {
    return "Source explicit";
  }
  return "Needs verification";
}

export function createPrivateJobOpportunityId(record: PrivateJobOpportunityIntakeRecord) {
  const basis = [
    PRIVATE_JOB_OPPORTUNITY_INTAKE_VERSION,
    text(record.sourceUrl),
    text(record.sourceProvider),
    text(record.sourceProviderRecordId),
    text(record.sourceObservedAt),
    normalizeForComparison(record.companyName),
    normalizeForComparison(record.roleTitle),
  ].join("|");

  return `privjobopp_${shortHash(basis)}`;
}

function createPrivateJobSourceId(record: PrivateJobOpportunityIntakeRecord, contentDigest: string) {
  const basis = [
    PRIVATE_JOB_OPPORTUNITY_INTAKE_VERSION,
    text(record.sourceUrl),
    text(record.sourceProvider),
    text(record.sourceProviderRecordId),
    text(record.sourceObservedAt),
    contentDigest,
  ].join("|");

  return `privjobsrc_${shortHash(basis)}`;
}

function sourceTextDigest(record: PrivateJobOpportunityIntakeRecord) {
  const sourceText = text(record.listingText) || text(record.sourceSummary);
  return `sha256:${sha256Text(sourceText)}`;
}

export function classifyPrivateJobOpportunityDuplicate(
  candidate: PrivateNormalizedJobOpportunity,
  existingOpportunities: readonly PrivateNormalizedJobOpportunity[] = [],
): PrivateJobDuplicateClassification {
  for (const existing of existingOpportunities) {
    if (existing.id === candidate.id) {
      return "EXACT_SOURCE_DUPLICATE";
    }
    if (
      existing.sourceAliases.sourceProvider === candidate.sourceAliases.sourceProvider &&
      existing.sourceAliases.sourceProviderRecordId &&
      existing.sourceAliases.sourceProviderRecordId === candidate.sourceAliases.sourceProviderRecordId
    ) {
      return "SAME_PROVIDER_ALIAS";
    }
    if (existing.sourceRecord.contentDigest === candidate.sourceRecord.contentDigest) {
      return "POSSIBLE_CONTENT_DUPLICATE";
    }
    if (
      existing.companyNameNormalized === candidate.companyNameNormalized &&
      existing.roleTitleNormalized === candidate.roleTitleNormalized
    ) {
      return "POSSIBLE_ROLE_VARIANT";
    }
  }

  return existingOpportunities.length ? "DISTINCT_OPPORTUNITY" : "NEEDS_OPERATOR_REVIEW";
}

export function normalizePrivateJobOpportunityIntake(
  record: unknown,
  options: NormalizeOptions,
): PrivateJobOpportunityNormalizationResult {
  const validation = validatePrivateJobOpportunityIntake(record);

  if (!validation.valid || !isRecord(record)) {
    return { ...validation, normalizedOpportunity: null };
  }

  const typedRecord = record as PrivateJobOpportunityIntakeRecord;
  const freshness = classifyPrivateJobOpportunityFreshness(typedRecord);
  const contentDigest = sourceTextDigest(typedRecord);
  const sourceId = createPrivateJobSourceId(typedRecord, contentDigest);
  const opportunityId = createPrivateJobOpportunityId(typedRecord);
  const sourceReference = `private-job-source://${sourceId}`;
  const baseLimitations = [
    "Private local Job Opportunity intake. Not committed to Git.",
    "Source URL was preserved as an alias and was not fetched by StaffordOS.",
    "Ross has not applied.",
    "No fit assessment, resume recommendation, or application record exists.",
    freshness === "UNKNOWN" ? "Listing date unknown." : null,
    freshness === "STALE" ? "Source may be stale." : null,
    ...((Array.isArray(typedRecord.limitations) ? typedRecord.limitations : []) as string[]),
  ].filter((value): value is string => Boolean(value));

  const normalized: PrivateNormalizedJobOpportunity = {
    schemaVersion: PRIVATE_JOB_OPPORTUNITY_NORMALIZED_SCHEMA_VERSION,
    id: opportunityId,
    workspaceId: PRIVATE_JOB_SEARCH_WORKSPACE_ID,
    sourceId,
    sourceRecord: {
      id: sourceId,
      workspaceId: PRIVATE_JOB_SEARCH_WORKSPACE_ID,
      sourceUrl: text(typedRecord.sourceUrl),
      sourceProvider: text(typedRecord.sourceProvider),
      sourceProviderRecordId: optionalText(typedRecord.sourceProviderRecordId),
      sourceObservedAt: text(typedRecord.sourceObservedAt),
      listingPublishedAt: optionalText(typedRecord.listingPublishedAt),
      listingExpiresAt: optionalText(typedRecord.listingExpiresAt),
      sourceReference,
      rawContentReference: `${sourceReference}#source-content`,
      contentDigest,
      authorityClassification: typedRecord.sourceAuthority,
      privacyClassification: "Professional owner-private",
      sourceFetchedByStaffordOS: false,
      sourceTextRetainedInIntake: true,
      limitations: [
        "The source content remains in the private intake record and is not duplicated in the normalized opportunity.",
        "A source URL does not prove that the listing is still open.",
      ],
    },
    sourceAliases: {
      sourceUrl: text(typedRecord.sourceUrl),
      sourceProvider: text(typedRecord.sourceProvider),
      sourceProviderRecordId: optionalText(typedRecord.sourceProviderRecordId),
    },
    roleTitle: text(typedRecord.roleTitle),
    roleTitleNormalized: normalizeForComparison(text(typedRecord.roleTitle)),
    companyName: text(typedRecord.companyName),
    companyNameNormalized: normalizeForComparison(text(typedRecord.companyName)),
    locationText: optionalText(typedRecord.location),
    workArrangement: optionalText(typedRecord.workArrangement),
    compensationText: optionalText(typedRecord.compensationText),
    employmentType: optionalText(typedRecord.employmentType),
    listingFreshness: freshness,
    s010ListingFreshness: toS010Freshness(freshness),
    opportunityStatus: opportunityStatusForFreshness(freshness),
    authorityClassification: authorityForSource(typedRecord.sourceAuthority),
    privacyClassification: "Professional owner-private",
    duplicateStatus: "NEEDS_OPERATOR_REVIEW",
    s010DuplicateStatus: "NOT_EVALUATED",
    nextAction: "Review opportunity",
    reviewStatus: "Needs Ross's review",
    approvalStatus: "Ross must decide whether to pursue this role.",
    intakeTimestamp: options.intakeTimestamp,
    sourceReference,
    originalSourceReference: `${sourceReference}#listing`,
    limitations: baseLimitations,
    operatorNotesPresent: Boolean(text(typedRecord.operatorNotes)),
    noncanonical: true,
    noApplicationCreated: true,
    noFitAssessmentCreated: true,
  };

  const duplicateStatus = classifyPrivateJobOpportunityDuplicate(normalized, options.existingOpportunities || []);
  normalized.duplicateStatus = duplicateStatus;
  normalized.s010DuplicateStatus = toS010DuplicateStatus(duplicateStatus);

  return {
    ...validation,
    normalizedOpportunity: normalized,
  };
}

export function buildPrivateJobOpportunityIntakeTemplate(): PrivateJobOpportunityIntakeRecord {
  return {
    schemaVersion: PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION,
    workspaceId: PRIVATE_JOB_SEARCH_WORKSPACE_ID,
    sourceUrl: "",
    sourceProvider: "",
    sourceProviderRecordId: null,
    sourceObservedAt: "",
    sourceSummary: "",
    listingText: null,
    roleTitle: "",
    companyName: "",
    location: null,
    workArrangement: null,
    compensationText: null,
    employmentType: null,
    listingPublishedAt: null,
    listingExpiresAt: null,
    operatorNotes: null,
    privacy: "Professional owner-private",
    sourceAuthority: "Source explicit",
    limitations: [
      "Fill with source-backed job information only.",
      "Do not add application, recruiter, resume, or fit-assessment fields.",
    ],
  };
}

export function readPrivateJobOpportunityIntakeFile(intakeFilePath: string, repositoryRoot: string) {
  const pathValidation = validatePrivateJobSearchStoragePath(path.dirname(intakeFilePath), repositoryRoot, "intake");
  if (!pathValidation.valid) {
    return { ok: false as const, record: null, errors: pathValidation.errors };
  }

  if (path.extname(intakeFilePath).toLowerCase() !== ".json") {
    const errors: PrivateJobOpportunityValidationError[] = [];
    addError(errors, "PRIVATE_INTAKE_JSON_REQUIRED", "intakeFilePath", "The private intake file must be JSON.", "Only JSON intake files are supported.");
    return { ok: false as const, record: null, errors };
  }

  if (!existsSync(intakeFilePath)) {
    const errors: PrivateJobOpportunityValidationError[] = [];
    addError(errors, "PRIVATE_INTAKE_FILE_NOT_FOUND", "intakeFilePath", "The private intake file was not found.", "intakeFilePath does not exist.");
    return { ok: false as const, record: null, errors };
  }

  try {
    return { ok: true as const, record: JSON.parse(readFileSync(intakeFilePath, "utf8")) as unknown, errors: [] };
  } catch (_error) {
    const errors: PrivateJobOpportunityValidationError[] = [];
    addError(errors, "PRIVATE_INTAKE_JSON_MALFORMED", "intakeFilePath", "The private intake file could not be read.", "JSON parsing failed.");
    return { ok: false as const, record: null, errors };
  }
}

export function writePrivateNormalizedJobOpportunity(
  opportunity: PrivateNormalizedJobOpportunity,
  outputDirectory: string,
  repositoryRoot: string,
) {
  const pathValidation = validatePrivateJobSearchStoragePath(outputDirectory, repositoryRoot, "output");
  if (!pathValidation.valid) {
    return { ok: false as const, outputPath: null, errors: pathValidation.errors };
  }

  mkdirSync(outputDirectory, { recursive: true, mode: 0o700 });
  chmodSync(outputDirectory, 0o700);
  const outputPath = path.join(outputDirectory, `${opportunity.id}.private.json`);
  writeFileSync(outputPath, `${JSON.stringify(opportunity, null, 2)}\n`, { mode: 0o600 });
  chmodSync(outputPath, 0o600);
  return { ok: true as const, outputPath, errors: [] };
}

function sourceStates(filePaths: readonly string[]): SourceState[] {
  return filePaths.map((filePath) => {
    const stats = statSync(filePath);
    return {
      filePath,
      sizeBytes: stats.size,
      modifiedMs: stats.mtimeMs,
      contentDigest: digestFile(filePath),
    };
  });
}

function sourceFilesModified(before: readonly SourceState[], after: readonly SourceState[]) {
  return before.some((beforeState) => {
    const afterState = after.find((state) => state.filePath === beforeState.filePath);
    return (
      !afterState ||
      afterState.sizeBytes !== beforeState.sizeBytes ||
      afterState.modifiedMs !== beforeState.modifiedMs ||
      afterState.contentDigest !== beforeState.contentDigest
    );
  });
}

function failedBridgeRun(
  options: BridgeRunOptions,
  failureCode: PrivateJobOpportunityValidationErrorCode,
): PrivateJobOpportunityBridgeRunResult {
  return {
    metadata: {
      schemaVersion: PRIVATE_JOB_OPPORTUNITY_INTAKE_VERSION,
      canonical: false,
      generatedAt: options.generatedAt,
      sourceDirectoryRedacted: options.intakeDirectory ? redactPathForReport(options.intakeDirectory) : "",
      outputDirectoryRedacted: options.outputDirectory ? redactPathForReport(options.outputDirectory) : null,
      noExternalNetwork: true,
      noModelInvocation: true,
      noApplicationCreated: true,
    },
    status: "failed",
    failureCode,
    validationResults: [],
    normalizedOpportunities: [],
    privateArtifacts: [],
    sourceFilesModified: false,
    summary: {
      intakeFileCount: 0,
      validOpportunityCount: 0,
      invalidOpportunityCount: 0,
      writtenPrivateArtifactCount: 0,
    },
  };
}

export function runPrivateJobOpportunityIntakeBridge(
  options: BridgeRunOptions,
): PrivateJobOpportunityBridgeRunResult {
  if (!options.intakeDirectory) {
    return failedBridgeRun(options, "EXPLICIT_PRIVATE_INTAKE_PATH_REQUIRED");
  }
  if (options.writePrivateArtifacts && !options.outputDirectory) {
    return failedBridgeRun(options, "EXPLICIT_PRIVATE_OUTPUT_PATH_REQUIRED");
  }

  const intakeValidation = validatePrivateJobSearchStoragePath(options.intakeDirectory, options.repositoryRoot, "intake");
  if (!intakeValidation.valid) {
    return failedBridgeRun(options, intakeValidation.errors[0].code);
  }

  if (options.outputDirectory) {
    const outputValidation = validatePrivateJobSearchStoragePath(options.outputDirectory, options.repositoryRoot, "output");
    if (!outputValidation.valid) {
      return failedBridgeRun(options, outputValidation.errors[0].code);
    }
  }

  if (!existsSync(options.intakeDirectory)) {
    return failedBridgeRun(options, "PRIVATE_INTAKE_FILE_NOT_FOUND");
  }

  const intakeFiles = readdirSync(options.intakeDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".json")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => path.join(options.intakeDirectory, entry.name));
  const beforeStates = sourceStates(intakeFiles);
  const normalizedOpportunities: PrivateNormalizedJobOpportunity[] = [];
  const validationResults: PrivateJobOpportunityNormalizationResult[] = [];
  const privateArtifacts: string[] = [];

  for (const intakeFile of intakeFiles) {
    const readResult = readPrivateJobOpportunityIntakeFile(intakeFile, options.repositoryRoot);
    if (!readResult.ok) {
      validationResults.push({
        valid: false,
        validationStatus: "Needs review",
        errors: readResult.errors,
        warnings: [],
        checkedRecordCount: 0,
        normalizedOpportunity: null,
      });
      continue;
    }

    const result = normalizePrivateJobOpportunityIntake(readResult.record, {
      intakeTimestamp: options.generatedAt,
      existingOpportunities: normalizedOpportunities,
    });
    validationResults.push(result);

    if (result.normalizedOpportunity) {
      normalizedOpportunities.push(result.normalizedOpportunity);
      if (options.writePrivateArtifacts && options.outputDirectory) {
        const writeResult = writePrivateNormalizedJobOpportunity(
          result.normalizedOpportunity,
          options.outputDirectory,
          options.repositoryRoot,
        );
        if (writeResult.ok && writeResult.outputPath) {
          privateArtifacts.push(writeResult.outputPath);
        }
      }
    }
  }

  const afterStates = sourceStates(intakeFiles);
  const modified = sourceFilesModified(beforeStates, afterStates);

  return {
    metadata: {
      schemaVersion: PRIVATE_JOB_OPPORTUNITY_INTAKE_VERSION,
      canonical: false,
      generatedAt: options.generatedAt,
      sourceDirectoryRedacted: redactPathForReport(options.intakeDirectory),
      outputDirectoryRedacted: options.outputDirectory ? redactPathForReport(options.outputDirectory) : null,
      noExternalNetwork: true,
      noModelInvocation: true,
      noApplicationCreated: true,
    },
    status: "completed",
    failureCode: null,
    validationResults,
    normalizedOpportunities,
    privateArtifacts,
    sourceFilesModified: modified,
    summary: {
      intakeFileCount: intakeFiles.length,
      validOpportunityCount: normalizedOpportunities.length,
      invalidOpportunityCount: validationResults.filter((result) => !result.valid).length,
      writtenPrivateArtifactCount: privateArtifacts.length,
    },
  };
}

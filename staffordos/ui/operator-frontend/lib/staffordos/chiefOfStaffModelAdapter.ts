import {
  STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE,
  STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE,
  formatChiefOfStaffValidationReport,
  validateChiefOfStaffResponse,
  type ChiefOfStaffAuthorityStatus,
  type ChiefOfStaffClaimType,
  type ChiefOfStaffConfidence,
  type ChiefOfStaffRecommendationStatus,
  type ChiefOfStaffRequestFixture,
  type ChiefOfStaffResponse,
  type ChiefOfStaffSourceFixture,
  type ChiefOfStaffSourceType,
  type ChiefOfStaffValidationReport,
  type ChiefOfStaffValidationResult,
  type ChiefOfStaffWorkspaceFamily,
  type ChiefOfStaffWorkspaceId,
} from "./chiefOfStaffValidator";

export const CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION = "S009.00";

export const CHIEF_OF_STAFF_ADAPTER_FALLBACK =
  "The Chief of Staff could not prepare a trusted response from the current request.";

export type ChiefOfStaffModelContractVersion = typeof CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION;

export type ChiefOfStaffAdapterKind =
  | "deterministic_fixture"
  | "test_invalid_fixture"
  | "future_provider";

export type ChiefOfStaffGenerationStatus =
  | "Proposed"
  | "Failed"
  | "Invalid structured output"
  | "Blocked by adapter policy"
  | "Unsupported request";

export type ChiefOfStaffProviderCapabilities = {
  structuredOutput: boolean;
  deterministicSeedSupport: boolean | "not_applicable";
  toolUse: boolean;
  streaming: boolean;
  localExecution: boolean;
  externalNetwork: boolean;
  maximumContextClassification: string;
  supportedContractVersions: ChiefOfStaffModelContractVersion[];
};

export type ChiefOfStaffInstructionEnvelope = {
  contractVersion: ChiefOfStaffModelContractVersion;
  role: string;
  allowedSourceRule: string;
  requiredResponseStructure: string[];
  sourceTracingRequirement: string;
  workspaceBoundary: string;
  authorityBoundary: string;
  uncertaintyBehavior: string;
  safeUnknownBehavior: string;
  prohibitedBehavior: string[];
};

export type GovernedChiefOfStaffModelRequest = {
  requestId: string;
  contractVersion: ChiefOfStaffModelContractVersion;
  workspaceId: ChiefOfStaffWorkspaceId;
  workspaceFamily: ChiefOfStaffWorkspaceFamily;
  operatorQuestion: string;
  operatorLanguageRules: string[];
  authorityRules: string[];
  allowedClaimTypes: ChiefOfStaffClaimType[];
  allowedRecommendationStatuses: ChiefOfStaffRecommendationStatus[];
  authorizedSources: ChiefOfStaffSourceFixture[];
  sourceSnapshotIds: string[];
  requiredResponseShape: string[];
  requiredLimitations: string[];
  prohibitedClaims: string[];
  instructionEnvelope: ChiefOfStaffInstructionEnvelope;
  currentTimeFixture: string;
  privacyClassification: string;
};

export type ChiefOfStaffAdapterResult = {
  adapterId: string;
  adapterKind: ChiefOfStaffAdapterKind;
  providerName: string;
  modelName: string;
  contractVersion: ChiefOfStaffModelContractVersion;
  requestId: string;
  proposedResponse: unknown;
  rawOutputAvailable: boolean;
  generationStatus: ChiefOfStaffGenerationStatus;
  adapterWarnings: string[];
  providerMetadata: Record<string, string | number | boolean | null>;
  generatedAt: string;
  deterministicFixture: boolean;
};

export type ChiefOfStaffModelAdapter = {
  adapterId: string;
  adapterKind: ChiefOfStaffAdapterKind;
  providerName: string;
  modelName: string;
  contractVersion: ChiefOfStaffModelContractVersion;
  capabilities: ChiefOfStaffProviderCapabilities;
  limitations: string[];
  generateStructuredResponse: (
    request: GovernedChiefOfStaffModelRequest,
  ) => ChiefOfStaffAdapterResult;
};

export type ChiefOfStaffStructuralGuardError = {
  code: string;
  path: string;
  message: string;
  technicalDetail: string;
};

export type ChiefOfStaffStructuralGuardResult = {
  valid: boolean;
  errors: ChiefOfStaffStructuralGuardError[];
};

export type ChiefOfStaffAdapterAuditEnvelope = {
  auditId: string;
  requestId: string;
  adapterId: string;
  providerName: string;
  modelName: string;
  contractVersion: ChiefOfStaffModelContractVersion;
  sourceSnapshotIds: string[];
  generationStatus: ChiefOfStaffGenerationStatus;
  validationStatus: "accepted" | "rejected" | "not_run";
  validationErrorCodes: string[];
  trustedResponseAvailable: boolean;
  generatedAt: string;
  workspaceId: ChiefOfStaffWorkspaceId;
  privacyClassification: string;
  limitations: string[];
};

export type ChiefOfStaffAdapterExecutionResult = {
  generationSucceeded: boolean;
  adapterResult: ChiefOfStaffAdapterResult;
  structuralGuardResult: ChiefOfStaffStructuralGuardResult;
  validationResult: ChiefOfStaffValidationResult | null;
  trustedResponse: ChiefOfStaffResponse | null;
  blockedResponse: unknown;
  operatorSafeReport: ChiefOfStaffValidationReport;
  auditEnvelope: ChiefOfStaffAdapterAuditEnvelope;
};

export type ChiefOfStaffAdapterExecutionInput = {
  adapter: ChiefOfStaffModelAdapter;
  governedRequest: GovernedChiefOfStaffModelRequest;
  authorizedSources: ChiefOfStaffSourceFixture[];
};

const ALLOWED_CLAIM_TYPES: ChiefOfStaffClaimType[] = [
  "SOURCE_FACT",
  "DERIVED_SUMMARY",
  "INFERENCE",
  "CANDIDATE_RECOMMENDATION",
  "UNKNOWN",
  "BLOCKED_BY_AUTHORITY",
  "PLANNED_CAPABILITY",
];

const ALLOWED_RECOMMENDATION_STATUSES: ChiefOfStaffRecommendationStatus[] = [
  "Candidate",
  "Needs more information",
  "Needs authority",
  "Not recommended",
  "Ready for operator review",
];

const ALLOWED_AUTHORITY_STATUSES: ChiefOfStaffAuthorityStatus[] = [
  "Informational only",
  "Candidate recommendation",
  "Operator review required",
  "Approval required",
  "Blocked by missing authority",
  "Not authorized",
];

const ALLOWED_CONFIDENCE_CLASSIFICATIONS: ChiefOfStaffConfidence[] = [
  "High confidence",
  "Moderate confidence",
  "Low confidence",
  "Not enough evidence",
];

export const CHIEF_OF_STAFF_REQUIRED_RESPONSE_SHAPE = [
  "responseId",
  "workspaceId",
  "headline",
  "summary",
  "attentionItems",
  "supportingClaims",
  "missingInformation",
  "candidateActions",
  "risks",
  "approvalsNeeded",
  "proofExpected",
  "learningReferences",
  "sources",
  "limitations",
  "generatedAt",
  "authorityStatus",
];

export const CHIEF_OF_STAFF_PROVIDER_NEUTRAL_INSTRUCTION_ENVELOPE: ChiefOfStaffInstructionEnvelope = {
  contractVersion: CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION,
  role: "Prepare a source-traced read-only Chief of Staff response from the supplied sources only.",
  allowedSourceRule: "Use only the authorized sources supplied in the governed request.",
  requiredResponseStructure: CHIEF_OF_STAFF_REQUIRED_RESPONSE_SHAPE,
  sourceTracingRequirement: "Every material claim must cite supplied source IDs.",
  workspaceBoundary: "Stay inside the request workspace. Do not mix workspace sources.",
  authorityBoundary: "Do not approve, execute, verify, complete, authorize, or decide work.",
  uncertaintyBehavior: "State missing information and limitations instead of inventing an answer.",
  safeUnknownBehavior: "Use the safe unknown response when supplied sources do not support an answer.",
  prohibitedBehavior: [
    "Do not add sources.",
    "Do not use hidden knowledge.",
    "Do not invent business metrics.",
    "Do not treat planned work as available now.",
    "Do not treat Evidence as Proof.",
    "Do not treat Proof as completion.",
    "Do not treat Learning as Policy.",
  ],
};

export const CHIEF_OF_STAFF_FIXTURE_ADAPTER_CAPABILITIES: ChiefOfStaffProviderCapabilities = {
  structuredOutput: true,
  deterministicSeedSupport: "not_applicable",
  toolUse: false,
  streaming: false,
  localExecution: true,
  externalNetwork: false,
  maximumContextClassification: "static_stafford_media_fixture_only",
  supportedContractVersions: [CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecordArray(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.every(isRecord);
}

function structuralError(
  code: string,
  path: string,
  message: string,
  technicalDetail: string,
): ChiefOfStaffStructuralGuardError {
  return { code, path, message, technicalDetail };
}

function workspaceFamilyFor(workspaceId: ChiefOfStaffWorkspaceId): ChiefOfStaffWorkspaceFamily {
  if (workspaceId === "professional") {
    return "professional";
  }

  if (workspaceId === "personal") {
    return "personal";
  }

  return "business";
}

function sourceTypesFor(sources: ChiefOfStaffSourceFixture[]): ChiefOfStaffSourceType[] {
  return Array.from(new Set(sources.map((source) => source.sourceType)));
}

function sanitizeSourcesForRequest(
  request: ChiefOfStaffRequestFixture,
  sources: ChiefOfStaffSourceFixture[],
) {
  const requestedSourceIds = new Set(request.sourceSnapshotIds);
  const allowedSourceTypes = new Set(request.allowedSourceTypes);
  const allowedPrivacy = new Set(request.policyContext.authorizedPrivacyClassifications);

  return clone(sources).filter((source) =>
    requestedSourceIds.has(source.sourceId) &&
    source.workspaceId === request.workspaceId &&
    allowedSourceTypes.has(source.sourceType) &&
    allowedPrivacy.has(source.privacyClassification)
  );
}

export function buildGovernedChiefOfStaffModelRequest(
  request: ChiefOfStaffRequestFixture = STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE,
  sources: ChiefOfStaffSourceFixture[] = STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
): GovernedChiefOfStaffModelRequest {
  const authorizedSources = sanitizeSourcesForRequest(request, sources);

  return {
    requestId: request.requestId,
    contractVersion: CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION,
    workspaceId: request.workspaceId,
    workspaceFamily: request.workspaceFamily,
    operatorQuestion: request.operatorQuestion,
    operatorLanguageRules: [
      "Use plain operator-facing language.",
      "State what is available now and what is not connected.",
      "Keep technical terms inside technical details only.",
    ],
    authorityRules: [
      "Informational only unless the response explicitly says operator review is needed.",
      "The adapter and model are not approval, execution, verification, or policy authority.",
      "WorkspaceContext remains presentation-only and is not authorization.",
    ],
    allowedClaimTypes: ALLOWED_CLAIM_TYPES,
    allowedRecommendationStatuses: ALLOWED_RECOMMENDATION_STATUSES,
    authorizedSources,
    sourceSnapshotIds: authorizedSources.map((source) => source.sourceId),
    requiredResponseShape: CHIEF_OF_STAFF_REQUIRED_RESPONSE_SHAPE,
    requiredLimitations: [
      "No live AI model is connected.",
      "No execution authority is present.",
      "No live ranking is connected.",
      "Static sources only.",
    ],
    prohibitedClaims: [
      "approved",
      "executing",
      "completed by the Chief of Staff",
      "live revenue",
      "live customer state",
      "Professional available now",
      "Personal available now",
    ],
    instructionEnvelope: CHIEF_OF_STAFF_PROVIDER_NEUTRAL_INSTRUCTION_ENVELOPE,
    currentTimeFixture: request.currentTime,
    privacyClassification: request.privacyClassification,
  };
}

function validatorRequestFromGovernedRequest(
  request: GovernedChiefOfStaffModelRequest,
  sources: ChiefOfStaffSourceFixture[],
): ChiefOfStaffRequestFixture {
  return {
    requestId: request.requestId,
    currentUserId: "model-adapter-fixture-user-not-authenticated",
    workspaceId: request.workspaceId,
    workspaceFamily: request.workspaceFamily || workspaceFamilyFor(request.workspaceId),
    activeRole: "owner_fixture_not_authorization",
    permissionSummary: "Static adapter fixture only. This is not real authentication, authorization, membership, role, or permission authority.",
    capabilitySummary: "Authorized static StaffordOS sources only.",
    operatorQuestion: request.operatorQuestion,
    allowedSourceTypes: sourceTypesFor(sources),
    sourceSnapshotIds: sources.map((source) => source.sourceId),
    currentTime: request.currentTimeFixture,
    privacyClassification: request.privacyClassification,
    policyContext: {
      mode: "read_only_contract",
      writesAllowed: false,
      externalAiAllowed: false,
      workspaceContextAuthorization: "not_authorization",
      authorizedPrivacyClassifications: [request.privacyClassification],
    },
    requestedOutputType: "source_traced_attention_summary",
  };
}

export function guardChiefOfStaffStructuredResponse(candidate: unknown): ChiefOfStaffStructuralGuardResult {
  const errors: ChiefOfStaffStructuralGuardError[] = [];

  if (!isRecord(candidate)) {
    return {
      valid: false,
      errors: [
        structuralError(
          "RESPONSE_NOT_OBJECT",
          "response",
          "Response cannot be shown as trusted.",
          "The proposed response is not an object.",
        ),
      ],
    };
  }

  for (const key of CHIEF_OF_STAFF_REQUIRED_RESPONSE_SHAPE) {
    if (!(key in candidate)) {
      errors.push(structuralError(
        "MISSING_RESPONSE_FIELD",
        `response.${key}`,
        "Response cannot be shown as trusted.",
        `Missing required field ${key}.`,
      ));
    }
  }

  for (const key of ["responseId", "workspaceId", "headline", "summary", "proofExpected", "generatedAt", "authorityStatus"]) {
    if (key in candidate && !isString(candidate[key])) {
      errors.push(structuralError(
        "INVALID_RESPONSE_STRING",
        `response.${key}`,
        "Response cannot be shown as trusted.",
        `${key} must be a non-empty string.`,
      ));
    }
  }

  for (const key of ["attentionItems", "supportingClaims", "missingInformation", "candidateActions", "sources"]) {
    if (key in candidate && !isRecordArray(candidate[key])) {
      errors.push(structuralError(
        "INVALID_RESPONSE_ARRAY",
        `response.${key}`,
        "Response cannot be shown as trusted.",
        `${key} must be an array of objects.`,
      ));
    }
  }

  for (const key of ["risks", "approvalsNeeded", "learningReferences", "limitations"]) {
    if (key in candidate && !isStringArray(candidate[key])) {
      errors.push(structuralError(
        "INVALID_STRING_ARRAY",
        `response.${key}`,
        "Response cannot be shown as trusted.",
        `${key} must be an array of strings.`,
      ));
    }
  }

  if (isRecordArray(candidate.attentionItems)) {
    candidate.attentionItems.forEach((item, index) => {
      for (const key of ["title", "reason"]) {
        if (!isString(item[key])) {
          errors.push(structuralError(
            "INVALID_ATTENTION_ITEM",
            `response.attentionItems[${index}].${key}`,
            "Response cannot be shown as trusted.",
            `${key} must be a non-empty string.`,
          ));
        }
      }

      if (!isStringArray(item.claimIds)) {
        errors.push(structuralError(
          "INVALID_ATTENTION_ITEM_CLAIMS",
          `response.attentionItems[${index}].claimIds`,
          "Response cannot be shown as trusted.",
          "claimIds must be an array of strings.",
        ));
      }
    });
  }

  if (isRecordArray(candidate.supportingClaims)) {
    candidate.supportingClaims.forEach((claim, index) => {
      for (const key of ["claimId", "claimType", "statement", "confidenceClassification", "limitation", "workspaceId", "authorityStatus"]) {
        if (!isString(claim[key])) {
          errors.push(structuralError(
            "INVALID_CLAIM_FIELD",
            `response.supportingClaims[${index}].${key}`,
            "Response cannot be shown as trusted.",
            `${key} must be a non-empty string.`,
          ));
        }
      }

      if (isString(claim.claimType) && !ALLOWED_CLAIM_TYPES.includes(claim.claimType as ChiefOfStaffClaimType)) {
        errors.push(structuralError(
          "UNSUPPORTED_CLAIM_TYPE",
          `response.supportingClaims[${index}].claimType`,
          "Response cannot be shown as trusted.",
          `Unsupported claim type ${claim.claimType}.`,
        ));
      }

      if (isString(claim.confidenceClassification) && !ALLOWED_CONFIDENCE_CLASSIFICATIONS.includes(claim.confidenceClassification as ChiefOfStaffConfidence)) {
        errors.push(structuralError(
          "UNSUPPORTED_CONFIDENCE_CLASSIFICATION",
          `response.supportingClaims[${index}].confidenceClassification`,
          "Response cannot be shown as trusted.",
          `Unsupported confidence classification ${claim.confidenceClassification}.`,
        ));
      }

      if (isString(claim.authorityStatus) && !ALLOWED_AUTHORITY_STATUSES.includes(claim.authorityStatus as ChiefOfStaffAuthorityStatus)) {
        errors.push(structuralError(
          "UNSUPPORTED_AUTHORITY_STATUS",
          `response.supportingClaims[${index}].authorityStatus`,
          "Response cannot be shown as trusted.",
          `Unsupported authority status ${claim.authorityStatus}.`,
        ));
      }

      if (!isStringArray(claim.supportingSourceIds)) {
        errors.push(structuralError(
          "INVALID_CLAIM_SOURCES",
          `response.supportingClaims[${index}].supportingSourceIds`,
          "Response cannot be shown as trusted.",
          "supportingSourceIds must be an array of strings.",
        ));
      }
    });
  }

  if (isRecordArray(candidate.missingInformation)) {
    candidate.missingInformation.forEach((item, index) => {
      for (const key of ["type", "statement"]) {
        if (!isString(item[key])) {
          errors.push(structuralError(
            "INVALID_MISSING_INFORMATION",
            `response.missingInformation[${index}].${key}`,
            "Response cannot be shown as trusted.",
            `${key} must be a non-empty string.`,
          ));
        }
      }
    });
  }

  if (isRecordArray(candidate.candidateActions)) {
    candidate.candidateActions.forEach((recommendation, index) => {
      for (const key of [
        "recommendationId",
        "workspaceId",
        "operatorFacingAction",
        "whyNow",
        "objectiveId",
        "decisionId",
        "supportingActionId",
        "proofStatus",
        "riskSummary",
        "uncertainty",
        "authorityNeeded",
        "authorityStatus",
        "expectedResult",
        "proofNeeded",
        "recommendationStatus",
      ]) {
        if (!isString(recommendation[key])) {
          errors.push(structuralError(
            "INVALID_RECOMMENDATION_FIELD",
            `response.candidateActions[${index}].${key}`,
            "Response cannot be shown as trusted.",
            `${key} must be a non-empty string.`,
          ));
        }
      }

      if (isString(recommendation.recommendationStatus) && !ALLOWED_RECOMMENDATION_STATUSES.includes(recommendation.recommendationStatus as ChiefOfStaffRecommendationStatus)) {
        errors.push(structuralError(
          "UNSUPPORTED_RECOMMENDATION_STATUS",
          `response.candidateActions[${index}].recommendationStatus`,
          "Response cannot be shown as trusted.",
          `Unsupported recommendation status ${recommendation.recommendationStatus}.`,
        ));
      }

      if (isString(recommendation.authorityStatus) && !ALLOWED_AUTHORITY_STATUSES.includes(recommendation.authorityStatus as ChiefOfStaffAuthorityStatus)) {
        errors.push(structuralError(
          "UNSUPPORTED_RECOMMENDATION_AUTHORITY",
          `response.candidateActions[${index}].authorityStatus`,
          "Response cannot be shown as trusted.",
          `Unsupported authority status ${recommendation.authorityStatus}.`,
        ));
      }

      for (const key of ["evidenceIds", "learningIds"]) {
        if (!isStringArray(recommendation[key])) {
          errors.push(structuralError(
            "INVALID_RECOMMENDATION_STRING_ARRAY",
            `response.candidateActions[${index}].${key}`,
            "Response cannot be shown as trusted.",
            `${key} must be an array of strings.`,
          ));
        }
      }

      if (!isRecordArray(recommendation.alternatives)) {
        errors.push(structuralError(
          "INVALID_RECOMMENDATION_ALTERNATIVES",
          `response.candidateActions[${index}].alternatives`,
          "Response cannot be shown as trusted.",
          "alternatives must be an array of objects.",
        ));
      } else {
        recommendation.alternatives.forEach((alternative, alternativeIndex) => {
          for (const key of ["label", "reason"]) {
            if (!isString(alternative[key])) {
              errors.push(structuralError(
                "INVALID_RECOMMENDATION_ALTERNATIVE_FIELD",
                `response.candidateActions[${index}].alternatives[${alternativeIndex}].${key}`,
                "Response cannot be shown as trusted.",
                `${key} must be a non-empty string.`,
              ));
            }
          }
        });
      }

      if (!isRecordArray(recommendation.sourceTrace)) {
        errors.push(structuralError(
          "INVALID_RECOMMENDATION_SOURCE_TRACE",
          `response.candidateActions[${index}].sourceTrace`,
          "Response cannot be shown as trusted.",
          "sourceTrace must be an array of objects.",
        ));
      } else {
        recommendation.sourceTrace.forEach((trace, traceIndex) => {
          if (!isString(trace.claimId)) {
            errors.push(structuralError(
              "INVALID_SOURCE_TRACE_CLAIM",
              `response.candidateActions[${index}].sourceTrace[${traceIndex}].claimId`,
              "Response cannot be shown as trusted.",
              "claimId must be a non-empty string.",
            ));
          }

          if (!isStringArray(trace.sourceIds)) {
            errors.push(structuralError(
              "INVALID_SOURCE_TRACE_SOURCES",
              `response.candidateActions[${index}].sourceTrace[${traceIndex}].sourceIds`,
              "Response cannot be shown as trusted.",
              "sourceIds must be an array of strings.",
            ));
          }
        });
      }
    });
  }

  if (isRecordArray(candidate.sources)) {
    candidate.sources.forEach((source, index) => {
      for (const key of ["sourceId", "exactSourceReference"]) {
        if (!isString(source[key])) {
          errors.push(structuralError(
            "INVALID_SOURCE_REFERENCE",
            `response.sources[${index}].${key}`,
            "Response cannot be shown as trusted.",
            `${key} must be a non-empty string.`,
          ));
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function responseFromCandidate(candidate: unknown): ChiefOfStaffResponse {
  return candidate as ChiefOfStaffResponse;
}

function adapterResultIsCompatible(
  adapter: ChiefOfStaffModelAdapter,
  request: GovernedChiefOfStaffModelRequest,
  result: ChiefOfStaffAdapterResult,
) {
  return (
    result.adapterId === adapter.adapterId &&
    result.contractVersion === request.contractVersion &&
    result.requestId === request.requestId
  );
}

function blockedReport(summary: string, technicalDetails: string[]): ChiefOfStaffValidationReport {
  return {
    trusted: false,
    headline: "Response cannot be shown as trusted.",
    summary,
    claimsChecked: 0,
    recommendationsChecked: 0,
    sourcesChecked: 0,
    warnings: [],
    technicalDetails,
  };
}

function blockedAdapterResult(
  adapter: ChiefOfStaffModelAdapter,
  request: GovernedChiefOfStaffModelRequest,
  status: ChiefOfStaffGenerationStatus,
  warning: string,
): ChiefOfStaffAdapterResult {
  return {
    adapterId: adapter.adapterId,
    adapterKind: adapter.adapterKind,
    providerName: adapter.providerName,
    modelName: adapter.modelName,
    contractVersion: request.contractVersion,
    requestId: request.requestId,
    proposedResponse: null,
    rawOutputAvailable: false,
    generationStatus: status,
    adapterWarnings: [warning],
    providerMetadata: {},
    generatedAt: request.currentTimeFixture,
    deterministicFixture: true,
  };
}

export function buildChiefOfStaffAdapterAuditEnvelope(params: {
  request: GovernedChiefOfStaffModelRequest;
  adapterResult: ChiefOfStaffAdapterResult;
  validationResult: ChiefOfStaffValidationResult | null;
  trustedResponseAvailable: boolean;
  limitations: string[];
}): ChiefOfStaffAdapterAuditEnvelope {
  const validationErrorCodes = params.validationResult?.errors.map((error) => error.code) || [];

  return {
    auditId: `audit-${params.request.requestId}-${params.adapterResult.adapterId}`,
    requestId: params.request.requestId,
    adapterId: params.adapterResult.adapterId,
    providerName: params.adapterResult.providerName,
    modelName: params.adapterResult.modelName,
    contractVersion: params.adapterResult.contractVersion,
    sourceSnapshotIds: params.request.sourceSnapshotIds,
    generationStatus: params.adapterResult.generationStatus,
    validationStatus: params.validationResult?.validationStatus || "not_run",
    validationErrorCodes,
    trustedResponseAvailable: params.trustedResponseAvailable,
    generatedAt: params.adapterResult.generatedAt,
    workspaceId: params.request.workspaceId,
    privacyClassification: params.request.privacyClassification,
    limitations: params.limitations,
  };
}

function executionResult(params: {
  request: GovernedChiefOfStaffModelRequest;
  adapterResult: ChiefOfStaffAdapterResult;
  structuralGuardResult: ChiefOfStaffStructuralGuardResult;
  validationResult: ChiefOfStaffValidationResult | null;
  trustedResponse: ChiefOfStaffResponse | null;
  blockedResponse: unknown;
  report: ChiefOfStaffValidationReport;
}): ChiefOfStaffAdapterExecutionResult {
  const trustedResponseAvailable = Boolean(params.trustedResponse);

  return {
    generationSucceeded: params.adapterResult.generationStatus === "Proposed",
    adapterResult: params.adapterResult,
    structuralGuardResult: params.structuralGuardResult,
    validationResult: params.validationResult,
    trustedResponse: params.trustedResponse,
    blockedResponse: params.blockedResponse,
    operatorSafeReport: params.report,
    auditEnvelope: buildChiefOfStaffAdapterAuditEnvelope({
      request: params.request,
      adapterResult: params.adapterResult,
      validationResult: params.validationResult,
      trustedResponseAvailable,
      limitations: [
        ...params.request.requiredLimitations,
        ...params.adapterResult.adapterWarnings,
      ],
    }),
  };
}

export function runChiefOfStaffAdapter(input: ChiefOfStaffAdapterExecutionInput): ChiefOfStaffAdapterExecutionResult {
  const authorizedSources = clone(input.authorizedSources).filter((source) =>
    source.workspaceId === input.governedRequest.workspaceId &&
    input.governedRequest.sourceSnapshotIds.includes(source.sourceId)
  );
  const governedRequest = clone({
    ...input.governedRequest,
    authorizedSources,
    sourceSnapshotIds: authorizedSources.map((source) => source.sourceId),
  });

  if (
    input.adapter.contractVersion !== governedRequest.contractVersion ||
    !input.adapter.capabilities.supportedContractVersions.includes(governedRequest.contractVersion)
  ) {
    const adapterResult = blockedAdapterResult(
      input.adapter,
      governedRequest,
      "Unsupported request",
      "Adapter does not support the governed request contract.",
    );
    const report = blockedReport(
      CHIEF_OF_STAFF_ADAPTER_FALLBACK,
      ["UNSUPPORTED_REQUEST: Adapter contract support did not match the request."],
    );

    return executionResult({
      request: governedRequest,
      adapterResult,
      structuralGuardResult: { valid: false, errors: [] },
      validationResult: null,
      trustedResponse: null,
      blockedResponse: null,
      report,
    });
  }

  let adapterResult: ChiefOfStaffAdapterResult;
  try {
    adapterResult = input.adapter.generateStructuredResponse(clone(governedRequest));
  } catch (error) {
    adapterResult = blockedAdapterResult(
      input.adapter,
      governedRequest,
      "Failed",
      error instanceof Error ? error.message : "Adapter failed without a structured error.",
    );
  }

  if (!adapterResultIsCompatible(input.adapter, governedRequest, adapterResult)) {
    const incompatibleResult = blockedAdapterResult(
      input.adapter,
      governedRequest,
      "Invalid structured output",
      "Adapter returned an incompatible result envelope.",
    );
    const report = blockedReport(
      CHIEF_OF_STAFF_ADAPTER_FALLBACK,
      ["INVALID_ADAPTER_RESULT: Adapter result did not match adapter, request, and contract identifiers."],
    );

    return executionResult({
      request: governedRequest,
      adapterResult: incompatibleResult,
      structuralGuardResult: { valid: false, errors: [] },
      validationResult: null,
      trustedResponse: null,
      blockedResponse: adapterResult,
      report,
    });
  }

  if (adapterResult.generationStatus !== "Proposed") {
    const report = blockedReport(
      CHIEF_OF_STAFF_ADAPTER_FALLBACK,
      [`${adapterResult.generationStatus}: ${adapterResult.adapterWarnings.join(" ") || "Adapter did not return a proposed response."}`],
    );

    return executionResult({
      request: governedRequest,
      adapterResult,
      structuralGuardResult: { valid: false, errors: [] },
      validationResult: null,
      trustedResponse: null,
      blockedResponse: adapterResult.proposedResponse,
      report,
    });
  }

  const structuralGuardResult = guardChiefOfStaffStructuredResponse(adapterResult.proposedResponse);
  if (!structuralGuardResult.valid) {
    const report = blockedReport(
      CHIEF_OF_STAFF_ADAPTER_FALLBACK,
      structuralGuardResult.errors.map((error) => `${error.code}: ${error.technicalDetail}`),
    );

    return executionResult({
      request: governedRequest,
      adapterResult: {
        ...adapterResult,
        generationStatus: "Invalid structured output",
      },
      structuralGuardResult,
      validationResult: null,
      trustedResponse: null,
      blockedResponse: adapterResult.proposedResponse,
      report,
    });
  }

  const proposedResponse = responseFromCandidate(adapterResult.proposedResponse);
  const validatorRequest = validatorRequestFromGovernedRequest(governedRequest, authorizedSources);
  const validationResult = validateChiefOfStaffResponse(
    validatorRequest,
    authorizedSources,
    proposedResponse,
  );
  const report = formatChiefOfStaffValidationReport(validationResult);

  return executionResult({
    request: governedRequest,
    adapterResult,
    structuralGuardResult,
    validationResult,
    trustedResponse: validationResult.valid ? proposedResponse : null,
    blockedResponse: validationResult.valid ? null : proposedResponse,
    report,
  });
}

function adapterResult(params: {
  adapter: ChiefOfStaffModelAdapter;
  request: GovernedChiefOfStaffModelRequest;
  response: unknown;
  status?: ChiefOfStaffGenerationStatus;
  warnings?: string[];
}): ChiefOfStaffAdapterResult {
  return {
    adapterId: params.adapter.adapterId,
    adapterKind: params.adapter.adapterKind,
    providerName: params.adapter.providerName,
    modelName: params.adapter.modelName,
    contractVersion: params.request.contractVersion,
    requestId: params.request.requestId,
    proposedResponse: params.response,
    rawOutputAvailable: false,
    generationStatus: params.status || "Proposed",
    adapterWarnings: params.warnings || [],
    providerMetadata: {
      deterministicFixture: true,
    },
    generatedAt: params.request.currentTimeFixture,
    deterministicFixture: true,
  };
}

function validResponseForRequest(request: GovernedChiefOfStaffModelRequest) {
  const response = clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE);
  response.workspaceId = request.workspaceId;
  response.generatedAt = request.currentTimeFixture;
  return response;
}

export const DeterministicFixtureChiefOfStaffAdapter: ChiefOfStaffModelAdapter = {
  adapterId: "deterministic-fixture-chief-of-staff-adapter",
  adapterKind: "deterministic_fixture",
  providerName: "Local deterministic fixture",
  modelName: "S009.03 fixture response",
  contractVersion: CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION,
  capabilities: CHIEF_OF_STAFF_FIXTURE_ADAPTER_CAPABILITIES,
  limitations: [
    "Local deterministic fixture only.",
    "No external AI model is used.",
    "No response is trusted until StaffordOS validation passes.",
  ],
  generateStructuredResponse(request) {
    if (request.workspaceId !== "stafford-media") {
      return adapterResult({
        adapter: this,
        request,
        response: null,
        status: "Unsupported request",
        warnings: ["Only the Stafford Media static fixture is supported."],
      });
    }

    return adapterResult({
      adapter: this,
      request,
      response: validResponseForRequest(request),
    });
  },
};

function responseWithClaim(statement: string, sourceIds: string[], claimId: string) {
  const response = clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE);
  response.responseId = `s009-03-${claimId}`;
  response.supportingClaims = [
    {
      claimId,
      claimType: "SOURCE_FACT",
      statement,
      supportingSourceIds: sourceIds,
      confidenceClassification: "High confidence",
      limitation: "Static validation fixture only.",
      workspaceId: "stafford-media",
      authorityStatus: "Informational only",
    },
  ];
  response.candidateActions = [];
  response.sources = sourceIds.map((sourceId) => ({
    sourceId,
    exactSourceReference: "s009-03-test-fixture",
  }));
  return response;
}

function invalidFixtureAdapter(
  adapterId: string,
  modelName: string,
  makeResponse: (request: GovernedChiefOfStaffModelRequest) => unknown,
): ChiefOfStaffModelAdapter {
  return {
    adapterId,
    adapterKind: "test_invalid_fixture",
    providerName: "Local deterministic fixture",
    modelName,
    contractVersion: CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION,
    capabilities: CHIEF_OF_STAFF_FIXTURE_ADAPTER_CAPABILITIES,
    limitations: [
      "Test-only invalid fixture.",
      "Must never be rendered as trusted guidance.",
    ],
    generateStructuredResponse(request) {
      return adapterResult({
        adapter: this,
        request,
        response: makeResponse(request),
      });
    },
  };
}

export const UnsourcedClaimAdapter = invalidFixtureAdapter(
  "unsourced-claim-adapter",
  "S009.03 unsourced claim fixture",
  () => responseWithClaim(
    "Start My Day is the current static primary Action for Stafford Media.",
    [],
    "claim-adapter-unsourced",
  ),
);

export const CrossWorkspaceLeakAdapter = invalidFixtureAdapter(
  "cross-workspace-leak-adapter",
  "S009.03 cross-workspace leak fixture",
  () => responseWithClaim(
    "Professional is planned and has no real professional data connected.",
    ["source-professional-planned"],
    "claim-adapter-cross-workspace",
  ),
);

export const UnauthorizedStatusAdapter = invalidFixtureAdapter(
  "unauthorized-status-adapter",
  "S009.03 unauthorized status fixture",
  () => {
    const response = clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE);
    response.responseId = "s009-03-unauthorized-status";
    response.candidateActions = response.candidateActions.map((recommendation) => ({
      ...recommendation,
      recommendationStatus: "Approved",
    }));
    return response;
  },
);

export const InvalidShapeAdapter: ChiefOfStaffModelAdapter = invalidFixtureAdapter(
  "invalid-shape-adapter",
  "S009.03 invalid shape fixture",
  () => ({
    responseId: "s009-03-invalid-shape",
    workspaceId: "stafford-media",
  }),
);

export const AdapterFailureAdapter: ChiefOfStaffModelAdapter = {
  adapterId: "adapter-failure-adapter",
  adapterKind: "test_invalid_fixture",
  providerName: "Local deterministic fixture",
  modelName: "S009.03 controlled failure fixture",
  contractVersion: CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION,
  capabilities: CHIEF_OF_STAFF_FIXTURE_ADAPTER_CAPABILITIES,
  limitations: ["Test-only controlled failure."],
  generateStructuredResponse(request) {
    return adapterResult({
      adapter: this,
      request,
      response: null,
      status: "Failed",
      warnings: ["Controlled fixture failure."],
    });
  },
};

export const PlannedAsAvailableAdapter = invalidFixtureAdapter(
  "planned-as-available-adapter",
  "S009.03 planned-as-available fixture",
  () => responseWithClaim(
    "Professional is available now.",
    ["source-professional-planned"],
    "claim-adapter-planned-as-available",
  ),
);

export const STAFFORD_MEDIA_GOVERNED_CHIEF_OF_STAFF_MODEL_REQUEST =
  buildGovernedChiefOfStaffModelRequest();

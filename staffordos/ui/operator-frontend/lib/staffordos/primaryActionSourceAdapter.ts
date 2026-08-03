import type {
  ChiefOfStaffFreshness,
  ChiefOfStaffSourceFixture,
  ChiefOfStaffWorkspaceId,
} from "./chiefOfStaffValidator";

type AnyRecord = Record<string, unknown>;

export const PRIMARY_ACTION_SOURCE_ADAPTER_ID = "s009-06-primary-action-source-adapter";

export const PRIMARY_ACTION_SOURCE_TYPE = "primary_action_snapshot";

export const PRIMARY_ACTION_SOURCE_FAILURE_MESSAGE =
  "I cannot verify the current primary action from the available StaffordOS source.";

export type PrimaryActionFallbackClassification =
  | "NONE"
  | "REPOSITORY_BACKED_FALLBACK"
  | "GENERATED_PLACEHOLDER"
  | "MOCK_DATA"
  | "OPERATOR_DEFAULT"
  | "UNKNOWN";

export type PrimaryActionConflictSeverity = "warning" | "blocking";

export type PrimaryActionConflict = {
  code:
    | "SOURCE_CONFLICT"
    | "STATIC_RUNTIME_CONFLICT"
    | "GENERATED_FALLBACK_CONFLICT"
    | "SOURCE_AUTHORITY_AMBIGUOUS";
  description: string;
  sourceReferences: string[];
  severity: PrimaryActionConflictSeverity;
};

export type PrimaryActionPermissionDecision = {
  allowed: boolean;
  workspaceId: ChiefOfStaffWorkspaceId | string;
  roleClassification: string;
  requiredCapability: string;
  decisionSource: string;
  limitations: string[];
  testOnly: boolean;
};

export type PrimaryActionSourceAdapterInput = {
  adapterExecutionId: string;
  requestWorkspaceId: ChiefOfStaffWorkspaceId | string;
  permissionDecision?: PrimaryActionPermissionDecision | null;
  primaryActionRecord: unknown;
  sourceReference: string;
  capturedAt: string;
  sourceUpdatedAt?: string | null;
  privacyClassification: string;
  authorityClassification: string;
  fallbackClassification?: PrimaryActionFallbackClassification;
  conflicts?: PrimaryActionConflict[];
};

export type PrimaryActionIncludedField = {
  field: string;
  sourcePath: string;
  operatorMeaning: string;
  privacyClassification: string;
  authorityClassification: string;
  transformationRule: string;
  limitation: string;
};

export type PrimaryActionStructuredFacts = {
  actionId: string;
  operatorFacingTitle: string;
  operatorFacingSummary: string;
  whyItMatters: string;
  expectedResult: string;
  relatedCapability: string;
  relatedObjectiveId: string | null;
  relatedDecisionId: string | null;
  productScope: string;
  sourceClassification: string;
  authorityClassification: string;
  availabilityClassification: string;
  fallbackClassification: PrimaryActionFallbackClassification;
};

export type PrimaryActionSourceSnapshot = {
  sourceId: string;
  sourceType: typeof PRIMARY_ACTION_SOURCE_TYPE;
  workspaceId: ChiefOfStaffWorkspaceId;
  productScope: string;
  authorityClassification: string;
  freshness: ChiefOfStaffFreshness;
  privacyClassification: string;
  immutable: true;
  title: string;
  contentSummary: string;
  structuredFacts: PrimaryActionStructuredFacts;
  exactSourceReference: string;
  sourceUpdatedAt: string | null;
  capturedAt: string;
  limitations: string[];
  excludedFieldClassifications: string[];
  conflictStatus: {
    status: "No conflict disclosed" | "Needs review";
    conflicts: PrimaryActionConflict[];
  };
  permissionRequirement: string;
  adapterId: typeof PRIMARY_ACTION_SOURCE_ADAPTER_ID;
};

export type PrimaryActionAuditSummary = {
  adapterExecutionId: string;
  adapterId: typeof PRIMARY_ACTION_SOURCE_ADAPTER_ID;
  workspaceId: ChiefOfStaffWorkspaceId | string;
  permissionDecision:
    | "allowed_test_fixture"
    | "denied"
    | "missing"
    | "workspace_mismatch"
    | "unsupported_authority";
  sourceReference: string;
  includedFields: string[];
  excludedFieldClassifications: string[];
  sourceUpdatedAt: string | null;
  capturedAt: string;
  freshness: ChiefOfStaffFreshness;
  conflictStatus: "No conflict disclosed" | "Needs review" | "Blocked";
  resultStatus: "SUCCESS" | "FAILURE";
  failureCode: PrimaryActionSourceFailureCode | null;
  privacyClassification: string;
  limitations: string[];
  fallbackClassification: PrimaryActionFallbackClassification;
  testOnly: boolean;
};

export type PrimaryActionSourceFailureCode =
  | "PERMISSION_DENIED"
  | "PERMISSION_MISSING"
  | "PERMISSION_WORKSPACE_MISMATCH"
  | "PERMISSION_AUTHORITY_UNSUPPORTED"
  | "WORKSPACE_MISMATCH"
  | "WORKSPACE_NOT_ALLOWED"
  | "WORKSPACE_AUTHORITY_MISSING"
  | "SOURCE_MALFORMED"
  | "SOURCE_AUTHORITY_MISSING"
  | "PROVENANCE_MISSING"
  | "PROHIBITED_FIELD_PRESENT"
  | "SOURCE_CONFLICT"
  | "STATIC_RUNTIME_CONFLICT"
  | "GENERATED_FALLBACK_CONFLICT"
  | "SOURCE_AUTHORITY_AMBIGUOUS";

export type PrimaryActionSourceAdapterSuccess = {
  ok: true;
  resultStatus: "SUCCESS";
  sourceSnapshot: PrimaryActionSourceSnapshot;
  auditSummary: PrimaryActionAuditSummary;
  warnings: Array<{
    code: string;
    operatorSafeMessage: string;
    technicalDetail: string;
  }>;
};

export type PrimaryActionSourceAdapterFailure = {
  ok: false;
  resultStatus: "FAILURE";
  failureCode: PrimaryActionSourceFailureCode;
  operatorSafeMessage: typeof PRIMARY_ACTION_SOURCE_FAILURE_MESSAGE;
  technicalDetail: string;
  auditSummary: PrimaryActionAuditSummary;
  warnings: Array<{
    code: string;
    operatorSafeMessage: string;
    technicalDetail: string;
  }>;
};

export type PrimaryActionSourceAdapterResult =
  | PrimaryActionSourceAdapterSuccess
  | PrimaryActionSourceAdapterFailure;

export const PRIMARY_ACTION_PERMISSION_DECISION_FIXTURE: PrimaryActionPermissionDecision = {
  allowed: true,
  workspaceId: "stafford-media",
  roleClassification: "owner_fixture_not_authorization",
  requiredCapability: "read_primary_action_snapshot",
  decisionSource: "s009_06_static_permission_fixture",
  limitations: [
    "Static test fixture only.",
    "This is not real authentication, workspace membership, or server authorization.",
    "Future runtime use must be replaced by deployed S007 identity and permission authority.",
  ],
  testOnly: true,
};

export const PRIMARY_ACTION_SAFE_FIELD_ALLOWLIST: PrimaryActionIncludedField[] = [
  {
    field: "actionId",
    sourcePath: "primaryActionRecord.primary_action.action_id",
    operatorMeaning: "Stable action identifier.",
    privacyClassification: "owner_private_stafford_media_fixture",
    authorityClassification: "Derived read model",
    transformationRule: "Copied only when non-empty; never used as permission authority.",
    limitation: "Identifier only; it does not prove execution or completion.",
  },
  {
    field: "operatorFacingTitle",
    sourcePath: "primaryActionRecord.primary_action.action_label",
    operatorMeaning: "Current primary action label for the operator.",
    privacyClassification: "owner_private_stafford_media_fixture",
    authorityClassification: "Derived read model",
    transformationRule: "Copied only after prohibited-value screening.",
    limitation: "Action label only; it does not approve the action.",
  },
  {
    field: "operatorFacingSummary",
    sourcePath: "primaryActionRecord.primary_action.next_step",
    operatorMeaning: "Plain-language next step summary.",
    privacyClassification: "owner_private_stafford_media_fixture",
    authorityClassification: "Derived read model",
    transformationRule: "Copied only after prohibited-value screening.",
    limitation: "Summary only; no live execution state is claimed.",
  },
  {
    field: "whyItMatters",
    sourcePath: "primaryActionRecord.primary_action.why_now",
    operatorMeaning: "Reason the action deserves attention.",
    privacyClassification: "owner_private_stafford_media_fixture",
    authorityClassification: "Derived read model",
    transformationRule: "Copied only after prohibited-value screening.",
    limitation: "Reasoning from the supplied read model; not model judgment.",
  },
  {
    field: "expectedResult",
    sourcePath: "primaryActionRecord.primary_action.expected_outcome",
    operatorMeaning: "Expected result if the operator later acts.",
    privacyClassification: "owner_private_stafford_media_fixture",
    authorityClassification: "Derived read model",
    transformationRule: "Copied only after prohibited-value screening.",
    limitation: "Expected result only; not an observed outcome.",
  },
  {
    field: "productScope",
    sourcePath: "primaryActionRecord.primary_action.product_id",
    operatorMeaning: "Broad product scope.",
    privacyClassification: "owner_private_stafford_media_fixture",
    authorityClassification: "Derived read model",
    transformationRule: "Reduced to a broad product label.",
    limitation: "Does not include merchant, customer, packet, or payment identifiers.",
  },
  {
    field: "relatedObjectiveId",
    sourcePath: "primaryActionRecord.primary_action.objective_id",
    operatorMeaning: "Explicit Objective mapping when supplied.",
    privacyClassification: "owner_private_stafford_media_fixture",
    authorityClassification: "Derived read model",
    transformationRule: "Copied only when supplied as a non-empty identifier.",
    limitation: "No title-based inference is performed.",
  },
  {
    field: "relatedDecisionId",
    sourcePath: "primaryActionRecord.primary_action.decision_id",
    operatorMeaning: "Explicit Decision mapping when supplied.",
    privacyClassification: "owner_private_stafford_media_fixture",
    authorityClassification: "Derived read model",
    transformationRule: "Copied only when supplied as a non-empty identifier.",
    limitation: "No historical Decision is rewritten.",
  },
];

export const PRIMARY_ACTION_EXCLUDED_FIELD_CLASSIFICATIONS = [
  "merchant_or_customer_identifier",
  "customer_contact",
  "store_domain",
  "payment_reference",
  "packet_or_checkout_identifier",
  "revenue_or_numeric_business_metric",
  "priority_or_confidence_score",
  "raw_notes_or_contact_content",
  "execution_or_mutation_instruction",
  "credential_or_secret",
  "provider_token",
  "rollback_command",
  "hidden_prompt",
  "generated_or_unverified_claim",
];

const HARD_FAIL_CLASSIFICATIONS = new Set([
  "credential_or_secret",
  "provider_token",
  "rollback_command",
  "execution_or_mutation_instruction",
  "hidden_prompt",
]);

const EXCLUDED_KEY_CLASSIFICATIONS: Array<{
  pattern: RegExp;
  classification: string;
}> = [
  { pattern: /(merchant|customer|client_id|merchant_id|owner|relationship)/i, classification: "merchant_or_customer_identifier" },
  { pattern: /(email|phone|contact|send_target|message_body)/i, classification: "customer_contact" },
  { pattern: /(domain|store|shop|myshopify|linked_units)/i, classification: "store_domain" },
  { pattern: /(payment|reservation|session)/i, classification: "payment_reference" },
  { pattern: /(packet|checkout)/i, classification: "packet_or_checkout_identifier" },
  { pattern: /(revenue|amount|price|gap|metric|score|priority_total|priority_score)/i, classification: "revenue_or_numeric_business_metric" },
  { pattern: /(confidence|confidence_band|urgency)/i, classification: "priority_or_confidence_score" },
  { pattern: /(note|raw|transcript|content)/i, classification: "raw_notes_or_contact_content" },
  { pattern: /(execute|mutation|command|queue|launch|route|api_path|script)/i, classification: "execution_or_mutation_instruction" },
  { pattern: /(secret|credential|password|private_key|api_key|oauth|auth_header)/i, classification: "credential_or_secret" },
  { pattern: /(token|provider_key)/i, classification: "provider_token" },
  { pattern: /(rollback)/i, classification: "rollback_command" },
  { pattern: /(prompt|system_instruction)/i, classification: "hidden_prompt" },
  { pattern: /(generated_placeholder|mock|unverified)/i, classification: "generated_or_unverified_claim" },
];

const SENSITIVE_VALUE_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/,
  /\b[a-z0-9-]+\.myshopify\.com\b/i,
  /\bhttps?:\/\//i,
  /\$\s?\d[\d,]*(?:\.\d+)?/,
  /\b(?:pkt|packet|pay|pi|cs|tok|sk|pk)_[a-z0-9_:-]+\b/i,
];

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "";
}

function validWorkspace(value: string): value is ChiefOfStaffWorkspaceId {
  return value === "stafford-media" || value === "professional" || value === "personal";
}

function nestedRecord(record: AnyRecord, key: string) {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function primaryActionRecordFrom(input: unknown) {
  if (!isRecord(input)) {
    return null;
  }

  const direct = nestedRecord(input, "primary_action");
  if (direct) {
    return direct;
  }

  const operatorActions = nestedRecord(input, "operator_actions");
  const nested = operatorActions ? nestedRecord(operatorActions, "primary_action") : null;
  if (nested) {
    return nested;
  }

  return input;
}

function stringFrom(record: AnyRecord, keys: string[]) {
  for (const key of keys) {
    const value = text(record[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

function productScopeFrom(record: AnyRecord) {
  const raw = [
    stringFrom(record, ["product_id", "product", "domain_id", "domain", "capabilityId", "related_capability"]),
  ].join(" ").toLowerCase();

  if (raw.includes("abando")) {
    return "abando";
  }

  if (raw.includes("shopifixer")) {
    return "shopifixer";
  }

  if (raw.includes("stafford")) {
    return "stafford-media";
  }

  return "stafford-media";
}

function sourceUpdatedAtFrom(input: PrimaryActionSourceAdapterInput, rootRecord: unknown) {
  if (input.sourceUpdatedAt !== undefined && input.sourceUpdatedAt !== null) {
    return text(input.sourceUpdatedAt) || null;
  }

  if (isRecord(rootRecord)) {
    return text(rootRecord.generated_at) || text(rootRecord.updated_at) || null;
  }

  return null;
}

function parseTime(value: string | null) {
  if (!value) {
    return null;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export function classifyPrimaryActionFreshness(
  sourceUpdatedAt: string | null,
  capturedAt: string,
): {
  freshness: ChiefOfStaffFreshness;
  limitation: string;
} {
  const sourceTime = parseTime(sourceUpdatedAt);
  const captureTime = parseTime(capturedAt);

  if (!sourceTime || !captureTime || sourceTime > captureTime) {
    return {
      freshness: "Unknown",
      limitation: "Freshness is unknown because timestamp authority is incomplete.",
    };
  }

  const ageMs = captureTime - sourceTime;
  const dayMs = 24 * 60 * 60 * 1000;

  if (ageMs <= dayMs) {
    return {
      freshness: "Current",
      limitation: "Freshness follows the S009.06 deterministic fixture policy.",
    };
  }

  if (ageMs <= 7 * dayMs) {
    return {
      freshness: "Recent",
      limitation: "Source is recent under the S009.06 deterministic fixture policy.",
    };
  }

  if (ageMs <= 90 * dayMs) {
    return {
      freshness: "Historical",
      limitation: "Source is historical under the S009.06 deterministic fixture policy.",
    };
  }

  return {
    freshness: "Stale",
    limitation: "Source is stale under the S009.06 deterministic fixture policy.",
  };
}

function collectExcludedClassifications(value: unknown, path = "primaryActionRecord") {
  const classifications = new Set<string>();
  const hardFailures = new Set<string>();

  function visit(item: unknown, currentPath: string) {
    if (Array.isArray(item)) {
      item.forEach((entry, index) => visit(entry, `${currentPath}[${index}]`));
      return;
    }

    if (!isRecord(item)) {
      return;
    }

    for (const [key, child] of Object.entries(item)) {
      const childPath = `${currentPath}.${key}`;
      for (const rule of EXCLUDED_KEY_CLASSIFICATIONS) {
        if (rule.pattern.test(key)) {
          classifications.add(rule.classification);
          if (HARD_FAIL_CLASSIFICATIONS.has(rule.classification)) {
            hardFailures.add(rule.classification);
          }
        }
      }
      visit(child, childPath);
    }
  }

  visit(value, path);

  return {
    classifications: Array.from(new Set([
      ...PRIMARY_ACTION_EXCLUDED_FIELD_CLASSIFICATIONS.filter((classification) =>
        classifications.has(classification),
      ),
    ])),
    hardFailures: Array.from(hardFailures),
  };
}

function containsProhibitedValue(value: string) {
  return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

function safeTextField(value: string, field: string) {
  if (!value) {
    return {
      ok: false as const,
      technicalDetail: `${field} is missing or empty.`,
    };
  }

  if (containsProhibitedValue(value)) {
    return {
      ok: false as const,
      technicalDetail: `${field} contains a prohibited value pattern.`,
    };
  }

  return {
    ok: true as const,
    value,
  };
}

function auditSummary(
  input: PrimaryActionSourceAdapterInput,
  overrides: Partial<PrimaryActionAuditSummary>,
): PrimaryActionAuditSummary {
  return {
    adapterExecutionId: text(input.adapterExecutionId),
    adapterId: PRIMARY_ACTION_SOURCE_ADAPTER_ID,
    workspaceId: text(input.requestWorkspaceId),
    permissionDecision: "missing",
    sourceReference: text(input.sourceReference),
    includedFields: [],
    excludedFieldClassifications: [],
    sourceUpdatedAt: null,
    capturedAt: text(input.capturedAt),
    freshness: "Unknown",
    conflictStatus: "No conflict disclosed",
    resultStatus: "FAILURE",
    failureCode: null,
    privacyClassification: text(input.privacyClassification),
    limitations: [],
    fallbackClassification: input.fallbackClassification || "UNKNOWN",
    testOnly: Boolean(input.permissionDecision?.testOnly),
    ...overrides,
  };
}

function failure(
  input: PrimaryActionSourceAdapterInput,
  failureCode: PrimaryActionSourceFailureCode,
  technicalDetail: string,
  overrides: Partial<PrimaryActionAuditSummary> = {},
  warnings: PrimaryActionSourceAdapterFailure["warnings"] = [],
): PrimaryActionSourceAdapterFailure {
  return {
    ok: false,
    resultStatus: "FAILURE",
    failureCode,
    operatorSafeMessage: PRIMARY_ACTION_SOURCE_FAILURE_MESSAGE,
    technicalDetail,
    auditSummary: auditSummary(input, {
      resultStatus: "FAILURE",
      failureCode,
      conflictStatus: failureCode.includes("CONFLICT") || failureCode === "SOURCE_AUTHORITY_AMBIGUOUS" ? "Blocked" : "No conflict disclosed",
      ...overrides,
    }),
    warnings,
  };
}

function compatibilitySourceFromSnapshot(snapshot: PrimaryActionSourceSnapshot): ChiefOfStaffSourceFixture {
  const supportedStatements = [
    `${snapshot.structuredFacts.operatorFacingTitle} is the current primary action.`,
    `The current primary action is ${snapshot.structuredFacts.operatorFacingTitle}.`,
    snapshot.structuredFacts.whyItMatters,
    snapshot.structuredFacts.expectedResult,
  ].filter(Boolean);

  return {
    sourceId: snapshot.sourceId,
    sourceType: "action",
    workspaceId: snapshot.workspaceId,
    authorityClassification: snapshot.authorityClassification,
    freshness: snapshot.freshness,
    privacyClassification: snapshot.privacyClassification,
    immutable: snapshot.immutable,
    title: snapshot.title,
    contentSummary: snapshot.contentSummary,
    exactSourceReference: snapshot.exactSourceReference,
    limitations: snapshot.limitations,
    availability: "available_now",
    supportedStatements,
    supportedClaimIds: ["claim-primary-action-current"],
  };
}

export function toChiefOfStaffSourceFixture(snapshot: PrimaryActionSourceSnapshot): ChiefOfStaffSourceFixture {
  return compatibilitySourceFromSnapshot(snapshot);
}

export function adaptPrimaryActionSource(input: PrimaryActionSourceAdapterInput): PrimaryActionSourceAdapterResult {
  const requestWorkspaceId = text(input.requestWorkspaceId);
  const sourceReference = text(input.sourceReference);
  const capturedAt = text(input.capturedAt);
  const authorityClassification = text(input.authorityClassification);
  const privacyClassification = text(input.privacyClassification);
  const permission = input.permissionDecision;
  const fallbackClassification = input.fallbackClassification || "UNKNOWN";
  const sourceUpdatedAt = sourceUpdatedAtFrom(input, input.primaryActionRecord);
  const freshness = classifyPrimaryActionFreshness(sourceUpdatedAt, capturedAt);
  const excluded = collectExcludedClassifications(input.primaryActionRecord);
  const baseAudit = {
    sourceUpdatedAt,
    capturedAt,
    freshness: freshness.freshness,
    privacyClassification,
    fallbackClassification,
    excludedFieldClassifications: excluded.classifications,
  };
  const warnings: PrimaryActionSourceAdapterSuccess["warnings"] = [];

  if (!requestWorkspaceId) {
    return failure(input, "WORKSPACE_AUTHORITY_MISSING", "requestWorkspaceId is missing.", baseAudit);
  }

  if (!validWorkspace(requestWorkspaceId)) {
    return failure(input, "WORKSPACE_NOT_ALLOWED", "requestWorkspaceId is not a recognized StaffordOS workspace.", baseAudit);
  }

  if (requestWorkspaceId !== "stafford-media") {
    return failure(input, "WORKSPACE_NOT_ALLOWED", "Only Stafford Media primary action fixtures are authorized in S009.06.", baseAudit);
  }

  if (!permission) {
    return failure(input, "PERMISSION_MISSING", "permissionDecision is missing.", {
      ...baseAudit,
      permissionDecision: "missing",
    });
  }

  if (!permission.allowed) {
    return failure(input, "PERMISSION_DENIED", "permissionDecision.allowed is false.", {
      ...baseAudit,
      permissionDecision: "denied",
      testOnly: Boolean(permission.testOnly),
    });
  }

  if (permission.workspaceId !== requestWorkspaceId) {
    return failure(input, "PERMISSION_WORKSPACE_MISMATCH", "permissionDecision.workspaceId does not match requestWorkspaceId.", {
      ...baseAudit,
      permissionDecision: "workspace_mismatch",
      testOnly: Boolean(permission.testOnly),
    });
  }

  if (!permission.testOnly || permission.decisionSource !== "s009_06_static_permission_fixture") {
    return failure(input, "PERMISSION_AUTHORITY_UNSUPPORTED", "Only the S009.06 static permission fixture is accepted in this library mission.", {
      ...baseAudit,
      permissionDecision: "unsupported_authority",
      testOnly: Boolean(permission.testOnly),
    });
  }

  if (!authorityClassification) {
    return failure(input, "SOURCE_AUTHORITY_MISSING", "authorityClassification is missing.", {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      testOnly: true,
    });
  }

  if (!sourceReference) {
    return failure(input, "PROVENANCE_MISSING", "sourceReference is missing.", {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      testOnly: true,
    });
  }

  if (!capturedAt) {
    return failure(input, "PROVENANCE_MISSING", "capturedAt is missing.", {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      testOnly: true,
    });
  }

  if (excluded.hardFailures.length > 0) {
    return failure(input, "PROHIBITED_FIELD_PRESENT", "The supplied record contains prohibited credential, prompt, rollback, or mutation fields.", {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      testOnly: true,
    });
  }

  if (fallbackClassification === "GENERATED_PLACEHOLDER" || fallbackClassification === "MOCK_DATA") {
    return failure(input, "GENERATED_FALLBACK_CONFLICT", "Generated or mock primary action data cannot become runtime truth.", {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      conflictStatus: "Blocked",
      testOnly: true,
    });
  }

  const conflicts = input.conflicts || [];
  const blockingConflict = conflicts.find((conflict) => conflict.severity === "blocking");
  if (blockingConflict) {
    return failure(input, blockingConflict.code, "A blocking source conflict prevents a trusted source snapshot.", {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      conflictStatus: "Blocked",
      testOnly: true,
    });
  }

  if (conflicts.length > 0) {
    warnings.push({
      code: "SOURCE_CONFLICT_DISCLOSED",
      operatorSafeMessage: "This source needs review because another source disagrees.",
      technicalDetail: "Non-blocking conflicts are preserved in conflictStatus.",
    });
  }

  if (freshness.freshness !== "Current") {
    warnings.push({
      code: "SOURCE_FRESHNESS_LIMITED",
      operatorSafeMessage: "Freshness is limited.",
      technicalDetail: `Freshness classified as ${freshness.freshness}.`,
    });
  }

  const primaryAction = primaryActionRecordFrom(input.primaryActionRecord);
  if (!primaryAction) {
    return failure(input, "SOURCE_MALFORMED", "primaryActionRecord is not an object with a primary action.", {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      testOnly: true,
    }, warnings);
  }

  const actionIdResult = safeTextField(stringFrom(primaryAction, ["action_id", "actionId", "id"]), "actionId");
  const titleResult = safeTextField(stringFrom(primaryAction, ["action_label", "title", "action", "next_step"]), "operatorFacingTitle");
  const summaryResult = safeTextField(stringFrom(primaryAction, ["summary", "next_step", "action_label", "title"]), "operatorFacingSummary");
  const whyResult = safeTextField(stringFrom(primaryAction, ["why_now", "reason", "whyItMatters"]), "whyItMatters");
  const expectedResultResult = safeTextField(stringFrom(primaryAction, ["expected_outcome", "expectedResult"]), "expectedResult");

  if (!actionIdResult.ok) {
    return failure(input, "SOURCE_MALFORMED", actionIdResult.technicalDetail, {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      testOnly: true,
    }, warnings);
  }

  if (!titleResult.ok) {
    return failure(input, "SOURCE_MALFORMED", titleResult.technicalDetail, {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      testOnly: true,
    }, warnings);
  }

  if (!summaryResult.ok) {
    return failure(input, "SOURCE_MALFORMED", summaryResult.technicalDetail, {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      testOnly: true,
    }, warnings);
  }

  if (!whyResult.ok) {
    return failure(input, "SOURCE_MALFORMED", whyResult.technicalDetail, {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      testOnly: true,
    }, warnings);
  }

  if (!expectedResultResult.ok) {
    return failure(input, "SOURCE_MALFORMED", expectedResultResult.technicalDetail, {
      ...baseAudit,
      permissionDecision: "allowed_test_fixture",
      testOnly: true,
    }, warnings);
  }

  const productScope = productScopeFrom(primaryAction);
  const structuredFacts: PrimaryActionStructuredFacts = {
    actionId: actionIdResult.value,
    operatorFacingTitle: titleResult.value,
    operatorFacingSummary: summaryResult.value,
    whyItMatters: whyResult.value,
    expectedResult: expectedResultResult.value,
    relatedCapability: stringFrom(primaryAction, ["related_capability", "capabilityId", "capability_id"]) || "start-my-day",
    relatedObjectiveId: stringFrom(primaryAction, ["objective_id", "objectiveId"]) || null,
    relatedDecisionId: stringFrom(primaryAction, ["decision_id", "decisionId"]) || null,
    productScope,
    sourceClassification: fallbackClassification === "NONE" ? "Runtime read model" : fallbackClassification,
    authorityClassification,
    availabilityClassification: "Available now as supplied read-model input",
    fallbackClassification,
  };

  const limitations = [
    "Derived from an explicitly supplied Primary Action read model input.",
    "Library-generated source snapshot only; not the original write authority.",
    "S009.06 uses a static test permission fixture and does not prove runtime authorization.",
    "Expected result is not an observed Outcome.",
    "The source snapshot does not approve, execute, verify, or complete the Action.",
    "No customer, merchant contact, payment, packet, revenue, score, credential, or command value is included.",
    freshness.limitation,
  ];

  if (fallbackClassification !== "NONE") {
    limitations.push(`Fallback classification: ${fallbackClassification}.`);
  }

  if (conflicts.length > 0) {
    limitations.push("Conflicting source information is preserved for operator review.");
  }

  const sourceSnapshot: PrimaryActionSourceSnapshot = {
    sourceId: `source-primary-action-${structuredFacts.actionId}`,
    sourceType: PRIMARY_ACTION_SOURCE_TYPE,
    workspaceId: "stafford-media",
    productScope,
    authorityClassification,
    freshness: freshness.freshness,
    privacyClassification,
    immutable: true,
    title: structuredFacts.operatorFacingTitle,
    contentSummary: `${structuredFacts.operatorFacingSummary} Expected result: ${structuredFacts.expectedResult}`,
    structuredFacts,
    exactSourceReference: sourceReference,
    sourceUpdatedAt,
    capturedAt,
    limitations,
    excludedFieldClassifications: excluded.classifications,
    conflictStatus: {
      status: conflicts.length > 0 ? "Needs review" : "No conflict disclosed",
      conflicts,
    },
    permissionRequirement: permission.requiredCapability,
    adapterId: PRIMARY_ACTION_SOURCE_ADAPTER_ID,
  };

  return {
    ok: true,
    resultStatus: "SUCCESS",
    sourceSnapshot,
    auditSummary: auditSummary(input, {
      resultStatus: "SUCCESS",
      failureCode: null,
      workspaceId: "stafford-media",
      permissionDecision: "allowed_test_fixture",
      sourceReference,
      includedFields: PRIMARY_ACTION_SAFE_FIELD_ALLOWLIST.map((field) => field.field),
      excludedFieldClassifications: excluded.classifications,
      sourceUpdatedAt,
      capturedAt,
      freshness: freshness.freshness,
      conflictStatus: conflicts.length > 0 ? "Needs review" : "No conflict disclosed",
      privacyClassification,
      limitations,
      fallbackClassification,
      testOnly: true,
    }),
    warnings,
  };
}

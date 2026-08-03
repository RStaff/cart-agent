import type { StaffordOsWorkspaceId } from "./workspaceRegistry";

export const SOURCE_SNAPSHOT_SCHEMA_VERSION = "staffordos.source_snapshot.v1";

export const DISPLAYED_DATA_SOURCE_TYPES = [
  "STATIC_REPOSITORY",
  "HISTORICAL_RECORD",
  "PRIVATE_LOCAL",
  "RUNTIME_READ_MODEL",
  "PROVIDER_CONFIRMED",
  "OPERATOR_CONFIRMED",
  "GENERATED_PROPOSAL",
  "PLANNED_PLACEHOLDER",
] as const;

export const SOURCE_STATICITY_VALUES = [
  "LIVE_RUNTIME",
  "CAPTURED_SNAPSHOT",
  "STATIC_REPOSITORY",
  "HISTORICAL",
  "GENERATED",
  "PLANNED",
] as const;

export const SOURCE_FRESHNESS_VALUES = [
  "CURRENT",
  "RECENT",
  "HISTORICAL",
  "STALE",
  "UNKNOWN",
] as const;

export const SOURCE_AUTHORIZATION_STATUS_VALUES = [
  "NOT_REQUIRED_FOR_PUBLIC_STATIC",
  "TEST_FIXTURE_ONLY",
  "PRESENTATION_ONLY_NOT_AUTHORIZED",
  "AUTHORIZED_BY_SERVER_POLICY",
  "AUTHORIZED_BY_PROVIDER",
  "OPERATOR_CONFIRMED",
  "AUTHORIZATION_UNKNOWN",
  "DENIED",
] as const;

export const SOURCE_CONFLICT_STATUS_VALUES = [
  "NO_CONFLICT",
  "CONFLICT_DISCLOSED",
  "CONFLICT_REQUIRES_REVIEW",
  "BLOCKING_CONFLICT",
  "UNKNOWN",
] as const;

export type DisplayedDataSourceType = (typeof DISPLAYED_DATA_SOURCE_TYPES)[number];
export type SourceStaticity = (typeof SOURCE_STATICITY_VALUES)[number];
export type SourceFreshness = (typeof SOURCE_FRESHNESS_VALUES)[number];
export type SourceAuthorizationStatus = (typeof SOURCE_AUTHORIZATION_STATUS_VALUES)[number];
export type SourceConflictStatus = (typeof SOURCE_CONFLICT_STATUS_VALUES)[number];

export type SourceSnapshot = {
  snapshotId: string;
  workspaceId: StaffordOsWorkspaceId;
  sourceType: DisplayedDataSourceType;
  sourceReference: string;
  sourceAuthority: string;
  privacyClassification: string;
  capturedAt: string | null;
  observedAt: string | null;
  sourceUpdatedAt: string | null;
  freshness: SourceFreshness;
  staticity: SourceStaticity;
  authorizationStatus: SourceAuthorizationStatus;
  conflictStatus: SourceConflictStatus;
  includedFields: readonly string[];
  excludedFields: readonly string[];
  limitations: readonly string[];
  contentDigest: string | null;
  adapterId: string | null;
  schemaVersion: typeof SOURCE_SNAPSHOT_SCHEMA_VERSION;
  testOnly: boolean;
};

export type SourceSnapshotValidationErrorCode =
  | "SNAPSHOT_ID_REQUIRED"
  | "WORKSPACE_REQUIRED"
  | "SOURCE_TYPE_UNSUPPORTED"
  | "SOURCE_REFERENCE_REQUIRED"
  | "SOURCE_AUTHORITY_REQUIRED"
  | "PRIVACY_CLASSIFICATION_REQUIRED"
  | "TIMESTAMP_OR_UNKNOWN_DATE_LIMITATION_REQUIRED"
  | "TIMESTAMP_INVALID"
  | "FRESHNESS_UNSUPPORTED"
  | "STATICITY_UNSUPPORTED"
  | "AUTHORIZATION_STATUS_UNSUPPORTED"
  | "CONFLICT_STATUS_UNSUPPORTED"
  | "FIELDS_MUST_BE_ARRAYS"
  | "LIMITATION_REQUIRED"
  | "CONTENT_DIGEST_OR_LIMITATION_REQUIRED"
  | "STATIC_REPOSITORY_STATICITY_REQUIRED"
  | "HISTORICAL_STATICITY_REQUIRED"
  | "PLANNED_STATICITY_REQUIRED"
  | "GENERATED_STATICITY_REQUIRED"
  | "PRIVATE_AUTHORIZATION_REQUIRED"
  | "RUNTIME_AUTHORIZATION_REQUIRED"
  | "PROVIDER_AUTHORIZATION_REQUIRED"
  | "GENERATED_SOURCE_AUTHORITY_OVERSTATED";

export type SourceSnapshotValidationError = {
  code: SourceSnapshotValidationErrorCode;
  path: string;
  message: string;
};

export type SourceSnapshotValidationResult = {
  valid: boolean;
  errors: SourceSnapshotValidationError[];
};

export type SourceSnapshotCreateResult = SourceSnapshotValidationResult & {
  snapshot: Readonly<SourceSnapshot> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const normalized = text(value);
  return normalized ? normalized : null;
}

function isAllowed<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

function hasUnknownDateLimitation(limitations: readonly string[]) {
  return limitations.some((limitation) => /date unknown|timestamp unknown|source date unknown/i.test(limitation));
}

function isIsoLikeTimestamp(value: string) {
  return !Number.isNaN(Date.parse(value));
}

function timestampError(path: string, value: string | null, errors: SourceSnapshotValidationError[]) {
  if (value && !isIsoLikeTimestamp(value)) {
    errors.push({
      code: "TIMESTAMP_INVALID",
      path,
      message: "Timestamp values must be parseable dates when supplied.",
    });
  }
}

function addError(
  errors: SourceSnapshotValidationError[],
  code: SourceSnapshotValidationErrorCode,
  path: string,
  message: string,
) {
  errors.push({ code, path, message });
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : null;
}

export function normalizeSourceSnapshot(input: unknown): SourceSnapshot | null {
  if (!isRecord(input)) return null;

  const includedFields = normalizeStringArray(input.includedFields);
  const excludedFields = normalizeStringArray(input.excludedFields);
  const limitations = normalizeStringArray(input.limitations);

  return {
    snapshotId: text(input.snapshotId),
    workspaceId: text(input.workspaceId) as StaffordOsWorkspaceId,
    sourceType: text(input.sourceType) as DisplayedDataSourceType,
    sourceReference: text(input.sourceReference),
    sourceAuthority: text(input.sourceAuthority),
    privacyClassification: text(input.privacyClassification),
    capturedAt: optionalText(input.capturedAt),
    observedAt: optionalText(input.observedAt),
    sourceUpdatedAt: optionalText(input.sourceUpdatedAt),
    freshness: text(input.freshness) as SourceFreshness,
    staticity: text(input.staticity) as SourceStaticity,
    authorizationStatus: text(input.authorizationStatus) as SourceAuthorizationStatus,
    conflictStatus: text(input.conflictStatus) as SourceConflictStatus,
    includedFields: includedFields || [],
    excludedFields: excludedFields || [],
    limitations: limitations || [],
    contentDigest: optionalText(input.contentDigest),
    adapterId: optionalText(input.adapterId),
    schemaVersion: SOURCE_SNAPSHOT_SCHEMA_VERSION,
    testOnly: input.testOnly === true,
  };
}

export function validateSourceSnapshot(input: unknown): SourceSnapshotValidationResult {
  const snapshot = normalizeSourceSnapshot(input);
  const errors: SourceSnapshotValidationError[] = [];

  if (!snapshot) {
    addError(errors, "SNAPSHOT_ID_REQUIRED", "snapshot", "Source snapshot must be an object.");
    return { valid: false, errors };
  }

  if (!snapshot.snapshotId) addError(errors, "SNAPSHOT_ID_REQUIRED", "snapshotId", "Snapshot ID is required.");
  if (!snapshot.workspaceId) addError(errors, "WORKSPACE_REQUIRED", "workspaceId", "Workspace scope is required.");
  if (!isAllowed(snapshot.sourceType, DISPLAYED_DATA_SOURCE_TYPES)) {
    addError(errors, "SOURCE_TYPE_UNSUPPORTED", "sourceType", "Source type is not supported.");
  }
  if (!snapshot.sourceReference) {
    addError(errors, "SOURCE_REFERENCE_REQUIRED", "sourceReference", "Source reference is required.");
  }
  if (!snapshot.sourceAuthority) {
    addError(errors, "SOURCE_AUTHORITY_REQUIRED", "sourceAuthority", "Source authority is required.");
  }
  if (!snapshot.privacyClassification) {
    addError(errors, "PRIVACY_CLASSIFICATION_REQUIRED", "privacyClassification", "Privacy classification is required.");
  }
  if (!isAllowed(snapshot.freshness, SOURCE_FRESHNESS_VALUES)) {
    addError(errors, "FRESHNESS_UNSUPPORTED", "freshness", "Freshness value is not supported.");
  }
  if (!isAllowed(snapshot.staticity, SOURCE_STATICITY_VALUES)) {
    addError(errors, "STATICITY_UNSUPPORTED", "staticity", "Staticity value is not supported.");
  }
  if (!isAllowed(snapshot.authorizationStatus, SOURCE_AUTHORIZATION_STATUS_VALUES)) {
    addError(errors, "AUTHORIZATION_STATUS_UNSUPPORTED", "authorizationStatus", "Authorization status is not supported.");
  }
  if (!isAllowed(snapshot.conflictStatus, SOURCE_CONFLICT_STATUS_VALUES)) {
    addError(errors, "CONFLICT_STATUS_UNSUPPORTED", "conflictStatus", "Conflict status is not supported.");
  }

  if (!Array.isArray((input as Record<string, unknown>).includedFields) || !Array.isArray((input as Record<string, unknown>).excludedFields)) {
    addError(errors, "FIELDS_MUST_BE_ARRAYS", "includedFields", "Included and excluded fields must be arrays.");
  }
  if (!snapshot.limitations.length) addError(errors, "LIMITATION_REQUIRED", "limitations", "At least one limitation is required.");

  if (!snapshot.capturedAt && !snapshot.observedAt && !snapshot.sourceUpdatedAt && !hasUnknownDateLimitation(snapshot.limitations)) {
    addError(
      errors,
      "TIMESTAMP_OR_UNKNOWN_DATE_LIMITATION_REQUIRED",
      "capturedAt",
      "A timestamp or explicit unknown-date limitation is required.",
    );
  }
  timestampError("capturedAt", snapshot.capturedAt, errors);
  timestampError("observedAt", snapshot.observedAt, errors);
  timestampError("sourceUpdatedAt", snapshot.sourceUpdatedAt, errors);

  if (!snapshot.contentDigest && !snapshot.limitations.some((limitation) => /digest unavailable|no content digest/i.test(limitation))) {
    addError(
      errors,
      "CONTENT_DIGEST_OR_LIMITATION_REQUIRED",
      "contentDigest",
      "Content digest is required unless a digest limitation is disclosed.",
    );
  }

  if (snapshot.sourceType === "STATIC_REPOSITORY" && snapshot.staticity !== "STATIC_REPOSITORY") {
    addError(errors, "STATIC_REPOSITORY_STATICITY_REQUIRED", "staticity", "Static repository sources must be labeled static.");
  }
  if (snapshot.sourceType === "HISTORICAL_RECORD" && snapshot.staticity !== "HISTORICAL") {
    addError(errors, "HISTORICAL_STATICITY_REQUIRED", "staticity", "Historical records must be labeled historical.");
  }
  if (snapshot.sourceType === "PLANNED_PLACEHOLDER" && snapshot.staticity !== "PLANNED") {
    addError(errors, "PLANNED_STATICITY_REQUIRED", "staticity", "Planned placeholders must be labeled planned.");
  }
  if (snapshot.sourceType === "GENERATED_PROPOSAL" && snapshot.staticity !== "GENERATED") {
    addError(errors, "GENERATED_STATICITY_REQUIRED", "staticity", "Generated proposals must be labeled generated.");
  }

  const unsafePrivateAuthorization = ["AUTHORIZATION_UNKNOWN", "PRESENTATION_ONLY_NOT_AUTHORIZED", "DENIED"];
  if (snapshot.sourceType === "PRIVATE_LOCAL" && unsafePrivateAuthorization.includes(snapshot.authorizationStatus)) {
    addError(errors, "PRIVATE_AUTHORIZATION_REQUIRED", "authorizationStatus", "Private local sources require server or operator authorization before display.");
  }
  if (snapshot.sourceType === "RUNTIME_READ_MODEL" && unsafePrivateAuthorization.includes(snapshot.authorizationStatus)) {
    addError(errors, "RUNTIME_AUTHORIZATION_REQUIRED", "authorizationStatus", "Runtime read models require authorization before display.");
  }
  if (snapshot.sourceType === "PROVIDER_CONFIRMED" && ["AUTHORIZATION_UNKNOWN", "DENIED"].includes(snapshot.authorizationStatus)) {
    addError(errors, "PROVIDER_AUTHORIZATION_REQUIRED", "authorizationStatus", "Provider-confirmed sources require provider or server authorization.");
  }

  if (snapshot.sourceType === "GENERATED_PROPOSAL" && /verified|official|source truth|canonical truth/i.test(snapshot.sourceAuthority)) {
    addError(
      errors,
      "GENERATED_SOURCE_AUTHORITY_OVERSTATED",
      "sourceAuthority",
      "Generated proposals cannot claim source authority.",
    );
  }

  return { valid: errors.length === 0, errors };
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      if (nestedValue && typeof nestedValue === "object") deepFreeze(nestedValue);
    }
  }
  return value as Readonly<T>;
}

export function createSourceSnapshot(input: unknown): SourceSnapshotCreateResult {
  const validation = validateSourceSnapshot(input);
  const snapshot = validation.valid ? normalizeSourceSnapshot(input) : null;

  return {
    ...validation,
    snapshot: snapshot ? deepFreeze(snapshot) : null,
  };
}

export function sourceSnapshotDisplayLabel(
  snapshot: Pick<SourceSnapshot, "staticity" | "capturedAt" | "observedAt" | "sourceUpdatedAt">,
) {
  const date = snapshot.sourceUpdatedAt || snapshot.observedAt || snapshot.capturedAt || null;
  if (snapshot.staticity === "LIVE_RUNTIME") return date ? `Live information as of ${date}` : "Live information, date unknown";
  if (snapshot.staticity === "CAPTURED_SNAPSHOT") return date ? `Captured snapshot from ${date}` : "Captured snapshot, date unknown";
  if (snapshot.staticity === "STATIC_REPOSITORY") return date ? `Static reference as of ${date}` : "Static reference, date unknown";
  if (snapshot.staticity === "HISTORICAL") return date ? `Historical record as of ${date}` : "Historical record, date unknown";
  if (snapshot.staticity === "GENERATED") return date ? `Generated proposal from ${date}` : "Generated proposal, date unknown";
  return "Planned, not connected yet";
}

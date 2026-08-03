import type { StaffordOsWorkspaceId } from "./workspaceRegistry";
import {
  SOURCE_AUTHORIZATION_STATUS_VALUES,
  SOURCE_CONFLICT_STATUS_VALUES,
  SOURCE_FRESHNESS_VALUES,
  SOURCE_STATICITY_VALUES,
  validateSourceSnapshot,
  type SourceAuthorizationStatus,
  type SourceConflictStatus,
  type SourceFreshness,
  type SourceSnapshot,
  type SourceStaticity,
} from "./sourceSnapshot";

export const READ_MODEL_ENVELOPE_SCHEMA_VERSION = "staffordos.read_model_envelope.v1";

export const READ_MODEL_EMPTY_STATE_REASONS = [
  "NO_RECORDS",
  "SOURCE_UNAVAILABLE",
  "UNAUTHORIZED",
  "NOT_CONNECTED",
  "VALIDATION_FAILED",
  "PLANNED",
] as const;

export const JOB_OPPORTUNITY_ADAPTER_READINESS_STATUSES = [
  "READY_FOR_STATIC_ADAPTER_CONTRACT",
  "BLOCKED_ON_SERVER_AUTHORIZATION",
  "BLOCKED_ON_IDENTITY",
  "BLOCKED_ON_SAFE_SERVER_BOUNDARY",
  "READY_FOR_PRIVATE_UI_CONNECTION",
] as const;

export const JOB_OPPORTUNITY_ADAPTER_READINESS = {
  status: "BLOCKED_ON_SERVER_AUTHORIZATION",
  futurePath: [
    "PRIVATE JOB INTAKE FILE",
    "PRIVATE NORMALIZED OPPORTUNITY",
    "SERVER-SIDE PRIVATE SOURCE ADAPTER",
    "SOURCE SNAPSHOT",
    "REDACTED OPPORTUNITY QUEUE READ MODEL",
    "JOB COMMAND",
  ],
  requiredProtections: [
    "server-only private file read",
    "explicit Professional workspace scope",
    "trusted server-side identity",
    "server-side permission check",
    "owner-private classification",
    "redacted queue fields only",
    "source freshness and as-of disclosure",
    "no client filesystem access",
    "no /operator loader reuse",
  ],
  limitations: [
    "Private opportunity intake exists, but no StaffordOS-wide identity or server authorization gate exists yet.",
    "The Job Command must remain disconnected from real private opportunities until that gate exists.",
  ],
} as const;

export type ReadModelEmptyStateReason = (typeof READ_MODEL_EMPTY_STATE_REASONS)[number];
export type JobOpportunityAdapterReadinessStatus = (typeof JOB_OPPORTUNITY_ADAPTER_READINESS_STATUSES)[number];

export type ReadModelEnvelope<TRecord = unknown> = {
  readModelId: string;
  workspaceId: StaffordOsWorkspaceId;
  modelType: string;
  records: readonly TRecord[];
  sourceSnapshotIds: readonly string[];
  assembledAt: string;
  asOf: string | null;
  freshness: SourceFreshness;
  staticity: SourceStaticity;
  authoritySummary: string;
  authorizationStatus: SourceAuthorizationStatus;
  conflictStatus: SourceConflictStatus;
  limitations: readonly string[];
  emptyStateReason: ReadModelEmptyStateReason | null;
  adapterId: string | null;
  schemaVersion: typeof READ_MODEL_ENVELOPE_SCHEMA_VERSION;
  testOnly: boolean;
};

export type ReadModelEnvelopeValidationErrorCode =
  | "READ_MODEL_ID_REQUIRED"
  | "WORKSPACE_REQUIRED"
  | "MODEL_TYPE_REQUIRED"
  | "RECORDS_MUST_BE_ARRAY"
  | "SOURCE_SNAPSHOT_IDS_MUST_BE_ARRAY"
  | "SOURCE_SNAPSHOT_NOT_FOUND"
  | "SOURCE_SNAPSHOT_INVALID"
  | "ASSEMBLED_AT_REQUIRED"
  | "TIMESTAMP_INVALID"
  | "AS_OF_REQUIRED"
  | "ASSEMBLED_AT_USED_AS_AS_OF"
  | "FRESHNESS_UNSUPPORTED"
  | "STATICITY_UNSUPPORTED"
  | "AUTHORIZATION_STATUS_UNSUPPORTED"
  | "CONFLICT_STATUS_UNSUPPORTED"
  | "LIMITATION_REQUIRED"
  | "EMPTY_STATE_REASON_REQUIRED"
  | "EMPTY_STATE_REASON_UNSUPPORTED"
  | "PRIVATE_AUTHORIZATION_REQUIRED"
  | "RUNTIME_AUTHORIZATION_REQUIRED"
  | "DENIED_AUTHORIZATION_HAS_RECORDS"
  | "BLOCKING_CONFLICT_HAS_RECORDS"
  | "BLOCKING_CONFLICT_NOT_DISCLOSED"
  | "NON_BLOCKING_CONFLICT_NOT_DISCLOSED"
  | "STATIC_SOURCE_CLAIMS_LIVE"
  | "PLANNED_MODEL_HAS_RECORDS"
  | "GENERATED_AUTHORITY_OVERSTATED"
  | "PROVIDER_DETAIL_LEAK";

export type ReadModelEnvelopeValidationError = {
  code: ReadModelEnvelopeValidationErrorCode;
  path: string;
  message: string;
};

export type ReadModelEnvelopeValidationResult = {
  valid: boolean;
  errors: ReadModelEnvelopeValidationError[];
};

export type ReadModelEnvelopeCreateResult<TRecord = unknown> = ReadModelEnvelopeValidationResult & {
  envelope: Readonly<ReadModelEnvelope<TRecord>> | null;
};

const UNSAFE_PRIVATE_AUTHORIZATION: SourceAuthorizationStatus[] = [
  "AUTHORIZATION_UNKNOWN",
  "PRESENTATION_ONLY_NOT_AUTHORIZED",
  "DENIED",
];

const PROVIDER_SPECIFIC_ENVELOPE_KEYS = [
  "providerName",
  "providerPayload",
  "providerSpecificMetadata",
  "externalProviderPayload",
  "rawProviderResponse",
] as const;

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

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : null;
}

function isAllowed<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

function addError(
  errors: ReadModelEnvelopeValidationError[],
  code: ReadModelEnvelopeValidationErrorCode,
  path: string,
  message: string,
) {
  errors.push({ code, path, message });
}

function isIsoLikeTimestamp(value: string) {
  return !Number.isNaN(Date.parse(value));
}

function timestampError(path: string, value: string | null, errors: ReadModelEnvelopeValidationError[]) {
  if (value && !isIsoLikeTimestamp(value)) {
    addError(errors, "TIMESTAMP_INVALID", path, "Timestamp values must be parseable dates when supplied.");
  }
}

function hasUnknownDateLimitation(limitations: readonly string[]) {
  return limitations.some((limitation) => /date unknown|timestamp unknown|source date unknown|as-of unknown/i.test(limitation));
}

function requiresAsOf(staticity: SourceStaticity) {
  return ["CAPTURED_SNAPSHOT", "STATIC_REPOSITORY", "HISTORICAL"].includes(staticity);
}

function hasNonBlockingConflict(snapshot: SourceSnapshot) {
  return ["CONFLICT_DISCLOSED", "CONFLICT_REQUIRES_REVIEW"].includes(snapshot.conflictStatus);
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

export function normalizeReadModelEnvelope<TRecord = unknown>(input: unknown): ReadModelEnvelope<TRecord> | null {
  if (!isRecord(input)) return null;

  const sourceSnapshotIds = stringArray(input.sourceSnapshotIds);
  const limitations = stringArray(input.limitations);

  return {
    readModelId: text(input.readModelId),
    workspaceId: text(input.workspaceId) as StaffordOsWorkspaceId,
    modelType: text(input.modelType),
    records: Array.isArray(input.records) ? ([...input.records] as TRecord[]) : [],
    sourceSnapshotIds: sourceSnapshotIds || [],
    assembledAt: text(input.assembledAt),
    asOf: optionalText(input.asOf),
    freshness: text(input.freshness) as SourceFreshness,
    staticity: text(input.staticity) as SourceStaticity,
    authoritySummary: text(input.authoritySummary),
    authorizationStatus: text(input.authorizationStatus) as SourceAuthorizationStatus,
    conflictStatus: text(input.conflictStatus) as SourceConflictStatus,
    limitations: limitations || [],
    emptyStateReason: optionalText(input.emptyStateReason) as ReadModelEmptyStateReason | null,
    adapterId: optionalText(input.adapterId),
    schemaVersion: READ_MODEL_ENVELOPE_SCHEMA_VERSION,
    testOnly: input.testOnly === true,
  };
}

export function validateReadModelEnvelope(
  input: unknown,
  sourceSnapshots: readonly SourceSnapshot[] = [],
): ReadModelEnvelopeValidationResult {
  const envelope = normalizeReadModelEnvelope(input);
  const errors: ReadModelEnvelopeValidationError[] = [];

  if (!envelope || !isRecord(input)) {
    addError(errors, "READ_MODEL_ID_REQUIRED", "readModel", "Read-model envelope must be an object.");
    return { valid: false, errors };
  }

  if (!envelope.readModelId) addError(errors, "READ_MODEL_ID_REQUIRED", "readModelId", "Read-model ID is required.");
  if (!envelope.workspaceId) addError(errors, "WORKSPACE_REQUIRED", "workspaceId", "Workspace scope is required.");
  if (!envelope.modelType) addError(errors, "MODEL_TYPE_REQUIRED", "modelType", "Model type is required.");
  if (!Array.isArray(input.records)) addError(errors, "RECORDS_MUST_BE_ARRAY", "records", "Records must be an array.");
  if (!Array.isArray(input.sourceSnapshotIds)) {
    addError(errors, "SOURCE_SNAPSHOT_IDS_MUST_BE_ARRAY", "sourceSnapshotIds", "Source snapshot IDs must be an array.");
  }
  if (!envelope.assembledAt) addError(errors, "ASSEMBLED_AT_REQUIRED", "assembledAt", "Assembly timestamp is required.");
  timestampError("assembledAt", envelope.assembledAt || null, errors);
  timestampError("asOf", envelope.asOf, errors);

  if (!isAllowed(envelope.freshness, SOURCE_FRESHNESS_VALUES)) {
    addError(errors, "FRESHNESS_UNSUPPORTED", "freshness", "Freshness value is not supported.");
  }
  if (!isAllowed(envelope.staticity, SOURCE_STATICITY_VALUES)) {
    addError(errors, "STATICITY_UNSUPPORTED", "staticity", "Staticity value is not supported.");
  }
  if (!isAllowed(envelope.authorizationStatus, SOURCE_AUTHORIZATION_STATUS_VALUES)) {
    addError(errors, "AUTHORIZATION_STATUS_UNSUPPORTED", "authorizationStatus", "Authorization status is not supported.");
  }
  if (!isAllowed(envelope.conflictStatus, SOURCE_CONFLICT_STATUS_VALUES)) {
    addError(errors, "CONFLICT_STATUS_UNSUPPORTED", "conflictStatus", "Conflict status is not supported.");
  }
  if (!envelope.limitations.length) addError(errors, "LIMITATION_REQUIRED", "limitations", "At least one limitation is required.");
  if (!envelope.records.length && !envelope.emptyStateReason) {
    addError(errors, "EMPTY_STATE_REASON_REQUIRED", "emptyStateReason", "Empty read models must explain why no records are shown.");
  }
  if (envelope.emptyStateReason && !isAllowed(envelope.emptyStateReason, READ_MODEL_EMPTY_STATE_REASONS)) {
    addError(errors, "EMPTY_STATE_REASON_UNSUPPORTED", "emptyStateReason", "Empty-state reason is not supported.");
  }

  if (requiresAsOf(envelope.staticity) && !envelope.asOf && !hasUnknownDateLimitation(envelope.limitations)) {
    addError(errors, "AS_OF_REQUIRED", "asOf", "Static, captured, and historical models require as-of data or an unknown-date limitation.");
  }
  if (requiresAsOf(envelope.staticity) && envelope.asOf && envelope.asOf === envelope.assembledAt) {
    addError(errors, "ASSEMBLED_AT_USED_AS_AS_OF", "asOf", "Assembly time cannot substitute for source freshness.");
  }

  if (envelope.authorizationStatus === "DENIED" && envelope.records.length) {
    addError(errors, "DENIED_AUTHORIZATION_HAS_RECORDS", "records", "Denied authorization must not return records.");
  }
  if (envelope.conflictStatus === "BLOCKING_CONFLICT" && envelope.records.length) {
    addError(errors, "BLOCKING_CONFLICT_HAS_RECORDS", "records", "Blocking conflicts must not return trusted records.");
  }
  if (envelope.staticity === "PLANNED" && envelope.records.length) {
    addError(errors, "PLANNED_MODEL_HAS_RECORDS", "records", "Planned placeholders must not contain live records.");
  }
  if (envelope.staticity === "GENERATED" && /verified|official|source truth|canonical truth/i.test(envelope.authoritySummary)) {
    addError(errors, "GENERATED_AUTHORITY_OVERSTATED", "authoritySummary", "Generated proposals cannot claim source authority.");
  }

  for (const key of PROVIDER_SPECIFIC_ENVELOPE_KEYS) {
    if (key in input) {
      addError(errors, "PROVIDER_DETAIL_LEAK", key, "Provider-specific fields must stay behind the adapter boundary.");
    }
  }

  const snapshotsById = new Map(sourceSnapshots.map((snapshot) => [snapshot.snapshotId, snapshot]));
  for (const snapshot of sourceSnapshots) {
    const snapshotValidation = validateSourceSnapshot(snapshot);
    if (!snapshotValidation.valid) {
      addError(errors, "SOURCE_SNAPSHOT_INVALID", "sourceSnapshots", "Source snapshots must be valid before envelope assembly.");
    }
  }
  for (const snapshotId of envelope.sourceSnapshotIds) {
    if (sourceSnapshots.length && !snapshotsById.has(snapshotId)) {
      addError(errors, "SOURCE_SNAPSHOT_NOT_FOUND", "sourceSnapshotIds", "Every referenced source snapshot must be supplied.");
    }
  }

  const includedSnapshots = envelope.sourceSnapshotIds
    .map((snapshotId) => snapshotsById.get(snapshotId))
    .filter((snapshot): snapshot is SourceSnapshot => Boolean(snapshot));
  const relevantSnapshots = includedSnapshots.length ? includedSnapshots : sourceSnapshots;

  for (const snapshot of relevantSnapshots) {
    if (snapshot.workspaceId !== envelope.workspaceId) {
      addError(errors, "WORKSPACE_REQUIRED", "workspaceId", "Source snapshot workspace must match the envelope workspace.");
    }
    if (snapshot.staticity === "STATIC_REPOSITORY" && envelope.staticity === "LIVE_RUNTIME") {
      addError(errors, "STATIC_SOURCE_CLAIMS_LIVE", "staticity", "Static repository sources cannot produce live read models.");
    }
    if (["PRIVATE_LOCAL", "RUNTIME_READ_MODEL"].includes(snapshot.sourceType) && UNSAFE_PRIVATE_AUTHORIZATION.includes(snapshot.authorizationStatus)) {
      addError(errors, "PRIVATE_AUTHORIZATION_REQUIRED", "authorizationStatus", "Private or runtime sources require authorization before display.");
    }
    if (snapshot.sourceType === "RUNTIME_READ_MODEL" && UNSAFE_PRIVATE_AUTHORIZATION.includes(envelope.authorizationStatus)) {
      addError(errors, "RUNTIME_AUTHORIZATION_REQUIRED", "authorizationStatus", "Runtime read models require server authorization.");
    }
    if (snapshot.conflictStatus === "BLOCKING_CONFLICT" && envelope.conflictStatus !== "BLOCKING_CONFLICT") {
      addError(errors, "BLOCKING_CONFLICT_NOT_DISCLOSED", "conflictStatus", "Blocking source conflicts must be disclosed by the envelope.");
    }
    if (hasNonBlockingConflict(snapshot) && envelope.conflictStatus === "NO_CONFLICT") {
      addError(errors, "NON_BLOCKING_CONFLICT_NOT_DISCLOSED", "conflictStatus", "Non-blocking source conflicts must remain disclosed.");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function createReadModelEnvelope<TRecord = unknown>(
  input: unknown,
  sourceSnapshots: readonly SourceSnapshot[] = [],
): ReadModelEnvelopeCreateResult<TRecord> {
  const validation = validateReadModelEnvelope(input, sourceSnapshots);
  const envelope = validation.valid ? normalizeReadModelEnvelope<TRecord>(input) : null;

  return {
    ...validation,
    envelope: envelope ? deepFreeze(envelope) : null,
  };
}

export function readModelStaticityLabel(envelope: Pick<ReadModelEnvelope, "staticity" | "asOf">) {
  const suffix = envelope.asOf ? ` as of ${envelope.asOf}` : ", date unknown";
  if (envelope.staticity === "LIVE_RUNTIME") return `Live information${suffix}`;
  if (envelope.staticity === "CAPTURED_SNAPSHOT") return `Captured snapshot${suffix}`;
  if (envelope.staticity === "STATIC_REPOSITORY") return `Static reference${suffix}`;
  if (envelope.staticity === "HISTORICAL") return `Historical record${suffix}`;
  if (envelope.staticity === "GENERATED") return `Generated proposal${suffix}`;
  return "Planned, not connected yet";
}

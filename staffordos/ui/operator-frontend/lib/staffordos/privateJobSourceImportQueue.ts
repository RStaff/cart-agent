import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import {
  buildJobDiscoveryPrioritizationResult,
  createMockJobDiscoveryProviderAdapter,
  type PrivateOpportunityQueueResult,
} from "./jobDiscoveryPrioritization";
import type { PrivateApplicationRecord } from "./manualApplicationEventTracking";
import {
  PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION,
  normalizePrivateJobOpportunityIntake,
  writePrivateNormalizedJobOpportunity,
  type PrivateJobOpportunityIntakeRecord,
  type PrivateNormalizedJobOpportunity,
} from "./privateJobOpportunityIntake";
import {
  createSourceSnapshot,
  SOURCE_SNAPSHOT_SCHEMA_VERSION,
  type SourceSnapshot,
} from "./sourceSnapshot";

export const PRIVATE_JOB_SOURCE_IMPORT_QUEUE_VERSION = "J002.02";
export const PRIVATE_JOB_SOURCE_RECORD_SCHEMA_VERSION =
  "staffordos.job_search.private_job_source_record.v1";
export const PRIVATE_JOB_SOURCE_IMPORT_QUEUE_SCHEMA_VERSION =
  "staffordos.job_search.private_job_source_import_queue.v1";
export const PRIVATE_JOB_SOURCE_IMPORT_DECISION_SCHEMA_VERSION =
  "staffordos.job_search.private_job_source_import_decision.v1";

export const JOB_SOURCE_ACCESS_MODES = [
  "PUBLIC_API",
  "PUBLIC_FEED",
  "PUBLIC_PAGE",
  "OPERATOR_PASTED_URL",
  "OPERATOR_PASTED_TEXT",
  "OPERATOR_IMPORTED_JSON",
  "OPERATOR_IMPORTED_FILE",
  "UNSUPPORTED_AUTHENTICATED_SOURCE",
] as const;

export const JOB_SOURCE_PROVIDER_TYPES = [
  "GREENHOUSE",
  "LEVER",
  "ASHBY",
  "WORKDAY",
  "LINKEDIN",
  "INDEED",
  "EMPLOYER_CAREER_SITE",
  "OTHER",
] as const;

export const JOB_SOURCE_ADAPTER_CONNECTION_STATUSES = [
  "NOT_CONNECTED",
  "PUBLIC_IMPORT_ONLY",
  "OPERATOR_INPUT_ONLY",
  "AUTHENTICATED_ACCESS_NOT_CONNECTED",
] as const;

export const JOB_SOURCE_IMPORT_QUEUE_STATES = [
  "DISCOVERED",
  "NORMALIZED",
  "DUPLICATE",
  "EXISTING_APPLICATION",
  "NEEDS_OPERATOR_REVIEW",
  "READY_FOR_OPPORTUNITY_IMPORT",
  "REJECTED_BY_OPERATOR",
  "IMPORTED",
  "STALE",
  "INVALID",
] as const;

export const JOB_SOURCE_DUPLICATE_RESULTS = [
  "NEW",
  "POSSIBLE_DUPLICATE",
  "CONFIRMED_DUPLICATE",
  "EXISTING_APPLICATION",
  "REAPPLICATION_CANDIDATE",
  "NEEDS_OPERATOR_REVIEW",
] as const;

export const JOB_SOURCE_IMPORT_DECISION_TYPES = [
  "APPROVE_IMPORT_OPPORTUNITY",
  "REJECT",
  "DEFER",
  "INSPECT_SUMMARY",
  "STOP",
] as const;

export const JOB_SOURCE_READ_METHODS = [
  "normalize",
  "validate",
  "buildSourceSnapshot",
  "buildImportCandidate",
] as const;

export const JOB_SOURCE_PROVIDER_CAPABILITY_MATRIX = [
  {
    providerId: "GREENHOUSE",
    providerName: "Greenhouse",
    providerType: "GREENHOUSE",
    connectionStatus: "NOT_CONNECTED",
    accessMode: "OPERATOR_IMPORTED_JSON",
    limitations: ["Provider identity only; no Greenhouse integration exists in J002.02."],
  },
  {
    providerId: "LEVER",
    providerName: "Lever",
    providerType: "LEVER",
    connectionStatus: "NOT_CONNECTED",
    accessMode: "OPERATOR_IMPORTED_JSON",
    limitations: ["Provider identity only; no Lever integration exists in J002.02."],
  },
  {
    providerId: "ASHBY",
    providerName: "Ashby",
    providerType: "ASHBY",
    connectionStatus: "NOT_CONNECTED",
    accessMode: "OPERATOR_IMPORTED_JSON",
    limitations: ["Provider identity only; no Ashby integration exists in J002.02."],
  },
  {
    providerId: "WORKDAY",
    providerName: "Workday",
    providerType: "WORKDAY",
    connectionStatus: "AUTHENTICATED_ACCESS_NOT_CONNECTED",
    accessMode: "UNSUPPORTED_AUTHENTICATED_SOURCE",
    limitations: ["Authenticated Workday sessions, cookies, and browser access are not connected."],
  },
  {
    providerId: "LINKEDIN",
    providerName: "LinkedIn",
    providerType: "LINKEDIN",
    connectionStatus: "AUTHENTICATED_ACCESS_NOT_CONNECTED",
    accessMode: "UNSUPPORTED_AUTHENTICATED_SOURCE",
    limitations: ["LinkedIn login, cookies, scraping, and browser automation are not connected."],
  },
  {
    providerId: "INDEED",
    providerName: "Indeed",
    providerType: "INDEED",
    connectionStatus: "NOT_CONNECTED",
    accessMode: "OPERATOR_PASTED_URL",
    limitations: ["Provider identity only; no Indeed integration exists in J002.02."],
  },
  {
    providerId: "EMPLOYER_CAREER_SITE",
    providerName: "Employer career site",
    providerType: "EMPLOYER_CAREER_SITE",
    connectionStatus: "OPERATOR_INPUT_ONLY",
    accessMode: "OPERATOR_PASTED_URL",
    limitations: ["Operator-supplied URL/text/JSON only; StaffordOS does not browse the site."],
  },
  {
    providerId: "OTHER",
    providerName: "Other source",
    providerType: "OTHER",
    connectionStatus: "OPERATOR_INPUT_ONLY",
    accessMode: "OPERATOR_IMPORTED_JSON",
    limitations: ["Operator-supplied source only."],
  },
] as const;

export type JobSourceAccessMode = (typeof JOB_SOURCE_ACCESS_MODES)[number];
export type JobSourceProviderType = (typeof JOB_SOURCE_PROVIDER_TYPES)[number];
export type JobSourceAdapterConnectionStatus = (typeof JOB_SOURCE_ADAPTER_CONNECTION_STATUSES)[number];
export type JobSourceImportQueueState = (typeof JOB_SOURCE_IMPORT_QUEUE_STATES)[number];
export type JobSourceDuplicateResult = (typeof JOB_SOURCE_DUPLICATE_RESULTS)[number];
export type JobSourceImportDecisionType = (typeof JOB_SOURCE_IMPORT_DECISION_TYPES)[number];

export type JobSourceAdapterContract = {
  providerId: string;
  providerName: string;
  providerType: JobSourceProviderType;
  sourceAuthority: "OPERATOR_SUPPLIED_READ_ONLY" | "PUBLIC_READ_ONLY" | "UNSUPPORTED_AUTHENTICATED_SOURCE";
  accessMode: JobSourceAccessMode;
  authenticationRequired: boolean;
  supportsSearch: boolean;
  supportsDirectImport: boolean;
  supportsUrlImport: boolean;
  supportsPagination: boolean;
  supportsPublicationDate: boolean;
  supportsRequisitionId: boolean;
  supportsCompensation: boolean;
  supportsLocation: boolean;
  supportsRemoteState: boolean;
  connectionStatus: JobSourceAdapterConnectionStatus;
  limitations: string[];
  readOnly: true;
  readMethods: typeof JOB_SOURCE_READ_METHODS;
  writeMethodsAvailable: false;
  authenticatedAccessConnected: false;
  browserAutomationAvailable: false;
  hasApplyMethod: false;
  hasSubmitMethod: false;
  hasMessageMethod: false;
  hasLoginMethod: false;
  hasBrowserControlMethod: false;
};

export type RawJobSourceInput = {
  accessMode: JobSourceAccessMode;
  providerId?: string | null;
  providerName?: string | null;
  providerType?: JobSourceProviderType | null;
  sourceUrl?: string | null;
  sourceText?: string | null;
  importedJson?: Record<string, unknown> | null;
  observedAt: string;
  providerJobId?: string | null;
  publicationDate?: string | null;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  remoteState?: string | null;
  employmentType?: string | null;
  compensationText?: string | null;
  descriptionText?: string | null;
  requisitionId?: string | null;
  sourceAuthority?: "OPERATOR_SUPPLIED_READ_ONLY" | "PUBLIC_READ_ONLY_PROVIDER";
  limitations?: string[];
};

export type NormalizedJobSourceRecord = {
  schemaVersion: typeof PRIVATE_JOB_SOURCE_RECORD_SCHEMA_VERSION;
  jobSourceRecordId: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  providerId: string;
  providerName: string;
  providerType: JobSourceProviderType;
  providerJobId: string | null;
  accessMode: JobSourceAccessMode;
  sourceUrl: string | null;
  sourceDigest: string;
  observedAt: string;
  publicationDate: string | null;
  publicationDateAuthority: "SOURCE_EXPLICIT" | "UNKNOWN";
  title: string;
  company: string;
  location: string | null;
  remoteState: string | null;
  employmentType: string | null;
  compensationText: string | null;
  descriptionText: string | null;
  descriptionTextReference: string;
  descriptionDigest: string;
  requisitionId: string | null;
  sourceAuthority: "OPERATOR_SUPPLIED_READ_ONLY" | "PUBLIC_READ_ONLY_PROVIDER";
  freshness: "RECENT" | "UNKNOWN" | "STALE";
  laneDisposition:
    | "PRIMARY_LANE"
    | "SECONDARY_BRIDGE_LANE"
    | "EXCLUDED_BY_DEFAULT"
    | "UNKNOWN_LANE";
  privacy: "Professional owner-private";
  limitations: string[];
  rawDescriptionStoredPrivately: true;
  importedTimestampIsPublicationDate: false;
  compensationInvented: false;
  remoteStateInvented: false;
  testOnly: false;
};

export type JobSourceImportQueueItem = {
  queueItemId: string;
  sourceRecordId: string;
  state: JobSourceImportQueueState;
  duplicateResult: JobSourceDuplicateResult;
  existingApplicationStatus: "NO_APPLICATION_MATCH" | "EXISTING_APPLICATION_MATCH" | "POSSIBLE_APPLICATION_DUPLICATE";
  company: string;
  role: string;
  providerName: string;
  sourceProducedBy: string;
  publicationDate: string | null;
  freshness: "RECENT" | "UNKNOWN" | "STALE";
  priorityTier: string;
  recommendedAction: string;
  rankingSummary: {
    totalScore: number;
    categoryContributions: Array<{
      label: string;
      weight: number;
      weightedScore: number;
      matchedTerms: string[];
    }>;
    whyRecommended: string[];
    missingThemes: string[];
  };
  known: string[];
  unknown: string[];
  whatRossMustApprove: string[];
  completionProof: string;
  sourceSnapshotId: string;
  normalizedOpportunityCandidateId: string | null;
  limitations: string[];
  privatePathVisible: false;
  rawDescriptionVisible: false;
  applicationSubmitted: false;
  messageSent: false;
  resumeGenerated: false;
};

export type JobSourceImportDecision = {
  schemaVersion: typeof PRIVATE_JOB_SOURCE_IMPORT_DECISION_SCHEMA_VERSION;
  decisionId: string;
  queueItemId: string;
  sourceRecordId: string;
  decisionType: JobSourceImportDecisionType;
  operatorConfirmed: true;
  createdAt: string;
  sourceAuthority: "ROSS_OPERATOR_DECISION";
  privacy: "Professional owner-private";
  applicationCreated: false;
  applicationSubmitted: false;
  messageSent: false;
  resumeGenerated: false;
  limitations: string[];
};

export type JobSourceImportApprovalResult = {
  decision: JobSourceImportDecision;
  normalizedOpportunity: PrivateNormalizedJobOpportunity | null;
  writtenPrivateArtifact: string | null;
  applicationCreated: false;
  applicationSubmitted: false;
  messageSent: false;
  resumeGenerated: false;
};

export type PrivateJobSourceImportQueueResult = {
  schemaVersion: typeof PRIVATE_JOB_SOURCE_IMPORT_QUEUE_SCHEMA_VERSION;
  workflowVersion: typeof PRIVATE_JOB_SOURCE_IMPORT_QUEUE_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  targetSearchLanes: {
    primary: string[];
    secondaryBridge: string[];
    excludedByDefault: string[];
  };
  adapterContract: {
    readOnly: true;
    readMethods: typeof JOB_SOURCE_READ_METHODS;
    writeMethodsAvailable: false;
    authenticatedAccessConnected: false;
    browserAutomationAvailable: false;
    supportedAccessModes: JobSourceAccessMode[];
  };
  providerCapabilityMatrix: typeof JOB_SOURCE_PROVIDER_CAPABILITY_MATRIX;
  normalizedSourceRecords: NormalizedJobSourceRecord[];
  sourceSnapshots: SourceSnapshot[];
  importQueue: JobSourceImportQueueItem[];
  prioritization: PrivateOpportunityQueueResult;
  decisions: JobSourceImportDecision[];
  importedOpportunities: PrivateNormalizedJobOpportunity[];
  summary: {
    normalizedRecords: number;
    queueItems: number;
    readyForOpportunityImport: number;
    needsOperatorReview: number;
    duplicateItems: number;
    existingApplicationItems: number;
    invalidItems: number;
    importedOpportunities: number;
    externalProviderCalls: 0;
    authenticatedSourcesRejected: number;
  };
  auditSummary: {
    noApplicationSubmitted: true;
    noApplicationCreated: true;
    noResumeGenerated: true;
    noCoverLetterGenerated: true;
    noMessageSent: true;
    noLinkedInMutated: true;
    noBrowserAutomation: true;
    noProviderLogin: true;
    noAuthenticatedScraping: true;
    noExternalAi: true;
    noOllama: true;
    noOsConnection: true;
    noOperatorConnection: true;
    noCareerFactPromoted: true;
    privatePathVisible: false;
  };
};

type QueueBuildOptions = {
  inputs: readonly RawJobSourceInput[];
  applications?: readonly Partial<PrivateApplicationRecord>[];
  generatedAt: string;
};

export const PRIMARY_SEARCH_LANE = [
  "AI Automation",
  "AI Product",
  "AI Product Operations",
  "AI Governance",
  "Responsible AI",
  "AI Operations",
  "AI Platform Operations",
  "Technical Product Manager",
  "Technical Product Owner",
  "Technical Program Manager",
  "Business Technology",
  "Business Systems Analyst",
  "Automation Engineer",
  "AI Solutions",
  "AI Integration",
  "RevOps AI",
  "GTM AI",
  "Platform Operations",
  "Digital Transformation",
] as const;

export const SECONDARY_SEARCH_LANE = [
  "Marketing Technology",
  "Marketing Operations",
  "Marketing Automation",
  "Marketing Systems",
  "CRM Operations",
  "Salesforce Operations",
  "Revenue Operations",
  "Lifecycle Operations",
  "Campaign Operations",
  "Marketing Analytics",
  "Digital Technology",
] as const;

export const EXCLUDED_DEFAULT_ROLE_LANE = [
  "Social Media Manager",
  "SEO Specialist",
  "PPC Specialist",
  "Content Marketing Specialist",
  "Email Marketing Specialist",
  "Marketing Coordinator",
] as const;

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function opaqueId(prefix: string, parts: readonly unknown[]) {
  return `${prefix}_${sha256Text(parts.map((part) => String(part ?? "")).join("|")).slice(0, 18)}`;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const normalized = text(value);
  return normalized ? normalized : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function parseTimestamp(value: string | null | undefined) {
  return value && !Number.isNaN(Date.parse(value)) ? Date.parse(value) : null;
}

function normalizeComparable(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#/.\s-]/g, " ")
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalUrl(value: string | null | undefined) {
  const urlText = optionalText(value);
  if (!urlText) return null;
  try {
    const parsed = new URL(urlText);
    parsed.hash = "";
    parsed.searchParams.sort();
    return parsed.toString();
  } catch (_error) {
    return urlText;
  }
}

function jsonField(record: Record<string, unknown> | null | undefined, names: readonly string[]) {
  if (!record) return null;
  for (const name of names) {
    const value = optionalText(record[name]);
    if (value) return value;
  }
  return null;
}

function providerType(value: string | null | undefined): JobSourceProviderType {
  const normalized = (value || "").toUpperCase().replace(/[^A-Z_]/g, "_");
  return (JOB_SOURCE_PROVIDER_TYPES as readonly string[]).includes(normalized) ? (normalized as JobSourceProviderType) : "OTHER";
}

function accessMode(value: string | null | undefined): JobSourceAccessMode {
  const normalized = (value || "").toUpperCase().replace(/[^A-Z_]/g, "_");
  return (JOB_SOURCE_ACCESS_MODES as readonly string[]).includes(normalized) ? (normalized as JobSourceAccessMode) : "OPERATOR_IMPORTED_JSON";
}

function descriptionFor(input: RawJobSourceInput) {
  return (
    optionalText(input.descriptionText) ||
    optionalText(input.sourceText) ||
    jsonField(input.importedJson, ["descriptionText", "description", "jobDescription", "body", "summary"]) ||
    ""
  );
}

function sourcePayloadForDigest(input: RawJobSourceInput) {
  return JSON.stringify({
    sourceUrl: canonicalUrl(input.sourceUrl || jsonField(input.importedJson, ["sourceUrl", "url", "applyUrl"])),
    sourceText: optionalText(input.sourceText),
    importedJson: input.importedJson || null,
    descriptionText: descriptionFor(input),
    title: input.title || jsonField(input.importedJson, ["title", "roleTitle", "jobTitle"]),
    company: input.company || jsonField(input.importedJson, ["company", "companyName", "employer"]),
    providerJobId: input.providerJobId || jsonField(input.importedJson, ["providerJobId", "jobId", "id"]),
    requisitionId: input.requisitionId || jsonField(input.importedJson, ["requisitionId", "reqId"]),
  });
}

function isStale(input: RawJobSourceInput, generatedAt: string) {
  if (
    input.sourceAuthority === "PUBLIC_READ_ONLY_PROVIDER" ||
    input.accessMode === "PUBLIC_API" ||
    input.accessMode === "PUBLIC_FEED" ||
    input.accessMode === "PUBLIC_PAGE"
  ) {
    return false;
  }
  const publicationDate = parseTimestamp(input.publicationDate || jsonField(input.importedJson, ["publicationDate", "publishedAt", "datePosted"]));
  const generated = parseTimestamp(generatedAt);
  if (!publicationDate || !generated) return false;
  const ageDays = (generated - publicationDate) / (1000 * 60 * 60 * 24);
  return ageDays > 45;
}

function containsAnyLaneTerm(value: string, terms: readonly string[]) {
  const normalized = normalizeComparable(value);
  return terms.some((term) => normalized.includes(normalizeComparable(term)));
}

function laneDispositionFor(record: {
  title: string;
  company: string;
  descriptionText: string | null;
  providerName: string;
}) {
  const source = [
    record.title,
    record.company,
    record.providerName,
    record.descriptionText || "",
  ].join(" ");
  if (containsAnyLaneTerm(record.title, EXCLUDED_DEFAULT_ROLE_LANE)) return "EXCLUDED_BY_DEFAULT" as const;
  if (containsAnyLaneTerm(source, PRIMARY_SEARCH_LANE)) return "PRIMARY_LANE" as const;
  if (containsAnyLaneTerm(source, SECONDARY_SEARCH_LANE)) return "SECONDARY_BRIDGE_LANE" as const;
  return "UNKNOWN_LANE" as const;
}

export function createJobSourceAdapterContract(input: {
  providerId: string;
  providerName: string;
  providerType?: JobSourceProviderType;
  accessMode: JobSourceAccessMode;
  supportsSearch?: boolean;
  supportsDirectImport?: boolean;
  supportsUrlImport?: boolean;
  supportsPagination?: boolean;
  supportsPublicationDate?: boolean;
  supportsRequisitionId?: boolean;
  supportsCompensation?: boolean;
  supportsLocation?: boolean;
  supportsRemoteState?: boolean;
  limitations?: string[];
}): JobSourceAdapterContract {
  const authenticated = input.accessMode === "UNSUPPORTED_AUTHENTICATED_SOURCE";
  return {
    providerId: input.providerId,
    providerName: input.providerName,
    providerType: input.providerType || providerType(input.providerId),
    sourceAuthority: authenticated ? "UNSUPPORTED_AUTHENTICATED_SOURCE" : "OPERATOR_SUPPLIED_READ_ONLY",
    accessMode: input.accessMode,
    authenticationRequired: authenticated,
    supportsSearch: Boolean(input.supportsSearch && !authenticated),
    supportsDirectImport: Boolean(input.supportsDirectImport && !authenticated),
    supportsUrlImport: Boolean(input.supportsUrlImport && !authenticated),
    supportsPagination: Boolean(input.supportsPagination && !authenticated),
    supportsPublicationDate: Boolean(input.supportsPublicationDate && !authenticated),
    supportsRequisitionId: Boolean(input.supportsRequisitionId && !authenticated),
    supportsCompensation: Boolean(input.supportsCompensation && !authenticated),
    supportsLocation: Boolean(input.supportsLocation && !authenticated),
    supportsRemoteState: Boolean(input.supportsRemoteState && !authenticated),
    connectionStatus: authenticated ? "AUTHENTICATED_ACCESS_NOT_CONNECTED" : "OPERATOR_INPUT_ONLY",
    limitations: [
      authenticated
        ? "Authenticated/private provider access is unsupported and fails closed."
        : "Read-only operator-supplied import boundary only.",
      ...(input.limitations || []),
    ],
    readOnly: true,
    readMethods: JOB_SOURCE_READ_METHODS,
    writeMethodsAvailable: false,
    authenticatedAccessConnected: false,
    browserAutomationAvailable: false,
    hasApplyMethod: false,
    hasSubmitMethod: false,
    hasMessageMethod: false,
    hasLoginMethod: false,
    hasBrowserControlMethod: false,
  };
}

export function createOperatorPastedUrlAdapter(providerName = "Operator pasted URL"): JobSourceAdapterContract {
  return createJobSourceAdapterContract({
    providerId: "OPERATOR_PASTED_URL",
    providerName,
    providerType: "OTHER",
    accessMode: "OPERATOR_PASTED_URL",
    supportsUrlImport: true,
    limitations: ["URL is supplied by Ross; StaffordOS does not fetch or browse it."],
  });
}

export function createOperatorPastedTextAdapter(providerName = "Operator pasted text"): JobSourceAdapterContract {
  return createJobSourceAdapterContract({
    providerId: "OPERATOR_PASTED_TEXT",
    providerName,
    providerType: "OTHER",
    accessMode: "OPERATOR_PASTED_TEXT",
    supportsDirectImport: true,
    limitations: ["Text is supplied by Ross; raw description remains owner-private."],
  });
}

export function createOperatorImportedJsonAdapter(providerName = "Operator imported JSON"): JobSourceAdapterContract {
  return createJobSourceAdapterContract({
    providerId: "OPERATOR_IMPORTED_JSON",
    providerName,
    providerType: "OTHER",
    accessMode: "OPERATOR_IMPORTED_JSON",
    supportsDirectImport: true,
    supportsPublicationDate: true,
    supportsRequisitionId: true,
    supportsCompensation: true,
    supportsLocation: true,
    supportsRemoteState: true,
    limitations: ["JSON is supplied by Ross or a separately authorized read-only export."],
  });
}

export function createUnsupportedAuthenticatedSourceAdapter(input: {
  providerId: string;
  providerName: string;
  providerType?: JobSourceProviderType;
}): JobSourceAdapterContract {
  return createJobSourceAdapterContract({
    providerId: input.providerId,
    providerName: input.providerName,
    providerType: input.providerType || providerType(input.providerId),
    accessMode: "UNSUPPORTED_AUTHENTICATED_SOURCE",
    limitations: ["Authenticated provider access is not connected in J002.02."],
  });
}

export function normalizeJobSourceInput(input: RawJobSourceInput, generatedAt: string): NormalizedJobSourceRecord | null {
  if (input.accessMode === "UNSUPPORTED_AUTHENTICATED_SOURCE") return null;
  const imported = input.importedJson || null;
  const sourceUrl = canonicalUrl(input.sourceUrl || jsonField(imported, ["sourceUrl", "url", "applyUrl"]));
  const providerId = optionalText(input.providerId) || jsonField(imported, ["providerId", "sourceProvider"]) || "OPERATOR_SUPPLIED_SOURCE";
  const providerName = optionalText(input.providerName) || jsonField(imported, ["providerName", "sourceProvider"]) || "Operator supplied source";
  const observedAt = optionalText(input.observedAt) || generatedAt;
  const publicationDate = optionalText(input.publicationDate) || jsonField(imported, ["publicationDate", "publishedAt", "datePosted"]);
  const title = optionalText(input.title) || jsonField(imported, ["title", "roleTitle", "jobTitle"]) || "UNKNOWN";
  const company = optionalText(input.company) || jsonField(imported, ["company", "companyName", "employer"]) || "UNKNOWN";
  const descriptionText = descriptionFor(input);
  const sourceDigest = `sha256:${sha256Text(sourcePayloadForDigest(input))}`;
  const descriptionDigest = `sha256:${sha256Text(descriptionText)}`;
  const providerJobId = optionalText(input.providerJobId) || jsonField(imported, ["providerJobId", "jobId", "id"]);
  const requisitionId = optionalText(input.requisitionId) || jsonField(imported, ["requisitionId", "reqId"]);
  const access = accessMode(input.accessMode);
  const recordId = opaqueId("privjobsource", [
    PRIVATE_JOB_SOURCE_IMPORT_QUEUE_VERSION,
    providerId,
    providerJobId,
    sourceUrl,
    requisitionId,
    title,
    company,
    sourceDigest,
  ]);
  const sourceAuthority =
    input.sourceAuthority ||
    (access === "PUBLIC_API" || access === "PUBLIC_FEED" || access === "PUBLIC_PAGE"
      ? "PUBLIC_READ_ONLY_PROVIDER"
      : "OPERATOR_SUPPLIED_READ_ONLY");

  return {
    schemaVersion: PRIVATE_JOB_SOURCE_RECORD_SCHEMA_VERSION,
    jobSourceRecordId: recordId,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    providerId,
    providerName,
    providerType: input.providerType || providerType(providerId),
    providerJobId,
    accessMode: access,
    sourceUrl,
    sourceDigest,
    observedAt,
    publicationDate,
    publicationDateAuthority: publicationDate ? "SOURCE_EXPLICIT" : "UNKNOWN",
    title,
    company,
    location: optionalText(input.location) || jsonField(imported, ["location", "locationText"]),
    remoteState: optionalText(input.remoteState) || jsonField(imported, ["remoteState", "workArrangement"]),
    employmentType: optionalText(input.employmentType) || jsonField(imported, ["employmentType"]),
    compensationText: optionalText(input.compensationText) || jsonField(imported, ["compensationText", "salary", "payRange"]),
    descriptionText: descriptionText || null,
    descriptionTextReference: `private-job-source://${recordId}#raw-description`,
    descriptionDigest,
    requisitionId,
    sourceAuthority,
    freshness: isStale(input, generatedAt) ? "STALE" : publicationDate ? "RECENT" : "UNKNOWN",
    laneDisposition: laneDispositionFor({
      title,
      company,
      providerName,
      descriptionText: descriptionText || null,
    }),
    privacy: "Professional owner-private",
    limitations: [
      "Source was supplied through a read-only operator-controlled import mode.",
      "Raw job description remains in private source storage and is not committed to Git.",
      "Import timestamp is not treated as publication date.",
      !publicationDate ? "Publication date unknown." : null,
      !input.remoteState && !jsonField(imported, ["remoteState", "workArrangement"]) ? "Remote state unknown unless source states it." : null,
      !input.compensationText && !jsonField(imported, ["compensationText", "salary", "payRange"]) ? "Compensation unknown unless source states it." : null,
      ...(input.limitations || []),
    ].filter((value): value is string => Boolean(value)),
    rawDescriptionStoredPrivately: true,
    importedTimestampIsPublicationDate: false,
    compensationInvented: false,
    remoteStateInvented: false,
    testOnly: false,
  };
}

export function buildJobSourceSnapshot(record: NormalizedJobSourceRecord, generatedAt: string): SourceSnapshot {
  const publicProvider = record.sourceAuthority === "PUBLIC_READ_ONLY_PROVIDER";
  const result = createSourceSnapshot({
    snapshotId: opaqueId("privjobsnapshot", [record.jobSourceRecordId, record.sourceDigest, generatedAt]),
    workspaceId: "professional",
    sourceType: publicProvider ? "PROVIDER_CONFIRMED" : "PRIVATE_LOCAL",
    sourceReference: `private-job-source://${record.jobSourceRecordId}`,
    sourceAuthority: record.sourceAuthority,
    privacyClassification: "Professional owner-private",
    capturedAt: generatedAt,
    observedAt: record.observedAt,
    sourceUpdatedAt: record.publicationDate,
    freshness: record.freshness === "RECENT" ? "RECENT" : record.freshness === "STALE" ? "STALE" : "UNKNOWN",
    staticity: "CAPTURED_SNAPSHOT",
    authorizationStatus: publicProvider ? "AUTHORIZED_BY_PROVIDER" : "OPERATOR_CONFIRMED",
    conflictStatus: "UNKNOWN",
    includedFields: [
      "provider",
      "source type",
      "observedAt",
      "asOf",
      "publicationDate",
      "authorizationStatus",
      "staticity",
      "freshness",
      "digest",
      "limitations",
    ],
    excludedFields: [
      "raw job description",
      "private filesystem path",
      "provider credentials",
      "browser cookies",
      "application controls",
      "message controls",
    ],
    limitations: record.limitations,
    contentDigest: record.sourceDigest,
    adapterId: record.providerId,
    schemaVersion: SOURCE_SNAPSHOT_SCHEMA_VERSION,
    testOnly: false,
  });
  if (!result.snapshot) {
    throw new Error(`Invalid source snapshot: ${result.errors.map((error) => error.code).join(", ")}`);
  }
  return result.snapshot;
}

function toRankingRecord(record: NormalizedJobSourceRecord) {
  return {
    providerName: record.providerName,
    providerRecordId: record.providerJobId || record.requisitionId || record.jobSourceRecordId,
    sourceUrl: record.sourceUrl,
    sourceObservedAt: record.observedAt,
    publishedAt: record.publicationDate,
    companyName: record.company,
    roleTitle: record.title,
    requisitionAlias: record.requisitionId || record.providerJobId,
    locationText: record.location,
    workArrangement: record.remoteState,
    employmentType: record.employmentType,
    description: record.descriptionText || `Source digest ${record.descriptionDigest}. ${record.descriptionTextReference}`,
    responsibilities: [],
    requirements: record.descriptionText ? [] : [record.descriptionTextReference],
    tags: [],
    limitations: [
      "Ranking input was derived from the private normalized source record.",
      "Raw job description is not exposed through the prioritization read model.",
    ],
    testOnly: false,
  };
}

function toIntakeRecord(record: NormalizedJobSourceRecord): PrivateJobOpportunityIntakeRecord {
  return {
    schemaVersion: PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION,
    workspaceId: "professional",
    sourceUrl: record.sourceUrl || `private-job-source://${record.jobSourceRecordId}`,
    sourceProvider: record.providerName,
    sourceProviderRecordId: record.providerJobId || record.requisitionId,
    sourceObservedAt: record.observedAt,
    sourceSummary: `Private normalized source record ${record.jobSourceRecordId}. Raw description retained privately.`,
    listingText: null,
    roleTitle: record.title,
    companyName: record.company,
    location: record.location,
    workArrangement: record.remoteState,
    compensationText: record.compensationText,
    employmentType: record.employmentType,
    listingPublishedAt: record.publicationDate,
    listingExpiresAt: null,
    operatorNotes: null,
    privacy: "Professional owner-private",
    sourceAuthority: "Imported",
    limitations: [
      "Created only after Ross approves import from the private Job Source Import Queue.",
      "No Application is created by importing an Opportunity.",
      "Raw job description remains owner-private and outside Git.",
    ],
  };
}

function knownValues(record: NormalizedJobSourceRecord) {
  return [
    `Provider: ${record.providerName}`,
    `Company: ${record.company}`,
    `Role: ${record.title}`,
    record.publicationDate ? `Published: ${record.publicationDate}` : null,
    record.requisitionId ? `Requisition: ${record.requisitionId}` : null,
  ].filter((value): value is string => Boolean(value));
}

function unknownValues(record: NormalizedJobSourceRecord) {
  return [
    record.publicationDate ? null : "Publication date",
    record.location ? null : "Location",
    record.remoteState ? null : "Remote state",
    record.employmentType ? null : "Employment type",
    record.compensationText ? null : "Compensation",
    record.company === "UNKNOWN" ? "Company" : null,
    record.title === "UNKNOWN" ? "Role title" : null,
  ].filter((value): value is string => Boolean(value));
}

function duplicateResult(priorityItem: PrivateOpportunityQueueResult["opportunities"][number]): JobSourceDuplicateResult {
  if (priorityItem.applicationComparison.status === "EXISTING_APPLICATION_MATCH") return "EXISTING_APPLICATION";
  if (priorityItem.applicationComparison.status === "POSSIBLE_APPLICATION_DUPLICATE") return "NEEDS_OPERATOR_REVIEW";
  if (priorityItem.duplicateStatus === "NO_DUPLICATE") return "NEW";
  if (priorityItem.duplicateStatus === "EXACT_SOURCE_DUPLICATE" || priorityItem.duplicateStatus === "SAME_PROVIDER_RECORD") {
    return "CONFIRMED_DUPLICATE";
  }
  return "POSSIBLE_DUPLICATE";
}

function queueState(input: {
  record: NormalizedJobSourceRecord;
  duplicateResult: JobSourceDuplicateResult;
  existingApplicationStatus: JobSourceImportQueueItem["existingApplicationStatus"];
}) {
  if (input.record.title === "UNKNOWN" || input.record.company === "UNKNOWN") return "NEEDS_OPERATOR_REVIEW" as const;
  if (!input.record.sourceUrl) return "NEEDS_OPERATOR_REVIEW" as const;
  if (input.record.laneDisposition === "EXCLUDED_BY_DEFAULT") return "NEEDS_OPERATOR_REVIEW" as const;
  if (input.record.laneDisposition === "UNKNOWN_LANE") return "NEEDS_OPERATOR_REVIEW" as const;
  if (input.record.freshness === "STALE") return "STALE" as const;
  if (input.existingApplicationStatus === "EXISTING_APPLICATION_MATCH") return "EXISTING_APPLICATION" as const;
  if (input.duplicateResult === "CONFIRMED_DUPLICATE" || input.duplicateResult === "POSSIBLE_DUPLICATE") return "DUPLICATE" as const;
  if (input.duplicateResult === "NEEDS_OPERATOR_REVIEW") return "NEEDS_OPERATOR_REVIEW" as const;
  return "READY_FOR_OPPORTUNITY_IMPORT" as const;
}

export function buildPrivateJobSourceImportQueue(options: QueueBuildOptions): PrivateJobSourceImportQueueResult {
  const normalizedSourceRecords = options.inputs
    .map((input) => normalizeJobSourceInput(input, options.generatedAt))
    .filter((record): record is NormalizedJobSourceRecord => record !== null);
  const authenticatedSourcesRejected = options.inputs.length - normalizedSourceRecords.length;
  const sourceSnapshots = normalizedSourceRecords.map((record) => buildJobSourceSnapshot(record, options.generatedAt));
  const rankingAdapter = createMockJobDiscoveryProviderAdapter(
    "J002.02 private source import ranking adapter",
    normalizedSourceRecords.map(toRankingRecord),
  );
  const prioritization = buildJobDiscoveryPrioritizationResult({
    providerAdapters: [rankingAdapter],
    applications: options.applications || [],
    generatedAt: options.generatedAt,
  });
  const priorityByProviderRecord = new Map(
    prioritization.opportunities.map((opportunity) => [
      opportunity.providerRecordId,
      opportunity,
    ]),
  );
  const importQueue = normalizedSourceRecords.map((record): JobSourceImportQueueItem => {
    const priority = priorityByProviderRecord.get(record.providerJobId || record.requisitionId || record.jobSourceRecordId);
    if (!priority) {
      throw new Error(`Missing prioritization for ${record.jobSourceRecordId}`);
    }
    const sourceSnapshot = sourceSnapshots.find((snapshot) => snapshot.sourceReference.endsWith(record.jobSourceRecordId));
    if (!sourceSnapshot) {
      throw new Error(`Missing source snapshot for ${record.jobSourceRecordId}`);
    }
    const result = duplicateResult(priority);
    const existingApplicationStatus =
      priority.applicationComparison.status === "APPLICATION_STATUS_UNKNOWN" ? "NO_APPLICATION_MATCH" : priority.applicationComparison.status;
    const state = queueState({ record, duplicateResult: result, existingApplicationStatus });
    return {
      queueItemId: opaqueId("privjobimport", [record.jobSourceRecordId, priority.opportunityId]),
      sourceRecordId: record.jobSourceRecordId,
      state,
      duplicateResult: result,
      existingApplicationStatus,
      company: record.company,
      role: record.title,
      providerName: record.providerName,
      sourceProducedBy: `${record.accessMode} via ${record.providerName}`,
      publicationDate: record.publicationDate,
      freshness: record.freshness,
      priorityTier: priority.priorityTier,
      recommendedAction: state === "READY_FOR_OPPORTUNITY_IMPORT" ? "IMPORT_REQUIRES_ROSS_APPROVAL" : priority.recommendedAction,
      rankingSummary: {
        totalScore: priority.ranking.totalScore,
        categoryContributions: priority.ranking.components.map((component) => ({
          label: component.label,
          weight: component.weight,
          weightedScore: component.weightedScore,
          matchedTerms: component.matchedTerms,
        })),
        whyRecommended: priority.ranking.explanation.whyRecommended,
        missingThemes: priority.ranking.components
          .filter((component) => component.weightedScore === 0)
          .map((component) => component.label),
      },
      known: knownValues(record),
      unknown: unknownValues(record),
      whatRossMustApprove: [
        "Whether to import this source as a private JobOpportunity.",
        "Whether the source is sufficiently current.",
        "Whether missing company, role, publication date, location, remote state, or compensation should remain unknown.",
        "Whether this source belongs in the authorized Career Operations search lanes.",
      ],
      completionProof: "Ross records Import Opportunity, Reject, Defer, Inspect Summary, or Stop.",
      sourceSnapshotId: sourceSnapshot.snapshotId,
      normalizedOpportunityCandidateId: state === "READY_FOR_OPPORTUNITY_IMPORT" ? priority.opportunityId : null,
      limitations: [
        "Queue item is not an application.",
        "No Application is created until a separately authorized workflow records one.",
        "No resume, cover letter, message, or provider action is created.",
        record.laneDisposition === "EXCLUDED_BY_DEFAULT"
          ? "Traditional narrow marketing role is excluded by default unless Ross separately authorizes it."
          : null,
        record.laneDisposition === "UNKNOWN_LANE"
          ? "Search-lane alignment needs operator review before Opportunity import."
          : null,
        ...record.limitations,
      ].filter((value): value is string => Boolean(value)),
      privatePathVisible: false,
      rawDescriptionVisible: false,
      applicationSubmitted: false,
      messageSent: false,
      resumeGenerated: false,
    };
  });

  return {
    schemaVersion: PRIVATE_JOB_SOURCE_IMPORT_QUEUE_SCHEMA_VERSION,
    workflowVersion: PRIVATE_JOB_SOURCE_IMPORT_QUEUE_VERSION,
    generatedAt: options.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    targetSearchLanes: {
      primary: [...PRIMARY_SEARCH_LANE],
      secondaryBridge: [...SECONDARY_SEARCH_LANE],
      excludedByDefault: [...EXCLUDED_DEFAULT_ROLE_LANE],
    },
    adapterContract: {
      readOnly: true,
      readMethods: JOB_SOURCE_READ_METHODS,
      writeMethodsAvailable: false,
      authenticatedAccessConnected: false,
      browserAutomationAvailable: false,
      supportedAccessModes: [
        "OPERATOR_PASTED_URL",
        "OPERATOR_PASTED_TEXT",
        "OPERATOR_IMPORTED_JSON",
      ],
    },
    providerCapabilityMatrix: JOB_SOURCE_PROVIDER_CAPABILITY_MATRIX,
    normalizedSourceRecords,
    sourceSnapshots,
    importQueue,
    prioritization,
    decisions: [],
    importedOpportunities: [],
    summary: {
      normalizedRecords: normalizedSourceRecords.length,
      queueItems: importQueue.length,
      readyForOpportunityImport: importQueue.filter((item) => item.state === "READY_FOR_OPPORTUNITY_IMPORT").length,
      needsOperatorReview: importQueue.filter((item) => item.state === "NEEDS_OPERATOR_REVIEW").length,
      duplicateItems: importQueue.filter((item) => item.state === "DUPLICATE").length,
      existingApplicationItems: importQueue.filter((item) => item.state === "EXISTING_APPLICATION").length,
      invalidItems: importQueue.filter((item) => item.state === "INVALID").length,
      importedOpportunities: 0,
      externalProviderCalls: 0,
      authenticatedSourcesRejected,
    },
    auditSummary: {
      noApplicationSubmitted: true,
      noApplicationCreated: true,
      noResumeGenerated: true,
      noCoverLetterGenerated: true,
      noMessageSent: true,
      noLinkedInMutated: true,
      noBrowserAutomation: true,
      noProviderLogin: true,
      noAuthenticatedScraping: true,
      noExternalAi: true,
      noOllama: true,
      noOsConnection: true,
      noOperatorConnection: true,
      noCareerFactPromoted: true,
      privatePathVisible: false,
    },
  };
}

export function approveJobSourceImport(input: {
  result: PrivateJobSourceImportQueueResult;
  queueItemId: string;
  decisionType: JobSourceImportDecisionType;
  generatedAt: string;
  outputDirectory?: string | null;
  repositoryRoot?: string | null;
}): JobSourceImportApprovalResult {
  const queueItem = input.result.importQueue.find((item) => item.queueItemId === input.queueItemId);
  if (!queueItem) throw new Error("Queue item not found.");
  const record = input.result.normalizedSourceRecords.find((item) => item.jobSourceRecordId === queueItem.sourceRecordId);
  if (!record) throw new Error("Source record not found.");
  const decision: JobSourceImportDecision = {
    schemaVersion: PRIVATE_JOB_SOURCE_IMPORT_DECISION_SCHEMA_VERSION,
    decisionId: opaqueId("privjobimportdecision", [input.queueItemId, input.decisionType, input.generatedAt]),
    queueItemId: input.queueItemId,
    sourceRecordId: record.jobSourceRecordId,
    decisionType: input.decisionType,
    operatorConfirmed: true,
    createdAt: input.generatedAt,
    sourceAuthority: "ROSS_OPERATOR_DECISION",
    privacy: "Professional owner-private",
    applicationCreated: false,
    applicationSubmitted: false,
    messageSent: false,
    resumeGenerated: false,
    limitations: [
      "Decision is owner-private and append-only.",
      "Import approval creates a private JobOpportunity candidate only, never an Application.",
    ],
  };

  if (input.decisionType !== "APPROVE_IMPORT_OPPORTUNITY") {
    return {
      decision,
      normalizedOpportunity: null,
      writtenPrivateArtifact: null,
      applicationCreated: false,
      applicationSubmitted: false,
      messageSent: false,
      resumeGenerated: false,
    };
  }
  if (queueItem.state !== "READY_FOR_OPPORTUNITY_IMPORT") {
    throw new Error("Only READY_FOR_OPPORTUNITY_IMPORT items can be imported.");
  }

  const normalization = normalizePrivateJobOpportunityIntake(toIntakeRecord(record), {
    intakeTimestamp: input.generatedAt,
  });
  if (!normalization.normalizedOpportunity) {
    throw new Error(`Opportunity intake normalization failed: ${normalization.errors.map((error) => error.code).join(", ")}`);
  }

  let writtenPrivateArtifact: string | null = null;
  if (input.outputDirectory && input.repositoryRoot) {
    const written = writePrivateNormalizedJobOpportunity(
      normalization.normalizedOpportunity,
      input.outputDirectory,
      input.repositoryRoot,
    );
    if (!written.ok) {
      throw new Error(`Opportunity write failed: ${written.errors.map((error) => error.code).join(", ")}`);
    }
    writtenPrivateArtifact = written.outputPath;
  }

  return {
    decision,
    normalizedOpportunity: normalization.normalizedOpportunity,
    writtenPrivateArtifact,
    applicationCreated: false,
    applicationSubmitted: false,
    messageSent: false,
    resumeGenerated: false,
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

function compactTimestamp(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 14);
}

export function writePrivateJobSourceImportQueueOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: PrivateJobSourceImportQueueResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private J002.02 job source import output root");
  const runDirectory = path.join(input.outputRoot, `J002_02_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const files = {
    "source_snapshots.json": input.result.sourceSnapshots,
    "normalized_source_records.json": input.result.normalizedSourceRecords,
    "import_queue.json": input.result.importQueue,
    "priority_queue.json": input.result.prioritization.priorityQueue,
    "provider_capability_matrix.json": input.result.providerCapabilityMatrix,
    "import_audit.json": input.result.auditSummary,
  };
  const written: string[] = [];
  for (const [filename, value] of Object.entries(files)) {
    const filePath = path.join(runDirectory, filename);
    writeJson(filePath, value);
    written.push(filePath);
  }
  return written;
}

export function readImportedJsonInput(filePath: string): RawJobSourceInput {
  const record = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  return {
    accessMode: "OPERATOR_IMPORTED_JSON",
    providerId: jsonField(record, ["providerId", "sourceProvider"]),
    providerName: jsonField(record, ["providerName", "sourceProvider"]),
    providerType: providerType(jsonField(record, ["providerType", "providerId"])),
    sourceUrl: jsonField(record, ["sourceUrl", "url", "applyUrl"]),
    observedAt: jsonField(record, ["observedAt", "sourceObservedAt"]) || new Date().toISOString(),
    providerJobId: jsonField(record, ["providerJobId", "jobId", "id"]),
    publicationDate: jsonField(record, ["publicationDate", "publishedAt", "datePosted"]),
    title: jsonField(record, ["title", "roleTitle", "jobTitle"]),
    company: jsonField(record, ["company", "companyName", "employer"]),
    location: jsonField(record, ["location", "locationText"]),
    remoteState: jsonField(record, ["remoteState", "workArrangement"]),
    employmentType: jsonField(record, ["employmentType"]),
    compensationText: jsonField(record, ["compensationText", "salary", "payRange"]),
    descriptionText: jsonField(record, ["descriptionText", "description", "jobDescription", "body", "summary"]),
    requisitionId: jsonField(record, ["requisitionId", "reqId"]),
    importedJson: record,
    limitations: stringArray(record.limitations),
  };
}

export function loadImportedJsonInputs(directory: string): RawJobSourceInput[] {
  if (!existsSync(directory)) return [];
  const files = readdirSync(directory)
    .filter((name: string) => name.endsWith(".json"))
    .sort((a: string, b: string) => a.localeCompare(b));
  return files.map((name: string) => readImportedJsonInput(path.join(directory, name)));
}

export function buildJobSourceImportCliSummary(result: PrivateJobSourceImportQueueResult, writtenCount = 0) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    normalizedRecords: result.summary.normalizedRecords,
    queueItems: result.summary.queueItems,
    readyForOpportunityImport: result.summary.readyForOpportunityImport,
    needsOperatorReview: result.summary.needsOperatorReview,
    duplicateItems: result.summary.duplicateItems,
    existingApplicationItems: result.summary.existingApplicationItems,
    importedOpportunities: result.summary.importedOpportunities,
    authenticatedSourcesRejected: result.summary.authenticatedSourcesRejected,
    externalProviderCalls: result.summary.externalProviderCalls,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noApplicationCreated: result.auditSummary.noApplicationCreated,
    noResumeGenerated: result.auditSummary.noResumeGenerated,
    noMessageSent: result.auditSummary.noMessageSent,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
    noOsConnection: result.auditSummary.noOsConnection,
    noOperatorConnection: result.auditSummary.noOperatorConnection,
    privateArtifactsWritten: writtenCount,
  };
}

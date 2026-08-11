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
import { homedir } from "node:os";
import * as path from "node:path";
import type { CareerEvidence, CareerFact } from "./careerEvidenceContracts";
import {
  buildPrivateJobAnalysisBundle,
  writePrivateJobAnalysisBundle,
  type PrivateJobAnalysisBundle,
} from "./privateJobAnalysisWorkflow";
import type { ManualApplicationEvent } from "./jobFitAssessment";
import {
  buildOpportunityRecommendationEngine,
  writeOpportunityRecommendationOutputs,
  type OpportunityRecommendationResult,
} from "./opportunityRecommendationEngine";
import type { PrivateApplicationRecord } from "./manualApplicationEventTracking";
import {
  approveJobSourceImport,
  buildPrivateJobSourceImportQueue,
  writePrivateJobSourceImportQueueOutputs,
  type JobSourceImportQueueItem,
  type NormalizedJobSourceRecord,
  type PrivateJobSourceImportQueueResult,
  type RawJobSourceInput,
} from "./privateJobSourceImportQueue";
import {
  writePrivateNormalizedJobOpportunity,
  type PrivateNormalizedJobOpportunity,
} from "./privateJobOpportunityIntake";
import type { PrivateResumeVersionRecord } from "./resumeVersionApplicationLinkage";

export const JOB_DESCRIPTION_INTAKE_BRIDGE_VERSION =
  "CAREEROS_APPLICATION_INTELLIGENCE_V1_01";
export const JOB_DESCRIPTION_INTAKE_BRIDGE_SCHEMA_VERSION =
  "staffordos.job_search.job_description_intake_bridge.v1";
export const JOB_DESCRIPTION_INTAKE_READ_MODEL_SCHEMA_VERSION =
  "staffordos.job_search.job_description_intake_read_model.v1";

export const JOB_DESCRIPTION_INTAKE_MODES = [
  "PASTED_DESCRIPTION",
  "URL_PLUS_DESCRIPTION",
  "URL_ONLY",
] as const;

export const JOB_DESCRIPTION_INTAKE_STATES = [
  "DESCRIPTION_REQUIRED",
  "MALFORMED_URL",
  "UNSUPPORTED_URL_SCHEME",
  "NORMALIZED",
  "READY_FOR_OPERATOR_APPROVAL",
  "IMPORTED_FOR_ANALYSIS",
  "NEEDS_OPERATOR_REVIEW",
  "DUPLICATE",
  "EXISTING_APPLICATION",
] as const;

export type JobDescriptionIntakeMode = (typeof JOB_DESCRIPTION_INTAKE_MODES)[number];
export type JobDescriptionIntakeState = (typeof JOB_DESCRIPTION_INTAKE_STATES)[number];

export type JobDescriptionIntakeInput = {
  sourceUrl?: string | null;
  jobDescriptionText?: string | null;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  remoteState?: string | null;
  employmentType?: string | null;
  compensationText?: string | null;
  publicationDate?: string | null;
  requisitionId?: string | null;
  providerId?: string | null;
  providerName?: string | null;
  providerJobId?: string | null;
  operatorApprovedForOpportunityImport?: boolean;
};

export type JobDescriptionIntakeBridgeOptions = JobDescriptionIntakeInput & {
  generatedAt: string;
  applications?: readonly Partial<PrivateApplicationRecord>[];
  resumeVersions?: readonly PrivateResumeVersionRecord[];
  careerFacts?: readonly Partial<CareerFact>[];
  careerEvidence?: readonly Partial<CareerEvidence>[];
  comparisonSourceInputs?: readonly RawJobSourceInput[];
};

export type JobDescriptionIntakeReadModel = {
  schemaVersion: typeof JOB_DESCRIPTION_INTAKE_READ_MODEL_SCHEMA_VERSION;
  workflowVersion: typeof JOB_DESCRIPTION_INTAKE_BRIDGE_VERSION;
  generatedAt: string;
  state: JobDescriptionIntakeState;
  intakeMode: JobDescriptionIntakeMode;
  company: string | null;
  role: string | null;
  sourceUrlKnown: boolean;
  canonicalUrl: string | null;
  queueItemState: JobSourceImportQueueItem["state"] | null;
  duplicateResult: JobSourceImportQueueItem["duplicateResult"] | null;
  existingApplicationStatus: JobSourceImportQueueItem["existingApplicationStatus"] | null;
  opportunityId: string | null;
  recommendation: string | null;
  explainableFit: string | null;
  recommendedResumeVersion: string | null;
  nextAction: string | null;
  missingSkillCount: number;
  supportingEvidenceCount: number;
  sourceDigestPrefix: string | null;
  descriptionDigestPrefix: string | null;
  limitations: string[];
  rawDescriptionVisible: false;
  privatePathVisible: false;
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
};

export type JobDescriptionIntakeBridgeResult = {
  schemaVersion: typeof JOB_DESCRIPTION_INTAKE_BRIDGE_SCHEMA_VERSION;
  workflowVersion: typeof JOB_DESCRIPTION_INTAKE_BRIDGE_VERSION;
  generatedAt: string;
  state: JobDescriptionIntakeState;
  intakeMode: JobDescriptionIntakeMode;
  urlValidation: {
    inputProvided: boolean;
    valid: boolean;
    canonicalUrl: string | null;
    error: "MALFORMED_URL" | "UNSUPPORTED_URL_SCHEME" | null;
  };
  httpRetrieval: {
    attempted: false;
    status: "NOT_ATTEMPTED";
    reason: string;
  };
  rawInput: RawJobSourceInput | null;
  normalizedSourceRecord: NormalizedJobSourceRecord | null;
  queueItem: JobSourceImportQueueItem | null;
  queueResult: PrivateJobSourceImportQueueResult | null;
  normalizedOpportunity: PrivateNormalizedJobOpportunity | null;
  analysisBundle: PrivateJobAnalysisBundle | null;
  recommendationResult: OpportunityRecommendationResult | null;
  readModel: JobDescriptionIntakeReadModel;
  auditSummary: {
    generatedAt: string;
    reusedPrivateJobSourceImportQueue: true;
    reusedJobOpportunityContract: true;
    reusedDuplicateDetection: true;
    reusedExistingApplicationDetection: true;
    reusedExplainableFit: true;
    reusedOpportunityRecommendationEngine: true;
    urlOnlyFailsClosed: true;
    descriptionRequiredForGenericUrl: true;
    noExternalNetwork: true;
    noAuthenticatedAccess: true;
    noCookies: true;
    noBrowserAutomation: true;
    noExternalAi: true;
    noOllama: true;
    noApplicationCreated: true;
    noApplicationSubmitted: true;
    noResumeGenerated: true;
    noResumeMutated: true;
    noCoverLetterGenerated: true;
    noMessageSent: true;
    privatePathVisible: false;
    rawDescriptionVisible: false;
    limitations: string[];
  };
};

export type JobDescriptionIntakeWriteResult = {
  runDirectory: string;
  artifactNames: string[];
  writtenFiles: string[];
  pipelineArtifactNames: string[];
  pipelineWrittenFiles: string[];
  privatePathVisible: false;
};

const DEFAULT_JOB_SEARCH_PRIVATE_ROOT = path.join(
  homedir(),
  ".staffordos/private/professional/job-search",
);

function sha256Text(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function compactTimestamp(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).replace(/[^0-9a-f]/g, "").slice(0, 14);
}

function optionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function uniqueStrings(values: readonly (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim().length))));
}

function canonicalHttpsUrl(input: string | null) {
  if (!input) {
    return {
      inputProvided: false,
      valid: false,
      canonicalUrl: null,
      error: null,
    } as const;
  }

  try {
    const parsed = new URL(input);
    parsed.hash = "";
    if (parsed.protocol !== "https:") {
      return {
        inputProvided: true,
        valid: false,
        canonicalUrl: null,
        error: "UNSUPPORTED_URL_SCHEME",
      } as const;
    }
    return {
      inputProvided: true,
      valid: true,
      canonicalUrl: parsed.toString(),
      error: null,
    } as const;
  } catch (_error) {
    return {
      inputProvided: true,
      valid: false,
      canonicalUrl: null,
      error: "MALFORMED_URL",
    } as const;
  }
}

function intakeMode(input: { sourceUrl?: string | null; jobDescriptionText?: string | null }): JobDescriptionIntakeMode {
  const url = optionalText(input.sourceUrl);
  const description = optionalText(input.jobDescriptionText);
  if (url && description) return "URL_PLUS_DESCRIPTION";
  if (url) return "URL_ONLY";
  return "PASTED_DESCRIPTION";
}

const FIELD_LABELS: Array<[keyof Pick<
  JobDescriptionIntakeInput,
  | "company"
  | "title"
  | "location"
  | "remoteState"
  | "employmentType"
  | "compensationText"
  | "publicationDate"
  | "requisitionId"
>, RegExp]> = [
  ["company", /^(company|employer|organization)\s*:\s*(.+)$/i],
  ["title", /^(role|title|position|job title)\s*:\s*(.+)$/i],
  ["location", /^(location|locations)\s*:\s*(.+)$/i],
  ["remoteState", /^(remote|work arrangement|workplace)\s*:\s*(.+)$/i],
  ["employmentType", /^(employment type|job type|type)\s*:\s*(.+)$/i],
  ["compensationText", /^(compensation|salary|pay range|base pay)\s*:\s*(.+)$/i],
  ["publicationDate", /^(published|posted|date posted|publication date)\s*:\s*(.+)$/i],
  ["requisitionId", /^(requisition|req id|job id|requisition id)\s*:\s*(.+)$/i],
];

function extractLabeledFields(description: string | null) {
  const extracted: Partial<Record<keyof JobDescriptionIntakeInput, string>> = {};
  if (!description) return extracted;
  for (const line of description.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const [field, pattern] of FIELD_LABELS) {
      const match = trimmed.match(pattern);
      if (match && !extracted[field]) {
        extracted[field] = match[2].trim();
      }
    }
  }
  return extracted;
}

function providerNameForUrl(url: string | null, supplied: string | null) {
  if (supplied) return supplied;
  if (!url) return "Operator pasted job description";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_error) {
    return "Operator pasted job URL";
  }
}

function buildRawInput(options: JobDescriptionIntakeBridgeOptions, canonicalUrl: string | null): RawJobSourceInput {
  const description = optionalText(options.jobDescriptionText);
  const extracted = extractLabeledFields(description);
  const providerName = providerNameForUrl(canonicalUrl, optionalText(options.providerName));
  return {
    accessMode: canonicalUrl ? "OPERATOR_PASTED_URL" : "OPERATOR_PASTED_TEXT",
    providerId: optionalText(options.providerId) || (canonicalUrl ? "EMPLOYER_CAREER_SITE" : "OPERATOR_PASTED_TEXT"),
    providerName,
    providerType: canonicalUrl ? "EMPLOYER_CAREER_SITE" : "OTHER",
    sourceUrl: canonicalUrl,
    sourceText: description,
    importedJson: null,
    observedAt: options.generatedAt,
    providerJobId: optionalText(options.providerJobId),
    publicationDate: optionalText(options.publicationDate) || optionalText(extracted.publicationDate),
    title: optionalText(options.title) || optionalText(extracted.title),
    company: optionalText(options.company) || optionalText(extracted.company),
    location: optionalText(options.location) || optionalText(extracted.location),
    remoteState: optionalText(options.remoteState) || optionalText(extracted.remoteState),
    employmentType: optionalText(options.employmentType) || optionalText(extracted.employmentType),
    compensationText: optionalText(options.compensationText) || optionalText(extracted.compensationText),
    descriptionText: description,
    requisitionId: optionalText(options.requisitionId) || optionalText(extracted.requisitionId),
    sourceAuthority: "OPERATOR_SUPPLIED_READ_ONLY",
    limitations: [
      "Operator supplied this job source for private CareerOS analysis.",
      canonicalUrl
        ? "The URL is retained as provenance; StaffordOS did not fetch the page in this bridge."
        : "No canonical public URL was supplied, so canonical JobOpportunity import requires operator review.",
      "Raw job description remains owner-private and outside Git.",
    ],
  };
}

function bridgeState(input: {
  queueItem: JobSourceImportQueueItem | null;
  normalizedOpportunity: PrivateNormalizedJobOpportunity | null;
}) {
  if (!input.queueItem) return "NORMALIZED" as const;
  if (input.normalizedOpportunity) return "IMPORTED_FOR_ANALYSIS" as const;
  if (input.queueItem.state === "READY_FOR_OPPORTUNITY_IMPORT") return "READY_FOR_OPERATOR_APPROVAL" as const;
  if (input.queueItem.state === "DUPLICATE") return "DUPLICATE" as const;
  if (input.queueItem.state === "EXISTING_APPLICATION") return "EXISTING_APPLICATION" as const;
  return "NEEDS_OPERATOR_REVIEW" as const;
}

function manualNotAppliedEvent(opportunityId: string): ManualApplicationEvent {
  return {
    schemaVersion: "staffordos.job_search.private_application_event.v1",
    opportunityId,
    applicationState: "NOT_APPLIED",
    submissionChannel: "NOT_APPLICABLE",
    submittedBy: "Unknown",
    submittedAt: null,
    resumeFilenameUsed: null,
    coverLetterStatus: "UNKNOWN",
    operatorAuthority: "NEEDS_OPERATOR_CONFIRMATION",
    currentEmployerResponse: "UNKNOWN",
    nextFollowUpReviewDate: null,
    limitations: [
      "This event is an analysis boundary marker only.",
      "The job description intake bridge did not create or submit an Application.",
    ],
    submittedByStaffordOS: false,
  };
}

function buildAnalysisBundle(input: {
  opportunity: PrivateNormalizedJobOpportunity;
  record: NormalizedJobSourceRecord;
  careerFacts: readonly Partial<CareerFact>[];
  careerEvidence: readonly Partial<CareerEvidence>[];
  generatedAt: string;
}) {
  return buildPrivateJobAnalysisBundle({
    opportunity: input.opportunity,
    intakeRecord: {
      listingText: input.record.descriptionText,
      sourceSummary: `Operator-supplied job description for ${input.record.company} / ${input.record.title}.`,
      sourceObservedAt: input.record.observedAt,
      roleTitle: input.record.title,
      companyName: input.record.company,
      location: input.record.location,
      workArrangement: input.record.remoteState,
      compensationText: input.record.compensationText,
      employmentType: input.record.employmentType,
    },
    careerFacts: input.careerFacts,
    careerEvidence: input.careerEvidence,
    generatedAt: input.generatedAt,
    applicationEvent: manualNotAppliedEvent(input.opportunity.id),
  });
}

function recommendationInputFromAnalysis(input: {
  queueItem: JobSourceImportQueueItem;
  analysisBundle: PrivateJobAnalysisBundle;
}) {
  return {
    queueItemId: input.queueItem.queueItemId,
    sourceRecordId: input.queueItem.sourceRecordId,
    opportunityId: input.analysisBundle.opportunity.id,
    fitAssessment: input.analysisBundle.fitAssessment,
    requirements: input.analysisBundle.requirements,
    mappings: input.analysisBundle.mappings,
    limitations: [
      "Explainable Fit was built from operator-supplied job description intake.",
      "No application, resume, cover letter, message, provider login, or browser action was performed.",
    ],
  };
}

function buildReadModel(input: {
  generatedAt: string;
  state: JobDescriptionIntakeState;
  mode: JobDescriptionIntakeMode;
  canonicalUrl: string | null;
  record: NormalizedJobSourceRecord | null;
  queueItem: JobSourceImportQueueItem | null;
  opportunity: PrivateNormalizedJobOpportunity | null;
  analysisBundle: PrivateJobAnalysisBundle | null;
  recommendationResult: OpportunityRecommendationResult | null;
  limitations: string[];
}): JobDescriptionIntakeReadModel {
  const recommendation =
    input.recommendationResult?.recommendations.find(
      (item) =>
        item.queueItemId === input.queueItem?.queueItemId ||
        item.opportunityId === input.opportunity?.id,
    ) || null;
  return {
    schemaVersion: JOB_DESCRIPTION_INTAKE_READ_MODEL_SCHEMA_VERSION,
    workflowVersion: JOB_DESCRIPTION_INTAKE_BRIDGE_VERSION,
    generatedAt: input.generatedAt,
    state: input.state,
    intakeMode: input.mode,
    company: input.record?.company === "UNKNOWN" ? null : input.record?.company || null,
    role: input.record?.title === "UNKNOWN" ? null : input.record?.title || null,
    sourceUrlKnown: Boolean(input.canonicalUrl),
    canonicalUrl: input.canonicalUrl,
    queueItemState: input.queueItem?.state || null,
    duplicateResult: input.queueItem?.duplicateResult || null,
    existingApplicationStatus: input.queueItem?.existingApplicationStatus || null,
    opportunityId: input.opportunity?.id || null,
    recommendation: recommendation?.recommendation || null,
    explainableFit: input.analysisBundle?.fitAssessment.finalRecommendation || null,
    recommendedResumeVersion: recommendation?.recommendedResumeVersion.safeLabel || null,
    nextAction: recommendation?.recommendedNextAction || input.analysisBundle?.nextAction.action || input.queueItem?.recommendedAction || null,
    missingSkillCount: recommendation?.missingSkills.length || 0,
    supportingEvidenceCount: recommendation?.supportingCareerEvidence.length || 0,
    sourceDigestPrefix: input.record?.sourceDigest.slice(0, 19) || null,
    descriptionDigestPrefix: input.record?.descriptionDigest.slice(0, 19) || null,
    limitations: input.limitations,
    rawDescriptionVisible: false,
    privatePathVisible: false,
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
  };
}

function blockedResult(input: {
  generatedAt: string;
  mode: JobDescriptionIntakeMode;
  state: "DESCRIPTION_REQUIRED" | "MALFORMED_URL" | "UNSUPPORTED_URL_SCHEME";
  urlValidation: JobDescriptionIntakeBridgeResult["urlValidation"];
  limitations: string[];
}): JobDescriptionIntakeBridgeResult {
  const readModel = buildReadModel({
    generatedAt: input.generatedAt,
    state: input.state,
    mode: input.mode,
    canonicalUrl: input.urlValidation.canonicalUrl,
    record: null,
    queueItem: null,
    opportunity: null,
    analysisBundle: null,
    recommendationResult: null,
    limitations: input.limitations,
  });
  return {
    schemaVersion: JOB_DESCRIPTION_INTAKE_BRIDGE_SCHEMA_VERSION,
    workflowVersion: JOB_DESCRIPTION_INTAKE_BRIDGE_VERSION,
    generatedAt: input.generatedAt,
    state: input.state,
    intakeMode: input.mode,
    urlValidation: input.urlValidation,
    httpRetrieval: {
      attempted: false,
      status: "NOT_ATTEMPTED",
      reason: "Generic URL retrieval is not enabled in this bridge; paste the job description with the URL.",
    },
    rawInput: null,
    normalizedSourceRecord: null,
    queueItem: null,
    queueResult: null,
    normalizedOpportunity: null,
    analysisBundle: null,
    recommendationResult: null,
    readModel,
    auditSummary: auditSummary(input.generatedAt, input.limitations),
  };
}

function auditSummary(generatedAt: string, limitations: string[]) {
  return {
    generatedAt,
    reusedPrivateJobSourceImportQueue: true,
    reusedJobOpportunityContract: true,
    reusedDuplicateDetection: true,
    reusedExistingApplicationDetection: true,
    reusedExplainableFit: true,
    reusedOpportunityRecommendationEngine: true,
    urlOnlyFailsClosed: true,
    descriptionRequiredForGenericUrl: true,
    noExternalNetwork: true,
    noAuthenticatedAccess: true,
    noCookies: true,
    noBrowserAutomation: true,
    noExternalAi: true,
    noOllama: true,
    noApplicationCreated: true,
    noApplicationSubmitted: true,
    noResumeGenerated: true,
    noResumeMutated: true,
    noCoverLetterGenerated: true,
    noMessageSent: true,
    privatePathVisible: false,
    rawDescriptionVisible: false,
    limitations,
  } satisfies JobDescriptionIntakeBridgeResult["auditSummary"];
}

export function buildJobDescriptionIntakeBridge(
  options: JobDescriptionIntakeBridgeOptions,
): JobDescriptionIntakeBridgeResult {
  const mode = intakeMode(options);
  const description = optionalText(options.jobDescriptionText);
  const urlValidation = canonicalHttpsUrl(optionalText(options.sourceUrl));

  if (urlValidation.inputProvided && !urlValidation.valid) {
    const state = urlValidation.error === "UNSUPPORTED_URL_SCHEME" ? "UNSUPPORTED_URL_SCHEME" : "MALFORMED_URL";
    return blockedResult({
      generatedAt: options.generatedAt,
      mode,
      state,
      urlValidation,
      limitations: [
        state === "MALFORMED_URL" ? "The supplied job URL is malformed." : "Only HTTPS job URLs are supported.",
        "No source was normalized and no opportunity was created.",
      ],
    });
  }

  if (!description) {
    return blockedResult({
      generatedAt: options.generatedAt,
      mode,
      state: "DESCRIPTION_REQUIRED",
      urlValidation,
      limitations: [
        "URL-only intake fails closed because this bridge does not perform generic page retrieval.",
        "Paste the public job description with the URL to preserve provenance and normalize safely.",
      ],
    });
  }

  const rawInput = buildRawInput(options, urlValidation.canonicalUrl);
  const queueResult = buildPrivateJobSourceImportQueue({
    inputs: [rawInput, ...(options.comparisonSourceInputs || [])],
    applications: options.applications || [],
    generatedAt: options.generatedAt,
  });
  const queueItem = queueResult.importQueue[0] || null;
  const normalizedSourceRecord =
    queueItem
      ? queueResult.normalizedSourceRecords.find((record) => record.jobSourceRecordId === queueItem.sourceRecordId) || null
      : null;
  let normalizedOpportunity: PrivateNormalizedJobOpportunity | null = null;
  if (queueItem && options.operatorApprovedForOpportunityImport && queueItem.state === "READY_FOR_OPPORTUNITY_IMPORT") {
    normalizedOpportunity =
      approveJobSourceImport({
        result: queueResult,
        queueItemId: queueItem.queueItemId,
        decisionType: "APPROVE_IMPORT_OPPORTUNITY",
        generatedAt: options.generatedAt,
      }).normalizedOpportunity || null;
  }

  const analysisBundle =
    normalizedOpportunity && normalizedSourceRecord
      ? buildAnalysisBundle({
          opportunity: normalizedOpportunity,
          record: normalizedSourceRecord,
          careerFacts: options.careerFacts || [],
          careerEvidence: options.careerEvidence || [],
          generatedAt: options.generatedAt,
        })
      : null;
  const explainableFitArtifacts = queueItem && analysisBundle
    ? [recommendationInputFromAnalysis({ queueItem, analysisBundle })]
    : [];
  const recommendationResult = buildOpportunityRecommendationEngine({
    generatedAt: options.generatedAt,
    queueResult,
    explainableFitArtifacts,
    resumeVersions: options.resumeVersions || [],
  });
  const state = bridgeState({ queueItem, normalizedOpportunity });
  const limitations = uniqueStrings([
    "Job description intake reused the existing private Job Source Import Queue.",
    normalizedOpportunity
      ? "Ross operator approval imported a private JobOpportunity candidate only."
      : "No canonical JobOpportunity was imported without a ready queue item and operator approval.",
    analysisBundle ? null : "Explainable Fit requires a canonical JobOpportunity produced from a ready queue item.",
    "No Application was created or submitted.",
    "No resume, cover letter, message, browser automation, external AI, or provider login was used.",
    ...(normalizedSourceRecord?.limitations || []),
    ...(queueItem?.limitations || []),
  ]);

  const readModel = buildReadModel({
    generatedAt: options.generatedAt,
    state,
    mode,
    canonicalUrl: urlValidation.canonicalUrl,
    record: normalizedSourceRecord,
    queueItem,
    opportunity: normalizedOpportunity,
    analysisBundle,
    recommendationResult,
    limitations,
  });

  return {
    schemaVersion: JOB_DESCRIPTION_INTAKE_BRIDGE_SCHEMA_VERSION,
    workflowVersion: JOB_DESCRIPTION_INTAKE_BRIDGE_VERSION,
    generatedAt: options.generatedAt,
    state,
    intakeMode: mode,
    urlValidation,
    httpRetrieval: {
      attempted: false,
      status: "NOT_ATTEMPTED",
      reason: "Generic URL retrieval is not enabled in this bridge; paste the job description with the URL.",
    },
    rawInput,
    normalizedSourceRecord,
    queueItem,
    queueResult,
    normalizedOpportunity,
    analysisBundle,
    recommendationResult,
    readModel,
    auditSummary: auditSummary(options.generatedAt, limitations),
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

export function writeJobDescriptionIntakeBridgeOutputs(input: {
  jobSearchRoot?: string;
  repositoryRoot: string;
  result: JobDescriptionIntakeBridgeResult;
  writePipelineOutputs?: boolean;
}): JobDescriptionIntakeWriteResult {
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  assertOutsideRepository(jobSearchRoot, input.repositoryRoot, "Private job description intake output root");
  const outputRoot = path.join(jobSearchRoot, "job-description-intake");
  const runDirectory = path.join(
    outputRoot,
    `${JOB_DESCRIPTION_INTAKE_BRIDGE_VERSION}_${compactTimestamp(input.result.generatedAt)}`,
  );
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "job_description_intake_result.private.json": input.result,
    "job_description_intake_read_model.private.json": input.result.readModel,
    "job_description_intake_audit.private.json": input.result.auditSummary,
  };

  const writtenFiles: string[] = [];
  for (const [name, value] of Object.entries(artifacts)) {
    const filePath = path.join(runDirectory, name);
    writeJson(filePath, value);
    writtenFiles.push(filePath);
  }

  const pipelineWrittenFiles: string[] = [];
  const pipelineArtifactNames: string[] = [];
  if (input.writePipelineOutputs) {
    if (input.result.queueResult) {
      const queueFiles = writePrivateJobSourceImportQueueOutputs({
        outputRoot: path.join(jobSearchRoot, "job-source-import"),
        repositoryRoot: input.repositoryRoot,
        result: input.result.queueResult,
      });
      pipelineWrittenFiles.push(...queueFiles);
      pipelineArtifactNames.push("job-source-import");
    }
    if (input.result.normalizedOpportunity) {
      const written = writePrivateNormalizedJobOpportunity(
        input.result.normalizedOpportunity,
        path.join(jobSearchRoot, "opportunities"),
        input.repositoryRoot,
      );
      if (!written.ok) {
        throw new Error(`Opportunity write failed: ${written.errors.map((error) => error.code).join(", ")}`);
      }
      if (written.outputPath) pipelineWrittenFiles.push(written.outputPath);
      pipelineArtifactNames.push("opportunity");
    }
    if (input.result.analysisBundle) {
      const analysisWrite = writePrivateJobAnalysisBundle(input.result.analysisBundle, {
        outputRoot: path.join(jobSearchRoot, "analysis"),
        repositoryRoot: input.repositoryRoot,
      });
      pipelineWrittenFiles.push(...analysisWrite.privateArtifacts);
      pipelineArtifactNames.push(...analysisWrite.privateArtifactNames.map((name) => `analysis/${name}`));
    }
    if (input.result.recommendationResult) {
      const recommendationWrite = writeOpportunityRecommendationOutputs({
        outputRoot: path.join(jobSearchRoot, "opportunity-recommendations"),
        repositoryRoot: input.repositoryRoot,
        result: input.result.recommendationResult,
      });
      pipelineWrittenFiles.push(...recommendationWrite.writtenFiles);
      pipelineArtifactNames.push(...recommendationWrite.artifactNames.map((name) => `recommendation/${name}`));
    }
  }

  return {
    runDirectory,
    artifactNames: Object.keys(artifacts),
    writtenFiles,
    pipelineArtifactNames,
    pipelineWrittenFiles,
    privatePathVisible: false,
  };
}

function readJson(filePath: string) {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

function latestDirectory(parent: string) {
  if (!existsSync(parent)) return null;
  const entries = readdirSync(parent)
    .map((name) => path.join(parent, name))
    .filter((candidate) => {
      try {
        return statSync(candidate).isDirectory();
      } catch (_error) {
        return false;
      }
    })
    .sort((a, b) => b.localeCompare(a));
  return entries[0] || null;
}

export function loadLatestResumeVersionsFromPrivateArtifacts(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  const root = latestDirectory(path.join(jobSearchRoot, "resume-asset-reconciliation"));
  if (!root) return [] as PrivateResumeVersionRecord[];
  const filePath = path.join(root, "resume_versions.json");
  if (!existsSync(filePath)) return [] as PrivateResumeVersionRecord[];
  const value = readJson(filePath);
  return Array.isArray(value) ? (value as PrivateResumeVersionRecord[]) : [];
}

export function loadApplicationComparisonsFromPrivateArtifacts(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  const root = latestDirectory(path.join(jobSearchRoot, "application-pipeline-review"));
  if (!root) return [] as Partial<PrivateApplicationRecord>[];
  const readModelPath = path.join(root, "future_ui_read_model.json");
  if (!existsSync(readModelPath)) return [] as Partial<PrivateApplicationRecord>[];
  const value = readJson(readModelPath);
  if (!isRecord(value) || !Array.isArray(value.applications)) return [] as Partial<PrivateApplicationRecord>[];
  return value.applications
    .filter(isRecord)
    .map((item): Partial<PrivateApplicationRecord> => ({
      applicationId: optionalText(item.applicationId) || optionalText(item.id) || `private_application_${sha256Text(JSON.stringify(item)).slice(7, 19)}`,
      companyReference: {
        label: optionalText(item.company) || optionalText(item.companyName) || "UNKNOWN",
        requisitionAlias: optionalText(item.jobId) || optionalText(item.requisitionId),
      },
      roleReference: {
        title: optionalText(item.role) || optionalText(item.roleTitle) || "UNKNOWN",
      },
    }));
}

export function loadJsonArrayFile<T = unknown>(filePath: string | null | undefined) {
  if (!filePath) return [] as T[];
  const value = readJson(filePath);
  return Array.isArray(value) ? (value as T[]) : [];
}

export function buildJobDescriptionIntakeCliSummary(
  result: JobDescriptionIntakeBridgeResult,
  writeResult?: JobDescriptionIntakeWriteResult | null,
) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    state: result.state,
    intakeMode: result.intakeMode,
    company: result.readModel.company || "UNKNOWN",
    role: result.readModel.role || "UNKNOWN",
    queueItemState: result.readModel.queueItemState,
    duplicateResult: result.readModel.duplicateResult,
    existingApplicationStatus: result.readModel.existingApplicationStatus,
    opportunityId: result.readModel.opportunityId,
    recommendation: result.readModel.recommendation,
    explainableFit: result.readModel.explainableFit,
    nextAction: result.readModel.nextAction,
    privateArtifactsWritten: writeResult ? writeResult.writtenFiles.length + writeResult.pipelineWrittenFiles.length : 0,
    rawDescriptionVisible: false,
    privatePathVisible: false,
    noApplicationCreated: true,
    noApplicationSubmitted: true,
    noResumeGenerated: true,
    noMessageSent: true,
    limitations: result.readModel.limitations,
  };
}

export function runJobDescriptionIntakeBridgeFromPrivateArtifacts(input: JobDescriptionIntakeInput & {
  generatedAt?: string;
  jobSearchRoot?: string;
  repositoryRoot?: string;
  writeOutputs?: boolean;
}) {
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  const repositoryRoot = input.repositoryRoot || process.cwd();
  const result = buildJobDescriptionIntakeBridge({
    ...input,
    generatedAt: input.generatedAt || new Date().toISOString(),
    applications: loadApplicationComparisonsFromPrivateArtifacts(jobSearchRoot),
    resumeVersions: loadLatestResumeVersionsFromPrivateArtifacts(jobSearchRoot),
  });
  const writeResult = input.writeOutputs
    ? writeJobDescriptionIntakeBridgeOutputs({
        jobSearchRoot,
        repositoryRoot,
        result,
        writePipelineOutputs: true,
      })
    : null;
  return { result, writeResult };
}

import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import { mapRequirementsToCareerEvidence, type PrivateRequirementEvidenceMapping } from "./candidateEvidenceMapper";
import { buildPrivateJobFitAssessment, type ManualApplicationEvent, type PrivateJobFitAssessment } from "./jobFitAssessment";
import { extractPrivateJobRequirements, type PrivateJobRequirementRecord } from "./jobRequirementExtractor";
import type { PrivateApplicationRecord } from "./manualApplicationEventTracking";
import {
  buildPrivateJobSourceImportQueue,
  type JobSourceImportQueueItem,
  type NormalizedJobSourceRecord,
  type PrivateJobSourceImportQueueResult,
  type RawJobSourceInput,
} from "./privateJobSourceImportQueue";

export const GREENHOUSE_DISCOVERY_VERSION = "J002.02B";
export const GREENHOUSE_PROVIDER_MANIFEST_SCHEMA_VERSION =
  "staffordos.job_search.greenhouse_provider_manifest.v1";
export const GREENHOUSE_DISCOVERY_RESULT_SCHEMA_VERSION =
  "staffordos.job_search.greenhouse_discovery_result.v1";
export const GREENHOUSE_ELIGIBILITY_REVIEW_SCHEMA_VERSION =
  "staffordos.job_search.greenhouse_eligibility_review.v1";
export const GREENHOUSE_EXPLAINABLE_FIT_ARTIFACT_SCHEMA_VERSION =
  "staffordos.job_search.greenhouse_explainable_fit_artifact.v1";

export type GreenhouseManifestSource = {
  company: string;
  provider: "greenhouse";
  boardToken?: string | null;
  boardUrl?: string | null;
  enabled?: boolean;
  maxJobs?: number | null;
  limitations?: string[];
};

export type GreenhouseProviderManifest = {
  schemaVersion?: typeof GREENHOUSE_PROVIDER_MANIFEST_SCHEMA_VERSION;
  sources: GreenhouseManifestSource[];
  limitations?: string[];
};

export type GreenhouseFetchResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

export type GreenhouseFetch = (
  url: string,
  init: {
    method: "GET";
    headers: Record<string, string>;
  },
) => Promise<GreenhouseFetchResponse>;

export type GreenhouseJob = {
  id?: number | string | null;
  internal_job_id?: number | string | null;
  absolute_url?: string | null;
  title?: string | null;
  company_name?: string | null;
  first_published?: string | null;
  updated_at?: string | null;
  requisition_id?: string | null;
  content?: string | null;
  location?: {
    name?: string | null;
  } | null;
  departments?: Array<{
    id?: number | string | null;
    name?: string | null;
  }>;
  offices?: Array<{
    id?: number | string | null;
    name?: string | null;
  }>;
  metadata?: Array<{
    id?: number | string | null;
    name?: string | null;
    value?: unknown;
    value_type?: string | null;
  }>;
};

export type GreenhouseRetrievalResult = {
  retrievalId: string;
  company: string;
  provider: "greenhouse";
  boardToken: string;
  endpoint: string;
  retrievedAt: string;
  status: "RETRIEVED" | "FAILED";
  httpStatus: number | null;
  jobCount: number;
  jobs: GreenhouseJob[];
  limitations: string[];
  noAuthentication: true;
  noCookies: true;
  noBrowserAutomation: true;
  noScraping: true;
};

export type GreenhouseEligibilityReview = {
  schemaVersion: typeof GREENHOUSE_ELIGIBILITY_REVIEW_SCHEMA_VERSION;
  reviewId: string;
  providerJobId: string;
  company: string;
  title: string;
  location: string | null;
  status: "ELIGIBLE" | "REJECTED";
  reasons: string[];
  deterministicRulesOnly: true;
  successProbabilityGenerated: false;
  limitations: string[];
};

export type GreenhouseExplainableFitArtifact = {
  schemaVersion: typeof GREENHOUSE_EXPLAINABLE_FIT_ARTIFACT_SCHEMA_VERSION;
  artifactId: string;
  queueItemId: string;
  sourceRecordId: string;
  opportunityId: string;
  requirementCount: number;
  mappingCoverage: PrivateJobFitAssessment["coverage"];
  fitAssessment: PrivateJobFitAssessment;
  requirements: PrivateJobRequirementRecord[];
  mappings: PrivateRequirementEvidenceMapping[];
  existingFitEngine: "J001.03A_PRIVATE_JOB_FIT_ASSESSMENT";
  noCareerFactPromoted: true;
  noResumeGenerated: true;
  noApplicationSubmitted: true;
  noExternalAi: true;
  limitations: string[];
};

export type GreenhouseDiscoveryResult = {
  schemaVersion: typeof GREENHOUSE_DISCOVERY_RESULT_SCHEMA_VERSION;
  workflowVersion: typeof GREENHOUSE_DISCOVERY_VERSION;
  generatedAt: string;
  providerManifest: {
    schemaVersion: typeof GREENHOUSE_PROVIDER_MANIFEST_SCHEMA_VERSION;
    sourceCount: number;
    enabledGreenhouseSources: number;
    limitations: string[];
  };
  retrievals: GreenhouseRetrievalResult[];
  eligibilityReviews: GreenhouseEligibilityReview[];
  jobSourceImportQueue: PrivateJobSourceImportQueueResult;
  opportunityQueue: JobSourceImportQueueItem[];
  explainableFitArtifacts: GreenhouseExplainableFitArtifact[];
  summary: {
    companiesRequested: number;
    boardsRetrieved: number;
    boardsFailed: number;
    publishedJobsRetrieved: number;
    eligibleJobs: number;
    rejectedJobs: number;
    normalizedRecords: number;
    queueItems: number;
    readyForOpportunityImport: number;
    duplicateItems: number;
    existingApplicationItems: number;
    externalProviderCalls: number;
  };
  auditSummary: {
    publicGreenhouseApiOnly: true;
    noAuthentication: true;
    noCookies: true;
    noBrowserAutomation: true;
    noScraping: true;
    noApplicationSubmitted: true;
    noApplicationCreated: true;
    noResumeGenerated: true;
    noCoverLetterGenerated: true;
    noMessageSent: true;
    noExternalAi: true;
    noOllama: true;
    noLinkedIn: true;
    noWorkday: true;
    noLever: true;
    noAshby: true;
    noDeployment: true;
    noPush: true;
  };
};

export type GreenhouseDiscoveryOptions = {
  manifest: GreenhouseProviderManifest;
  generatedAt: string;
  applications?: readonly Partial<PrivateApplicationRecord>[];
  fetcher?: GreenhouseFetch;
  maxJobsPerSource?: number;
};

export const EXAMPLE_GREENHOUSE_PROVIDER_MANIFEST: GreenhouseProviderManifest = {
  schemaVersion: GREENHOUSE_PROVIDER_MANIFEST_SCHEMA_VERSION,
  sources: [
    {
      company: "Anthropic",
      provider: "greenhouse",
      boardToken: "anthropic",
    },
    {
      company: "Datadog",
      provider: "greenhouse",
      boardToken: "datadog",
    },
  ],
  limitations: [
    "Example manifest only; operators should maintain real monitored sources in owner-private storage.",
  ],
};

const TARGET_TITLE_OR_TEXT_PATTERNS = [
  /\bai\b/i,
  /\bagent/i,
  /\bautomation\b/i,
  /\bplatform\b/i,
  /\bgovernance\b/i,
  /\bresponsible ai\b/i,
  /\bproduct\b/i,
  /\bprogram\b/i,
  /\bbusiness technolog/i,
  /\bbusiness systems?\b/i,
  /\bdigital transformation\b/i,
  /\brevenue operations\b/i,
  /\brevops\b/i,
  /\bcrm\b/i,
  /\bmarketing technolog/i,
  /\bmarketing automation\b/i,
  /\bsalesforce\b/i,
  /\banalytics\b/i,
  /\bworkflow\b/i,
];

const TRADITIONAL_MARKETING_TITLE_PATTERNS = [
  /\bsocial media manager\b/i,
  /\bseo specialist\b/i,
  /\bppc specialist\b/i,
  /\bcontent marketing specialist\b/i,
  /\bemail marketing specialist\b/i,
  /\bmarketing coordinator\b/i,
];

const CLEARLY_UNRELATED_TITLE_PATTERNS = [
  /\baccount executive\b/i,
  /\bsales development representative\b/i,
  /\bbusiness development representative\b/i,
  /\brecruiter\b/i,
  /\btalent acquisition\b/i,
  /\bpeople partner\b/i,
  /\bhr business partner\b/i,
  /\blegal counsel\b/i,
  /\baccountant\b/i,
  /\bfinance manager\b/i,
  /\boffice manager\b/i,
  /\bexecutive assistant\b/i,
  /\bcustomer support\b/i,
  /\btechnical support\b/i,
  /\bfield marketing\b/i,
  /\bevents manager\b/i,
];

const SECURITY_CLEARANCE_PATTERNS = [
  /\bactive security clearance\b/i,
  /\bsecurity clearance required\b/i,
  /\bts\/sci\b/i,
  /\btop secret\b/i,
  /\bsecret clearance\b/i,
  /\bpolygraph\b/i,
  /\bmust be a u\.?s\.? citizen\b/i,
  /\bu\.?s\.? citizenship required\b/i,
];

const VISA_INCOMPATIBILITY_PATTERNS = [
  /\bmust be authorized to work in (?!the united states|u\.?s\.?|us\b)[a-z ,.-]+/i,
  /\brequires existing work authorization in (?!the united states|u\.?s\.?|us\b)[a-z ,.-]+/i,
];

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

function scalarText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return optionalText(value);
}

function stripHtml(value: string | null | undefined) {
  return (value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeCompanyToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function boardTokenFromUrl(value: string | null | undefined) {
  const urlText = optionalText(value);
  if (!urlText) return null;
  const patterns = [
    /boards-api\.greenhouse\.io\/v1\/boards\/([^/?#]+)/i,
    /boards\.greenhouse\.io\/([^/?#]+)/i,
    /job-boards\.greenhouse\.io\/([^/?#]+)/i,
  ];
  for (const pattern of patterns) {
    const match = urlText.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

export function greenhouseBoardTokenForSource(source: GreenhouseManifestSource) {
  return optionalText(source.boardToken) || boardTokenFromUrl(source.boardUrl) || normalizeCompanyToken(source.company);
}

export function greenhouseJobsEndpoint(boardToken: string) {
  return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
}

function metadataValue(job: GreenhouseJob, names: readonly RegExp[]) {
  for (const item of job.metadata || []) {
    const name = optionalText(item.name);
    if (!name || !names.some((pattern) => pattern.test(name))) continue;
    if (typeof item.value === "string") return optionalText(item.value);
    if (item.value && typeof item.value === "object" && !Array.isArray(item.value)) {
      const record = item.value as Record<string, unknown>;
      if (record.unit && (record.min_value || record.max_value)) {
        return `${record.unit} ${record.min_value ?? "UNKNOWN"}-${record.max_value ?? "UNKNOWN"}`;
      }
    }
  }
  return null;
}

function departmentText(job: GreenhouseJob) {
  const names = (job.departments || []).map((department) => optionalText(department.name)).filter(Boolean);
  return names.length ? names.join("; ") : metadataValue(job, [/department/i, /area/i, /cost center/i]);
}

function employmentType(job: GreenhouseJob) {
  return metadataValue(job, [/employment type/i, /time type/i]) || null;
}

function compensationText(job: GreenhouseJob) {
  return metadataValue(job, [/pay transparency/i, /salary/i, /compensation/i]) || null;
}

function remoteState(job: GreenhouseJob) {
  const metadata = metadataValue(job, [/location type/i, /remote/i, /work arrangement/i]);
  const location = optionalText(job.location?.name);
  const source = `${metadata || ""} ${location || ""}`;
  if (/\bremote\b|remote-friendly/i.test(source)) return "Remote or remote-friendly";
  if (/\bhybrid\b/i.test(source)) return "Hybrid";
  if (/\bon-?site\b/i.test(source)) return "On-site";
  return metadata;
}

function canonicalUrl(job: GreenhouseJob, boardToken: string) {
  const explicit = optionalText(job.absolute_url);
  if (explicit) return explicit;
  const id = scalarText(job.id);
  return id ? `https://boards.greenhouse.io/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(id)}` : null;
}

function jobDescription(job: GreenhouseJob) {
  return stripHtml(job.content);
}

function searchableJobText(job: GreenhouseJob) {
  return [
    job.title,
    job.company_name,
    job.location?.name,
    departmentText(job),
    employmentType(job),
    jobDescription(job),
  ]
    .filter(Boolean)
    .join(" ");
}

function targetSignalText(job: GreenhouseJob) {
  return [
    job.title,
    job.location?.name,
    departmentText(job),
    employmentType(job),
    jobDescription(job),
  ]
    .filter(Boolean)
    .join(" ");
}

function locationLooksUsCompatible(value: string | null | undefined) {
  const location = (value || "").toLowerCase();
  if (!location) return true;
  if (/\b(remote|remote-friendly|united states|usa|u\.s\.|us-remote|new york|ny\b|boston|massachusetts|ma\b|austin|texas|tx\b|san francisco|california|ca\b|seattle|washington,? dc|denver|colorado)\b/i.test(location)) {
    return true;
  }
  if (/\b(canada|uk|london|dublin|ireland|paris|france|germany|berlin|amsterdam|sydney|australia|india|brazil|singapore|japan|tokyo)\b/i.test(location)) {
    return false;
  }
  return true;
}

export function evaluateGreenhouseJobEligibility(job: GreenhouseJob, source: GreenhouseManifestSource): GreenhouseEligibilityReview {
  const providerJobId = scalarText(job.id) || opaqueId("greenhouse_job_unknown", [source.company, job.title, job.location?.name]);
  const title = optionalText(job.title) || "UNKNOWN";
  const company = optionalText(job.company_name) || source.company;
  const location = optionalText(job.location?.name);
  const jobText = searchableJobText(job);
  const reasons: string[] = [];

  if (!locationLooksUsCompatible(location)) reasons.push("LOCATION_INCOMPATIBLE");
  if (SECURITY_CLEARANCE_PATTERNS.some((pattern) => pattern.test(jobText))) reasons.push("SECURITY_CLEARANCE_REQUIRED");
  if (VISA_INCOMPATIBILITY_PATTERNS.some((pattern) => pattern.test(jobText))) reasons.push("VISA_REQUIREMENT_INCOMPATIBLE");
  if (TRADITIONAL_MARKETING_TITLE_PATTERNS.some((pattern) => pattern.test(title))) reasons.push("TRADITIONAL_MARKETING_SPECIALIST_ROLE");

  const hasTargetSignal = TARGET_TITLE_OR_TEXT_PATTERNS.some((pattern) => pattern.test(targetSignalText(job)));
  const clearlyUnrelated = CLEARLY_UNRELATED_TITLE_PATTERNS.some((pattern) => pattern.test(title));
  if (clearlyUnrelated) reasons.push("CLEARLY_UNRELATED_DISCIPLINE");

  return {
    schemaVersion: GREENHOUSE_ELIGIBILITY_REVIEW_SCHEMA_VERSION,
    reviewId: opaqueId("greenhouse_eligibility", [source.company, providerJobId, title, location]),
    providerJobId,
    company,
    title,
    location,
    status: reasons.length ? "REJECTED" : "ELIGIBLE",
    reasons,
    deterministicRulesOnly: true,
    successProbabilityGenerated: false,
    limitations: [
      "Eligibility filter is deterministic and conservative.",
      "Rejected source records are not deleted; they are excluded before ranking.",
      "Eligibility does not estimate employer interest, interview probability, offer probability, or success probability.",
      !hasTargetSignal ? "No explicit target-lane signal was found; ranking would be low or require operator review." : null,
    ].filter((value): value is string => Boolean(value)),
  };
}

function parseGreenhousePayload(payload: string) {
  const parsed = JSON.parse(payload) as { jobs?: unknown };
  return Array.isArray(parsed.jobs) ? (parsed.jobs as GreenhouseJob[]) : [];
}

function defaultFetcher(): GreenhouseFetch {
  const fetcher = globalThis.fetch;
  if (typeof fetcher !== "function") {
    throw new Error("Global fetch is unavailable; provide a GreenhouseFetch implementation.");
  }
  return (url, init) => fetcher(url, init) as Promise<GreenhouseFetchResponse>;
}

export async function retrieveGreenhousePublishedJobs(input: {
  source: GreenhouseManifestSource;
  retrievedAt: string;
  fetcher?: GreenhouseFetch;
}): Promise<GreenhouseRetrievalResult> {
  const boardToken = greenhouseBoardTokenForSource(input.source);
  const endpoint = greenhouseJobsEndpoint(boardToken);
  const retrievalId = opaqueId("greenhouse_retrieval", [input.source.company, boardToken, input.retrievedAt]);
  const fetcher = input.fetcher || defaultFetcher();

  try {
    const response = await fetcher(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "StaffordOS-CareerOperations-GreenhouseDiscovery/1.0",
      },
    });
    const body = await response.text();
    if (!response.ok) {
      return {
        retrievalId,
        company: input.source.company,
        provider: "greenhouse",
        boardToken,
        endpoint,
        retrievedAt: input.retrievedAt,
        status: "FAILED",
        httpStatus: response.status,
        jobCount: 0,
        jobs: [],
        limitations: [
          `Greenhouse public Job Board API returned HTTP ${response.status}.`,
          "No authentication, cookies, browser automation, or scraping was attempted.",
        ],
        noAuthentication: true,
        noCookies: true,
        noBrowserAutomation: true,
        noScraping: true,
      };
    }
    const jobs = parseGreenhousePayload(body);
    return {
      retrievalId,
      company: input.source.company,
      provider: "greenhouse",
      boardToken,
      endpoint,
      retrievedAt: input.retrievedAt,
      status: "RETRIEVED",
      httpStatus: response.status,
      jobCount: jobs.length,
      jobs,
      limitations: [
        "Retrieved through the public Greenhouse Job Board API.",
        "No authentication, cookies, browser automation, or scraping was attempted.",
      ],
      noAuthentication: true,
      noCookies: true,
      noBrowserAutomation: true,
      noScraping: true,
    };
  } catch (error) {
    return {
      retrievalId,
      company: input.source.company,
      provider: "greenhouse",
      boardToken,
      endpoint,
      retrievedAt: input.retrievedAt,
      status: "FAILED",
      httpStatus: null,
      jobCount: 0,
      jobs: [],
      limitations: [
        `Greenhouse public retrieval failed: ${error instanceof Error ? error.message : String(error)}`,
        "No fallback scraping, login, cookies, or browser automation was attempted.",
      ],
      noAuthentication: true,
      noCookies: true,
      noBrowserAutomation: true,
      noScraping: true,
    };
  }
}

export function normalizeGreenhouseJobToRawInput(input: {
  source: GreenhouseManifestSource;
  job: GreenhouseJob;
  boardToken: string;
  retrievedAt: string;
}): RawJobSourceInput {
  const providerJobId = scalarText(input.job.id) || opaqueId("greenhouse_job", [input.source.company, input.job.title, input.job.location?.name]);
  const department = departmentText(input.job);
  const location = optionalText(input.job.location?.name);
  const description = [
    jobDescription(input.job),
    department ? `Department: ${department}` : null,
    input.job.requisition_id ? `Requisition: ${input.job.requisition_id}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    accessMode: "PUBLIC_API",
    providerId: "GREENHOUSE",
    providerName: `Greenhouse public board: ${input.source.company}`,
    providerType: "GREENHOUSE",
    providerJobId,
    sourceUrl: canonicalUrl(input.job, input.boardToken),
    sourceText: description,
    observedAt: input.retrievedAt,
    publicationDate: optionalText(input.job.first_published),
    title: optionalText(input.job.title),
    company: optionalText(input.job.company_name) || input.source.company,
    location,
    remoteState: remoteState(input.job),
    employmentType: employmentType(input.job),
    compensationText: compensationText(input.job),
    descriptionText: description,
    requisitionId: optionalText(input.job.requisition_id),
    sourceAuthority: "PUBLIC_READ_ONLY_PROVIDER",
    importedJson: {
      provider: "greenhouse",
      boardToken: input.boardToken,
      providerJobId,
      requisitionId: optionalText(input.job.requisition_id),
      internalJobId: scalarText(input.job.internal_job_id),
      department,
      offices: (input.job.offices || []).map((office) => optionalText(office.name)).filter(Boolean),
      updatedAt: optionalText(input.job.updated_at),
    },
    limitations: [
      "Normalized from Greenhouse public Job Board API.",
      "Greenhouse application POST endpoint is not implemented or available.",
      "Raw job description remains owner-private and outside Git.",
    ],
  };
}

function notAppliedEvent(opportunityId: string): ManualApplicationEvent {
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
      "Discovery does not create or submit Applications.",
      "Ross must approve any future application action separately.",
    ],
    submittedByStaffordOS: false,
  };
}

function opportunityIdForQueueItem(item: JobSourceImportQueueItem) {
  return item.normalizedOpportunityCandidateId || item.queueItemId;
}

function buildExplainableFitArtifacts(input: {
  queue: PrivateJobSourceImportQueueResult;
  generatedAt: string;
}): GreenhouseExplainableFitArtifact[] {
  const recordsById = new Map(input.queue.normalizedSourceRecords.map((record) => [record.jobSourceRecordId, record]));

  return input.queue.importQueue.map((queueItem) => {
    const record = recordsById.get(queueItem.sourceRecordId);
    if (!record) throw new Error(`Missing normalized source record for ${queueItem.sourceRecordId}`);
    const opportunityId = opportunityIdForQueueItem(queueItem);
    const requirements = extractPrivateJobRequirements({
      jobOpportunityId: opportunityId,
      sourceId: record.jobSourceRecordId,
      listingText: record.descriptionText,
      sourceSummary: `${record.title} at ${record.company}`,
      locationText: record.location,
      workArrangement: record.remoteState,
      compensationText: record.compensationText,
      employmentType: record.employmentType,
      createdAt: input.generatedAt,
    });
    const mappings = mapRequirementsToCareerEvidence({
      requirements,
      careerFacts: [],
      careerEvidence: [],
      createdAt: input.generatedAt,
    });
    const fitAssessment = buildPrivateJobFitAssessment({
      opportunityId,
      requirements,
      mappings,
      applicationEvent: notAppliedEvent(opportunityId),
      createdAt: input.generatedAt,
    });

    return {
      schemaVersion: GREENHOUSE_EXPLAINABLE_FIT_ARTIFACT_SCHEMA_VERSION,
      artifactId: opaqueId("greenhouse_fit", [queueItem.queueItemId, record.sourceDigest, input.generatedAt]),
      queueItemId: queueItem.queueItemId,
      sourceRecordId: record.jobSourceRecordId,
      opportunityId,
      requirementCount: requirements.length,
      mappingCoverage: fitAssessment.coverage,
      fitAssessment,
      requirements,
      mappings,
      existingFitEngine: "J001.03A_PRIVATE_JOB_FIT_ASSESSMENT",
      noCareerFactPromoted: true,
      noResumeGenerated: true,
      noApplicationSubmitted: true,
      noExternalAi: true,
      limitations: [
        "Uses existing J001.03A fit-assessment primitive with deterministic requirement extraction.",
        "No private Career evidence is loaded by this discovery MVP.",
        "Mappings therefore remain missing or unknown until a later private analysis mission reviews evidence.",
      ],
    };
  });
}

function enabledGreenhouseSources(manifest: GreenhouseProviderManifest) {
  return (manifest.sources || []).filter(
    (source) => source.provider === "greenhouse" && source.enabled !== false && Boolean(optionalText(source.company)),
  );
}

export async function buildGreenhouseDiscoveryQueue(options: GreenhouseDiscoveryOptions): Promise<GreenhouseDiscoveryResult> {
  const sources = enabledGreenhouseSources(options.manifest);
  const retrievals: GreenhouseRetrievalResult[] = [];
  const eligibilityReviews: GreenhouseEligibilityReview[] = [];
  const rawInputs: RawJobSourceInput[] = [];

  for (const source of sources) {
    const retrieval = await retrieveGreenhousePublishedJobs({
      source,
      retrievedAt: options.generatedAt,
      fetcher: options.fetcher,
    });
    retrievals.push(retrieval);
    const maxJobs = source.maxJobs || options.maxJobsPerSource || retrieval.jobs.length;
    for (const job of retrieval.jobs.slice(0, maxJobs)) {
      const review = evaluateGreenhouseJobEligibility(job, source);
      eligibilityReviews.push(review);
      if (review.status === "ELIGIBLE") {
        rawInputs.push(
          normalizeGreenhouseJobToRawInput({
            source,
            job,
            boardToken: retrieval.boardToken,
            retrievedAt: options.generatedAt,
          }),
        );
      }
    }
  }

  const jobSourceImportQueue = buildPrivateJobSourceImportQueue({
    inputs: rawInputs,
    applications: options.applications || [],
    generatedAt: options.generatedAt,
  });
  const explainableFitArtifacts = buildExplainableFitArtifacts({
    queue: jobSourceImportQueue,
    generatedAt: options.generatedAt,
  });

  return {
    schemaVersion: GREENHOUSE_DISCOVERY_RESULT_SCHEMA_VERSION,
    workflowVersion: GREENHOUSE_DISCOVERY_VERSION,
    generatedAt: options.generatedAt,
    providerManifest: {
      schemaVersion: GREENHOUSE_PROVIDER_MANIFEST_SCHEMA_VERSION,
      sourceCount: options.manifest.sources.length,
      enabledGreenhouseSources: sources.length,
      limitations: [
        "Provider manifest is configuration only, not a plugin framework.",
        "Greenhouse board tokens may differ from company names and should be explicit when known.",
        ...(options.manifest.limitations || []),
      ],
    },
    retrievals,
    eligibilityReviews,
    jobSourceImportQueue,
    opportunityQueue: jobSourceImportQueue.importQueue,
    explainableFitArtifacts,
    summary: {
      companiesRequested: options.manifest.sources.length,
      boardsRetrieved: retrievals.filter((retrieval) => retrieval.status === "RETRIEVED").length,
      boardsFailed: retrievals.filter((retrieval) => retrieval.status === "FAILED").length,
      publishedJobsRetrieved: retrievals.reduce((count, retrieval) => count + retrieval.jobCount, 0),
      eligibleJobs: eligibilityReviews.filter((review) => review.status === "ELIGIBLE").length,
      rejectedJobs: eligibilityReviews.filter((review) => review.status === "REJECTED").length,
      normalizedRecords: jobSourceImportQueue.summary.normalizedRecords,
      queueItems: jobSourceImportQueue.summary.queueItems,
      readyForOpportunityImport: jobSourceImportQueue.summary.readyForOpportunityImport,
      duplicateItems: jobSourceImportQueue.summary.duplicateItems,
      existingApplicationItems: jobSourceImportQueue.summary.existingApplicationItems,
      externalProviderCalls: retrievals.length,
    },
    auditSummary: {
      publicGreenhouseApiOnly: true,
      noAuthentication: true,
      noCookies: true,
      noBrowserAutomation: true,
      noScraping: true,
      noApplicationSubmitted: true,
      noApplicationCreated: true,
      noResumeGenerated: true,
      noCoverLetterGenerated: true,
      noMessageSent: true,
      noExternalAi: true,
      noOllama: true,
      noLinkedIn: true,
      noWorkday: true,
      noLever: true,
      noAshby: true,
      noDeployment: true,
      noPush: true,
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

function compactTimestamp(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 14);
}

export function writeGreenhouseDiscoveryOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: GreenhouseDiscoveryResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private J002.02B Greenhouse discovery output root");
  const runDirectory = path.join(input.outputRoot, `J002_02B_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const files = {
    "greenhouse_provider_manifest_snapshot.json": input.result.providerManifest,
    "greenhouse_retrievals.json": input.result.retrievals.map((retrieval) => ({
      ...retrieval,
      jobs: retrieval.jobs.map((job) => ({
        id: job.id,
        internal_job_id: job.internal_job_id,
        title: job.title,
        company_name: job.company_name,
        location: job.location,
        first_published: job.first_published,
        updated_at: job.updated_at,
        requisition_id: job.requisition_id,
        absolute_url: job.absolute_url,
      })),
    })),
    "eligibility_reviews.json": input.result.eligibilityReviews,
    "job_source_import_queue.json": input.result.jobSourceImportQueue.importQueue,
    "opportunity_queue.json": input.result.opportunityQueue,
    "explainable_fit_artifacts.json": input.result.explainableFitArtifacts,
    "greenhouse_discovery_audit.json": input.result.auditSummary,
  };
  const written: string[] = [];
  for (const [filename, value] of Object.entries(files)) {
    const filePath = path.join(runDirectory, filename);
    writeJson(filePath, value);
    written.push(filePath);
  }
  return written;
}

export function loadGreenhouseProviderManifest(filePath: string): GreenhouseProviderManifest {
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as GreenhouseProviderManifest;
  return {
    schemaVersion: GREENHOUSE_PROVIDER_MANIFEST_SCHEMA_VERSION,
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    limitations: Array.isArray(parsed.limitations) ? parsed.limitations.map(String) : [],
  };
}

export function buildGreenhouseDiscoveryCliSummary(result: GreenhouseDiscoveryResult, writtenCount = 0) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    companiesRequested: result.summary.companiesRequested,
    boardsRetrieved: result.summary.boardsRetrieved,
    boardsFailed: result.summary.boardsFailed,
    publishedJobsRetrieved: result.summary.publishedJobsRetrieved,
    eligibleJobs: result.summary.eligibleJobs,
    rejectedJobs: result.summary.rejectedJobs,
    normalizedRecords: result.summary.normalizedRecords,
    queueItems: result.summary.queueItems,
    readyForOpportunityImport: result.summary.readyForOpportunityImport,
    duplicateItems: result.summary.duplicateItems,
    existingApplicationItems: result.summary.existingApplicationItems,
    externalProviderCalls: result.summary.externalProviderCalls,
    explainableFitArtifacts: result.explainableFitArtifacts.length,
    noAuthentication: result.auditSummary.noAuthentication,
    noCookies: result.auditSummary.noCookies,
    noBrowserAutomation: result.auditSummary.noBrowserAutomation,
    noScraping: result.auditSummary.noScraping,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noResumeGenerated: result.auditSummary.noResumeGenerated,
    noMessageSent: result.auditSummary.noMessageSent,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
    privateArtifactsWritten: writtenCount,
  };
}

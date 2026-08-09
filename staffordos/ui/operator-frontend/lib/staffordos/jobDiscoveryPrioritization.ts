import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import type { PrivateApplicationRecord } from "./manualApplicationEventTracking";

export const JOB_DISCOVERY_PRIORITIZATION_VERSION = "J002.01";
export const PRIVATE_DISCOVERED_OPPORTUNITY_SCHEMA_VERSION =
  "staffordos.job_search.private_discovered_opportunity.v1";
export const PRIVATE_OPPORTUNITY_QUEUE_SCHEMA_VERSION =
  "staffordos.job_search.private_opportunity_queue.v1";
export const PRIVATE_OPPORTUNITY_READ_MODEL_SCHEMA_VERSION =
  "staffordos.job_search.private_opportunity_read_model.v1";

export const JOB_DISCOVERY_PRIORITY_WEIGHTS = {
  aiAutomation: 45,
  businessTechnology: 25,
  productTpm: 15,
  marketingTechnology: 15,
} as const;

export const JOB_DISCOVERY_DIMENSIONS = [
  "AI_ENGINEERING",
  "AI_AUTOMATION",
  "AI_GOVERNANCE",
  "BUSINESS_TECHNOLOGY",
  "TECHNICAL_PRODUCT_MANAGEMENT",
  "TECHNICAL_PROGRAM_MANAGEMENT",
  "BUSINESS_SYSTEMS_ANALYSIS",
  "MARKETING_TECHNOLOGY",
  "REVOPS",
  "PLATFORM_OPERATIONS",
  "DIGITAL_TRANSFORMATION",
] as const;

export const OPPORTUNITY_DUPLICATE_STATUSES = [
  "NO_DUPLICATE",
  "EXACT_SOURCE_DUPLICATE",
  "SAME_PROVIDER_RECORD",
  "SAME_REQUISITION_ALIAS",
  "SAME_COMPANY_ROLE",
  "POSSIBLE_ROLE_VARIANT",
  "NEEDS_OPERATOR_REVIEW",
] as const;

export const APPLICATION_COMPARISON_STATUSES = [
  "NO_APPLICATION_MATCH",
  "EXISTING_APPLICATION_MATCH",
  "POSSIBLE_APPLICATION_DUPLICATE",
  "APPLICATION_STATUS_UNKNOWN",
] as const;

export const OPPORTUNITY_RECOMMENDED_ACTIONS = [
  "REVIEW_FOR_APPLICATION",
  "REVIEW_DUPLICATE_BEFORE_APPLICATION",
  "DO_NOT_APPLY_DUPLICATE",
  "NEEDS_OPERATOR_REVIEW",
  "LOW_PRIORITY_REVIEW",
] as const;

export const OPPORTUNITY_PRIORITY_TIERS = [
  "HIGH_PRIORITY_REVIEW",
  "MEDIUM_PRIORITY_REVIEW",
  "LOW_PRIORITY_REVIEW",
  "BLOCKED_DUPLICATE_APPLICATION",
  "NEEDS_OPERATOR_REVIEW",
] as const;

export type JobDiscoveryDimension = (typeof JOB_DISCOVERY_DIMENSIONS)[number];
export type OpportunityDuplicateStatus = (typeof OPPORTUNITY_DUPLICATE_STATUSES)[number];
export type ApplicationComparisonStatus = (typeof APPLICATION_COMPARISON_STATUSES)[number];
export type OpportunityRecommendedAction = (typeof OPPORTUNITY_RECOMMENDED_ACTIONS)[number];
export type OpportunityPriorityTier = (typeof OPPORTUNITY_PRIORITY_TIERS)[number];

export type MockJobDiscoveryProviderRecord = {
  providerName: string;
  providerRecordId: string | null;
  sourceUrl?: string | null;
  sourceObservedAt: string;
  publishedAt?: string | null;
  companyName: string;
  roleTitle: string;
  requisitionAlias?: string | null;
  locationText?: string | null;
  workArrangement?: string | null;
  employmentType?: string | null;
  description?: string | null;
  responsibilities?: string[];
  requirements?: string[];
  tags?: string[];
  limitations?: string[];
  testOnly?: boolean;
};

export type MockJobDiscoveryProviderAdapter = {
  adapterType: "MOCK_PROVIDER";
  providerName: string;
  load: () => readonly MockJobDiscoveryProviderRecord[];
};

export type PrivateDiscoveredOpportunity = {
  schemaVersion: typeof PRIVATE_DISCOVERED_OPPORTUNITY_SCHEMA_VERSION;
  opportunityId: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  sourceRecordId: string;
  providerName: string;
  providerRecordId: string | null;
  sourceUrl: string | null;
  sourceTextDigest: string;
  sourceAuthority: "MOCK_PROVIDER_ADAPTER";
  companyReference: {
    label: string;
    normalized: string;
    requisitionAlias: string | null;
  };
  roleReference: {
    title: string;
    normalized: string;
    deterministicRoleFamilies: JobDiscoveryDimension[];
  };
  locationText: string | null;
  workArrangement: string | null;
  employmentType: string | null;
  descriptionSummary: string;
  responsibilities: string[];
  requirements: string[];
  discoveredAt: string;
  publishedAt: string | null;
  duplicateStatus: OpportunityDuplicateStatus;
  duplicateGroupId: string | null;
  applicationComparison: OpportunityApplicationComparison;
  ranking: OpportunityRanking;
  recommendedAction: OpportunityRecommendedAction;
  priorityTier: OpportunityPriorityTier;
  privacy: "Professional owner-private";
  sourceFetchedByStaffordOS: false;
  providerExternalCallPerformed: false;
  noApplicationCreated: true;
  noApplicationSubmitted: true;
  noResumeGenerated: true;
  noResumeSubmitted: true;
  noCoverLetterGenerated: true;
  noRecruiterMessageSent: true;
  noExternalAi: true;
  noOllama: true;
  limitations: string[];
};

export type OpportunityApplicationComparison = {
  status: ApplicationComparisonStatus;
  matchingApplicationIds: string[];
  prevention: "DUPLICATE_APPLICATION_BLOCKED" | "REVIEW_REQUIRED" | "NONE";
  evidence: string[];
  limitations: string[];
  noEmployerInterestInferred: true;
  noFitInferred: true;
};

export type OpportunityRankingComponent = {
  componentId: keyof typeof JOB_DISCOVERY_PRIORITY_WEIGHTS;
  label: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  matchedDimensions: JobDiscoveryDimension[];
  matchedTerms: string[];
  explanation: string;
};

export type OpportunityRanking = {
  totalScore: number;
  maxScore: 100;
  components: OpportunityRankingComponent[];
  explanation: {
    whyRecommended: string[];
    known: string[];
    unknown: string[];
    limitations: string[];
  };
  deterministicRulesOnly: true;
  externalAiUsed: false;
  successProbabilityGenerated: false;
  interviewProbabilityGenerated: false;
  employerInterestInferred: false;
};

export type OpportunityDuplicateReviewRecord = {
  duplicateGroupId: string;
  classification: OpportunityDuplicateStatus;
  memberOpportunityIds: string[];
  canonicalOpportunityId: string;
  evidence: string[];
  limitations: string[];
  silentlyMerged: false;
};

export type OpportunityQueueItem = {
  rank: number;
  opportunityId: string;
  company: string;
  role: string;
  priorityTier: OpportunityPriorityTier;
  recommendedAction: OpportunityRecommendedAction;
  totalScore: number;
  duplicateStatus: OpportunityDuplicateStatus;
  applicationComparisonStatus: ApplicationComparisonStatus;
  whyRecommended: string[];
  authorityRequired: "ROSS_APPROVAL_BEFORE_APPLICATION";
  completionProof: string;
  limitations: string[];
};

export type OpportunityReadModelRecord = {
  schemaVersion: typeof PRIVATE_OPPORTUNITY_READ_MODEL_SCHEMA_VERSION;
  opportunityId: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  company: string;
  role: string;
  priorityTier: OpportunityPriorityTier;
  recommendedAction: OpportunityRecommendedAction;
  totalScore: number;
  duplicateStatus: OpportunityDuplicateStatus;
  applicationComparisonStatus: ApplicationComparisonStatus;
  discoveredAt: string;
  capturedAsOf: string;
  limitations: string[];
  sourceTextVisible: false;
  sourceUrlVisible: false;
  privatePathVisible: false;
  applicationActionAvailable: false;
  messageActionAvailable: false;
  connectedToOs: false;
  connectedToOperator: false;
};

export type PrivateOpportunityQueueResult = {
  schemaVersion: typeof PRIVATE_OPPORTUNITY_QUEUE_SCHEMA_VERSION;
  workflowVersion: typeof JOB_DISCOVERY_PRIORITIZATION_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  sourceAuthority: {
    mockedProviderAdaptersOnly: true;
    providerCount: number;
    externalProviderCalls: 0;
    browserAutomationUsed: false;
    entireInternetSearched: false;
  };
  opportunities: PrivateDiscoveredOpportunity[];
  duplicateReview: OpportunityDuplicateReviewRecord[];
  priorityQueue: OpportunityQueueItem[];
  readModel: OpportunityReadModelRecord[];
  summary: {
    importedOpportunities: number;
    duplicateGroups: number;
    existingApplicationMatches: number;
    possibleApplicationDuplicates: number;
    queueItemsReadyForReview: number;
    duplicateApplicationsPrevented: number;
    highestPriorityOpportunityId: string | null;
    vanityMetricGenerated: false;
    successProbabilityGenerated: false;
  };
  auditSummary: {
    noApplicationSubmitted: true;
    noResumeSubmitted: true;
    noResumeGenerated: true;
    noCoverLetterGenerated: true;
    noRecruiterMessageSent: true;
    noLinkedInMutated: true;
    noExternalProviderCall: true;
    noExternalAi: true;
    noOllama: true;
    noBrowserAutomation: true;
    noOsConnection: true;
    noOperatorConnection: true;
    opportunitySeparateFromApplication: true;
    privatePathVisible: false;
  };
};

type BuildQueueOptions = {
  providerAdapters: readonly MockJobDiscoveryProviderAdapter[];
  applications?: readonly Partial<PrivateApplicationRecord>[];
  existingOpportunities?: readonly PrivateDiscoveredOpportunity[];
  generatedAt: string;
};

type DuplicateCandidate = {
  opportunity: PrivateDiscoveredOpportunity;
  key: string;
  classification: OpportunityDuplicateStatus;
  evidence: string;
};

type DuplicateAssignment = {
  status: OpportunityDuplicateStatus;
  duplicateGroupId: string | null;
};

const CATEGORY_DEFINITIONS: Record<
  keyof typeof JOB_DISCOVERY_PRIORITY_WEIGHTS,
  {
    label: string;
    dimensions: JobDiscoveryDimension[];
  }
> = {
  aiAutomation: {
    label: "AI / Automation",
    dimensions: ["AI_ENGINEERING", "AI_AUTOMATION", "AI_GOVERNANCE"],
  },
  businessTechnology: {
    label: "Business Technology",
    dimensions: [
      "BUSINESS_TECHNOLOGY",
      "BUSINESS_SYSTEMS_ANALYSIS",
      "REVOPS",
      "PLATFORM_OPERATIONS",
      "DIGITAL_TRANSFORMATION",
    ],
  },
  productTpm: {
    label: "Product / TPM",
    dimensions: ["TECHNICAL_PRODUCT_MANAGEMENT", "TECHNICAL_PROGRAM_MANAGEMENT"],
  },
  marketingTechnology: {
    label: "Marketing Technology",
    dimensions: ["MARKETING_TECHNOLOGY"],
  },
};

const DIMENSION_KEYWORDS: Record<JobDiscoveryDimension, string[]> = {
  AI_ENGINEERING: [
    "ai engineering",
    "machine learning",
    "llm",
    "large language model",
    "agent",
    "ai agent",
    "prompt",
    "python",
    "api integration",
  ],
  AI_AUTOMATION: [
    "ai automation",
    "automation",
    "workflow automation",
    "process automation",
    "codex",
    "claude code",
    "chatgpt",
    "agentic",
  ],
  AI_GOVERNANCE: [
    "ai governance",
    "responsible ai",
    "model risk",
    "governance",
    "policy",
    "controls",
    "risk management",
  ],
  BUSINESS_TECHNOLOGY: [
    "business technology",
    "enterprise applications",
    "business applications",
    "technology enablement",
    "business process",
  ],
  TECHNICAL_PRODUCT_MANAGEMENT: [
    "product owner",
    "product manager",
    "product management",
    "roadmap",
    "backlog",
    "user stories",
    "requirements",
  ],
  TECHNICAL_PROGRAM_MANAGEMENT: [
    "technical program",
    "program manager",
    "program management",
    "cross functional",
    "delivery",
    "milestones",
    "pmp",
  ],
  BUSINESS_SYSTEMS_ANALYSIS: [
    "business analyst",
    "business systems analyst",
    "requirements gathering",
    "functional specifications",
    "process maps",
    "uat",
    "test coordination",
  ],
  MARKETING_TECHNOLOGY: [
    "marketing technology",
    "martech",
    "marketing automation",
    "campaign operations",
    "crm marketing",
    "lifecycle marketing",
  ],
  REVOPS: [
    "revops",
    "revenue operations",
    "sales operations",
    "customer operations",
    "pipeline operations",
    "gtm operations",
  ],
  PLATFORM_OPERATIONS: [
    "platform operations",
    "platform",
    "devops",
    "ci cd",
    "cloud",
    "systems integration",
    "integration",
  ],
  DIGITAL_TRANSFORMATION: [
    "digital transformation",
    "transformation",
    "process improvement",
    "change management",
    "modernization",
    "operating model",
  ],
};

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

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#/.\s-]/g, " ")
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchText(parts: readonly (string | null | undefined | readonly string[])[]) {
  return normalizeText(
    parts
      .flatMap((part) => (Array.isArray(part) ? part : [part]))
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(" "),
  );
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

function matchesTerm(source: string, term: string) {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;
  if (normalizedTerm.includes(" ")) return source.includes(normalizedTerm);
  return new RegExp(`(^|\\s)${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(source);
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function sourceDigest(record: MockJobDiscoveryProviderRecord) {
  const source = [
    record.companyName,
    record.roleTitle,
    record.requisitionAlias,
    record.description,
    ...(record.responsibilities || []),
    ...(record.requirements || []),
    ...(record.tags || []),
  ].join("|");
  return `sha256:${sha256Text(source)}`;
}

function descriptionSummary(record: MockJobDiscoveryProviderRecord) {
  const summary = text(record.description) || [...(record.responsibilities || []), ...(record.requirements || [])].join(" ");
  return summary.slice(0, 420);
}

function deterministicRoleFamilies(record: MockJobDiscoveryProviderRecord) {
  const source = searchText([
    record.roleTitle,
    record.description,
    record.responsibilities || [],
    record.requirements || [],
    record.tags || [],
  ]);
  return JOB_DISCOVERY_DIMENSIONS.filter((dimension) =>
    DIMENSION_KEYWORDS[dimension].some((keyword) => matchesTerm(source, keyword)),
  );
}

function createOpportunityFromProviderRecord(
  adapter: MockJobDiscoveryProviderAdapter,
  record: MockJobDiscoveryProviderRecord,
  generatedAt: string,
): PrivateDiscoveredOpportunity {
  const providerName = text(record.providerName) || adapter.providerName;
  const digest = sourceDigest(record);
  const sourceRecordId = opaqueId("privjobsrcdisc", [
    JOB_DISCOVERY_PRIORITIZATION_VERSION,
    providerName,
    record.providerRecordId,
    canonicalUrl(record.sourceUrl),
    digest,
  ]);
  const companyNormalized = normalizeText(record.companyName);
  const roleNormalized = normalizeText(record.roleTitle);
  const opportunityId = opaqueId("privjobdisc", [
    JOB_DISCOVERY_PRIORITIZATION_VERSION,
    providerName,
    record.providerRecordId,
    companyNormalized,
    roleNormalized,
    normalizeText(record.requisitionAlias || null),
  ]);

  return {
    schemaVersion: PRIVATE_DISCOVERED_OPPORTUNITY_SCHEMA_VERSION,
    opportunityId,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceRecordId,
    providerName,
    providerRecordId: optionalText(record.providerRecordId),
    sourceUrl: canonicalUrl(record.sourceUrl),
    sourceTextDigest: digest,
    sourceAuthority: "MOCK_PROVIDER_ADAPTER",
    companyReference: {
      label: text(record.companyName) || "UNKNOWN",
      normalized: companyNormalized,
      requisitionAlias: optionalText(record.requisitionAlias),
    },
    roleReference: {
      title: text(record.roleTitle) || "UNKNOWN",
      normalized: roleNormalized,
      deterministicRoleFamilies: deterministicRoleFamilies(record),
    },
    locationText: optionalText(record.locationText),
    workArrangement: optionalText(record.workArrangement),
    employmentType: optionalText(record.employmentType),
    descriptionSummary: descriptionSummary(record),
    responsibilities: [...(record.responsibilities || [])],
    requirements: [...(record.requirements || [])],
    discoveredAt: text(record.sourceObservedAt) || generatedAt,
    publishedAt: optionalText(record.publishedAt),
    duplicateStatus: "NEEDS_OPERATOR_REVIEW",
    duplicateGroupId: null,
    applicationComparison: {
      status: "APPLICATION_STATUS_UNKNOWN",
      matchingApplicationIds: [],
      prevention: "REVIEW_REQUIRED",
      evidence: ["Application comparison has not run yet."],
      limitations: ["No application state is inferred from opportunity discovery."],
      noEmployerInterestInferred: true,
      noFitInferred: true,
    },
    ranking: emptyRanking(),
    recommendedAction: "NEEDS_OPERATOR_REVIEW",
    priorityTier: "NEEDS_OPERATOR_REVIEW",
    privacy: "Professional owner-private",
    sourceFetchedByStaffordOS: false,
    providerExternalCallPerformed: false,
    noApplicationCreated: true,
    noApplicationSubmitted: true,
    noResumeGenerated: true,
    noResumeSubmitted: true,
    noCoverLetterGenerated: true,
    noRecruiterMessageSent: true,
    noExternalAi: true,
    noOllama: true,
    limitations: [
      "Discovered from a mocked provider adapter; no external job source was contacted.",
      "Opportunity is not an Application.",
      "Ranking is deterministic prioritization, not employer interest or success probability.",
      ...(record.limitations || []),
    ],
  };
}

function emptyRanking(): OpportunityRanking {
  return {
    totalScore: 0,
    maxScore: 100,
    components: [],
    explanation: {
      whyRecommended: [],
      known: [],
      unknown: [],
      limitations: [],
    },
    deterministicRulesOnly: true,
    externalAiUsed: false,
    successProbabilityGenerated: false,
    interviewProbabilityGenerated: false,
    employerInterestInferred: false,
  };
}

export function createMockJobDiscoveryProviderAdapter(
  providerName: string,
  records: readonly MockJobDiscoveryProviderRecord[],
): MockJobDiscoveryProviderAdapter {
  return {
    adapterType: "MOCK_PROVIDER",
    providerName,
    load: () => records.map((record) => ({ ...record, responsibilities: [...(record.responsibilities || [])], requirements: [...(record.requirements || [])], tags: [...(record.tags || [])] })),
  };
}

export function importDiscoveredOpportunitiesFromMockAdapters(
  adapters: readonly MockJobDiscoveryProviderAdapter[],
  generatedAt: string,
) {
  return adapters.flatMap((adapter) => {
    if (adapter.adapterType !== "MOCK_PROVIDER") return [];
    return adapter.load().map((record) => createOpportunityFromProviderRecord(adapter, record, generatedAt));
  });
}

function applicationId(record: Partial<PrivateApplicationRecord>) {
  return text(record.applicationId) || "UNKNOWN_APPLICATION";
}

function applicationCompany(record: Partial<PrivateApplicationRecord>) {
  return normalizeText(record.companyReference?.label || null);
}

function applicationRole(record: Partial<PrivateApplicationRecord>) {
  return normalizeText(record.roleReference?.title || null);
}

function applicationRequisition(record: Partial<PrivateApplicationRecord>) {
  return normalizeText(record.companyReference?.requisitionAlias || null);
}

function tokenOverlap(left: string, right: string) {
  const leftTokens = new Set(left.split(/\s+/).filter(Boolean));
  const rightTokens = new Set(right.split(/\s+/).filter(Boolean));
  if (!leftTokens.size || !rightTokens.size) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return intersection / Math.max(leftTokens.size, rightTokens.size);
}

export function compareOpportunityAgainstApplications(
  opportunity: PrivateDiscoveredOpportunity,
  applications: readonly Partial<PrivateApplicationRecord>[] = [],
): OpportunityApplicationComparison {
  const exactMatches: string[] = [];
  const possibleMatches: string[] = [];
  const evidence: string[] = [];
  const company = opportunity.companyReference.normalized;
  const role = opportunity.roleReference.normalized;
  const requisition = normalizeText(opportunity.companyReference.requisitionAlias);

  for (const application of applications) {
    if (application.opportunityId && application.opportunityId === opportunity.opportunityId) {
      exactMatches.push(applicationId(application));
      evidence.push("Existing Application references this Opportunity ID.");
      continue;
    }

    const appCompany = applicationCompany(application);
    const appRole = applicationRole(application);
    const appRequisition = applicationRequisition(application);
    if (company && appCompany === company && requisition && appRequisition === requisition) {
      exactMatches.push(applicationId(application));
      evidence.push("Existing Application has the same normalized company and requisition alias.");
      continue;
    }
    if (company && role && appCompany === company && appRole === role) {
      exactMatches.push(applicationId(application));
      evidence.push("Existing Application has the same normalized company and role title.");
      continue;
    }
    if (company && appCompany === company && tokenOverlap(role, appRole) >= 0.6) {
      possibleMatches.push(applicationId(application));
    }
  }

  if (exactMatches.length) {
    return {
      status: "EXISTING_APPLICATION_MATCH",
      matchingApplicationIds: unique(exactMatches).sort(),
      prevention: "DUPLICATE_APPLICATION_BLOCKED",
      evidence: unique(evidence).sort(),
      limitations: [
        "Do not apply again unless Ross explicitly classifies the opportunity as a reapplication.",
        "Application state remains separate from Opportunity state.",
      ],
      noEmployerInterestInferred: true,
      noFitInferred: true,
    };
  }

  if (possibleMatches.length) {
    return {
      status: "POSSIBLE_APPLICATION_DUPLICATE",
      matchingApplicationIds: unique(possibleMatches).sort(),
      prevention: "REVIEW_REQUIRED",
      evidence: ["Existing Application shares normalized company and overlapping role tokens."],
      limitations: [
        "Possible duplicate requires Ross review before application planning.",
        "Do not infer that this role was already submitted.",
      ],
      noEmployerInterestInferred: true,
      noFitInferred: true,
    };
  }

  return {
    status: "NO_APPLICATION_MATCH",
    matchingApplicationIds: [],
    prevention: "NONE",
    evidence: ["No matching Application was found in the supplied private application store."],
    limitations: ["No application is created by discovery."],
    noEmployerInterestInferred: true,
    noFitInferred: true,
  };
}

function duplicateCandidates(opportunity: PrivateDiscoveredOpportunity): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];
  if (opportunity.providerRecordId) {
    candidates.push({
      opportunity,
      key: `provider:${normalizeText(opportunity.providerName)}|${normalizeText(opportunity.providerRecordId)}`,
      classification: "SAME_PROVIDER_RECORD",
      evidence: "Same mocked provider name and provider record ID.",
    });
  }
  if (opportunity.sourceUrl) {
    candidates.push({
      opportunity,
      key: `url:${opportunity.sourceUrl}`,
      classification: "EXACT_SOURCE_DUPLICATE",
      evidence: "Same canonical source URL.",
    });
  }
  candidates.push({
    opportunity,
    key: `digest:${opportunity.sourceTextDigest}`,
    classification: "EXACT_SOURCE_DUPLICATE",
    evidence: "Same source text digest.",
  });
  if (opportunity.companyReference.requisitionAlias) {
    candidates.push({
      opportunity,
      key: `requisition:${opportunity.companyReference.normalized}|${normalizeText(opportunity.companyReference.requisitionAlias)}`,
      classification: "SAME_REQUISITION_ALIAS",
      evidence: "Same normalized company and requisition alias.",
    });
  }
  if (opportunity.companyReference.normalized && opportunity.roleReference.normalized) {
    candidates.push({
      opportunity,
      key: `company-role:${opportunity.companyReference.normalized}|${opportunity.roleReference.normalized}`,
      classification: "SAME_COMPANY_ROLE",
      evidence: "Same normalized company and role title.",
    });
  }
  return candidates;
}

function duplicatePriority(status: OpportunityDuplicateStatus) {
  return {
    EXACT_SOURCE_DUPLICATE: 5,
    SAME_PROVIDER_RECORD: 4,
    SAME_REQUISITION_ALIAS: 3,
    SAME_COMPANY_ROLE: 2,
    POSSIBLE_ROLE_VARIANT: 1,
    NEEDS_OPERATOR_REVIEW: 0,
    NO_DUPLICATE: -1,
  }[status];
}

export function detectOpportunityDuplicates(
  opportunities: readonly PrivateDiscoveredOpportunity[],
  existingOpportunities: readonly PrivateDiscoveredOpportunity[] = [],
): {
  assignments: Map<string, DuplicateAssignment>;
  duplicateReview: OpportunityDuplicateReviewRecord[];
} {
  const allOpportunities = [...existingOpportunities, ...opportunities];
  const byKey = new Map<string, DuplicateCandidate[]>();
  for (const opportunity of allOpportunities) {
    for (const candidate of duplicateCandidates(opportunity)) {
      byKey.set(candidate.key, [...(byKey.get(candidate.key) || []), candidate]);
    }
  }

  const duplicateReview: OpportunityDuplicateReviewRecord[] = [];
  const assignments = new Map<string, DuplicateAssignment>();

  for (const opportunity of opportunities) {
    assignments.set(opportunity.opportunityId, { status: "NO_DUPLICATE", duplicateGroupId: null });
  }

  for (const [key, candidates] of byKey) {
    const uniqueMembers = unique(candidates.map((candidate) => candidate.opportunity.opportunityId)).sort();
    if (uniqueMembers.length <= 1) continue;

    const classification = candidates
      .map((candidate) => candidate.classification)
      .sort((a, b) => duplicatePriority(b) - duplicatePriority(a))[0];
    const duplicateGroupId = opaqueId("privjobdup", [JOB_DISCOVERY_PRIORITIZATION_VERSION, key, uniqueMembers.join("|")]);
    const canonicalOpportunityId = uniqueMembers[0];
    const evidence = unique(candidates.map((candidate) => candidate.evidence)).sort();

    duplicateReview.push({
      duplicateGroupId,
      classification,
      memberOpportunityIds: uniqueMembers,
      canonicalOpportunityId,
      evidence,
      limitations: [
        "Duplicate candidates are not silently merged.",
        "Ross or a later governed resolver must decide whether records represent the same opportunity.",
      ],
      silentlyMerged: false,
    });

    for (const memberId of uniqueMembers) {
      if (!assignments.has(memberId)) continue;
      const current = assignments.get(memberId);
      if (!current || duplicatePriority(classification) > duplicatePriority(current.status)) {
        assignments.set(memberId, { status: classification, duplicateGroupId });
      }
    }
  }

  return {
    assignments,
    duplicateReview: duplicateReview.sort((a, b) => a.duplicateGroupId.localeCompare(b.duplicateGroupId)),
  };
}

function rankOpportunity(opportunity: PrivateDiscoveredOpportunity): OpportunityRanking {
  const source = searchText([
    opportunity.companyReference.label,
    opportunity.roleReference.title,
    opportunity.descriptionSummary,
    opportunity.responsibilities,
    opportunity.requirements,
    opportunity.employmentType,
  ]);

  const components = Object.entries(CATEGORY_DEFINITIONS).map(([componentId, definition]) => {
    const matchedDimensions = definition.dimensions.filter((dimension) =>
      DIMENSION_KEYWORDS[dimension].some((keyword) => matchesTerm(source, keyword)),
    );
    const matchedTerms = unique(
      definition.dimensions.flatMap((dimension) =>
        DIMENSION_KEYWORDS[dimension].filter((keyword) => matchesTerm(source, keyword)),
      ),
    ).sort();
    const coverage = matchedDimensions.length / definition.dimensions.length;
    const termDensity = Math.min(1, matchedTerms.length / 6);
    const rawScore = roundScore(coverage * 0.7 + termDensity * 0.3);
    const weight = JOB_DISCOVERY_PRIORITY_WEIGHTS[componentId as keyof typeof JOB_DISCOVERY_PRIORITY_WEIGHTS];
    const weightedScore = roundScore(rawScore * weight);
    return {
      componentId: componentId as keyof typeof JOB_DISCOVERY_PRIORITY_WEIGHTS,
      label: definition.label,
      weight,
      rawScore,
      weightedScore,
      matchedDimensions,
      matchedTerms,
      explanation: matchedDimensions.length
        ? `${definition.label} matched ${matchedDimensions.join(", ")}.`
        : `${definition.label} did not match deterministic role-family signals.`,
    };
  });

  const totalScore = roundScore(components.reduce((sum, component) => sum + component.weightedScore, 0));
  const whyRecommended = components
    .filter((component) => component.weightedScore > 0)
    .sort((a, b) => b.weightedScore - a.weightedScore || a.label.localeCompare(b.label))
    .map((component) => `${component.label}: ${component.weightedScore}/${component.weight} from ${component.matchedDimensions.join(", ")}.`);

  return {
    totalScore,
    maxScore: 100,
    components,
    explanation: {
      whyRecommended,
      known: [
        `Company: ${opportunity.companyReference.label}`,
        `Role: ${opportunity.roleReference.title}`,
        `Deterministic role-family matches: ${opportunity.roleReference.deterministicRoleFamilies.join(", ") || "none"}`,
      ],
      unknown: [
        "Employer interest is unknown.",
        "Interview likelihood is unknown.",
        "Compensation fit is unknown unless source text states it.",
        "Ross still controls whether to apply.",
      ],
      limitations: [
        "Ranking uses explicit weighted rules only.",
        "Ranking is not a fit proof, employer validation, or success probability.",
        "Career facts are not promoted by opportunity discovery.",
      ],
    },
    deterministicRulesOnly: true,
    externalAiUsed: false,
    successProbabilityGenerated: false,
    interviewProbabilityGenerated: false,
    employerInterestInferred: false,
  };
}

function actionFor(input: {
  ranking: OpportunityRanking;
  duplicateStatus: OpportunityDuplicateStatus;
  applicationComparison: OpportunityApplicationComparison;
}): { recommendedAction: OpportunityRecommendedAction; priorityTier: OpportunityPriorityTier } {
  if (input.applicationComparison.status === "EXISTING_APPLICATION_MATCH") {
    return {
      recommendedAction: "DO_NOT_APPLY_DUPLICATE",
      priorityTier: "BLOCKED_DUPLICATE_APPLICATION",
    };
  }

  if (input.applicationComparison.status === "POSSIBLE_APPLICATION_DUPLICATE" || input.duplicateStatus !== "NO_DUPLICATE") {
    return {
      recommendedAction: "REVIEW_DUPLICATE_BEFORE_APPLICATION",
      priorityTier: "NEEDS_OPERATOR_REVIEW",
    };
  }

  if (input.ranking.totalScore >= 55) {
    return { recommendedAction: "REVIEW_FOR_APPLICATION", priorityTier: "HIGH_PRIORITY_REVIEW" };
  }
  if (input.ranking.totalScore >= 30) {
    return { recommendedAction: "REVIEW_FOR_APPLICATION", priorityTier: "MEDIUM_PRIORITY_REVIEW" };
  }
  return { recommendedAction: "LOW_PRIORITY_REVIEW", priorityTier: "LOW_PRIORITY_REVIEW" };
}

function queueSort(a: PrivateDiscoveredOpportunity, b: PrivateDiscoveredOpportunity) {
  const tierRank: Record<OpportunityPriorityTier, number> = {
    HIGH_PRIORITY_REVIEW: 0,
    MEDIUM_PRIORITY_REVIEW: 1,
    NEEDS_OPERATOR_REVIEW: 2,
    LOW_PRIORITY_REVIEW: 3,
    BLOCKED_DUPLICATE_APPLICATION: 4,
  };
  return (
    tierRank[a.priorityTier] - tierRank[b.priorityTier] ||
    b.ranking.totalScore - a.ranking.totalScore ||
    a.companyReference.label.localeCompare(b.companyReference.label) ||
    a.roleReference.title.localeCompare(b.roleReference.title) ||
    a.opportunityId.localeCompare(b.opportunityId)
  );
}

function buildQueueItem(opportunity: PrivateDiscoveredOpportunity, rank: number): OpportunityQueueItem {
  return {
    rank,
    opportunityId: opportunity.opportunityId,
    company: opportunity.companyReference.label,
    role: opportunity.roleReference.title,
    priorityTier: opportunity.priorityTier,
    recommendedAction: opportunity.recommendedAction,
    totalScore: opportunity.ranking.totalScore,
    duplicateStatus: opportunity.duplicateStatus,
    applicationComparisonStatus: opportunity.applicationComparison.status,
    whyRecommended: opportunity.ranking.explanation.whyRecommended,
    authorityRequired: "ROSS_APPROVAL_BEFORE_APPLICATION",
    completionProof: "Ross reviews the opportunity and records whether to pursue, defer, or reject it.",
    limitations: [
      "Queue item is not an application submission.",
      "No resume, cover letter, or recruiter message is generated.",
      ...opportunity.ranking.explanation.limitations,
    ],
  };
}

function buildReadModel(opportunity: PrivateDiscoveredOpportunity, generatedAt: string): OpportunityReadModelRecord {
  return {
    schemaVersion: PRIVATE_OPPORTUNITY_READ_MODEL_SCHEMA_VERSION,
    opportunityId: opportunity.opportunityId,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    company: opportunity.companyReference.label,
    role: opportunity.roleReference.title,
    priorityTier: opportunity.priorityTier,
    recommendedAction: opportunity.recommendedAction,
    totalScore: opportunity.ranking.totalScore,
    duplicateStatus: opportunity.duplicateStatus,
    applicationComparisonStatus: opportunity.applicationComparison.status,
    discoveredAt: opportunity.discoveredAt,
    capturedAsOf: generatedAt,
    limitations: [
      "Redacted future read model only.",
      "Not connected to /os or /operator.",
      "No source URL, source text, private path, or application action is exposed.",
    ],
    sourceTextVisible: false,
    sourceUrlVisible: false,
    privatePathVisible: false,
    applicationActionAvailable: false,
    messageActionAvailable: false,
    connectedToOs: false,
    connectedToOperator: false,
  };
}

export function buildJobDiscoveryPrioritizationResult(options: BuildQueueOptions): PrivateOpportunityQueueResult {
  const imported = importDiscoveredOpportunitiesFromMockAdapters(options.providerAdapters, options.generatedAt);
  const { assignments, duplicateReview } = detectOpportunityDuplicates(imported, options.existingOpportunities || []);
  const opportunities = imported.map((opportunity) => {
    const assignment = assignments.get(opportunity.opportunityId) || { status: "NO_DUPLICATE" as const, duplicateGroupId: null };
    const applicationComparison = compareOpportunityAgainstApplications(opportunity, options.applications || []);
    const ranking = rankOpportunity(opportunity);
    const action = actionFor({
      ranking,
      duplicateStatus: assignment.status,
      applicationComparison,
    });
    return {
      ...opportunity,
      duplicateStatus: assignment.status,
      duplicateGroupId: assignment.duplicateGroupId,
      applicationComparison,
      ranking,
      recommendedAction: action.recommendedAction,
      priorityTier: action.priorityTier,
    };
  }).sort(queueSort);

  const queueable = opportunities.filter((opportunity) => opportunity.recommendedAction !== "DO_NOT_APPLY_DUPLICATE");
  const priorityQueue = queueable.map((opportunity, index) => buildQueueItem(opportunity, index + 1));
  const readModel = opportunities.map((opportunity) => buildReadModel(opportunity, options.generatedAt));
  const existingApplicationMatches = opportunities.filter((opportunity) => opportunity.applicationComparison.status === "EXISTING_APPLICATION_MATCH").length;

  return {
    schemaVersion: PRIVATE_OPPORTUNITY_QUEUE_SCHEMA_VERSION,
    workflowVersion: JOB_DISCOVERY_PRIORITIZATION_VERSION,
    generatedAt: options.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {
      mockedProviderAdaptersOnly: true,
      providerCount: options.providerAdapters.length,
      externalProviderCalls: 0,
      browserAutomationUsed: false,
      entireInternetSearched: false,
    },
    opportunities,
    duplicateReview,
    priorityQueue,
    readModel,
    summary: {
      importedOpportunities: opportunities.length,
      duplicateGroups: duplicateReview.length,
      existingApplicationMatches,
      possibleApplicationDuplicates: opportunities.filter((opportunity) => opportunity.applicationComparison.status === "POSSIBLE_APPLICATION_DUPLICATE").length,
      queueItemsReadyForReview: priorityQueue.length,
      duplicateApplicationsPrevented: existingApplicationMatches,
      highestPriorityOpportunityId: priorityQueue[0]?.opportunityId || null,
      vanityMetricGenerated: false,
      successProbabilityGenerated: false,
    },
    auditSummary: {
      noApplicationSubmitted: true,
      noResumeSubmitted: true,
      noResumeGenerated: true,
      noCoverLetterGenerated: true,
      noRecruiterMessageSent: true,
      noLinkedInMutated: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noBrowserAutomation: true,
      noOsConnection: true,
      noOperatorConnection: true,
      opportunitySeparateFromApplication: true,
      privatePathVisible: false,
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

export function writeJobDiscoveryPrioritizationOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: PrivateOpportunityQueueResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private J002.01 opportunity discovery output root");
  const runDirectory = path.join(input.outputRoot, `J002_01_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const files = {
    "opportunity_queue.json": input.result,
    "opportunities.json": input.result.opportunities,
    "duplicate_review.json": input.result.duplicateReview,
    "opportunity_read_model.json": input.result.readModel,
    "audit_summary.json": input.result.auditSummary,
  };
  const written: string[] = [];
  for (const [filename, value] of Object.entries(files)) {
    const filePath = path.join(runDirectory, filename);
    writeJson(filePath, value);
    written.push(filePath);
  }
  return written;
}

export function buildJobDiscoveryCliSummary(result: PrivateOpportunityQueueResult, writtenCount = 0) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    importedOpportunities: result.summary.importedOpportunities,
    duplicateGroups: result.summary.duplicateGroups,
    queueItemsReadyForReview: result.summary.queueItemsReadyForReview,
    duplicateApplicationsPrevented: result.summary.duplicateApplicationsPrevented,
    highestPriorityOpportunityId: result.summary.highestPriorityOpportunityId,
    mockedProviderAdaptersOnly: result.sourceAuthority.mockedProviderAdaptersOnly,
    externalProviderCalls: result.sourceAuthority.externalProviderCalls,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noResumeGenerated: result.auditSummary.noResumeGenerated,
    noRecruiterMessageSent: result.auditSummary.noRecruiterMessageSent,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
    noOsConnection: result.auditSummary.noOsConnection,
    noOperatorConnection: result.auditSummary.noOperatorConnection,
    privateArtifactsWritten: writtenCount,
  };
}

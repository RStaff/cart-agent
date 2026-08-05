import type { PrivateRequirementEvidenceMapping } from "./candidateEvidenceMapper";
import { summarizeMappingCoverage } from "./candidateEvidenceMapper";
import type { PrivateJobRequirementRecord } from "./jobRequirementExtractor";

export const PRIVATE_JOB_FIT_ASSESSMENT_VERSION = "J001.03A";
export const PRIVATE_JOB_FIT_ASSESSMENT_SCHEMA_VERSION =
  "staffordos.job_search.private_fit_assessment.v1";

export const APPLICATION_EVENT_STATES = [
  "NOT_APPLIED",
  "PREPARING",
  "SUBMITTED_MANUAL_EXTERNAL",
  "SUBMITTED_THROUGH_FUTURE_STAFFORDOS",
  "WITHDRAWN",
  "REJECTED_BY_EMPLOYER",
  "INTERVIEWING",
  "OFFER",
  "CLOSED",
  "NEEDS_OPERATOR_CONFIRMATION",
] as const;

export const JOB_ANALYSIS_RECOMMENDATIONS = [
  "STRONG_APPLY",
  "APPLY_WITH_POSITIONING",
  "REVIEW_REQUIRED",
  "LOW_PRIORITY",
  "DO_NOT_APPLY",
  "INSUFFICIENT_EVIDENCE",
  "ALREADY_APPLIED_MONITOR",
] as const;

export type ApplicationEventState = (typeof APPLICATION_EVENT_STATES)[number];
export type JobAnalysisRecommendation = (typeof JOB_ANALYSIS_RECOMMENDATIONS)[number];

export type ManualApplicationEvent = {
  schemaVersion: "staffordos.job_search.private_application_event.v1";
  opportunityId: string;
  applicationState: ApplicationEventState;
  submissionChannel: "MANUAL_EXTERNAL" | "NOT_APPLICABLE" | "UNKNOWN";
  submittedBy: "Ross" | "StaffordOS" | "Unknown";
  submittedAt: string | null;
  resumeFilenameUsed: string | null;
  coverLetterStatus: "UNKNOWN" | "NOT_USED" | "USED" | "DRAFTED_EXTERNALLY";
  operatorAuthority: "ROSS_CONFIRMED" | "NEEDS_OPERATOR_CONFIRMATION";
  currentEmployerResponse: "UNKNOWN" | "NONE_RECORDED" | "RESPONDED" | "REJECTED" | "INTERVIEW_REQUESTED" | "OFFER";
  nextFollowUpReviewDate: string | null;
  limitations: string[];
  submittedByStaffordOS: false;
};

export type FitDimension = {
  id: string;
  label: string;
  finding: "STRONG" | "PARTIAL" | "WEAK" | "UNKNOWN" | "NOT_APPLICABLE";
  explanation: string;
};

export type PrivateJobFitAssessment = {
  schemaVersion: typeof PRIVATE_JOB_FIT_ASSESSMENT_SCHEMA_VERSION;
  opportunityId: string;
  applicationState: ApplicationEventState;
  finalRecommendation: JobAnalysisRecommendation;
  recommendationExplanation: string;
  coverage: ReturnType<typeof summarizeMappingCoverage>;
  dimensions: FitDimension[];
  majorBlockers: string[];
  applicationEffort: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN";
  strategicValue: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  numericEmployerSuccessProbability: null;
  limitations: string[];
  createdAt: string;
  privateRecord: true;
  testOnly: false;
};

function mappingForRequirement(requirement: PrivateJobRequirementRecord, mappings: readonly PrivateRequirementEvidenceMapping[]) {
  return mappings.find((mapping) => mapping.requirementId === requirement.id) || null;
}

function relevantMappings(
  requirements: readonly PrivateJobRequirementRecord[],
  mappings: readonly PrivateRequirementEvidenceMapping[],
  predicate: (requirement: PrivateJobRequirementRecord) => boolean,
) {
  return requirements
    .filter(predicate)
    .map((requirement) => mappingForRequirement(requirement, mappings))
    .filter((mapping): mapping is PrivateRequirementEvidenceMapping => Boolean(mapping));
}

function dimensionFromMappings(id: string, label: string, mappings: readonly PrivateRequirementEvidenceMapping[]): FitDimension {
  if (!mappings.length) {
    return { id, label, finding: "NOT_APPLICABLE", explanation: "The listing did not expose a distinct requirement group for this dimension." };
  }
  const coverage = summarizeMappingCoverage(mappings);
  if (coverage.PROVEN + coverage.PARTIAL >= mappings.length && coverage.UNKNOWN === 0 && coverage.MISSING === 0) {
    return { id, label, finding: "STRONG", explanation: "Mapped requirements are proven or partially supported, with no missing or unknown mappings." };
  }
  if (coverage.PROVEN + coverage.PARTIAL + coverage.TRANSFERABLE > 0 && coverage.MISSING === 0) {
    return { id, label, finding: "PARTIAL", explanation: "Some evidence or transferable support exists, but review is still required." };
  }
  if (coverage.MISSING > 0 && coverage.PROVEN + coverage.PARTIAL + coverage.TRANSFERABLE === 0) {
    return { id, label, finding: "WEAK", explanation: "No mapped support was found for this dimension." };
  }
  return { id, label, finding: "UNKNOWN", explanation: "The available evidence is incomplete, unreviewed, or mixed." };
}

function recommendation(
  requirements: readonly PrivateJobRequirementRecord[],
  mappings: readonly PrivateRequirementEvidenceMapping[],
  applicationEvent: ManualApplicationEvent,
): { finalRecommendation: JobAnalysisRecommendation; explanation: string } {
  if (applicationEvent.applicationState === "SUBMITTED_MANUAL_EXTERNAL") {
    return {
      finalRecommendation: "ALREADY_APPLIED_MONITOR",
      explanation: "Ross has already submitted this application outside StaffordOS, so StaffordOS should monitor, prepare follow-up material, or support interview readiness rather than recommend another application.",
    };
  }

  if (!requirements.length) {
    return {
      finalRecommendation: "INSUFFICIENT_EVIDENCE",
      explanation: "No explicit requirements were extracted from the saved listing.",
    };
  }

  const required = relevantMappings(requirements, mappings, (requirement) => requirement.requirementLevel === "REQUIRED");
  const requiredCoverage = summarizeMappingCoverage(required.length ? required : mappings);
  if (requiredCoverage.MISSING > 0) {
    return {
      finalRecommendation: "REVIEW_REQUIRED",
      explanation: "At least one required requirement has no mapped support. Ross should review before positioning.",
    };
  }
  if (requiredCoverage.UNKNOWN > 0) {
    return {
      finalRecommendation: "REVIEW_REQUIRED",
      explanation: "Required evidence is present but unresolved or unreviewed. Ross should answer role-specific review questions before using the claim.",
    };
  }
  if (requiredCoverage.PROVEN + requiredCoverage.PARTIAL > 0) {
    return {
      finalRecommendation: "APPLY_WITH_POSITIONING",
      explanation: "The role has mapped support, but resume positioning still needs careful evidence-backed wording.",
    };
  }
  return {
    finalRecommendation: "LOW_PRIORITY",
    explanation: "The extracted requirements do not yet show enough mapped support to prioritize this role.",
  };
}

function applicationEffort(requirements: readonly PrivateJobRequirementRecord[], mappings: readonly PrivateRequirementEvidenceMapping[]) {
  const coverage = summarizeMappingCoverage(mappings);
  const reviewLoad = coverage.UNKNOWN + coverage.MISSING + coverage.TRANSFERABLE;
  if (!requirements.length) return "UNKNOWN" as const;
  if (reviewLoad >= 8) return "HIGH" as const;
  if (reviewLoad >= 3) return "MODERATE" as const;
  return "LOW" as const;
}

function strategicValue(requirements: readonly PrivateJobRequirementRecord[]) {
  const text = requirements.map((requirement) => requirement.requirementText).join(" ").toLowerCase();
  if (/\b(ai|agent|automation|product owner|product manager|platform|architecture)\b/.test(text)) return "HIGH" as const;
  if (/\b(product|analytics|data|leadership|workflow)\b/.test(text)) return "MEDIUM" as const;
  return "UNKNOWN" as const;
}

export function buildManualExternalApplicationEvent(input: {
  opportunityId: string;
  rossConfirmedSubmission: boolean;
  submittedAt?: string | null;
  resumeFilenameUsed?: string | null;
  coverLetterStatus?: ManualApplicationEvent["coverLetterStatus"];
  nextFollowUpReviewDate?: string | null;
}): ManualApplicationEvent {
  return {
    schemaVersion: "staffordos.job_search.private_application_event.v1",
    opportunityId: input.opportunityId,
    applicationState: input.rossConfirmedSubmission ? "SUBMITTED_MANUAL_EXTERNAL" : "NEEDS_OPERATOR_CONFIRMATION",
    submissionChannel: input.rossConfirmedSubmission ? "MANUAL_EXTERNAL" : "UNKNOWN",
    submittedBy: input.rossConfirmedSubmission ? "Ross" : "Unknown",
    submittedAt: input.submittedAt || null,
    resumeFilenameUsed: input.resumeFilenameUsed || null,
    coverLetterStatus: input.coverLetterStatus || "UNKNOWN",
    operatorAuthority: input.rossConfirmedSubmission ? "ROSS_CONFIRMED" : "NEEDS_OPERATOR_CONFIRMATION",
    currentEmployerResponse: "NONE_RECORDED",
    nextFollowUpReviewDate: input.nextFollowUpReviewDate || null,
    limitations: [
      "Application was not submitted by StaffordOS.",
      "Submission date and resume file remain unknown unless Ross records them.",
      "No external employer system was contacted by this workflow.",
    ],
    submittedByStaffordOS: false,
  };
}

export function buildPrivateJobFitAssessment(input: {
  opportunityId: string;
  requirements: readonly PrivateJobRequirementRecord[];
  mappings: readonly PrivateRequirementEvidenceMapping[];
  applicationEvent: ManualApplicationEvent;
  createdAt: string;
}): PrivateJobFitAssessment {
  const { finalRecommendation, explanation } = recommendation(input.requirements, input.mappings, input.applicationEvent);
  const dimensions = [
    dimensionFromMappings(
      "required-skill-coverage",
      "Required-skill coverage",
      relevantMappings(input.requirements, input.mappings, (requirement) => requirement.requirementLevel === "REQUIRED"),
    ),
    dimensionFromMappings(
      "preferred-skill-coverage",
      "Preferred-skill coverage",
      relevantMappings(input.requirements, input.mappings, (requirement) => requirement.requirementLevel === "PREFERRED"),
    ),
    dimensionFromMappings(
      "technical-alignment",
      "Technical alignment",
      relevantMappings(input.requirements, input.mappings, (requirement) => Boolean(requirement.technologyOrSkill)),
    ),
    dimensionFromMappings(
      "leadership-alignment",
      "Leadership alignment",
      relevantMappings(input.requirements, input.mappings, (requirement) => requirement.requirementCategory === "Leadership"),
    ),
    dimensionFromMappings(
      "product-program-alignment",
      "Product/program alignment",
      relevantMappings(input.requirements, input.mappings, (requirement) => /\b(product|program|roadmap|stakeholder)\b/i.test(requirement.requirementText)),
    ),
    dimensionFromMappings(
      "domain-alignment",
      "Domain alignment",
      relevantMappings(input.requirements, input.mappings, (requirement) => requirement.requirementCategory === "Domain"),
    ),
    dimensionFromMappings(
      "production-system-evidence",
      "Production-system evidence",
      input.mappings.filter((mapping) => !mapping.prohibitedOverstatement.some((item) => /production use/i.test(item))),
    ),
    dimensionFromMappings(
      "ai-automation-alignment",
      "AI and automation alignment",
      relevantMappings(input.requirements, input.mappings, (requirement) => /\b(ai|agent|automation|llm|machine learning)\b/i.test(requirement.requirementText)),
    ),
    dimensionFromMappings(
      "architecture-alignment",
      "Architecture alignment",
      relevantMappings(input.requirements, input.mappings, (requirement) => /\b(architecture|platform|system|technical design)\b/i.test(requirement.requirementText)),
    ),
    dimensionFromMappings(
      "location-work-arrangement",
      "Location/work-arrangement alignment",
      relevantMappings(input.requirements, input.mappings, (requirement) => requirement.requirementCategory === "Location or work arrangement"),
    ),
    dimensionFromMappings(
      "compensation-alignment",
      "Compensation alignment",
      relevantMappings(input.requirements, input.mappings, (requirement) => requirement.requirementCategory === "Compensation"),
    ),
    dimensionFromMappings("evidence-strength", "Evidence strength", input.mappings),
  ];

  const coverage = summarizeMappingCoverage(input.mappings);
  const majorBlockers: string[] = [];
  if (coverage.MISSING > 0) majorBlockers.push("One or more requirements have no mapped evidence.");
  if (coverage.UNKNOWN > 0) majorBlockers.push("Some mappings require Ross review before use.");
  if (input.applicationEvent.applicationState === "SUBMITTED_MANUAL_EXTERNAL") {
    majorBlockers.push("Already submitted externally; do not submit again from StaffordOS.");
  }

  return {
    schemaVersion: PRIVATE_JOB_FIT_ASSESSMENT_SCHEMA_VERSION,
    opportunityId: input.opportunityId,
    applicationState: input.applicationEvent.applicationState,
    finalRecommendation,
    recommendationExplanation: explanation,
    coverage,
    dimensions,
    majorBlockers,
    applicationEffort: applicationEffort(input.requirements, input.mappings),
    strategicValue: strategicValue(input.requirements),
    numericEmployerSuccessProbability: null,
    limitations: [
      "No employer-success probability is generated.",
      "No external job listing, employer, or provider was contacted.",
      "Assessment depends on current private Career evidence, which contains unresolved review items.",
    ],
    createdAt: input.createdAt,
    privateRecord: true,
    testOnly: false,
  };
}

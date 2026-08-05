import type { PrivateRequirementEvidenceMapping } from "./candidateEvidenceMapper";
import type { PrivateJobAnalysisBundle } from "./privateJobAnalysisWorkflow";
import type {
  PrivateJobAnalysisOperatorDecision,
  PrivateJobAnalysisRunMetadata,
  RoleFocusedReviewQuestion,
} from "./privateJobAnalysisReview";
import { buildRoleFocusedReviewQuestions } from "./privateJobAnalysisReview";

export const JOB_ANALYSIS_REVIEW_PRESENTATION_VERSION = "J001.03B";

export type JobAnalysisReviewPresentation = {
  schemaVersion: "staffordos.job_search.private_analysis_review_presentation.v1";
  surface: "OWNER_PRIVATE_LOCAL_CLI";
  opportunitySummary: {
    opportunityId: string;
    company: string;
    role: string;
    applicationStatus: string;
    analysisTimestamp: string;
    currentRecommendation: string;
    nextAction: string;
  };
  requirementSummary: {
    total: number;
    required: number;
    preferred: number;
    responsibilities: number;
    informational: number;
    ambiguous: number;
  };
  evidenceCoverage: {
    PROVEN: number;
    PARTIAL: number;
    TRANSFERABLE: number;
    MISSING: number;
    UNKNOWN: number;
  };
  priorityReviewQuestions: RoleFocusedReviewQuestion[];
  majorGaps: Array<{
    requirementId: string;
    classification: string;
    limitation: string;
  }>;
  positioning: {
    supportedStrengthCount: number;
    transferableStrengthCount: number;
    claimsToAvoidCount: number;
    currentPrimaryGap: string;
  };
  safety: {
    ownerPrivateLocalOnly: true;
    privatePathVisible: false;
    rawListingTextVisible: false;
    sourceUrlVisible: false;
    contactVisible: false;
    compensationVisibleByDefault: false;
    noApplicationActionAvailable: true;
    noMessageActionAvailable: true;
    noResumeMutationAvailable: true;
    notConnectedToOs: true;
    notConnectedToOperator: true;
  };
};

function countMappings(mappings: readonly PrivateRequirementEvidenceMapping[]) {
  return mappings.reduce(
    (counts, mapping) => {
      counts[mapping.classification] += 1;
      return counts;
    },
    {
      PROVEN: 0,
      PARTIAL: 0,
      TRANSFERABLE: 0,
      MISSING: 0,
      UNKNOWN: 0,
    },
  );
}

function requirementSummary(bundle: PrivateJobAnalysisBundle) {
  return bundle.requirements.reduce(
    (summary, requirement) => {
      summary.total += 1;
      if (requirement.requirementLevel === "REQUIRED") summary.required += 1;
      if (requirement.requirementLevel === "PREFERRED" || requirement.requirementLevel === "DESIRED") summary.preferred += 1;
      if (requirement.requirementLevel === "RESPONSIBILITY") summary.responsibilities += 1;
      if (requirement.requirementLevel === "INFORMATIONAL") summary.informational += 1;
      if (requirement.requirementLevel === "UNCLEAR" || requirement.ambiguity) summary.ambiguous += 1;
      return summary;
    },
    {
      total: 0,
      required: 0,
      preferred: 0,
      responsibilities: 0,
      informational: 0,
      ambiguous: 0,
    },
  );
}

export function buildJobAnalysisReviewPresentation(input: {
  metadata: PrivateJobAnalysisRunMetadata;
  bundle: PrivateJobAnalysisBundle;
  decisions?: readonly PrivateJobAnalysisOperatorDecision[];
  maxQuestions?: number;
}): JobAnalysisReviewPresentation {
  const questions = buildRoleFocusedReviewQuestions({
    bundle: input.bundle,
    decisions: input.decisions || [],
  })
    .filter((question) => question.status === "UNANSWERED")
    .sort((a, b) => a.priority - b.priority)
    .slice(0, input.maxQuestions || 15);
  const majorGaps = input.bundle.mappings
    .filter((mapping) => mapping.classification === "MISSING" || mapping.classification === "UNKNOWN")
    .slice(0, 10)
    .map((mapping) => ({
      requirementId: mapping.requirementId,
      classification: mapping.classification,
      limitation: mapping.supportLimitations[0] || "Review required before use.",
    }));

  return {
    schemaVersion: "staffordos.job_search.private_analysis_review_presentation.v1",
    surface: "OWNER_PRIVATE_LOCAL_CLI",
    opportunitySummary: {
      opportunityId: input.metadata.opportunityId,
      company: input.metadata.company,
      role: input.metadata.role,
      applicationStatus: input.bundle.applicationEvent.applicationState,
      analysisTimestamp: input.bundle.auditSummary.generatedAt,
      currentRecommendation: input.bundle.fitAssessment.finalRecommendation,
      nextAction: input.bundle.nextAction.action,
    },
    requirementSummary: requirementSummary(input.bundle),
    evidenceCoverage: countMappings(input.bundle.mappings),
    priorityReviewQuestions: questions,
    majorGaps,
    positioning: {
      supportedStrengthCount: input.bundle.positioningBrief.strongestSupportedThemes.length,
      transferableStrengthCount: input.bundle.positioningBrief.transferableExperience.length,
      claimsToAvoidCount: input.bundle.positioningBrief.unsupportedClaimsToAvoid.length,
      currentPrimaryGap: input.bundle.positioningBrief.primaryGap,
    },
    safety: {
      ownerPrivateLocalOnly: true,
      privatePathVisible: false,
      rawListingTextVisible: false,
      sourceUrlVisible: false,
      contactVisible: false,
      compensationVisibleByDefault: false,
      noApplicationActionAvailable: true,
      noMessageActionAvailable: true,
      noResumeMutationAvailable: true,
      notConnectedToOs: true,
      notConnectedToOperator: true,
    },
  };
}

export function buildJobAnalysisRunListPresentation(runs: readonly PrivateJobAnalysisRunMetadata[]) {
  return runs.map((run) => ({
    analysisRunId: run.analysisRunId,
    opportunityId: run.opportunityId,
    company: run.company,
    role: run.role,
    analysisTimestamp: run.analysisTimestamp,
    applicationState: run.applicationState,
    requirementCount: run.requirementCount,
    unansweredReviewQuestionCount: run.unansweredReviewQuestionCount,
    recommendation: run.recommendation,
    privatePathVisible: false as const,
  }));
}

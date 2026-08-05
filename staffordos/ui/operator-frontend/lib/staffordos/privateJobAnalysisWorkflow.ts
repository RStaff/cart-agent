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
import * as path from "node:path";
import type { CareerEvidence, CareerFact } from "./careerEvidenceContracts";
import {
  buildManualExternalApplicationEvent,
  buildPrivateJobFitAssessment,
  type ManualApplicationEvent,
  type PrivateJobFitAssessment,
} from "./jobFitAssessment";
import type { PrivateNormalizedJobOpportunity } from "./privateJobOpportunityIntake";
import {
  extractPrivateJobRequirements,
  type PrivateJobRequirementRecord,
} from "./jobRequirementExtractor";
import {
  mapRequirementsToCareerEvidence,
  type PrivateRequirementEvidenceMapping,
} from "./candidateEvidenceMapper";

export const PRIVATE_JOB_ANALYSIS_WORKFLOW_VERSION = "J001.03A";
export const PRIVATE_JOB_ANALYSIS_AUDIT_SCHEMA_VERSION =
  "staffordos.job_search.private_analysis_audit.v1";

export type PrivateJobAnalysisReviewQuestion = {
  id: string;
  requirementId: string;
  priority: number;
  question: string;
  whyItMatters: string;
  allowedResponses: string[];
  privateRecord: true;
};

export type PrivateJobPositioningBrief = {
  schemaVersion: "staffordos.job_search.private_positioning_brief.v1";
  opportunityId: string;
  strongestSupportedThemes: string[];
  evidenceToEmphasize: Array<{
    requirementId: string;
    careerFactIds: string[];
    careerEvidenceIds: string[];
    classification: string;
    safePositioning: string;
  }>;
  transferableExperience: Array<{
    requirementId: string;
    safePositioning: string;
    limitation: string;
  }>;
  unsupportedClaimsToAvoid: string[];
  primaryGap: string;
  recommendedResumeEmphasis: string[];
  recommendedProjectExamples: string[];
  recommendedInterviewStories: string[];
  employerSpecificLanguage: string[];
  questionsRequiringRossReview: string[];
  factEvidencePositioningBoundary: "FACT_TO_EVIDENCE_TO_POSITIONING";
  finalResumeGenerated: false;
  createdAt: string;
  privateRecord: true;
};

export type PrivateJobNextAction = {
  schemaVersion: "staffordos.job_search.private_next_action.v1";
  opportunityId: string;
  action: string;
  whyNow: string;
  deadlineOrReviewDate: string | null;
  evidence: string[];
  limitation: string;
  rossApprovalRequired: boolean;
  completionProof: string;
  externalActionAuthorized: false;
};

export type PrivateJobAnalysisAuditSummary = {
  schemaVersion: typeof PRIVATE_JOB_ANALYSIS_AUDIT_SCHEMA_VERSION;
  workflowVersion: typeof PRIVATE_JOB_ANALYSIS_WORKFLOW_VERSION;
  opportunityId: string;
  generatedAt: string;
  noExternalNetwork: true;
  noExternalAi: true;
  noOllama: true;
  noApi: true;
  noDatabase: true;
  noApplicationSubmitted: true;
  noMessageSent: true;
  noResumeMutated: true;
  sourceTextStoredOnlyInPrivateArtifacts: true;
  outputDirectoryRedacted: string;
  summary: {
    requirementCount: number;
    mappingCount: number;
    reviewQuestionCount: number;
    finalRecommendation: string;
  };
};

export type PrivateJobAnalysisBundle = {
  workflowVersion: typeof PRIVATE_JOB_ANALYSIS_WORKFLOW_VERSION;
  opportunity: {
    id: string;
    companyName: string;
    roleTitle: string;
    observedAt: string | null;
  };
  requirements: PrivateJobRequirementRecord[];
  mappings: PrivateRequirementEvidenceMapping[];
  fitAssessment: PrivateJobFitAssessment;
  positioningBrief: PrivateJobPositioningBrief;
  reviewQueue: PrivateJobAnalysisReviewQuestion[];
  applicationEvent: ManualApplicationEvent;
  nextAction: PrivateJobNextAction;
  auditSummary: PrivateJobAnalysisAuditSummary;
};

export type PrivateJobAnalysisInput = {
  opportunity: PrivateNormalizedJobOpportunity;
  intakeRecord: {
    listingText?: string | null;
    sourceSummary?: string | null;
    sourceObservedAt?: string | null;
    roleTitle?: string | null;
    companyName?: string | null;
    location?: string | null;
    workArrangement?: string | null;
    compensationText?: string | null;
    employmentType?: string | null;
  };
  careerFacts: readonly Partial<CareerFact>[];
  careerEvidence: readonly Partial<CareerEvidence>[];
  generatedAt: string;
  applicationEvent: ManualApplicationEvent;
  outputDirectoryRedacted?: string;
};

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function isInsideDirectory(candidatePath: string, parentPath: string) {
  const resolvedCandidate = path.resolve(candidatePath);
  const resolvedParent = path.resolve(parentPath);
  return resolvedCandidate === resolvedParent || resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`);
}

function redactPathForReport(filePath: string) {
  return filePath.replace(/^\/Users\/[^/]+/, "~");
}

function compactDate(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 12);
}

function mappingByRequirement(mappings: readonly PrivateRequirementEvidenceMapping[]) {
  return new Map(mappings.map((mapping) => [mapping.requirementId, mapping]));
}

function buildReviewQueue(requirements: readonly PrivateJobRequirementRecord[], mappings: readonly PrivateRequirementEvidenceMapping[]) {
  const byReq = mappingByRequirement(mappings);
  const priority = (requirement: PrivateJobRequirementRecord) => {
    const mapping = byReq.get(requirement.id);
    let score = 0;
    if (requirement.requirementLevel === "REQUIRED") score += 50;
    if (requirement.requirementLevel === "PREFERRED") score += 25;
    if (requirement.requirementCategory === "Leadership" || requirement.requirementCategory === "Experience") score += 10;
    if (mapping?.classification === "UNKNOWN") score += 20;
    if (mapping?.classification === "MISSING") score += 15;
    if (mapping?.classification === "TRANSFERABLE") score += 10;
    return score;
  };

  return requirements
    .filter((requirement) => {
      const mapping = byReq.get(requirement.id);
      return Boolean(mapping && mapping.classification !== "PROVEN");
    })
    .sort((a, b) => priority(b) - priority(a) || a.requirementText.localeCompare(b.requirementText))
    .slice(0, 15)
    .map((requirement, index): PrivateJobAnalysisReviewQuestion => {
      const mapping = byReq.get(requirement.id);
      return {
        id: `privjobreview_${sha256Text(`${requirement.id}|${index}`).slice(0, 18)}`,
        requirementId: requirement.id,
        priority: index + 1,
        question:
          mapping?.classification === "MISSING"
            ? "Can Ross provide a supported example or evidence for this requirement, or should StaffordOS treat it as a gap?"
            : "Can Ross confirm the exact scope and safe wording for this requirement before it is used?",
        whyItMatters:
          requirement.requirementLevel === "REQUIRED"
            ? "This appears required or central to the role and affects recommendation and resume positioning."
            : "This could improve positioning, but only if the claim is supported.",
        allowedResponses: [
          "Confirm supported wording",
          "Mark as transferable only",
          "Mark as missing",
          "Keep unknown for now",
          "Reject requirement mapping",
        ],
        privateRecord: true,
      };
    });
}

function buildPositioningBrief(input: {
  opportunityId: string;
  requirements: readonly PrivateJobRequirementRecord[];
  mappings: readonly PrivateRequirementEvidenceMapping[];
  reviewQueue: readonly PrivateJobAnalysisReviewQuestion[];
  createdAt: string;
}): PrivateJobPositioningBrief {
  const supported = input.mappings.filter((mapping) => mapping.classification === "PROVEN" || mapping.classification === "PARTIAL");
  const transferable = input.mappings.filter((mapping) => mapping.classification === "TRANSFERABLE");
  const unsupported = input.mappings.filter((mapping) => mapping.classification === "MISSING" || mapping.classification === "UNKNOWN");
  const requirementsById = new Map(input.requirements.map((requirement) => [requirement.id, requirement]));
  const requirementTextFor = (requirementId: string) => requirementsById.get(requirementId)?.requirementText || "Selected requirement";

  return {
    schemaVersion: "staffordos.job_search.private_positioning_brief.v1",
    opportunityId: input.opportunityId,
    strongestSupportedThemes: supported.slice(0, 5).map((mapping) => requirementTextFor(mapping.requirementId)),
    evidenceToEmphasize: supported.slice(0, 8).map((mapping) => ({
      requirementId: mapping.requirementId,
      careerFactIds: mapping.careerFactIds,
      careerEvidenceIds: mapping.careerEvidenceIds,
      classification: mapping.classification,
      safePositioning: mapping.safePositioning,
    })),
    transferableExperience: transferable.slice(0, 8).map((mapping) => ({
      requirementId: mapping.requirementId,
      safePositioning: mapping.safePositioning,
      limitation: "Use adjacent-capability wording only after Ross review.",
    })),
    unsupportedClaimsToAvoid: [
      ...unsupported.slice(0, 10).map((mapping) => requirementTextFor(mapping.requirementId)),
      "Any years of experience, production use, customer use, certification, employer, title, metric, or outcome not supported by Career evidence.",
    ],
    primaryGap:
      unsupported.length > 0
        ? requirementTextFor(unsupported[0].requirementId)
        : "No primary unsupported gap identified from current mapping.",
    recommendedResumeEmphasis: supported.length
      ? supported.slice(0, 5).map((mapping) => `Emphasize evidence-backed support for: ${requirementTextFor(mapping.requirementId)}`)
      : ["Do not tailor resume claims until Ross reviews the mapped evidence."],
    recommendedProjectExamples: supported
      .filter((mapping) => mapping.safePositioning.toLowerCase().includes("evidence") || mapping.careerFactIds.length > 0)
      .slice(0, 5)
      .map((mapping) => `Use CareerFact IDs ${mapping.careerFactIds.join(", ")} only with their linked evidence limitations.`),
    recommendedInterviewStories: input.reviewQueue.slice(0, 5).map((question) => `Prepare a reviewed story for requirement ${question.requirementId}.`),
    employerSpecificLanguage: input.requirements
      .filter((requirement) => /\b(ai|agent|automation|product|stakeholder|roadmap|platform)\b/i.test(requirement.requirementText))
      .slice(0, 8)
      .map((requirement) => requirement.requirementText),
    questionsRequiringRossReview: input.reviewQueue.map((question) => question.question),
    factEvidencePositioningBoundary: "FACT_TO_EVIDENCE_TO_POSITIONING",
    finalResumeGenerated: false,
    createdAt: input.createdAt,
    privateRecord: true,
  };
}

function buildNextAction(input: {
  opportunityId: string;
  fitAssessment: PrivateJobFitAssessment;
  reviewQueue: readonly PrivateJobAnalysisReviewQuestion[];
}): PrivateJobNextAction {
  if (input.fitAssessment.finalRecommendation === "ALREADY_APPLIED_MONITOR") {
    return {
      schemaVersion: "staffordos.job_search.private_next_action.v1",
      opportunityId: input.opportunityId,
      action: "Monitor employer response and prepare role-specific follow-up evidence.",
      whyNow: "Ross already submitted this application manually outside StaffordOS, so the useful next work is follow-up readiness and interview preparation.",
      deadlineOrReviewDate: null,
      evidence: ["Manual external submission authority from operator mission context.", "Current private requirement and evidence mapping."],
      limitation: "Submission date, resume filename, cover-letter status, and employer response remain unknown unless Ross records them.",
      rossApprovalRequired: true,
      completionProof: "Ross records follow-up review date, employer response, or interview-prep completion in private Job Search records.",
      externalActionAuthorized: false,
    };
  }

  if (input.reviewQueue.length) {
    return {
      schemaVersion: "staffordos.job_search.private_next_action.v1",
      opportunityId: input.opportunityId,
      action: `Review ${Math.min(5, input.reviewQueue.length)} role-specific Career evidence questions.`,
      whyNow: "These questions materially affect recommendation and resume positioning.",
      deadlineOrReviewDate: null,
      evidence: input.reviewQueue.slice(0, 5).map((question) => question.id),
      limitation: "No resume or application action is authorized by this review queue.",
      rossApprovalRequired: true,
      completionProof: "Ross records operator decisions for the role-specific review questions.",
      externalActionAuthorized: false,
    };
  }

  return {
    schemaVersion: "staffordos.job_search.private_next_action.v1",
    opportunityId: input.opportunityId,
    action: "Prepare evidence-backed resume positioning for Ross review.",
    whyNow: "No blocking review questions were generated by the current mapping.",
    deadlineOrReviewDate: null,
    evidence: ["Private requirement extraction", "Private evidence mapping"],
    limitation: "Final resume generation is not authorized in this mission.",
    rossApprovalRequired: true,
    completionProof: "Ross approves positioning language before any resume artifact changes.",
    externalActionAuthorized: false,
  };
}

export function buildPrivateJobAnalysisBundle(input: PrivateJobAnalysisInput): PrivateJobAnalysisBundle {
  const requirements = extractPrivateJobRequirements({
    workspaceId: input.opportunity.workspaceId,
    jobOpportunityId: input.opportunity.id,
    sourceId: input.opportunity.sourceId,
    listingText: input.intakeRecord.listingText,
    sourceSummary: input.intakeRecord.sourceSummary,
    locationText: input.opportunity.locationText || input.intakeRecord.location || null,
    workArrangement: input.opportunity.workArrangement || input.intakeRecord.workArrangement || null,
    compensationText: input.opportunity.compensationText || input.intakeRecord.compensationText || null,
    employmentType: input.opportunity.employmentType || input.intakeRecord.employmentType || null,
    createdAt: input.generatedAt,
  });
  const mappings = mapRequirementsToCareerEvidence({
    requirements,
    careerFacts: input.careerFacts,
    careerEvidence: input.careerEvidence,
    createdAt: input.generatedAt,
  });
  const fitAssessment = buildPrivateJobFitAssessment({
    opportunityId: input.opportunity.id,
    requirements,
    mappings,
    applicationEvent: input.applicationEvent,
    createdAt: input.generatedAt,
  });
  const reviewQueue = buildReviewQueue(requirements, mappings);
  const positioningBrief = buildPositioningBrief({
    opportunityId: input.opportunity.id,
    requirements,
    mappings,
    reviewQueue,
    createdAt: input.generatedAt,
  });
  const nextAction = buildNextAction({
    opportunityId: input.opportunity.id,
    fitAssessment,
    reviewQueue,
  });
  const auditSummary: PrivateJobAnalysisAuditSummary = {
    schemaVersion: PRIVATE_JOB_ANALYSIS_AUDIT_SCHEMA_VERSION,
    workflowVersion: PRIVATE_JOB_ANALYSIS_WORKFLOW_VERSION,
    opportunityId: input.opportunity.id,
    generatedAt: input.generatedAt,
    noExternalNetwork: true,
    noExternalAi: true,
    noOllama: true,
    noApi: true,
    noDatabase: true,
    noApplicationSubmitted: true,
    noMessageSent: true,
    noResumeMutated: true,
    sourceTextStoredOnlyInPrivateArtifacts: true,
    outputDirectoryRedacted: input.outputDirectoryRedacted || "~/.staffordos/private/professional/job-search/analysis/<opportunity>/<run>",
    summary: {
      requirementCount: requirements.length,
      mappingCount: mappings.length,
      reviewQuestionCount: reviewQueue.length,
      finalRecommendation: fitAssessment.finalRecommendation,
    },
  };

  return {
    workflowVersion: PRIVATE_JOB_ANALYSIS_WORKFLOW_VERSION,
    opportunity: {
      id: input.opportunity.id,
      companyName: input.opportunity.companyName,
      roleTitle: input.opportunity.roleTitle,
      observedAt: input.opportunity.sourceRecord?.sourceObservedAt || input.opportunity.intakeTimestamp || null,
    },
    requirements,
    mappings,
    fitAssessment,
    positioningBrief,
    reviewQueue,
    applicationEvent: input.applicationEvent,
    nextAction,
    auditSummary,
  };
}

export function buildPrivateJobAnalysisPreview(bundle: PrivateJobAnalysisBundle) {
  return {
    opportunityId: bundle.opportunity.id,
    company: bundle.opportunity.companyName,
    role: bundle.opportunity.roleTitle,
    requirementsExtracted: bundle.requirements.length,
    mappingCoverage: bundle.fitAssessment.coverage,
    finalRecommendation: bundle.fitAssessment.finalRecommendation,
    nextAction: bundle.nextAction.action,
    roleSpecificReviewQuestionCount: bundle.reviewQueue.length,
    privatePathVisible: false,
    rawListingTextVisible: false,
    sourceUrlVisible: false,
    recruiterOrContactVisible: false,
  };
}

export function assertPrivateAnalysisOutputDirectory(outputDirectory: string, repositoryRoot: string) {
  if (!outputDirectory || isInsideDirectory(outputDirectory, repositoryRoot)) {
    throw new Error("Private analysis output directory must be outside the repository.");
  }
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  chmodSync(filePath, 0o600);
}

export function writePrivateJobAnalysisBundle(
  bundle: PrivateJobAnalysisBundle,
  options: {
    outputRoot: string;
    repositoryRoot: string;
  },
) {
  assertPrivateAnalysisOutputDirectory(options.outputRoot, options.repositoryRoot);
  const runDirectory = path.join(
    options.outputRoot,
    bundle.opportunity.id,
    `j001_03a_${compactDate(bundle.auditSummary.generatedAt)}`,
  );
  mkdirSync(runDirectory, { recursive: true, mode: 0o700 });
  chmodSync(runDirectory, 0o700);

  const artifacts = {
    "requirements.json": bundle.requirements,
    "requirement_evidence_mappings.json": bundle.mappings,
    "fit_assessment.json": bundle.fitAssessment,
    "positioning_brief.json": bundle.positioningBrief,
    "role_review_queue.json": bundle.reviewQueue,
    "application_event.json": bundle.applicationEvent,
    "next_action.json": bundle.nextAction,
    "processing_audit_summary.json": bundle.auditSummary,
  };

  const privateArtifacts: string[] = [];
  for (const [name, value] of Object.entries(artifacts)) {
    const filePath = path.join(runDirectory, name);
    writeJson(filePath, value);
    privateArtifacts.push(filePath);
  }

  return {
    runDirectory,
    runDirectoryRedacted: redactPathForReport(runDirectory),
    privateArtifacts,
    privateArtifactNames: Object.keys(artifacts),
  };
}

export function loadSelectedPrivateOpportunityInputs(options: {
  opportunityId: string;
  opportunityDirectory: string;
  intakeDirectory: string;
  careerDirectory: string;
  repositoryRoot: string;
}) {
  for (const dir of [options.opportunityDirectory, options.intakeDirectory, options.careerDirectory]) {
    if (isInsideDirectory(dir, options.repositoryRoot)) {
      throw new Error("Private input directory must be outside the repository.");
    }
  }

  const readJsonFiles = (dir: string) =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter((name) => name.endsWith(".json"))
          .map((name) => path.join(dir, name))
          .filter((filePath) => statSync(filePath).isFile())
          .map((filePath) => JSON.parse(readFileSync(filePath, "utf8")))
      : [];

  const opportunities = readJsonFiles(options.opportunityDirectory) as PrivateNormalizedJobOpportunity[];
  const opportunity = opportunities.find((item) => item.id === options.opportunityId);
  if (!opportunity) throw new Error("Selected private opportunity was not found.");

  const intakeRecord = readJsonFiles(options.intakeDirectory).find(
    (record) => record.roleTitle === opportunity.roleTitle && record.companyName === opportunity.companyName,
  );
  if (!intakeRecord) throw new Error("Matching private opportunity intake record was not found.");

  const careerArtifacts = readJsonFiles(options.careerDirectory);
  const isCareerFactRecord = (record: Partial<CareerFact>) =>
    typeof record.id === "string" &&
    typeof record.factType === "string" &&
    (typeof record.statement === "string" || typeof record.normalizedStatement === "string");
  const isCareerEvidenceRecord = (record: Partial<CareerEvidence>) =>
    typeof record.id === "string" &&
    typeof record.evidenceType === "string" &&
    (typeof record.title === "string" ||
      typeof record.summary === "string" ||
      Array.isArray((record as { supportsFactIds?: unknown }).supportsFactIds));
  const careerFacts = careerArtifacts.flatMap((artifact) =>
    Array.isArray(artifact.records) ? artifact.records.filter((record: Partial<CareerFact>) => isCareerFactRecord(record)) : [],
  );
  const careerEvidence = careerArtifacts.flatMap((artifact) =>
    Array.isArray(artifact.records)
      ? artifact.records.filter((record: Partial<CareerEvidence>) => isCareerEvidenceRecord(record))
      : [],
  );

  return {
    opportunity,
    intakeRecord,
    careerFacts,
    careerEvidence,
  };
}

export { buildManualExternalApplicationEvent };

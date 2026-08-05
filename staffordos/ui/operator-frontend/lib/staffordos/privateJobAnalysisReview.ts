import { createHash } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import type { PrivateRequirementEvidenceMapping, RequirementEvidenceClassification } from "./candidateEvidenceMapper";
import { summarizeMappingCoverage } from "./candidateEvidenceMapper";
import { buildPrivateJobFitAssessment, type ManualApplicationEvent } from "./jobFitAssessment";
import type { PrivateJobRequirementRecord } from "./jobRequirementExtractor";
import {
  buildPrivateJobAnalysisNextAction,
  buildPrivateJobAnalysisReviewQueue,
  buildPrivateJobPositioningBrief,
  type PrivateJobAnalysisAuditSummary,
  type PrivateJobAnalysisBundle,
  type PrivateJobAnalysisReviewQuestion,
  type PrivateJobNextAction,
  type PrivateJobPositioningBrief,
  writePrivateJobAnalysisBundle,
} from "./privateJobAnalysisWorkflow";

export const PRIVATE_JOB_ANALYSIS_REVIEW_VERSION = "J001.03B";
export const PRIVATE_JOB_ANALYSIS_DECISION_SCHEMA_VERSION =
  "staffordos.job_search.private_analysis_operator_decision.v1";
export const PRIVATE_JOB_ANALYSIS_CHANGE_REPORT_SCHEMA_VERSION =
  "staffordos.job_search.private_analysis_change_report.v1";

export const JOB_ANALYSIS_OPERATOR_DECISION_TYPES = [
  "CONFIRM_SUPPORTED",
  "CONFIRM_PARTIALLY_SUPPORTED",
  "CONFIRM_TRANSFERABLE",
  "CONFIRM_MISSING",
  "KEEP_UNKNOWN",
  "REJECT_CANDIDATE_EVIDENCE",
  "DEFER",
  "FLAG_CONFLICT",
  "ADD_OPERATOR_CONTEXT",
] as const;

export type JobAnalysisOperatorDecisionType = (typeof JOB_ANALYSIS_OPERATOR_DECISION_TYPES)[number];

export type PrivateJobAnalysisRunMetadata = {
  analysisRunId: string;
  opportunityId: string;
  company: string;
  role: string;
  analysisTimestamp: string;
  applicationState: string;
  requirementCount: number;
  unansweredReviewQuestionCount: number;
  recommendation: string;
  runLabel: string;
  runDirectory: string;
  privatePathVisible: false;
};

export type PrivateJobAnalysisOperatorDecision = {
  schemaVersion: typeof PRIVATE_JOB_ANALYSIS_DECISION_SCHEMA_VERSION;
  decisionId: string;
  workspaceId: "professional";
  opportunityId: string;
  analysisRunId: string;
  reviewQuestionId: string;
  requirementId: string;
  decisionType: JobAnalysisOperatorDecisionType;
  operatorConfirmed: true;
  selectedCareerFactIds: string[];
  selectedEvidenceIds: string[];
  operatorContext: string | null;
  limitation: string;
  createdAt: string;
  supersedesDecisionId: string | null;
  sourceAuthority: "ROSS_OPERATOR_DECISION";
  privacy: "Professional owner-private";
  canonicalCareerFactUpdated: false;
  applicationSubmitted: false;
  messageSent: false;
  resumeMutated: false;
};

export type RoleFocusedReviewQuestion = {
  reviewQuestionId: string;
  opportunityId: string;
  requirementId: string;
  question: string;
  whyItMatters: string;
  candidateCareerFactIds: string[];
  candidateEvidenceIds: string[];
  currentClassification: RequirementEvidenceClassification;
  currentLimitation: string;
  allowedDecisionTypes: JobAnalysisOperatorDecisionType[];
  priority: number;
  status: "UNANSWERED" | "ANSWERED";
  answeredAt: string | null;
  operatorDecisionId: string | null;
};

export type PrivateJobAnalysisChangeReport = {
  schemaVersion: typeof PRIVATE_JOB_ANALYSIS_CHANGE_REPORT_SCHEMA_VERSION;
  workflowVersion: typeof PRIVATE_JOB_ANALYSIS_REVIEW_VERSION;
  previousAnalysisRunId: string;
  regeneratedAnalysisRunId: string | null;
  generatedAt: string;
  decisionsApplied: number;
  classificationChanges: Array<{
    requirementId: string;
    before: RequirementEvidenceClassification;
    after: RequirementEvidenceClassification;
    reason: string;
  }>;
  classificationsUnchanged: number;
  conflictsAdded: string[];
  conflictsResolved: string[];
  coverageBefore: ReturnType<typeof summarizeMappingCoverage>;
  coverageAfter: ReturnType<typeof summarizeMappingCoverage>;
  recommendationBefore: string;
  recommendationAfter: string;
  positioningChanged: boolean;
  nextActionBefore: string;
  nextActionAfter: string;
  remainingHighPriorityQuestionCount: number;
  noEmployerSuccessProbability: true;
  applicationStatePreserved: true;
};

type LoadedPrivateJobAnalysisRun = {
  metadata: PrivateJobAnalysisRunMetadata;
  bundle: PrivateJobAnalysisBundle;
};

type JsonRecord = Record<string, unknown>;

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
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

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  chmodSync(filePath, 0o600);
}

function ensurePrivateDirectory(directory: string) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
}

function immediateSubdirectories(directory: string) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .map((name) => path.join(directory, name))
    .filter((candidate) => statSync(candidate).isDirectory());
}

function analysisRunIdFor(runDirectory: string) {
  return `privjobanalysis_${sha256Text(path.resolve(runDirectory)).slice(0, 18)}`;
}

function loadOpportunitySummaries(opportunityDirectory: string | null | undefined, repositoryRoot: string) {
  const summaries = new Map<string, { company: string; role: string }>();
  if (!opportunityDirectory) return summaries;
  assertOutsideRepository(opportunityDirectory, repositoryRoot, "Private opportunity directory");
  if (!existsSync(opportunityDirectory)) return summaries;

  for (const name of readdirSync(opportunityDirectory).filter((entry) => entry.endsWith(".json"))) {
    const filePath = path.join(opportunityDirectory, name);
    if (!statSync(filePath).isFile()) continue;
    const record = readJson<JsonRecord>(filePath);
    if (typeof record.id !== "string") continue;
    summaries.set(record.id, {
      company: typeof record.companyName === "string" && record.companyName ? record.companyName : "UNKNOWN",
      role: typeof record.roleTitle === "string" && record.roleTitle ? record.roleTitle : "UNKNOWN",
    });
  }

  return summaries;
}

function loadDecisionFile(filePath: string) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as PrivateJobAnalysisOperatorDecision);
}

function decisionsFilePath(decisionRoot: string, opportunityId: string, analysisRunId: string) {
  return path.join(decisionRoot, opportunityId, analysisRunId, "decisions.ndjson");
}

function latestDecisionByQuestion(decisions: readonly PrivateJobAnalysisOperatorDecision[]) {
  const latest = new Map<string, PrivateJobAnalysisOperatorDecision>();
  for (const decision of decisions) {
    latest.set(decision.reviewQuestionId, decision);
  }
  return latest;
}

export function listPrivateJobAnalysisRuns(options: {
  analysisRoot: string;
  repositoryRoot: string;
  opportunityDirectory?: string | null;
  decisionRoot?: string | null;
}): PrivateJobAnalysisRunMetadata[] {
  assertOutsideRepository(options.analysisRoot, options.repositoryRoot, "Private analysis root");
  if (options.decisionRoot) assertOutsideRepository(options.decisionRoot, options.repositoryRoot, "Private decision root");
  const opportunities = loadOpportunitySummaries(options.opportunityDirectory, options.repositoryRoot);
  const runs: PrivateJobAnalysisRunMetadata[] = [];

  for (const opportunityDirectory of immediateSubdirectories(options.analysisRoot)) {
    for (const runDirectory of immediateSubdirectories(opportunityDirectory)) {
      const auditPath = path.join(runDirectory, "processing_audit_summary.json");
      const applicationPath = path.join(runDirectory, "application_event.json");
      const fitPath = path.join(runDirectory, "fit_assessment.json");
      const reviewPath = path.join(runDirectory, "role_review_queue.json");
      if (!existsSync(auditPath) || !existsSync(fitPath)) continue;

      const audit = readJson<PrivateJobAnalysisAuditSummary>(auditPath);
      const application = existsSync(applicationPath) ? readJson<ManualApplicationEvent>(applicationPath) : null;
      const fit = readJson<{ applicationState?: string; finalRecommendation?: string }>(fitPath);
      const reviewQuestions = existsSync(reviewPath) ? readJson<PrivateJobAnalysisReviewQuestion[]>(reviewPath) : [];
      const analysisRunId = analysisRunIdFor(runDirectory);
      const decisions =
        options.decisionRoot && audit.opportunityId
          ? loadDecisionFile(decisionsFilePath(options.decisionRoot, audit.opportunityId, analysisRunId))
          : [];
      const answeredIds = new Set(decisions.map((decision) => decision.reviewQuestionId));
      const opportunity = opportunities.get(audit.opportunityId);

      runs.push({
        analysisRunId,
        opportunityId: audit.opportunityId,
        company: opportunity?.company || "UNKNOWN",
        role: opportunity?.role || "UNKNOWN",
        analysisTimestamp: audit.generatedAt,
        applicationState: application?.applicationState || fit.applicationState || "UNKNOWN",
        requirementCount: audit.summary.requirementCount,
        unansweredReviewQuestionCount: reviewQuestions.filter((question) => !answeredIds.has(question.id)).length,
        recommendation: audit.summary.finalRecommendation || fit.finalRecommendation || "UNKNOWN",
        runLabel: path.basename(runDirectory),
        runDirectory,
        privatePathVisible: false,
      });
    }
  }

  return runs.sort((a, b) => b.analysisTimestamp.localeCompare(a.analysisTimestamp));
}

export function loadPrivateJobAnalysisRun(options: {
  analysisRoot: string;
  repositoryRoot: string;
  opportunityDirectory?: string | null;
  decisionRoot?: string | null;
  analysisRunId?: string | null;
  latest?: boolean;
}): LoadedPrivateJobAnalysisRun {
  const runs = listPrivateJobAnalysisRuns(options);
  const selected = options.analysisRunId
    ? runs.find((run) => run.analysisRunId === options.analysisRunId)
    : options.latest
      ? runs[0]
      : null;
  if (!selected) throw new Error("Selected private analysis run was not found.");

  const bundle: PrivateJobAnalysisBundle = {
    workflowVersion: "J001.03A",
    opportunity: {
      id: selected.opportunityId,
      companyName: selected.company,
      roleTitle: selected.role,
      observedAt: null,
    },
    requirements: readJson<PrivateJobRequirementRecord[]>(path.join(selected.runDirectory, "requirements.json")),
    mappings: readJson<PrivateRequirementEvidenceMapping[]>(path.join(selected.runDirectory, "requirement_evidence_mappings.json")),
    fitAssessment: readJson<PrivateJobAnalysisBundle["fitAssessment"]>(path.join(selected.runDirectory, "fit_assessment.json")),
    positioningBrief: readJson<PrivateJobPositioningBrief>(path.join(selected.runDirectory, "positioning_brief.json")),
    reviewQueue: readJson<PrivateJobAnalysisReviewQuestion[]>(path.join(selected.runDirectory, "role_review_queue.json")),
    applicationEvent: readJson<ManualApplicationEvent>(path.join(selected.runDirectory, "application_event.json")),
    nextAction: readJson<PrivateJobNextAction>(path.join(selected.runDirectory, "next_action.json")),
    auditSummary: readJson<PrivateJobAnalysisAuditSummary>(path.join(selected.runDirectory, "processing_audit_summary.json")),
  };

  return { metadata: selected, bundle };
}

export function loadPrivateJobAnalysisDecisions(options: {
  decisionRoot: string;
  repositoryRoot: string;
  opportunityId: string;
  analysisRunId: string;
}) {
  assertOutsideRepository(options.decisionRoot, options.repositoryRoot, "Private decision root");
  return loadDecisionFile(decisionsFilePath(options.decisionRoot, options.opportunityId, options.analysisRunId));
}

export function buildRoleFocusedReviewQuestions(input: {
  bundle: PrivateJobAnalysisBundle;
  decisions?: readonly PrivateJobAnalysisOperatorDecision[];
}): RoleFocusedReviewQuestion[] {
  const mappingByRequirement = new Map(input.bundle.mappings.map((mapping) => [mapping.requirementId, mapping]));
  const latest = latestDecisionByQuestion(input.decisions || []);

  return input.bundle.reviewQueue.map((question) => {
    const mapping = mappingByRequirement.get(question.requirementId);
    const decision = latest.get(question.id) || null;
    return {
      reviewQuestionId: question.id,
      opportunityId: input.bundle.opportunity.id,
      requirementId: question.requirementId,
      question: question.question,
      whyItMatters: question.whyItMatters,
      candidateCareerFactIds: mapping?.careerFactIds || [],
      candidateEvidenceIds: mapping?.careerEvidenceIds || [],
      currentClassification: mapping?.classification || "UNKNOWN",
      currentLimitation: mapping?.supportLimitations[0] || "No mapping limitation is available.",
      allowedDecisionTypes: [...JOB_ANALYSIS_OPERATOR_DECISION_TYPES],
      priority: question.priority,
      status: decision ? "ANSWERED" : "UNANSWERED",
      answeredAt: decision?.createdAt || null,
      operatorDecisionId: decision?.decisionId || null,
    };
  });
}

function currentMappingFor(bundle: PrivateJobAnalysisBundle, requirementId: string) {
  return bundle.mappings.find((mapping) => mapping.requirementId === requirementId) || null;
}

function currentRequirementFor(bundle: PrivateJobAnalysisBundle, requirementId: string) {
  return bundle.requirements.find((requirement) => requirement.id === requirementId) || null;
}

function decisionValidationError(input: {
  bundle: PrivateJobAnalysisBundle;
  reviewQuestionId: string;
  requirementId: string;
  decisionType: JobAnalysisOperatorDecisionType;
  selectedCareerFactIds?: readonly string[];
  selectedEvidenceIds?: readonly string[];
  operatorConfirmed?: boolean;
}) {
  if (!input.operatorConfirmed) return "OPERATOR_CONFIRMATION_REQUIRED";
  if (!JOB_ANALYSIS_OPERATOR_DECISION_TYPES.includes(input.decisionType)) return "UNSUPPORTED_DECISION_TYPE";
  const question = input.bundle.reviewQueue.find((item) => item.id === input.reviewQuestionId);
  if (!question) return "REVIEW_QUESTION_NOT_FOUND";
  if (question.requirementId !== input.requirementId) return "REVIEW_QUESTION_REQUIREMENT_MISMATCH";

  const mapping = currentMappingFor(input.bundle, input.requirementId);
  const requirement = currentRequirementFor(input.bundle, input.requirementId);
  if (!mapping || !requirement) return "MAPPING_NOT_FOUND";

  const candidateFacts = new Set(mapping.careerFactIds);
  const candidateEvidence = new Set(mapping.careerEvidenceIds);
  const selectedFacts = input.selectedCareerFactIds || [];
  const selectedEvidence = input.selectedEvidenceIds || [];
  if (selectedFacts.some((id) => !candidateFacts.has(id))) return "SELECTED_FACT_NOT_CANDIDATE";
  if (selectedEvidence.some((id) => !candidateEvidence.has(id))) return "SELECTED_EVIDENCE_NOT_CANDIDATE";

  if (input.decisionType === "CONFIRM_SUPPORTED") {
    if (mapping.classification !== "PROVEN") return "CONFIRM_SUPPORTED_REQUIRES_PROVEN_MAPPING";
    if (!mapping.careerFactIds.length || !mapping.careerEvidenceIds.length) return "CONFIRM_SUPPORTED_REQUIRES_EVIDENCE";
    if (requirement.yearsMentioned !== null && mapping.prohibitedOverstatement.some((item) => /years/i.test(item))) {
      return "UNSUPPORTED_YEARS_CANNOT_BE_CONFIRMED";
    }
    if (requirement.certificationMentioned && mapping.prohibitedOverstatement.some((item) => /certification/i.test(item))) {
      return "UNSUPPORTED_CERTIFICATION_CANNOT_BE_CONFIRMED";
    }
    if (mapping.supportLimitations.some((item) => /Resume wording alone/i.test(item))) return "RESUME_WORDING_CANNOT_VERIFY";
  }

  if (
    (input.decisionType === "CONFIRM_TRANSFERABLE" || input.decisionType === "CONFIRM_PARTIALLY_SUPPORTED") &&
    selectedFacts.length === 0 &&
    selectedEvidence.length === 0
  ) {
    return "SUPPORT_DECISION_REQUIRES_SELECTED_CANDIDATE_EVIDENCE";
  }

  if (input.decisionType === "CONFIRM_SUPPORTED" && /\b\d+%|\$\d|\b\d+x\b/i.test(requirement.requirementText)) {
    return "UNSUPPORTED_METRIC_CANNOT_BE_CONFIRMED";
  }

  return null;
}

export function createPrivateJobAnalysisOperatorDecision(input: {
  bundle: PrivateJobAnalysisBundle;
  analysisRunId: string;
  reviewQuestionId: string;
  requirementId: string;
  decisionType: JobAnalysisOperatorDecisionType;
  selectedCareerFactIds?: readonly string[];
  selectedEvidenceIds?: readonly string[];
  operatorContext?: string | null;
  createdAt: string;
  existingDecisions?: readonly PrivateJobAnalysisOperatorDecision[];
  operatorConfirmed?: boolean;
}): PrivateJobAnalysisOperatorDecision {
  const error = decisionValidationError(input);
  if (error) throw new Error(error);
  const supersedes =
    [...(input.existingDecisions || [])]
      .reverse()
      .find((decision) => decision.reviewQuestionId === input.reviewQuestionId)?.decisionId || null;
  const limitation =
    input.decisionType === "CONFIRM_SUPPORTED"
      ? "Role-specific decision confirms an already proven mapping only; it does not rewrite canonical Career facts."
      : "Role-specific decision updates this analysis only and does not verify or rewrite canonical Career facts.";
  const seed = [
    input.analysisRunId,
    input.reviewQuestionId,
    input.requirementId,
    input.decisionType,
    input.createdAt,
    (input.selectedCareerFactIds || []).join(","),
    (input.selectedEvidenceIds || []).join(","),
  ].join("|");

  return {
    schemaVersion: PRIVATE_JOB_ANALYSIS_DECISION_SCHEMA_VERSION,
    decisionId: `privjobdecision_${sha256Text(seed).slice(0, 18)}`,
    workspaceId: "professional",
    opportunityId: input.bundle.opportunity.id,
    analysisRunId: input.analysisRunId,
    reviewQuestionId: input.reviewQuestionId,
    requirementId: input.requirementId,
    decisionType: input.decisionType,
    operatorConfirmed: true,
    selectedCareerFactIds: [...(input.selectedCareerFactIds || [])],
    selectedEvidenceIds: [...(input.selectedEvidenceIds || [])],
    operatorContext: input.operatorContext || null,
    limitation,
    createdAt: input.createdAt,
    supersedesDecisionId: supersedes,
    sourceAuthority: "ROSS_OPERATOR_DECISION",
    privacy: "Professional owner-private",
    canonicalCareerFactUpdated: false,
    applicationSubmitted: false,
    messageSent: false,
    resumeMutated: false,
  };
}

export function appendPrivateJobAnalysisOperatorDecision(options: {
  decisionRoot: string;
  repositoryRoot: string;
  decision: PrivateJobAnalysisOperatorDecision;
}) {
  assertOutsideRepository(options.decisionRoot, options.repositoryRoot, "Private decision root");
  const directory = path.dirname(decisionsFilePath(options.decisionRoot, options.decision.opportunityId, options.decision.analysisRunId));
  ensurePrivateDirectory(directory);
  const filePath = path.join(directory, "decisions.ndjson");
  appendFileSync(filePath, `${JSON.stringify(options.decision)}\n`, { encoding: "utf8", mode: 0o600 });
  chmodSync(filePath, 0o600);
  return {
    decisionFile: filePath,
    decisionFileRedacted: "$HOME/.staffordos/private/professional/job-search/analysis-decisions/<opportunity>/<analysis-run>/decisions.ndjson",
    privatePathVisible: false as const,
  };
}

function nextClassification(decisionType: JobAnalysisOperatorDecisionType, current: RequirementEvidenceClassification) {
  if (decisionType === "DEFER") return current;
  if (decisionType === "KEEP_UNKNOWN" || decisionType === "ADD_OPERATOR_CONTEXT" || decisionType === "FLAG_CONFLICT") return "UNKNOWN";
  if (decisionType === "CONFIRM_TRANSFERABLE") return "TRANSFERABLE";
  if (decisionType === "CONFIRM_PARTIALLY_SUPPORTED") return "PARTIAL";
  if (decisionType === "CONFIRM_MISSING" || decisionType === "REJECT_CANDIDATE_EVIDENCE") return "MISSING";
  if (decisionType === "CONFIRM_SUPPORTED") return current === "PROVEN" ? "PROVEN" : current;
  return current;
}

function reasonForDecision(decision: PrivateJobAnalysisOperatorDecision, before: RequirementEvidenceClassification, after: RequirementEvidenceClassification) {
  if (decision.decisionType === "DEFER") return "Ross deferred the question; mapping remains unchanged.";
  if (decision.decisionType === "KEEP_UNKNOWN") return "Ross kept the requirement unknown for this role-specific analysis.";
  if (decision.decisionType === "CONFIRM_TRANSFERABLE") {
    return "Ross confirmed adjacent evidence can be positioned as transferable, not as direct proof.";
  }
  if (decision.decisionType === "CONFIRM_PARTIALLY_SUPPORTED") {
    return "Ross confirmed partial support for this role-specific analysis without verifying the canonical Career fact.";
  }
  if (decision.decisionType === "CONFIRM_MISSING") return "Ross confirmed the current evidence does not support this requirement.";
  if (decision.decisionType === "REJECT_CANDIDATE_EVIDENCE") return "Ross rejected candidate evidence for this requirement in this analysis.";
  if (decision.decisionType === "FLAG_CONFLICT") return "Ross flagged a conflict that must remain visible.";
  if (decision.decisionType === "ADD_OPERATOR_CONTEXT") return "Ross added private operator context; it does not become verified evidence.";
  return before === after ? "Decision preserved the prior classification." : "Decision changed the role-specific classification.";
}

export function applyPrivateJobAnalysisDecisions(input: {
  bundle: PrivateJobAnalysisBundle;
  decisions: readonly PrivateJobAnalysisOperatorDecision[];
}) {
  const latestByRequirement = new Map<string, PrivateJobAnalysisOperatorDecision>();
  for (const decision of input.decisions) {
    latestByRequirement.set(decision.requirementId, decision);
  }

  return input.bundle.mappings.map((mapping): PrivateRequirementEvidenceMapping => {
    const decision = latestByRequirement.get(mapping.requirementId);
    if (!decision) return mapping;
    const after = nextClassification(decision.decisionType, mapping.classification);
    if (decision.decisionType === "DEFER") return mapping;
    return {
      ...mapping,
      classification: after,
      explanation: reasonForDecision(decision, mapping.classification, after),
      supportLimitations: [
        ...mapping.supportLimitations,
        decision.limitation,
        "Role-specific review decision is private and append-only.",
      ],
      verificationStatus: after === "PROVEN" ? mapping.verificationStatus : "ROLE_SPECIFIC_REVIEWED",
      conflictStatus: decision.decisionType === "FLAG_CONFLICT" ? "CONFLICT_REQUIRES_REVIEW" : mapping.conflictStatus,
      operatorReviewRequirement:
        after === "UNKNOWN" ? "Requires additional Ross review before use." : "Role-specific Ross review decision recorded.",
      safePositioning:
        after === "TRANSFERABLE"
          ? "Position as adjacent or transferable experience; do not claim exact same-role experience."
          : after === "PARTIAL"
            ? "Use limited wording that preserves scope, recency, depth, and unresolved limitations."
            : after === "MISSING"
              ? "Do not claim this requirement. Treat it as a gap or review item."
              : mapping.safePositioning,
      createdAt: decision.createdAt,
    };
  });
}

export function regeneratePrivateJobAnalysisFromDecisions(input: {
  previous: LoadedPrivateJobAnalysisRun;
  decisions: readonly PrivateJobAnalysisOperatorDecision[];
  generatedAt: string;
}) {
  const updatedMappings = applyPrivateJobAnalysisDecisions({
    bundle: input.previous.bundle,
    decisions: input.decisions,
  });
  const fitAssessment = buildPrivateJobFitAssessment({
    opportunityId: input.previous.bundle.opportunity.id,
    requirements: input.previous.bundle.requirements,
    mappings: updatedMappings,
    applicationEvent: input.previous.bundle.applicationEvent,
    createdAt: input.generatedAt,
  });
  const reviewQueue = buildPrivateJobAnalysisReviewQueue(input.previous.bundle.requirements, updatedMappings);
  const positioningBrief = buildPrivateJobPositioningBrief({
    opportunityId: input.previous.bundle.opportunity.id,
    requirements: input.previous.bundle.requirements,
    mappings: updatedMappings,
    reviewQueue,
    createdAt: input.generatedAt,
  });
  const nextAction = buildPrivateJobAnalysisNextAction({
    opportunityId: input.previous.bundle.opportunity.id,
    fitAssessment,
    reviewQueue,
  });
  const auditSummary: PrivateJobAnalysisAuditSummary = {
    ...input.previous.bundle.auditSummary,
    generatedAt: input.generatedAt,
    summary: {
      requirementCount: input.previous.bundle.requirements.length,
      mappingCount: updatedMappings.length,
      reviewQuestionCount: reviewQueue.length,
      finalRecommendation: fitAssessment.finalRecommendation,
    },
  };
  const regeneratedBundle: PrivateJobAnalysisBundle = {
    ...input.previous.bundle,
    mappings: updatedMappings,
    fitAssessment,
    positioningBrief,
    reviewQueue,
    nextAction,
    auditSummary,
  };
  const changeReport = buildPrivateJobAnalysisChangeReport({
    previous: input.previous,
    regeneratedBundle,
    decisions: input.decisions,
    generatedAt: input.generatedAt,
    regeneratedAnalysisRunId: null,
  });

  return { regeneratedBundle, changeReport };
}

export function buildPrivateJobAnalysisChangeReport(input: {
  previous: LoadedPrivateJobAnalysisRun;
  regeneratedBundle: PrivateJobAnalysisBundle;
  decisions: readonly PrivateJobAnalysisOperatorDecision[];
  generatedAt: string;
  regeneratedAnalysisRunId: string | null;
}): PrivateJobAnalysisChangeReport {
  const beforeById = new Map(input.previous.bundle.mappings.map((mapping) => [mapping.requirementId, mapping]));
  const classificationChanges = input.regeneratedBundle.mappings.flatMap((after) => {
    const before = beforeById.get(after.requirementId);
    if (!before || before.classification === after.classification) return [];
    const decision = input.decisions.find((item) => item.requirementId === after.requirementId);
    return [
      {
        requirementId: after.requirementId,
        before: before.classification,
        after: after.classification,
        reason: decision ? reasonForDecision(decision, before.classification, after.classification) : "Mapping changed during deterministic reanalysis.",
      },
    ];
  });
  const conflictsAdded = input.regeneratedBundle.mappings
    .filter((after) => beforeById.get(after.requirementId)?.conflictStatus !== "CONFLICT_REQUIRES_REVIEW" && after.conflictStatus === "CONFLICT_REQUIRES_REVIEW")
    .map((mapping) => mapping.requirementId);
  const applicationStatePreserved =
    input.previous.bundle.applicationEvent.applicationState === input.regeneratedBundle.applicationEvent.applicationState;
  if (!applicationStatePreserved) {
    throw new Error("Private job analysis reanalysis cannot change application state.");
  }

  return {
    schemaVersion: PRIVATE_JOB_ANALYSIS_CHANGE_REPORT_SCHEMA_VERSION,
    workflowVersion: PRIVATE_JOB_ANALYSIS_REVIEW_VERSION,
    previousAnalysisRunId: input.previous.metadata.analysisRunId,
    regeneratedAnalysisRunId: input.regeneratedAnalysisRunId,
    generatedAt: input.generatedAt,
    decisionsApplied: input.decisions.length,
    classificationChanges,
    classificationsUnchanged: input.regeneratedBundle.mappings.length - classificationChanges.length,
    conflictsAdded,
    conflictsResolved: [],
    coverageBefore: summarizeMappingCoverage(input.previous.bundle.mappings),
    coverageAfter: summarizeMappingCoverage(input.regeneratedBundle.mappings),
    recommendationBefore: input.previous.bundle.fitAssessment.finalRecommendation,
    recommendationAfter: input.regeneratedBundle.fitAssessment.finalRecommendation,
    positioningChanged:
      JSON.stringify(input.previous.bundle.positioningBrief) !== JSON.stringify(input.regeneratedBundle.positioningBrief),
    nextActionBefore: input.previous.bundle.nextAction.action,
    nextActionAfter: input.regeneratedBundle.nextAction.action,
    remainingHighPriorityQuestionCount: input.regeneratedBundle.reviewQueue.length,
    noEmployerSuccessProbability: true,
    applicationStatePreserved,
  };
}

export function writeRegeneratedPrivateJobAnalysis(options: {
  outputRoot: string;
  repositoryRoot: string;
  previous: LoadedPrivateJobAnalysisRun;
  regeneratedBundle: PrivateJobAnalysisBundle;
  changeReport: PrivateJobAnalysisChangeReport;
}) {
  const result = writePrivateJobAnalysisBundle(options.regeneratedBundle, {
    outputRoot: options.outputRoot,
    repositoryRoot: options.repositoryRoot,
  });
  const regeneratedAnalysisRunId = analysisRunIdFor(result.runDirectory);
  const report = {
    ...options.changeReport,
    regeneratedAnalysisRunId,
  };
  const changeReportPath = path.join(result.runDirectory, "change_report.json");
  writeJson(changeReportPath, report);
  return {
    ...result,
    regeneratedAnalysisRunId,
    previousAnalysisRunId: options.previous.metadata.analysisRunId,
    privateArtifactNames: [...result.privateArtifactNames, "change_report.json"],
    privateArtifacts: [...result.privateArtifacts, changeReportPath],
    changeReport: report,
  };
}

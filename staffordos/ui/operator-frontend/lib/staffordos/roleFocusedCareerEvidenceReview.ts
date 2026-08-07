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
import { buildPrivateJobFitAssessment } from "./jobFitAssessment";
import {
  buildPrivateJobAnalysisNextAction,
  buildPrivateJobAnalysisReviewQueue,
  buildPrivateJobPositioningBrief,
  type PrivateJobAnalysisAuditSummary,
  type PrivateJobAnalysisBundle,
  writePrivateJobAnalysisBundle,
} from "./privateJobAnalysisWorkflow";
import { loadPrivateJobAnalysisRun, type PrivateJobAnalysisRunMetadata } from "./privateJobAnalysisReview";

export const ROLE_FOCUSED_CAREER_EVIDENCE_REVIEW_VERSION = "S010.02D";
export const ROLE_FOCUSED_CAREER_EVIDENCE_DECISION_SCHEMA_VERSION =
  "staffordos.professional.role_focused_career_evidence_decision.v1";
export const ROLE_FOCUSED_CAREER_EVIDENCE_CHANGE_REPORT_SCHEMA_VERSION =
  "staffordos.professional.role_focused_career_evidence_change_report.v1";

export const ROLE_FOCUSED_CAREER_EVIDENCE_OUTCOMES = [
  "VERIFIED",
  "PARTIALLY_SUPPORTED",
  "TRANSFERABLE",
  "NEEDS_EVIDENCE",
  "CONFLICTING",
  "REJECTED",
  "DEFERRED",
] as const;

export type RoleFocusedCareerEvidenceOutcome = (typeof ROLE_FOCUSED_CAREER_EVIDENCE_OUTCOMES)[number];

export type CareerCandidateFactSummary = {
  id: string;
  factType: string;
  statement: string;
  verificationStatus: string;
  authorityClassification: string;
  skillContext: string | null;
  metricClassification: string | null;
  limitations: string[];
};

export type CareerEvidenceSummary = {
  id: string;
  evidenceType: string;
  sourceKind: string | null;
  authorityClassification: string;
  freshness: string;
  limitations: string[];
};

export type RoleFocusedCareerEvidenceReviewItem = {
  reviewItemId: string;
  analysisRunId: string;
  opportunityId: string;
  requirementId: string;
  requirementText: string;
  requirementCategory: string;
  requirementLevel: string;
  currentClassification: RequirementEvidenceClassification;
  currentConflictStatus: PrivateRequirementEvidenceMapping["conflictStatus"];
  reusableCareerLanes: string[];
  candidateFacts: CareerCandidateFactSummary[];
  candidateEvidence: CareerEvidenceSummary[];
  whatWouldMoveToPartial: string;
  whatWouldMoveToProven: string;
  conciseQuestion: string;
  priority: number;
};

export type RoleFocusedCareerEvidenceDecision = {
  schemaVersion: typeof ROLE_FOCUSED_CAREER_EVIDENCE_DECISION_SCHEMA_VERSION;
  decisionId: string;
  workspaceId: "professional";
  analysisRunId: string;
  opportunityId: string;
  requirementId: string;
  reviewItemId: string;
  outcome: RoleFocusedCareerEvidenceOutcome;
  operatorConfirmed: true;
  selectedCareerFactIds: string[];
  selectedEvidenceIds: string[];
  operatorContext: string | null;
  limitation: string;
  createdAt: string;
  supersedesDecisionId: string | null;
  sourceAuthority: "ROSS_ROLE_FOCUSED_CAREER_EVIDENCE_REVIEW";
  privacy: "Professional owner-private";
  canonicalCareerEvidenceUpdated: false;
  applicationSubmitted: false;
  messageSent: false;
  resumeMutated: false;
};

export type RoleFocusedCareerEvidenceChangeReport = {
  schemaVersion: typeof ROLE_FOCUSED_CAREER_EVIDENCE_CHANGE_REPORT_SCHEMA_VERSION;
  workflowVersion: typeof ROLE_FOCUSED_CAREER_EVIDENCE_REVIEW_VERSION;
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
  coverageBefore: ReturnType<typeof summarizeMappingCoverage>;
  coverageAfter: ReturnType<typeof summarizeMappingCoverage>;
  remainingMajorGaps: string[];
  reusableCareerFactsImproved: string[];
  positioningImplications: string[];
  recommendationBefore: string;
  recommendationAfter: string;
  nextActionAfter: string;
  canonicalCareerEvidenceUpdated: false;
  noEmployerSuccessProbability: true;
  applicationStatePreserved: true;
};

type AnyRecord = Record<string, unknown>;

type LoadedRoleFocusedAnalysis = {
  metadata: PrivateJobAnalysisRunMetadata;
  bundle: PrivateJobAnalysisBundle;
};

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

function walkFiles(directory: string, maxDepth = 6) {
  if (!existsSync(directory)) return [];
  const files: string[] = [];
  const walk = (current: string, depth: number) => {
    if (depth > maxDepth) return;
    for (const name of readdirSync(current)) {
      const filePath = path.join(current, name);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        walk(filePath, depth + 1);
      } else if (stat.isFile()) {
        files.push(filePath);
      }
    }
  };
  walk(directory, 0);
  return files;
}

function payloadArray(filePath: string) {
  const value = readJson<unknown>(filePath);
  if (Array.isArray(value)) return value as AnyRecord[];
  if (value && typeof value === "object" && Array.isArray((value as { records?: unknown }).records)) {
    return (value as { records: AnyRecord[] }).records;
  }
  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: AnyRecord[] }).data;
  }
  return [];
}

function stringValue(value: unknown, fallback = "UNKNOWN") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function unique<T>(items: readonly T[]) {
  return [...new Set(items)];
}

function safeIdList(value: unknown) {
  return stringArray(value).filter(Boolean);
}

function factSummary(record: AnyRecord): CareerCandidateFactSummary {
  return {
    id: stringValue(record.id),
    factType: stringValue(record.factType),
    statement: stringValue(record.statement, ""),
    verificationStatus: stringValue(record.verificationStatus),
    authorityClassification: stringValue(record.authorityClassification),
    skillContext: typeof record.skillContext === "string" ? record.skillContext : typeof record.experienceClassification === "string" ? record.experienceClassification : null,
    metricClassification: typeof record.metricClassification === "string" ? record.metricClassification : null,
    limitations: stringArray(record.limitations).slice(0, 3),
  };
}

function evidenceSummary(record: AnyRecord): CareerEvidenceSummary {
  return {
    id: stringValue(record.id),
    evidenceType: stringValue(record.evidenceType),
    sourceKind: typeof record.sourceKind === "string" ? record.sourceKind : null,
    authorityClassification: stringValue(record.authorityClassification),
    freshness: stringValue(record.freshness),
    limitations: stringArray(record.limitations).slice(0, 3),
  };
}

function careerLaneSignals(text: string) {
  const lanes: string[] = [];
  if (/\b(product|roadmap|rollout|customer experience|customer-facing)\b/i.test(text)) lanes.push("AI Product");
  if (/\b(governance|guardrail|standard|best practice|risk|policy)\b/i.test(text)) lanes.push("AI Governance");
  if (/\b(platform|infrastructure|single source of truth|scale|system)\b/i.test(text)) lanes.push("AI Platform");
  if (/\b(agent|computer-use|llm|prompt|evaluation|framework)\b/i.test(text)) lanes.push("Agentic Development");
  if (/\b(automation|automates|workflow|back-office)\b/i.test(text)) lanes.push("Automation");
  if (/\b(technical|engineer|sql|data|latency|cost|accuracy)\b/i.test(text)) lanes.push("Technical Product");
  return unique(lanes);
}

function reusableScore(item: {
  requirementText: string;
  requirementCategory: string;
  requirementLevel: string;
  classification: RequirementEvidenceClassification;
  conflictStatus: string;
}) {
  let score = careerLaneSignals(item.requirementText).length * 12;
  if (item.classification === "TRANSFERABLE") score += 8;
  if (item.classification === "UNKNOWN") score += 4;
  if (item.requirementCategory === "Leadership") score += 8;
  if (item.requirementCategory === "Responsibility") score += 5;
  if (item.requirementLevel === "REQUIRED") score += 8;
  if (item.conflictStatus !== "NO_CONFLICT") score -= 4;
  if (/compensation|benefit|equal employment|accommodation|employment type|how you|ideal experience/i.test(item.requirementText)) {
    score -= 80;
  }
  return score;
}

function whatMovesToPartial(facts: readonly CareerCandidateFactSummary[], evidence: readonly CareerEvidenceSummary[]) {
  if (!facts.length || !evidence.length) {
    return "A specific private Career fact plus at least one supporting evidence record would be needed for partial support.";
  }
  return "Ross can mark this partially supported only if the listed facts accurately describe his experience and the evidence supports the narrower claim without adding metrics, years, titles, dates, or production use.";
}

function hasStrongAuthority(evidence: CareerEvidenceSummary) {
  return ["OFFICIAL_DOCUMENT", "PROVIDER_CONFIRMED", "PUBLIC_ARTIFACT"].includes(evidence.authorityClassification);
}

function whatMovesToProven(facts: readonly CareerCandidateFactSummary[], evidence: readonly CareerEvidenceSummary[]) {
  if (facts.some((fact) => fact.verificationStatus === "VERIFIED") && evidence.some(hasStrongAuthority)) {
    return "A VERIFIED fact with direct non-resume evidence can support PROVEN positioning.";
  }
  return "PROVEN requires direct non-resume authority such as an official record, provider-confirmed artifact, public artifact, or other existing S010-approved evidence. Resume wording or operator recollection alone is insufficient.";
}

export function loadRoleFocusedAnalysis(options: {
  analysisRoot: string;
  repositoryRoot: string;
  opportunityDirectory?: string | null;
  analysisRunId: string;
}): LoadedRoleFocusedAnalysis {
  const loaded = loadPrivateJobAnalysisRun({
    analysisRoot: options.analysisRoot,
    repositoryRoot: options.repositoryRoot,
    opportunityDirectory: options.opportunityDirectory || null,
    analysisRunId: options.analysisRunId,
    latest: false,
  });
  return loaded;
}

export function loadPrivateCareerEvidenceStore(options: {
  careerRoots: readonly string[];
  repositoryRoot: string;
}) {
  const factMap = new Map<string, CareerCandidateFactSummary>();
  const evidenceMap = new Map<string, CareerEvidenceSummary>();

  for (const root of options.careerRoots) {
    if (!existsSync(root)) continue;
    assertOutsideRepository(root, options.repositoryRoot, "Private Career evidence root");
    for (const filePath of walkFiles(root)) {
      const filename = path.basename(filePath);
      if (/(candidate_career_facts|combined_candidate_career_facts|canonical_career_facts).*\.json$/.test(filename)) {
        for (const record of payloadArray(filePath)) {
          const summary = factSummary(record);
          if (summary.id !== "UNKNOWN") factMap.set(summary.id, summary);
        }
      }
      if (/(career_evidence|combined_career_evidence|canonical_career_evidence).*\.json$/.test(filename)) {
        for (const record of payloadArray(filePath)) {
          const summary = evidenceSummary(record);
          if (summary.id !== "UNKNOWN") evidenceMap.set(summary.id, summary);
        }
      }
    }
  }

  return {
    facts: [...factMap.values()],
    evidence: [...evidenceMap.values()],
  };
}

export function buildRoleFocusedCareerEvidenceReviewItems(input: {
  analysis: LoadedRoleFocusedAnalysis;
  facts: readonly CareerCandidateFactSummary[];
  evidence: readonly CareerEvidenceSummary[];
  maxItems?: number;
}): RoleFocusedCareerEvidenceReviewItem[] {
  const factById = new Map(input.facts.map((fact) => [fact.id, fact]));
  const evidenceById = new Map(input.evidence.map((item) => [item.id, item]));
  const requirementById = new Map(input.analysis.bundle.requirements.map((requirement) => [requirement.id, requirement]));

  const candidates: RoleFocusedCareerEvidenceReviewItem[] = [];
  for (const mapping of input.analysis.bundle.mappings) {
    if (mapping.classification !== "UNKNOWN" && mapping.classification !== "TRANSFERABLE") continue;
    const requirement = requirementById.get(mapping.requirementId);
    if (!requirement) continue;
    const candidateFacts = mapping.careerFactIds.flatMap((id) => {
      const fact = factById.get(id);
      return fact ? [fact] : [];
    });
    const candidateEvidence = mapping.careerEvidenceIds.flatMap((id) => {
      const record = evidenceById.get(id);
      return record ? [record] : [];
    });
    const lanes = careerLaneSignals(requirement.requirementText);
    const score = reusableScore({
      requirementText: requirement.requirementText,
      requirementCategory: requirement.requirementCategory,
      requirementLevel: requirement.requirementLevel,
      classification: mapping.classification,
      conflictStatus: mapping.conflictStatus,
    });
    if (score <= 0 || lanes.length === 0) continue;

    candidates.push({
      reviewItemId: `s010role_${sha256Text(`${input.analysis.metadata.analysisRunId}|${mapping.requirementId}`).slice(0, 18)}`,
      analysisRunId: input.analysis.metadata.analysisRunId,
      opportunityId: input.analysis.metadata.opportunityId,
      requirementId: mapping.requirementId,
      requirementText: requirement.requirementText,
      requirementCategory: requirement.requirementCategory,
      requirementLevel: requirement.requirementLevel,
      currentClassification: mapping.classification,
      currentConflictStatus: mapping.conflictStatus,
      reusableCareerLanes: lanes,
      candidateFacts,
      candidateEvidence,
      whatWouldMoveToPartial: whatMovesToPartial(candidateFacts, candidateEvidence),
      whatWouldMoveToProven: whatMovesToProven(candidateFacts, candidateEvidence),
      conciseQuestion: "What evidence-safe outcome should StaffordOS record for this requirement?",
      priority: score,
    });
  }

  return candidates
    .sort((a, b) => b.priority - a.priority || a.requirementText.localeCompare(b.requirementText))
    .slice(0, input.maxItems || 8)
    .map((item, index): RoleFocusedCareerEvidenceReviewItem => ({ ...item, priority: index + 1 }));
}

function decisionsFilePath(decisionRoot: string, analysisRunId: string) {
  return path.join(decisionRoot, analysisRunId, "decisions.ndjson");
}

export function loadRoleFocusedCareerEvidenceDecisions(options: {
  decisionRoot: string;
  repositoryRoot: string;
  analysisRunId: string;
}) {
  assertOutsideRepository(options.decisionRoot, options.repositoryRoot, "Private role-focused decision root");
  const filePath = decisionsFilePath(options.decisionRoot, options.analysisRunId);
  if (!existsSync(filePath)) return [] as RoleFocusedCareerEvidenceDecision[];
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RoleFocusedCareerEvidenceDecision);
}

function canVerify(item: RoleFocusedCareerEvidenceReviewItem, selectedFactIds: readonly string[], selectedEvidenceIds: readonly string[]) {
  const selectedFacts = item.candidateFacts.filter((fact) => selectedFactIds.includes(fact.id));
  const selectedEvidence = item.candidateEvidence.filter((record) => selectedEvidenceIds.includes(record.id));
  return selectedFacts.some((fact) => fact.verificationStatus === "VERIFIED") && selectedEvidence.some(hasStrongAuthority);
}

function validateDecision(input: {
  item: RoleFocusedCareerEvidenceReviewItem;
  outcome: RoleFocusedCareerEvidenceOutcome;
  selectedCareerFactIds?: readonly string[];
  selectedEvidenceIds?: readonly string[];
  operatorConfirmed?: boolean;
}) {
  if (!input.operatorConfirmed) return "OPERATOR_CONFIRMATION_REQUIRED";
  if (!ROLE_FOCUSED_CAREER_EVIDENCE_OUTCOMES.includes(input.outcome)) return "UNSUPPORTED_OUTCOME";
  const candidateFactIds = new Set(input.item.candidateFacts.map((fact) => fact.id));
  const candidateEvidenceIds = new Set(input.item.candidateEvidence.map((evidence) => evidence.id));
  const selectedFactIds = input.selectedCareerFactIds || [];
  const selectedEvidenceIds = input.selectedEvidenceIds || [];
  if (selectedFactIds.some((id) => !candidateFactIds.has(id))) return "SELECTED_FACT_NOT_CANDIDATE";
  if (selectedEvidenceIds.some((id) => !candidateEvidenceIds.has(id))) return "SELECTED_EVIDENCE_NOT_CANDIDATE";
  if ((input.outcome === "PARTIALLY_SUPPORTED" || input.outcome === "TRANSFERABLE") && (!selectedFactIds.length || !selectedEvidenceIds.length)) {
    return "SUPPORT_OUTCOME_REQUIRES_SELECTED_CANDIDATE_EVIDENCE";
  }
  if (input.outcome === "VERIFIED" && !canVerify(input.item, selectedFactIds, selectedEvidenceIds)) {
    return "VERIFIED_REQUIRES_DIRECT_NON_RESUME_AUTHORITY";
  }
  return null;
}

export function createRoleFocusedCareerEvidenceDecision(input: {
  item: RoleFocusedCareerEvidenceReviewItem;
  outcome: RoleFocusedCareerEvidenceOutcome;
  selectedCareerFactIds?: readonly string[];
  selectedEvidenceIds?: readonly string[];
  operatorContext?: string | null;
  existingDecisions?: readonly RoleFocusedCareerEvidenceDecision[];
  createdAt: string;
  operatorConfirmed?: boolean;
}): RoleFocusedCareerEvidenceDecision {
  const error = validateDecision(input);
  if (error) throw new Error(error);
  const selectedCareerFactIds = [...(input.selectedCareerFactIds || [])];
  const selectedEvidenceIds = [...(input.selectedEvidenceIds || [])];
  const supersedesDecisionId =
    [...(input.existingDecisions || [])]
      .reverse()
      .find((decision) => decision.reviewItemId === input.item.reviewItemId)?.decisionId || null;
  const seed = [
    input.item.analysisRunId,
    input.item.requirementId,
    input.item.reviewItemId,
    input.outcome,
    input.createdAt,
    selectedCareerFactIds.join(","),
    selectedEvidenceIds.join(","),
  ].join("|");

  return {
    schemaVersion: ROLE_FOCUSED_CAREER_EVIDENCE_DECISION_SCHEMA_VERSION,
    decisionId: `s010roledecision_${sha256Text(seed).slice(0, 18)}`,
    workspaceId: "professional",
    analysisRunId: input.item.analysisRunId,
    opportunityId: input.item.opportunityId,
    requirementId: input.item.requirementId,
    reviewItemId: input.item.reviewItemId,
    outcome: input.outcome,
    operatorConfirmed: true,
    selectedCareerFactIds,
    selectedEvidenceIds,
    operatorContext: input.operatorContext || null,
    limitation:
      input.outcome === "VERIFIED"
        ? "Verification is permitted only with direct non-resume authority already present in the private Career evidence set."
        : "Role-focused Career evidence review updates this private analysis only; it does not verify canonical Career facts.",
    createdAt: input.createdAt,
    supersedesDecisionId,
    sourceAuthority: "ROSS_ROLE_FOCUSED_CAREER_EVIDENCE_REVIEW",
    privacy: "Professional owner-private",
    canonicalCareerEvidenceUpdated: false,
    applicationSubmitted: false,
    messageSent: false,
    resumeMutated: false,
  };
}

export function appendRoleFocusedCareerEvidenceDecision(options: {
  decisionRoot: string;
  repositoryRoot: string;
  decision: RoleFocusedCareerEvidenceDecision;
}) {
  assertOutsideRepository(options.decisionRoot, options.repositoryRoot, "Private role-focused decision root");
  const directory = path.dirname(decisionsFilePath(options.decisionRoot, options.decision.analysisRunId));
  ensurePrivateDirectory(directory);
  const filePath = decisionsFilePath(options.decisionRoot, options.decision.analysisRunId);
  appendFileSync(filePath, `${JSON.stringify(options.decision)}\n`, { encoding: "utf8", mode: 0o600 });
  chmodSync(filePath, 0o600);
  return {
    decisionFileRedacted:
      "$HOME/.staffordos/private/professional/career-evidence/role-focused-decisions/<analysis-run>/decisions.ndjson",
    privatePathVisible: false as const,
  };
}

function latestDecisionByRequirement(decisions: readonly RoleFocusedCareerEvidenceDecision[]) {
  const latest = new Map<string, RoleFocusedCareerEvidenceDecision>();
  for (const decision of decisions) latest.set(decision.requirementId, decision);
  return latest;
}

function classificationForOutcome(outcome: RoleFocusedCareerEvidenceOutcome, current: RequirementEvidenceClassification) {
  if (outcome === "VERIFIED") return "PROVEN";
  if (outcome === "PARTIALLY_SUPPORTED") return "PARTIAL";
  if (outcome === "TRANSFERABLE") return "TRANSFERABLE";
  if (outcome === "REJECTED") return "MISSING";
  if (outcome === "NEEDS_EVIDENCE" || outcome === "CONFLICTING") return "UNKNOWN";
  return current;
}

function reasonForOutcome(outcome: RoleFocusedCareerEvidenceOutcome) {
  if (outcome === "VERIFIED") return "Ross confirmed direct, non-resume evidence authority for this role-focused requirement.";
  if (outcome === "PARTIALLY_SUPPORTED") return "Ross confirmed partial support; limitations remain visible.";
  if (outcome === "TRANSFERABLE") return "Ross confirmed transferable evidence; do not claim direct same-role proof.";
  if (outcome === "NEEDS_EVIDENCE") return "Ross confirmed more evidence is needed before strengthening this claim.";
  if (outcome === "CONFLICTING") return "Ross confirmed the evidence remains conflicting and requires review.";
  if (outcome === "REJECTED") return "Ross rejected this candidate evidence for the selected requirement.";
  return "Ross deferred the review item; the mapping is unchanged.";
}

export function applyRoleFocusedCareerEvidenceDecisions(input: {
  bundle: PrivateJobAnalysisBundle;
  decisions: readonly RoleFocusedCareerEvidenceDecision[];
}) {
  const latest = latestDecisionByRequirement(input.decisions);
  return input.bundle.mappings.map((mapping): PrivateRequirementEvidenceMapping => {
    const decision = latest.get(mapping.requirementId);
    if (!decision || decision.outcome === "DEFERRED") return mapping;
    const after = classificationForOutcome(decision.outcome, mapping.classification);
    return {
      ...mapping,
      classification: after,
      explanation: reasonForOutcome(decision.outcome),
      supportLimitations: unique([
        ...mapping.supportLimitations,
        decision.limitation,
        "S010.02D role-focused Career evidence review is private and does not rewrite canonical Career facts.",
      ]),
      verificationStatus: after === "PROVEN" ? "ROLE_FOCUSED_VERIFIED" : "ROLE_FOCUSED_REVIEWED",
      conflictStatus:
        decision.outcome === "CONFLICTING"
          ? "CONFLICT_REQUIRES_REVIEW"
          : after === "PROVEN" || after === "PARTIAL" || after === "TRANSFERABLE"
            ? mapping.conflictStatus
            : mapping.conflictStatus,
      operatorReviewRequirement:
        after === "UNKNOWN" ? "Requires additional non-resume evidence before stronger positioning." : "Role-focused Ross review decision recorded.",
      safePositioning:
        after === "PROVEN"
          ? "Use only with direct evidence-cited wording."
          : after === "PARTIAL"
            ? "Use limited wording; do not claim full ownership, production use, metrics, years, titles, dates, or certifications beyond evidence."
            : after === "TRANSFERABLE"
              ? "Position as adjacent or transferable evidence; do not claim exact same-role experience."
              : after === "MISSING"
                ? "Do not use this as a supported claim."
                : mapping.safePositioning,
      createdAt: decision.createdAt,
    };
  });
}

export function regenerateAnalysisAfterRoleFocusedCareerReview(input: {
  previous: LoadedRoleFocusedAnalysis;
  decisions: readonly RoleFocusedCareerEvidenceDecision[];
  generatedAt: string;
}) {
  const updatedMappings = applyRoleFocusedCareerEvidenceDecisions({
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
    workflowVersion: "J001.03A",
    summary: {
      requirementCount: input.previous.bundle.requirements.length,
      mappingCount: updatedMappings.length,
      reviewQuestionCount: reviewQueue.length,
      finalRecommendation: fitAssessment.finalRecommendation,
    },
  };
  const regeneratedBundle: PrivateJobAnalysisBundle = {
    ...input.previous.bundle,
    workflowVersion: "J001.03A",
    mappings: updatedMappings,
    fitAssessment,
    positioningBrief,
    reviewQueue,
    nextAction,
    auditSummary,
  };
  const changeReport = buildRoleFocusedCareerEvidenceChangeReport({
    previous: input.previous,
    regeneratedBundle,
    decisions: input.decisions,
    generatedAt: input.generatedAt,
    regeneratedAnalysisRunId: null,
  });

  return { regeneratedBundle, changeReport };
}

export function buildRoleFocusedCareerEvidenceChangeReport(input: {
  previous: LoadedRoleFocusedAnalysis;
  regeneratedBundle: PrivateJobAnalysisBundle;
  decisions: readonly RoleFocusedCareerEvidenceDecision[];
  generatedAt: string;
  regeneratedAnalysisRunId: string | null;
}): RoleFocusedCareerEvidenceChangeReport {
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
        reason: decision ? reasonForOutcome(decision.outcome) : "Role-focused Career evidence review changed this mapping.",
      },
    ];
  });
  const coverageAfter = summarizeMappingCoverage(input.regeneratedBundle.mappings);
  const remainingMajorGaps = input.regeneratedBundle.mappings
    .filter((mapping) => mapping.classification === "UNKNOWN" || mapping.classification === "MISSING")
    .slice(0, 10)
    .map((mapping) => mapping.requirementId);
  const applicationStatePreserved =
    input.previous.bundle.applicationEvent.applicationState === input.regeneratedBundle.applicationEvent.applicationState;
  if (!applicationStatePreserved) throw new Error("S010.02D regeneration cannot change application state.");

  return {
    schemaVersion: ROLE_FOCUSED_CAREER_EVIDENCE_CHANGE_REPORT_SCHEMA_VERSION,
    workflowVersion: ROLE_FOCUSED_CAREER_EVIDENCE_REVIEW_VERSION,
    previousAnalysisRunId: input.previous.metadata.analysisRunId,
    regeneratedAnalysisRunId: input.regeneratedAnalysisRunId,
    generatedAt: input.generatedAt,
    decisionsApplied: input.decisions.length,
    classificationChanges,
    coverageBefore: summarizeMappingCoverage(input.previous.bundle.mappings),
    coverageAfter,
    remainingMajorGaps,
    reusableCareerFactsImproved: unique(input.decisions.flatMap((decision) => decision.selectedCareerFactIds)),
    positioningImplications: classificationChanges.map((change) =>
      change.after === "PARTIAL"
        ? `${change.requirementId}: use limited evidence-backed wording.`
        : change.after === "TRANSFERABLE"
          ? `${change.requirementId}: position as transferable only.`
          : change.after === "PROVEN"
            ? `${change.requirementId}: cite direct non-resume evidence.`
            : `${change.requirementId}: keep out of supported positioning.`,
    ),
    recommendationBefore: input.previous.bundle.fitAssessment.finalRecommendation,
    recommendationAfter: input.regeneratedBundle.fitAssessment.finalRecommendation,
    nextActionAfter: input.regeneratedBundle.nextAction.action,
    canonicalCareerEvidenceUpdated: false,
    noEmployerSuccessProbability: true,
    applicationStatePreserved,
  };
}

export function writeRegeneratedAnalysisAfterRoleFocusedCareerReview(options: {
  outputRoot: string;
  repositoryRoot: string;
  previous: LoadedRoleFocusedAnalysis;
  regeneratedBundle: PrivateJobAnalysisBundle;
  changeReport: RoleFocusedCareerEvidenceChangeReport;
}) {
  const result = writePrivateJobAnalysisBundle(options.regeneratedBundle, {
    outputRoot: options.outputRoot,
    repositoryRoot: options.repositoryRoot,
  });
  const regeneratedAnalysisRunId = `privjobanalysis_${sha256Text(path.resolve(result.runDirectory)).slice(0, 18)}`;
  const report = {
    ...options.changeReport,
    regeneratedAnalysisRunId,
  };
  const changeReportPath = path.join(result.runDirectory, "s010_02d_career_evidence_change_report.json");
  writeJson(changeReportPath, report);
  return {
    ...result,
    regeneratedAnalysisRunId,
    previousAnalysisRunId: options.previous.metadata.analysisRunId,
    privateArtifactNames: [...result.privateArtifactNames, "s010_02d_career_evidence_change_report.json"],
    privateArtifacts: [...result.privateArtifacts, changeReportPath],
    changeReport: report,
  };
}

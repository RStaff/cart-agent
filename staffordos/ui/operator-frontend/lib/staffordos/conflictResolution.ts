import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import * as path from "node:path";
import type { ReviewCluster, ReviewClusterAnswer } from "./evidenceReviewCompression";

export const CONFLICT_TYPES = [
  "TEMPORAL_CONFLICT",
  "EMPLOYMENT_SCOPE_CONFLICT",
  "RESPONSIBILITY_SCOPE_CONFLICT",
  "TECHNICAL_DEPTH_CONFLICT",
  "LEADERSHIP_SCOPE_CONFLICT",
  "DOMAIN_CONTEXT_CONFLICT",
  "SOURCE_PROVENANCE_CONFLICT",
  "METRIC_OR_SCALE_CONFLICT",
  "DUPLICATE_OR_NEAR_DUPLICATE_CONFLICT",
  "OTHER_UNRESOLVED",
] as const;
export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const CONFLICT_OUTCOMES = [
  "VERIFIED_DIRECT",
  "VERIFIED_TRANSFERABLE",
  "PARTIALLY_SUPPORTED",
  "REJECTED",
  "KEEP_UNRESOLVED",
] as const;
export type ConflictOutcome = (typeof CONFLICT_OUTCOMES)[number];

export const CONFLICT_DECISION_SCHEMA_VERSION = "staffordos.professional.conflict_resolution.v1";

export type ConflictResolutionDecision = {
  schemaVersion: typeof CONFLICT_DECISION_SCHEMA_VERSION;
  decisionId: string;
  questionId: string;
  answer: ReviewClusterAnswer;
  underlyingCandidateIds: string[];
  propagationEligibleCandidateIds: string[];
  createdAt: string;
  operatorId: "ROSS";
  sourceAuthority: "PRIVATE_CAREER_AUTHORITY_CONFLICT_RESOLUTION";
  canonicalCareerFactMutated: false;
  canonicalCareerEvidenceCreated: false;
  supersedesDecisionId: string | null;
};

export type ConflictReviewItem = ReviewCluster & {
  historicalHighValueAnswer: ReviewClusterAnswer | null;
  conflictDecision: ConflictResolutionDecision | null;
  conflictType: ConflictType;
  currentOutcome: ConflictOutcome;
  authorityEffect: string;
  excludedEffects: string;
};

function conflictDecisionPath(root: string) { return path.join(root, "conflict-decisions.ndjson"); }

function latestConflictDecisions(decisions: readonly ConflictResolutionDecision[]) {
  const latest = new Map<string, ConflictResolutionDecision>();
  for (const decision of decisions) latest.set(decision.questionId, decision);
  return latest;
}

export function loadConflictResolutionDecisions(options: { decisionRoot: string; repositoryRoot: string }) {
  const file = conflictDecisionPath(options.decisionRoot);
  if (!existsSync(file)) return [] as ConflictResolutionDecision[];
  if (path.resolve(options.decisionRoot).startsWith(path.resolve(options.repositoryRoot) + path.sep)) throw new Error("PRIVATE_DECISION_ROOT_REQUIRED");
  return readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as ConflictResolutionDecision);
}

export function appendConflictResolutionDecision(options: {
  decisionRoot: string;
  repositoryRoot: string;
  questionId: string;
  answer: ReviewClusterAnswer;
  underlyingCandidateIds: string[];
  propagationEligibleCandidateIds: string[];
  priorDecisionId?: string | null;
  createdAt?: string;
}) {
  const createdAt = options.createdAt || new Date().toISOString();
  const seed = `${options.questionId}|${createdAt}|${options.answer}`;
  const decision: ConflictResolutionDecision = {
    schemaVersion: CONFLICT_DECISION_SCHEMA_VERSION,
    decisionId: `conflict_resolution_decision_${createHash("sha256").update(seed).digest("hex").slice(0, 24)}`,
    questionId: options.questionId,
    answer: options.answer,
    underlyingCandidateIds: [...options.underlyingCandidateIds],
    propagationEligibleCandidateIds: [...options.propagationEligibleCandidateIds],
    createdAt,
    operatorId: "ROSS",
    sourceAuthority: "PRIVATE_CAREER_AUTHORITY_CONFLICT_RESOLUTION",
    canonicalCareerFactMutated: false,
    canonicalCareerEvidenceCreated: false,
    supersedesDecisionId: options.priorDecisionId || null,
  };
  if (path.resolve(options.decisionRoot).startsWith(path.resolve(options.repositoryRoot) + path.sep)) throw new Error("PRIVATE_DECISION_ROOT_REQUIRED");
  mkdirSync(options.decisionRoot, { recursive: true, mode: 0o700 });
  appendFileSync(conflictDecisionPath(options.decisionRoot), `${JSON.stringify(decision)}\n`, { encoding: "utf8", mode: 0o600 });
  return decision;
}

function text(value: unknown) { return typeof value === "string" ? value.toLowerCase() : ""; }

export function classifyConflictType(cluster: Pick<ReviewCluster, "operatorQuestion" | "whyAsked" | "conflictStates" | "sourceProvenanceStates">): ConflictType {
  const source = `${text(cluster.operatorQuestion)} ${text(cluster.whyAsked)}`;
  if (/date|period|current|historical|temporal/.test(source)) return "TEMPORAL_CONFLICT";
  if (/directly manage people|people management|direct report/.test(source)) return "LEADERSHIP_SCOPE_CONFLICT";
  if (/technical|software|infrastructure|automation|system/.test(source)) return "TECHNICAL_DEPTH_CONFLICT";
  if (/program|cross-functional|product|backlog|transformation|operating model/.test(source)) return "RESPONSIBILITY_SCOPE_CONFLICT";
  if (/ai|marketing technology|domain|industry/.test(source)) return "DOMAIN_CONTEXT_CONFLICT";
  if (cluster.sourceProvenanceStates.includes("NO_LINKED_SOURCE")) return "SOURCE_PROVENANCE_CONFLICT";
  if (cluster.conflictStates.includes("CONFLICTING")) return "OTHER_UNRESOLVED";
  return "OTHER_UNRESOLVED";
}

export function outcomeForAnswer(answer: string | null): ConflictOutcome {
  if (answer === "DIRECT") return "VERIFIED_DIRECT";
  if (answer === "TRANSFERABLE") return "VERIFIED_TRANSFERABLE";
  if (answer === "ADJACENT") return "PARTIALLY_SUPPORTED";
  if (answer === "NO") return "REJECTED";
  return "KEEP_UNRESOLVED";
}

export function buildConflictReviewQueue(clusters: readonly ReviewCluster[], decisions: readonly ConflictResolutionDecision[] = []): ConflictReviewItem[] {
  const latest = latestConflictDecisions(decisions);
  return clusters
    .filter((cluster) => cluster.conflictStates.includes("CONFLICTING") || cluster.sourceProvenanceStates.includes("NO_LINKED_SOURCE"))
    .map((cluster) => ({
      ...cluster,
      conflictType: classifyConflictType(cluster),
      historicalHighValueAnswer: cluster.operatorAnswer,
      conflictDecision: latest.get(cluster.clusterId) || null,
      currentOutcome: outcomeForAnswer(latest.get(cluster.clusterId)?.answer || null),
      authorityEffect: "Affects only the bounded evidence authority represented by this question and its compatible candidates.",
      excludedEffects: "Does not change ranking, J002, J003, J010, application status, workflow, preferences, CareerFact, or CareerEvidence.",
    }));
}

export function conflictProgress(queue: ReturnType<typeof buildConflictReviewQueue>, total = queue.length) {
  return { completed: queue.filter((item) => Boolean(item.conflictDecision)).length, total };
}

export function conflictTypeDistribution(queue: ReturnType<typeof buildConflictReviewQueue>) {
  return Object.fromEntries(CONFLICT_TYPES.map((type) => [type, queue.filter((item) => item.conflictType === type).length]));
}

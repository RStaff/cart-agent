import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";
import { loadHighValueCareerEvidenceStore } from "./highValueCareerFactVerification";

export const EVIDENCE_ADJUDICATION_SCHEMA_VERSION =
  "staffordos.professional.evidence_adjudication.v1";
export const EVIDENCE_ADJUDICATION_ACTIONS = [
  "CONFIRM",
  "CORRECT",
  "REJECT",
  "KEEP_UNRESOLVED",
] as const;
export type EvidenceAdjudicationAction = (typeof EVIDENCE_ADJUDICATION_ACTIONS)[number];
export const PROJECTION_ELIGIBILITY_STATES = [
  "AUTO_PROJECTABLE",
  "OPERATOR_REVIEW_REQUIRED",
  "INSUFFICIENT_PROVENANCE",
  "CONFLICT_BLOCKED",
  "UNSUPPORTED",
  "ALREADY_PROJECTED",
] as const;
export type ProjectionEligibilityState = (typeof PROJECTION_ELIGIBILITY_STATES)[number];

type RecordValue = Record<string, unknown>;

export type EvidenceAdjudicationCandidate = {
  candidateId: string;
  sourceFactId: string;
  statement: string;
  factType: string;
  organization: string | null;
  roleOrTitle: string | null;
  capabilityFamily: string;
  directOrTransferable: "DIRECT" | "TRANSFERABLE" | "UNRESOLVED";
  verificationStatus: string;
  authorityClassification: string;
  supportLevel: string;
  conflictState: "CONFLICTING" | "CLEAR" | "UNKNOWN";
  conflictReason: string | null;
  eligibilityState: ProjectionEligibilityState;
  eligibilityReasons: string[];
  sourceEvidenceCount: number;
  sourceEvidenceTypes: string[];
  alreadyProjected: boolean;
  operatorDecision: EvidenceAdjudicationAction | null;
  operatorCorrection: string | null;
  priority: number;
};

export type EvidenceAdjudicationDecision = {
  schemaVersion: typeof EVIDENCE_ADJUDICATION_SCHEMA_VERSION;
  decisionId: string;
  candidateId: string;
  sourceFactId: string;
  action: EvidenceAdjudicationAction;
  operatorCorrection: string | null;
  createdAt: string;
  operatorId: "ROSS";
  sourceAuthority: "PRIVATE_CAREER_AUTHORITY_ADJUDICATION";
  canonicalCareerFactMutated: false;
  canonicalCareerEvidenceCreated: false;
};

export function privateCareerAuthorityRoots(home = homedir()) {
  return [
    path.join(home, ".staffordos/private/professional/career-evidence"),
    path.join(home, ".staffordos/private/professional/career"),
    path.join(home, ".staffordos/private/professional"),
  ];
}

export function privateAdjudicationRoot(home = homedir()) {
  return path.join(home, ".staffordos/private/professional/career-evidence/adjudication");
}

function stringValue(record: RecordValue, key: string) {
  return typeof record[key] === "string" && String(record[key]).trim() ? String(record[key]).trim() : null;
}

function stringArray(record: RecordValue, key: string) {
  return Array.isArray(record[key]) ? record[key].filter((value): value is string => typeof value === "string") : [];
}

function boolValue(record: RecordValue, key: string) {
  return record[key] === true;
}

function capabilityFamily(fact: RecordValue) {
  const type = stringValue(fact, "factType") || "UNKNOWN";
  const technology = stringValue(fact, "technologyOrSkill");
  if (technology) return technology;
  if (["LEADERSHIP", "EMPLOYMENT"].includes(type)) return "PROGRAM_AND_LEADERSHIP";
  if (["PROJECT", "PRODUCT", "ACHIEVEMENT"].includes(type)) return "DELIVERY_AND_PRODUCT";
  if (type === "TECHNOLOGY") return "TECHNOLOGY_AND_AUTOMATION";
  if (type === "CERTIFICATION" || type === "EDUCATION") return "CREDENTIAL_AND_EDUCATION";
  return type;
}

function directOrTransferable(fact: RecordValue): EvidenceAdjudicationCandidate["directOrTransferable"] {
  const support = stringValue(fact, "supportLevel");
  const experience = stringValue(fact, "experienceClassification");
  if (support === "DIRECT" || support === "PROVEN" || experience === "USED_IN_CONTROLLED_PROJECT") return "DIRECT";
  if (support === "TRANSFERABLE" || experience === "TRANSFERABLE") return "TRANSFERABLE";
  return "UNRESOLVED";
}

export function classifyConflictRootCause(fact: RecordValue): string {
  const conflictTypes = stringArray(fact, "conflictTypes");
  const statement = (stringValue(fact, "statement") || "").toLowerCase();
  if (conflictTypes.some((value) => /normal|format|duplicate/i.test(value))) return "NORMALIZATION_CONFLICT";
  if (conflictTypes.some((value) => /date|temporal|current|historical/i.test(value))) return "TEMPORAL_VERSION_CONFLICT";
  if (conflictTypes.some((value) => /source|value|title|employer/i.test(value))) return "SOURCE_VALUE_DISAGREEMENT";
  if (/inferred|inference|generated|derived/.test(statement) || stringValue(fact, "authorityClassification") === "GENERATED_DOCUMENT") {
    return "INFERENCE_VS_SOURCE_CONFLICT";
  }
  if (stringValue(fact, "verificationStatus") === "CONFLICTING") return "UNRESOLVED_VERIFICATION";
  return "OTHER";
}

export function projectionEligibility(fact: RecordValue, evidence: readonly RecordValue[] = []): {
  state: ProjectionEligibilityState;
  reasons: string[];
} {
  const status = stringValue(fact, "verificationStatus") || "UNKNOWN";
  const support = stringValue(fact, "supportLevel") || "UNKNOWN";
  const conflicts = stringArray(fact, "conflictingEvidenceIds");
  const sourceIds = stringArray(fact, "sourceEvidenceIds");
  const factType = stringValue(fact, "factType") || "UNKNOWN";
  const linkedEvidence = evidence.filter((item) => sourceIds.includes(stringValue(item, "id") || ""));
  const hasLinkedEvidence = linkedEvidence.length > 0;
  const hasExistingProjection = linkedEvidence.some((item) => stringArray(item, "supportsFactIds").includes(String(fact.id || "")));
  if (hasExistingProjection && sourceIds.length > 0) return { state: "ALREADY_PROJECTED", reasons: ["Existing canonical evidence linkage is present."] };
  if (status === "CONFLICTING" || conflicts.length > 0) return { state: "CONFLICT_BLOCKED", reasons: ["Substantive conflict remains unresolved.", `Conflict category: ${classifyConflictRootCause(fact)}.`] };
  if (["REJECTED"].includes(status)) return { state: "UNSUPPORTED", reasons: ["The source fact is rejected."] };
  if (!sourceIds.length || !hasLinkedEvidence) return { state: "INSUFFICIENT_PROVENANCE", reasons: ["No linked authoritative source evidence is available to the projection gate."] };
  const narrow = ["CERTIFICATION", "EDUCATION"].includes(factType)
    && (!stringValue(fact, "metricClassification") || stringValue(fact, "metricClassification") === "NOT_APPLICABLE")
    && !stringValue(fact, "deploymentClaim")
    && !stringValue(fact, "customerUseClaim");
  const authoritative = evidence.some((item) => sourceIds.includes(stringValue(item, "id") || "")
    && ["OFFICIAL_DOCUMENT", "PROVIDER_CONFIRMED", "OPERATOR_CONFIRMED"].includes(stringValue(item, "authorityClassification") || ""));
  if (status === "VERIFIED" && support === "DIRECT" && narrow && authoritative) {
    return { state: "AUTO_PROJECTABLE", reasons: ["Verified, narrow, conflict-free fact with authoritative source evidence."] };
  }
  return { state: "OPERATOR_REVIEW_REQUIRED", reasons: ["Projection requires operator adjudication because scope or semantics may expand beyond the source."] };
}

function latestDecisions(decisions: readonly EvidenceAdjudicationDecision[]) {
  const result = new Map<string, EvidenceAdjudicationDecision>();
  for (const decision of decisions) result.set(decision.candidateId, decision);
  return result;
}

function priorityFor(fact: RecordValue, eligibilityState: ProjectionEligibilityState, evidenceCount: number) {
  let score = 0;
  const type = stringValue(fact, "factType") || "";
  if (["PROJECT", "PRODUCT", "LEADERSHIP", "TECHNOLOGY", "EMPLOYMENT"].includes(type)) score += 30;
  if (evidenceCount > 0) score += 20;
  if (eligibilityState === "CONFLICT_BLOCKED") score += 25;
  if (eligibilityState === "OPERATOR_REVIEW_REQUIRED") score += 15;
  if (stringValue(fact, "experienceClassification") === "TRANSFERABLE") score += 10;
  if (stringValue(fact, "metricClassification") && stringValue(fact, "metricClassification") !== "NOT_APPLICABLE") score += 5;
  return score;
}

export function buildEvidenceAdjudicationCandidates(input: {
  facts: readonly RecordValue[];
  evidence: readonly RecordValue[];
  decisions?: readonly EvidenceAdjudicationDecision[];
  limit?: number;
}) {
  const evidenceById = new Map(input.evidence.map((item) => [stringValue(item, "id"), item]));
  const decisions = latestDecisions(input.decisions || []);
  const candidates = input.facts.flatMap((fact) => {
    const factId = stringValue(fact, "id");
    const statement = stringValue(fact, "statement");
    if (!factId || !statement) return [];
    const sourceIds = stringArray(fact, "sourceEvidenceIds");
    const sourceEvidence = sourceIds.map((id) => evidenceById.get(id)).filter((value): value is RecordValue => Boolean(value));
    const eligibility = projectionEligibility(fact, input.evidence);
    const candidateId = `evidence_candidate_${createHash("sha256").update(`${factId}|projection-v1`).digest("hex").slice(0, 24)}`;
    const decision = decisions.get(candidateId);
    return [{
      candidateId,
      sourceFactId: factId,
      statement,
      factType: stringValue(fact, "factType") || "UNKNOWN",
      organization: stringValue(fact, "organization"),
      roleOrTitle: stringValue(fact, "roleOrTitle"),
      capabilityFamily: capabilityFamily(fact),
      directOrTransferable: directOrTransferable(fact),
      verificationStatus: stringValue(fact, "verificationStatus") || "UNKNOWN",
      authorityClassification: stringValue(fact, "authorityClassification") || "UNKNOWN",
      supportLevel: stringValue(fact, "supportLevel") || "UNKNOWN",
      conflictState: eligibility.state === "CONFLICT_BLOCKED" ? "CONFLICTING" : sourceIds.length ? "CLEAR" : "UNKNOWN",
      conflictReason: eligibility.state === "CONFLICT_BLOCKED" ? classifyConflictRootCause(fact) : null,
      eligibilityState: eligibility.state,
      eligibilityReasons: eligibility.reasons,
      sourceEvidenceCount: sourceEvidence.length,
      sourceEvidenceTypes: sourceEvidence.map((item) => stringValue(item, "evidenceType") || "UNKNOWN"),
      alreadyProjected: eligibility.state === "ALREADY_PROJECTED",
      operatorDecision: decision?.action || null,
      operatorCorrection: decision?.operatorCorrection || null,
      priority: priorityFor(fact, eligibility.state, sourceEvidence.length),
    } satisfies EvidenceAdjudicationCandidate];
  });
  candidates.sort((a, b) => b.priority - a.priority || a.capabilityFamily.localeCompare(b.capabilityFamily) || a.candidateId.localeCompare(b.candidateId));
  const ranked = candidates.map((candidate, index) => ({ ...candidate, priority: index + 1 }));
  return typeof input.limit === "number" ? ranked.slice(0, input.limit) : ranked;
}

export function loadEvidenceAdjudicationRuntime(options: { repositoryRoot: string; home?: string; limit?: number }) {
  const store = loadHighValueCareerEvidenceStore({
    careerRoots: privateCareerAuthorityRoots(options.home),
    repositoryRoot: options.repositoryRoot,
  });
  const decisions = loadEvidenceAdjudicationDecisions({ decisionRoot: privateAdjudicationRoot(options.home), repositoryRoot: options.repositoryRoot });
  const candidates = buildEvidenceAdjudicationCandidates({ ...store, decisions, limit: options.limit });
  return { ...store, decisions, candidates };
}

function decisionsPath(decisionRoot: string) {
  return path.join(decisionRoot, "decisions.ndjson");
}

export function loadEvidenceAdjudicationDecisions(options: { decisionRoot: string; repositoryRoot: string }) {
  if (!path.resolve(options.decisionRoot).startsWith(path.resolve(options.repositoryRoot) + path.sep) && existsSync(decisionsPath(options.decisionRoot))) {
    return readFileSync(decisionsPath(options.decisionRoot), "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as EvidenceAdjudicationDecision);
  }
  return [] as EvidenceAdjudicationDecision[];
}

export function appendEvidenceAdjudicationDecision(options: {
  decisionRoot: string;
  repositoryRoot: string;
  candidate: EvidenceAdjudicationCandidate;
  action: EvidenceAdjudicationAction;
  operatorCorrection?: string | null;
  createdAt?: string;
}) {
  if (!EVIDENCE_ADJUDICATION_ACTIONS.includes(options.action)) throw new Error("INVALID_ADJUDICATION_ACTION");
  const correction = options.operatorCorrection?.trim() || null;
  if (options.action === "CORRECT" && !correction) throw new Error("CORRECTION_TEXT_REQUIRED");
  const createdAt = options.createdAt || new Date().toISOString();
  const decisionId = `evidence_adjudication_${createHash("sha256").update(`${options.candidate.candidateId}|${createdAt}|${options.action}`).digest("hex").slice(0, 24)}`;
  const decision: EvidenceAdjudicationDecision = {
    schemaVersion: EVIDENCE_ADJUDICATION_SCHEMA_VERSION,
    decisionId,
    candidateId: options.candidate.candidateId,
    sourceFactId: options.candidate.sourceFactId,
    action: options.action,
    operatorCorrection: correction,
    createdAt,
    operatorId: "ROSS",
    sourceAuthority: "PRIVATE_CAREER_AUTHORITY_ADJUDICATION",
    canonicalCareerFactMutated: false,
    canonicalCareerEvidenceCreated: false,
  };
  if (path.resolve(options.decisionRoot).startsWith(path.resolve(options.repositoryRoot) + path.sep)) throw new Error("PRIVATE_DECISION_ROOT_REQUIRED");
  mkdirSync(options.decisionRoot, { recursive: true, mode: 0o700 });
  appendFileSync(decisionsPath(options.decisionRoot), `${JSON.stringify(decision)}\n`, { encoding: "utf8", mode: 0o600 });
  return decision;
}

export function adjudicationProgress(candidates: readonly EvidenceAdjudicationCandidate[]) {
  const queue = candidates.filter((candidate) => candidate.eligibilityState !== "ALREADY_PROJECTED");
  const reviewed = queue.filter((candidate) => Boolean(candidate.operatorDecision)).length;
  return { reviewed, remaining: Math.max(queue.length - reviewed, 0), total: queue.length };
}

export function reviewQueueCandidates(candidates: readonly EvidenceAdjudicationCandidate[]) {
  return candidates.filter((candidate) => candidate.eligibilityState !== "ALREADY_PROJECTED");
}

export function summarizeConflictRoots(facts: readonly RecordValue[]) {
  const counts: Record<string, number> = {};
  for (const fact of facts) {
    const category = classifyConflictRootCause(fact);
    counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}

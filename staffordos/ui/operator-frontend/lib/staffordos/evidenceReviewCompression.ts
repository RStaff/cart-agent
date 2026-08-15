import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import * as path from "node:path";
import {
  EVIDENCE_ADJUDICATION_SCHEMA_VERSION,
  loadEvidenceAdjudicationRuntime,
  privateAdjudicationRoot,
  type EvidenceAdjudicationCandidate,
} from "./evidenceAdjudication";

export const REVIEW_CLUSTER_SCHEMA_VERSION = "staffordos.professional.evidence_review_cluster.v1";
export const REVIEW_CLUSTER_ANSWERS = ["DIRECT", "TRANSFERABLE", "ADJACENT", "NO", "NEEDS_EVIDENCE", "KEEP_UNRESOLVED"] as const;
export type ReviewClusterAnswer = (typeof REVIEW_CLUSTER_ANSWERS)[number];

type ClusterTemplate = {
  key: string;
  question: string;
  whyAsked: string;
  families: string[];
  terms: RegExp[];
  excludedFamilies?: string[];
};

export type ReviewCluster = {
  clusterId: string;
  clusterType: "SHARED_QUESTION" | "EXACT_CONTEXT";
  operatorQuestion: string;
  whyAsked: string;
  capabilityFamily: string;
  directOrTransferable: EvidenceAdjudicationCandidate["directOrTransferable"];
  underlyingCandidateIds: string[];
  underlyingCandidateCount: number;
  affectedOpportunityCount: number | null;
  sourceProvenanceStates: string[];
  conflictStates: string[];
  propagationEligibleCandidateIds: string[];
  allowedAnswers: ReviewClusterAnswer[];
  priorityScore: number;
  priorityReason: string;
  operatorAnswer: ReviewClusterAnswer | null;
  operatorCorrection: string | null;
};

export type ReviewClusterDecision = {
  schemaVersion: typeof REVIEW_CLUSTER_SCHEMA_VERSION;
  decisionId: string;
  clusterId: string;
  answer: ReviewClusterAnswer;
  operatorCorrection: string | null;
  underlyingCandidateIds: string[];
  propagationEligibleCandidateIds: string[];
  createdAt: string;
  operatorId: "ROSS";
  sourceAuthority: "PRIVATE_CAREER_AUTHORITY_CLUSTER_ADJUDICATION";
  canonicalCareerFactMutated: false;
  canonicalCareerEvidenceCreated: false;
};

const TEMPLATES: ClusterTemplate[] = [
  {
    key: "PROGRAM_ACCOUNTABILITY",
    question: "Have you been accountable for planning, dependencies, risk, and delivery across a program or complex initiative?",
    whyAsked: "Recurring program-delivery evidence can resolve scope questions without assuming a job title proves accountability.",
    families: ["PROGRAM_AND_LEADERSHIP", "DELIVERY_AND_PRODUCT"],
    terms: [/program|initiative|delivery|dependency|risk|roadmap|backlog/i],
  },
  {
    key: "CROSS_FUNCTIONAL_LEADERSHIP",
    question: "Have you directly led cross-functional work involving business and technical stakeholders?",
    whyAsked: "This separates demonstrated coordination from generic operations or strategy wording.",
    families: ["PROGRAM_AND_LEADERSHIP", "DELIVERY_AND_PRODUCT"],
    terms: [/cross.?functional|stakeholder|coordinate|lead|collaborat/i],
  },
  {
    key: "PEOPLE_LEADERSHIP",
    question: "Did you directly manage people, or primarily lead through influence?",
    whyAsked: "People management and influence-led leadership are different evidence claims.",
    families: ["PROGRAM_AND_LEADERSHIP", "DELIVERY_AND_PRODUCT"],
    terms: [/manage|mentor|team|leadership|direct report|people/i],
  },
  {
    key: "TECHNICAL_DEPTH",
    question: "Have you designed or implemented software, infrastructure, automation, or technical systems directly?",
    whyAsked: "This distinguishes technical implementation from managing or coordinating technical work.",
    families: ["TECHNOLOGY_AND_AUTOMATION", "DELIVERY_AND_PRODUCT"],
    terms: [/implement|architect|automation|software|infrastructure|technical|system|cloud|devops/i],
    excludedFamilies: ["CREDENTIAL_AND_EDUCATION"],
  },
  {
    key: "AI_AUTOMATION_OWNERSHIP",
    question: "Have you directly owned or operated AI or automation workflows beyond exposure or study?",
    whyAsked: "AI/automation evidence must distinguish operating responsibility from vocabulary overlap.",
    families: ["TECHNOLOGY_AND_AUTOMATION", "DELIVERY_AND_PRODUCT"],
    terms: [/AI|agent|automation|workflow|orchestrat|model/i],
  },
  {
    key: "MARKETING_SYSTEMS",
    question: "Have you designed, operated, or led marketing technology and automation systems?",
    whyAsked: "This targets recurring MarTech evidence while keeping specialist technical claims separate.",
    families: ["TECHNOLOGY_AND_AUTOMATION", "DELIVERY_AND_PRODUCT"],
    terms: [/marketing|MarTech|Salesforce|Pardot|CRM|campaign|lifecycle/i],
  },
  {
    key: "PRODUCT_REQUIREMENTS",
    question: "Have you defined product requirements, priorities, backlog, or operating decisions with accountable ownership?",
    whyAsked: "Product vocabulary alone does not prove product ownership; the operator must classify the actual experience.",
    families: ["DELIVERY_AND_PRODUCT"],
    terms: [/product|requirement|backlog|priorit|roadmap|customer/i],
  },
  {
    key: "TRANSFORMATION_GOVERNANCE",
    question: "Have you led business-process improvement, transformation, governance, or operating-model work?",
    whyAsked: "This distinguishes transferable transformation scope from generic strategy or operations language.",
    families: ["PROGRAM_AND_LEADERSHIP", "DELIVERY_AND_PRODUCT", "TECHNOLOGY_AND_AUTOMATION"],
    terms: [/transform|process|operating model|govern|improve|change|strategy/i],
  },
];

function decisionPath(root: string) { return path.join(root, "cluster-decisions.ndjson"); }

function latestDecisions(decisions: readonly ReviewClusterDecision[]) {
  const latest = new Map<string, ReviewClusterDecision>();
  for (const decision of decisions) latest.set(decision.clusterId, decision);
  return latest;
}

function matchesTemplate(candidate: EvidenceAdjudicationCandidate, template: ClusterTemplate) {
  if (!template.families.includes(candidate.capabilityFamily)) return false;
  if (template.excludedFamilies?.includes(candidate.capabilityFamily)) return false;
  return template.terms.some((term) => term.test(candidate.statement));
}

function priorityScore(candidates: readonly EvidenceAdjudicationCandidate[], template: ClusterTemplate) {
  const conflictCount = candidates.filter((candidate) => candidate.conflictState === "CONFLICTING").length;
  const provenanceCount = candidates.filter((candidate) => candidate.sourceEvidenceCount > 0).length;
  return candidates.length * 4 + conflictCount * 3 + provenanceCount * 2 + (template.key === "PROGRAM_ACCOUNTABILITY" ? 8 : 0);
}

export function buildReviewClusters(input: {
  candidates: readonly EvidenceAdjudicationCandidate[];
  decisions?: readonly ReviewClusterDecision[];
  maxHighValue?: number;
}) {
  const decisions = latestDecisions(input.decisions || []);
  const clusters: ReviewCluster[] = [];
  for (const template of TEMPLATES) {
    const matched = input.candidates.filter((candidate) => candidate.eligibilityState !== "ALREADY_PROJECTED" && matchesTemplate(candidate, template));
    const bySemantics = new Map<string, EvidenceAdjudicationCandidate[]>();
    for (const candidate of matched) {
      const key = `${template.key}|${candidate.capabilityFamily}|${candidate.directOrTransferable}`;
      const group = bySemantics.get(key) || [];
      group.push(candidate);
      bySemantics.set(key, group);
    }
    for (const [key, group] of bySemantics) {
      const clusterId = `review_cluster_${createHash("sha256").update(key).digest("hex").slice(0, 24)}`;
      const decision = decisions.get(clusterId);
      const propagationEligibleCandidateIds = group
        .filter((candidate) => candidate.conflictReason === "UNRESOLVED_VERIFICATION")
        .map((candidate) => candidate.candidateId);
      const allowedAnswers: ReviewClusterAnswer[] = group[0].directOrTransferable === "DIRECT"
        ? ["DIRECT", "ADJACENT", "NEEDS_EVIDENCE", "KEEP_UNRESOLVED"]
        : group[0].directOrTransferable === "TRANSFERABLE"
          ? ["TRANSFERABLE", "ADJACENT", "NEEDS_EVIDENCE", "KEEP_UNRESOLVED"]
          : [...REVIEW_CLUSTER_ANSWERS];
      clusters.push({
        clusterId,
        clusterType: "SHARED_QUESTION",
        operatorQuestion: template.question,
        whyAsked: template.whyAsked,
        capabilityFamily: group[0].capabilityFamily,
        directOrTransferable: group[0].directOrTransferable,
        underlyingCandidateIds: group.map((candidate) => candidate.candidateId),
        underlyingCandidateCount: group.length,
        affectedOpportunityCount: null,
        sourceProvenanceStates: [...new Set(group.map((candidate) => candidate.sourceEvidenceCount ? "LINKED_SOURCE" : "NO_LINKED_SOURCE"))],
        conflictStates: [...new Set(group.map((candidate) => candidate.conflictState))],
        propagationEligibleCandidateIds,
        allowedAnswers,
        priorityScore: priorityScore(group, template),
        priorityReason: `${group.length} related candidates share the same question template, capability family, and direct/transferable state; ${propagationEligibleCandidateIds.length} are eligible for bounded propagation.`,
        operatorAnswer: decision?.answer || null,
        operatorCorrection: decision?.operatorCorrection || null,
      });
    }
  }
  clusters.sort((a, b) => b.priorityScore - a.priorityScore || a.clusterId.localeCompare(b.clusterId));
  const maxHighValue = input.maxHighValue || 18;
  return {
    allClusters: clusters,
    highValueClusters: clusters.slice(0, Math.min(maxHighValue, clusters.length)),
    lowValueOrRedundantClusters: clusters.slice(Math.min(maxHighValue, clusters.length)),
  };
}

export function loadReviewClusterDecisions(options: { decisionRoot: string; repositoryRoot: string }) {
  const file = decisionPath(options.decisionRoot);
  if (!existsSync(file)) return [] as ReviewClusterDecision[];
  if (path.resolve(options.decisionRoot).startsWith(path.resolve(options.repositoryRoot) + path.sep)) throw new Error("PRIVATE_DECISION_ROOT_REQUIRED");
  return readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as ReviewClusterDecision);
}

export function appendReviewClusterDecision(options: {
  decisionRoot: string;
  repositoryRoot: string;
  cluster: ReviewCluster;
  answer: ReviewClusterAnswer;
  operatorCorrection?: string | null;
  createdAt?: string;
}) {
  if (!REVIEW_CLUSTER_ANSWERS.includes(options.answer)) throw new Error("INVALID_REVIEW_CLUSTER_ANSWER");
  if (!options.cluster.allowedAnswers.includes(options.answer)) throw new Error("ANSWER_CROSSES_DIRECT_TRANSFERABLE_BOUNDARY");
  const createdAt = options.createdAt || new Date().toISOString();
  const operatorCorrection = options.operatorCorrection?.trim() || null;
  const seed = `${options.cluster.clusterId}|${createdAt}|${options.answer}`;
  const decision: ReviewClusterDecision = {
    schemaVersion: REVIEW_CLUSTER_SCHEMA_VERSION,
    decisionId: `review_cluster_decision_${createHash("sha256").update(seed).digest("hex").slice(0, 24)}`,
    clusterId: options.cluster.clusterId,
    answer: options.answer,
    operatorCorrection,
    underlyingCandidateIds: [...options.cluster.underlyingCandidateIds],
    propagationEligibleCandidateIds: [...options.cluster.propagationEligibleCandidateIds],
    createdAt,
    operatorId: "ROSS",
    sourceAuthority: "PRIVATE_CAREER_AUTHORITY_CLUSTER_ADJUDICATION",
    canonicalCareerFactMutated: false,
    canonicalCareerEvidenceCreated: false,
  };
  if (path.resolve(options.decisionRoot).startsWith(path.resolve(options.repositoryRoot) + path.sep)) throw new Error("PRIVATE_DECISION_ROOT_REQUIRED");
  mkdirSync(options.decisionRoot, { recursive: true, mode: 0o700 });
  appendFileSync(decisionPath(options.decisionRoot), `${JSON.stringify(decision)}\n`, { encoding: "utf8", mode: 0o600 });
  return decision;
}

export function loadCompressedReviewRuntime(options: { repositoryRoot: string; home?: string; maxHighValue?: number }) {
  const runtime = loadEvidenceAdjudicationRuntime({ repositoryRoot: options.repositoryRoot, home: options.home });
  const decisions = loadReviewClusterDecisions({ decisionRoot: privateAdjudicationRoot(options.home), repositoryRoot: options.repositoryRoot });
  const clusters = buildReviewClusters({ candidates: runtime.candidates, decisions, maxHighValue: options.maxHighValue });
  const addressed = new Set<string>();
  for (const cluster of clusters.allClusters) {
    if (!cluster.operatorAnswer) continue;
    for (const candidateId of cluster.propagationEligibleCandidateIds) addressed.add(candidateId);
  }
  return { ...runtime, decisions, ...clusters, addressedCandidateCount: addressed.size };
}

export function compressionProgress(runtime: ReturnType<typeof loadCompressedReviewRuntime>) {
  const reviewed = runtime.highValueClusters.filter((cluster) => Boolean(cluster.operatorAnswer)).length;
  return {
    operatorDecisions: reviewed,
    operatorDecisionTotal: runtime.highValueClusters.length,
    underlyingCandidatesAddressed: runtime.addressedCandidateCount,
    underlyingCandidateTotal: runtime.candidates.filter((candidate) => candidate.eligibilityState !== "ALREADY_PROJECTED").length,
  };
}

export const REVIEW_CLUSTER_SOURCE_SCHEMA = EVIDENCE_ADJUDICATION_SCHEMA_VERSION;
export { privateAdjudicationRoot } from "./evidenceAdjudication";

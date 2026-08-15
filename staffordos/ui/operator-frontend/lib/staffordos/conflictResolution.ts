import type { ReviewCluster } from "./evidenceReviewCompression";

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

export function buildConflictReviewQueue(clusters: readonly ReviewCluster[]) {
  return clusters
    .filter((cluster) => cluster.conflictStates.includes("CONFLICTING") || cluster.sourceProvenanceStates.includes("NO_LINKED_SOURCE"))
    .map((cluster) => ({
      ...cluster,
      conflictType: classifyConflictType(cluster),
      currentOutcome: outcomeForAnswer(cluster.operatorAnswer),
      authorityEffect: "Affects only the bounded evidence authority represented by this question and its compatible candidates.",
      excludedEffects: "Does not change ranking, J002, J003, J010, application status, workflow, preferences, CareerFact, or CareerEvidence.",
    }));
}

export function conflictTypeDistribution(queue: ReturnType<typeof buildConflictReviewQueue>) {
  return Object.fromEntries(CONFLICT_TYPES.map((type) => [type, queue.filter((item) => item.conflictType === type).length]));
}

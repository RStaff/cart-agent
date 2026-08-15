const POSITIVE_ANSWERS = new Set(["DIRECT", "TRANSFERABLE"]);
const BLOCKED_CONFLICTS = /conflict|specialist|temporal|scope|source/i;

function list(value) { return Array.isArray(value) ? value : []; }
function text(value) { return typeof value === "string" ? value.trim() : ""; }

function blockedCandidate(candidate) {
  return candidate?.eligibilityState === "CONFLICT_BLOCKED"
    || candidate?.conflictState === "CONFLICTING"
    || BLOCKED_CONFLICTS.test(`${candidate?.conflictReason || ""} ${list(candidate?.eligibilityReasons).join(" ")}`);
}

function latestClusterDecisions(runtime) {
  const result = new Map();
  for (const cluster of runtime?.highValueClusters || []) {
    if (!cluster.operatorAnswer) continue;
    for (const candidateId of list(cluster.propagationEligibleCandidateIds)) {
      const candidate = (runtime.candidates || []).find((item) => item.candidateId === candidateId);
      const prior = result.get(candidateId);
      const current = { clusterId: cluster.clusterId, answer: cluster.operatorAnswer, candidate };
      if (prior && prior.answer !== current.answer) result.set(candidateId, { ...current, blocked: true, blockReason: "CONFLICTING_CLUSTER_DECISIONS" });
      else if (!prior) result.set(candidateId, current);
    }
  }
  return result;
}

export function buildAdjudicatedProjectionIndex(runtime) {
  const byCandidateId = latestClusterDecisions(runtime);
  const bySourceFactId = new Map();
  let blocked = 0;
  for (const item of byCandidateId.values()) {
    if (item.blocked || !item.candidate || blockedCandidate(item.candidate) || !POSITIVE_ANSWERS.has(item.answer)) {
      if (item.answer !== "KEEP_UNRESOLVED" && item.candidate?.sourceFactId) {
        bySourceFactId.set(item.candidate.sourceFactId, { ...item, sourceFactId: item.candidate.sourceFactId, blocked: true, blockReason: item.blockReason || item.candidate.conflictReason || "CONFLICT_BLOCKED" });
        blocked += 1;
      }
      continue;
    }
    const sourceFactId = text(item.candidate.sourceFactId);
    if (!sourceFactId) continue;
    const prior = bySourceFactId.get(sourceFactId);
    if (prior && (prior.answer !== item.answer || prior.clusterId !== item.clusterId)) {
      bySourceFactId.delete(sourceFactId);
      blocked += 1;
      continue;
    }
    if (!prior) bySourceFactId.set(sourceFactId, { ...item, sourceFactId });
  }
  return { bySourceFactId, candidateDecisionCount: byCandidateId.size, blockedCandidateCount: blocked };
}

export function projectAdjudicatedMappings({ mappings = [], index }) {
  const stats = {
    comparisonsConsidered: mappings.length,
    comparisonsAffected: 0,
    directConsumed: 0,
    transferableConsumed: 0,
    unresolvedPreserved: 0,
    blockedPropagations: 0,
    conflictBlocked: 0,
    specialistBlocked: 0,
    temporalBlocked: 0,
    scopeBlocked: 0,
  };
  const projected = mappings.map((mapping) => {
    const factIds = list(mapping.careerFactIds);
    const matches = factIds.map((id) => index?.bySourceFactId?.get(id)).filter(Boolean);
    if (!matches.length) return mapping;
    const positive = matches.filter((item) => POSITIVE_ANSWERS.has(item.answer));
    const blocked = matches.filter((item) => item.blocked || blockedCandidate(item.candidate));
    if (blocked.length) {
      stats.blockedPropagations += blocked.length;
      const reason = blocked.map((item) => `${item.candidate?.conflictReason || "BOUNDARY"}`).join(" ");
      if (/specialist/i.test(reason)) stats.specialistBlocked += blocked.length;
      else if (/temporal/i.test(reason)) stats.temporalBlocked += blocked.length;
      else if (/scope/i.test(reason)) stats.scopeBlocked += blocked.length;
      else stats.conflictBlocked += blocked.length;
      return mapping;
    }
    if (!positive.length || ["PROVEN", "PARTIAL", "TRANSFERABLE"].includes(mapping.classification)) return mapping;
    const direct = positive.filter((item) => item.answer === "DIRECT");
    const transferable = positive.filter((item) => item.answer === "TRANSFERABLE");
    const answer = direct.length ? "DIRECT" : "TRANSFERABLE";
    const first = direct[0] || transferable[0];
    stats.comparisonsAffected += 1;
    if (answer === "DIRECT") stats.directConsumed += 1;
    else stats.transferableConsumed += 1;
    return {
      ...mapping,
      classification: answer === "DIRECT" ? "PROVEN" : "TRANSFERABLE",
      explanation: `${mapping.explanation || "Existing requirement mapping."} Offline operator adjudication projection: ${answer}.`,
      operatorAdjudicationProjection: {
        answer,
        clusterId: first.clusterId,
        sourceFactIds: factIds.filter((id) => positive.some((item) => item.sourceFactId === id)),
        sourceAuthority: "V1_26C_OPERATOR_ADJUDICATION_OFFLINE_PROJECTION",
        canonicalCareerFactMutated: false,
        canonicalCareerEvidenceCreated: false,
      },
    };
  });
  stats.unresolvedPreserved = mappings.filter((mapping, index) => mapping === projected[index] && ["UNKNOWN", "MISSING"].includes(mapping.classification)).length;
  return { mappings: projected, stats };
}

export function createAdjudicatedMappingProjection(runtime) {
  const index = buildAdjudicatedProjectionIndex(runtime);
  const aggregate = { comparisonsConsidered: 0, comparisonsAffected: 0, directConsumed: 0, transferableConsumed: 0, unresolvedPreserved: 0, blockedPropagations: index.blockedCandidateCount, conflictBlocked: 0, specialistBlocked: 0, temporalBlocked: 0, scopeBlocked: 0 };
  const mappingProjection = ({ mappings }) => {
    const result = projectAdjudicatedMappings({ mappings, index });
    for (const [key, value] of Object.entries(result.stats)) aggregate[key] += value;
    return result;
  };
  return { index, mappingProjection, getStats: () => ({ ...aggregate }) };
}

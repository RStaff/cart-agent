const DECISION_TO_CLASSIFICATION = Object.freeze({
  DIRECT: "PROVEN",
  TRANSFERABLE: "TRANSFERABLE",
  ADJACENT: "PARTIAL",
});

function list(value) { return Array.isArray(value) ? value : []; }
function text(value) { return typeof value === "string" ? value.toLowerCase() : ""; }
function specialistRequirement(requirement) {
  const source = [requirement?.requirementCategory, requirement?.requirementLevel, requirement?.importanceClassification, requirement?.requirementText, requirement?.normalizedRequirement, requirement?.technologyOrSkill].map(text).join(" ");
  return /mandatory_specialist|specialist|international tax|tax compliance|payroll|accounting|finance close|legal counsel|av production|av engineer|software engineer|software development|data scientist|statistical model|clinical|regulated|regulatory/.test(source);
}

function clearanceForAnswers(answers) {
  const unique = new Set(answers);
  if (!unique.size || [...unique].some((answer) => ["KEEP_UNRESOLVED", "NEEDS_EVIDENCE"].includes(answer))) return "KEEP_UNRESOLVED";
  if ([...unique].some((answer) => answer === "NO")) return "REJECTED_BY_OPERATOR";
  if (unique.has("ADJACENT") || (unique.has("DIRECT") && unique.has("TRANSFERABLE"))) return "SAFELY_CLEARED_PARTIAL";
  if (unique.has("DIRECT")) return "SAFELY_CLEARED_DIRECT";
  if (unique.has("TRANSFERABLE")) return "SAFELY_CLEARED_TRANSFERABLE";
  return "KEEP_UNRESOLVED";
}

export function buildConflictClearanceIndex({ candidates = [], decisions = [] } = {}) {
  const byCandidate = new Map(candidates.map((candidate) => [candidate.candidateId, candidate]));
  const answersByCandidate = new Map();
  const decisionsByCandidate = new Map();
  const latestQuestions = new Map();
  for (const decision of decisions) latestQuestions.set(decision.questionId, decision);
  for (const decision of latestQuestions.values()) {
    for (const candidateId of list(decision.propagationEligibleCandidateIds)) {
      if (!answersByCandidate.has(candidateId)) answersByCandidate.set(candidateId, []);
      if (!decisionsByCandidate.has(candidateId)) decisionsByCandidate.set(candidateId, []);
      answersByCandidate.get(candidateId).push(decision.answer);
      decisionsByCandidate.get(candidateId).push(decision);
    }
  }
  const byCandidateId = new Map();
  for (const [candidateId, answers] of answersByCandidate) {
    const candidate = byCandidate.get(candidateId);
    let classification = clearanceForAnswers(answers);
    let reason = "Exact candidate reference is covered by active V1.26G decision(s).";
    if (!candidate) {
      classification = "NOT_APPLICABLE_TO_DECISION";
      reason = "Candidate reference is not present in the loaded private candidate authority.";
    } else if (candidate.conflictState !== "CONFLICTING" || candidate.conflictReason !== "UNRESOLVED_VERIFICATION") {
      classification = candidate.eligibilityState === "INSUFFICIENT_PROVENANCE" ? "INSUFFICIENT_PROVENANCE" : "STILL_CONFLICT_BLOCKED";
      reason = "The active decision does not address the candidate's current conflict boundary exactly.";
    }
    byCandidateId.set(candidateId, { candidateId, sourceFactId: candidate?.sourceFactId || null, classification, answers: [...answers], decisionIds: decisionsByCandidate.get(candidateId)?.map((decision) => decision.decisionId) || [], reason });
  }
  return { byCandidateId, latestQuestionCount: latestQuestions.size, referenceCount: [...latestQuestions.values()].reduce((sum, decision) => sum + list(decision.propagationEligibleCandidateIds).length, 0), distinctCandidateCount: byCandidateId.size };
}

export function projectConflictClearanceMappings({ mappings = [], requirements = [], index } = {}) {
  const stats = { comparisonsConsidered: mappings.length, comparisonsAffected: 0, directConsumed: 0, transferableConsumed: 0, partialConsumed: 0, unresolvedPreserved: 0, rejectedPreserved: 0, blocked: 0, specialistBlocked: 0 };
  const requirementsById = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  const projected = mappings.map((mapping) => {
    if (["PROVEN", "PARTIAL", "TRANSFERABLE"].includes(mapping.classification)) return mapping;
    if (specialistRequirement(requirementsById.get(mapping.requirementId))) {
      stats.specialistBlocked += 1;
      stats.blocked += 1;
      return mapping;
    }
    const decisions = list(mapping.careerFactIds).map((factId) => [...(index?.byCandidateId?.values() || [])].filter((item) => item.sourceFactId === factId)).flat();
    if (!decisions.length) {
      if (["UNKNOWN", "MISSING"].includes(mapping.classification)) stats.unresolvedPreserved += 1;
      return mapping;
    }
    const clearances = decisions.map((item) => item.classification);
    if (clearances.some((value) => ["STILL_CONFLICT_BLOCKED", "INSUFFICIENT_PROVENANCE", "NOT_APPLICABLE_TO_DECISION"].includes(value))) {
      stats.blocked += 1;
      return mapping;
    }
    const positive = clearances.filter((value) => value.startsWith("SAFELY_CLEARED_"));
    if (!positive.length) {
      if (clearances.includes("REJECTED_BY_OPERATOR")) stats.rejectedPreserved += 1;
      else stats.unresolvedPreserved += 1;
      return mapping;
    }
    const classification = positive.includes("SAFELY_CLEARED_PARTIAL") ? "PARTIAL" : positive.includes("SAFELY_CLEARED_DIRECT") ? "PROVEN" : "TRANSFERABLE";
    stats.comparisonsAffected += 1;
    if (classification === "PROVEN") stats.directConsumed += 1;
    else if (classification === "TRANSFERABLE") stats.transferableConsumed += 1;
    else stats.partialConsumed += 1;
    const first = decisions.find((item) => item.classification === (classification === "PROVEN" ? "SAFELY_CLEARED_DIRECT" : classification === "TRANSFERABLE" ? "SAFELY_CLEARED_TRANSFERABLE" : "SAFELY_CLEARED_PARTIAL")) || decisions[0];
    return { ...mapping, classification, operatorConflictResolution: { decisionIds: first.decisionIds, clearance: first.classification, sourceFactIds: list(mapping.careerFactIds), offlineOnly: true, canonicalCareerFactMutated: false, canonicalCareerEvidenceCreated: false } };
  });
  return { mappings: projected, stats };
}

export function createConflictClearanceProjection({ candidates = [], decisions = [] } = {}) {
  const index = buildConflictClearanceIndex({ candidates, decisions });
  const aggregate = { comparisonsConsidered: 0, comparisonsAffected: 0, directConsumed: 0, transferableConsumed: 0, partialConsumed: 0, unresolvedPreserved: 0, rejectedPreserved: 0, blocked: 0, specialistBlocked: 0 };
  const mappingProjection = ({ mappings, requirements }) => {
    const result = projectConflictClearanceMappings({ mappings, requirements, index });
    for (const [key, value] of Object.entries(result.stats)) aggregate[key] += value;
    return result;
  };
  return { index, mappingProjection, getStats: () => ({ ...aggregate }) };
}

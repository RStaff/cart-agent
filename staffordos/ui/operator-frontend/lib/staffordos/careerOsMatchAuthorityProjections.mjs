const DIRECT = "EXACT_OR_DIRECT_SUPPORT";
const TRANSFERABLE = "STRONG_TRANSFERABLE_SUPPORT";
const PARTIAL = "PARTIAL_SUPPORT";
const NO_EVIDENCE = "NO_SUPPORTED_EVIDENCE";
const UNKNOWN = "UNKNOWN";

function text(value) { return typeof value === "string" ? value.trim() : ""; }
function list(value) { return Array.isArray(value) ? value : []; }
function level(value) { return text(value).toUpperCase(); }
function mappingFor(requirement, mappings) { return mappings.find((item) => item.requirementId === requirement.id) || null; }
function stateFor(mapping) {
  if (!mapping) return UNKNOWN;
  if (mapping.classification === "PROVEN") return DIRECT;
  if (mapping.classification === "TRANSFERABLE") return TRANSFERABLE;
  if (mapping.classification === "PARTIAL") return PARTIAL;
  if (mapping.classification === "MISSING") return NO_EVIDENCE;
  return UNKNOWN;
}
function capabilityConclusion(state) {
  if (state === DIRECT) return "SUPPORTED_CAPABILITY";
  if (state === TRANSFERABLE) return "TRANSFERABLE_CAPABILITY";
  if (state === PARTIAL) return "PARTIALLY_SUPPORTED_CAPABILITY";
  if (state === NO_EVIDENCE) return "NO_PROOF_OF_CAPABILITY_GAP";
  return "UNRESOLVED_CAPABILITY";
}

export function projectResponsibilitySimilarity({ requirements = [], mappings = [] } = {}) {
  const responsibilities = list(requirements).filter((requirement) => ["RESPONSIBILITY", "RESPONSIBILITIES", "LEADERSHIP", "PROGRAM_MANAGEMENT", "OPERATIONS"].includes(level(requirement.requirementCategory || requirement.requirementLevel || requirement.importanceClassification)) || level(requirement.requirementLevel) === "RESPONSIBILITY");
  const comparisons = responsibilities.map((requirement) => {
    const mapping = mappingFor(requirement, mappings);
    const evidenceState = stateFor(mapping);
    return {
      requirementId: requirement.id || null,
      requirement: text(requirement.requirementText || requirement.text) || "Unknown responsibility",
      evidenceState,
      capabilityConclusion: capabilityConclusion(evidenceState),
      careerEvidenceIds: mapping?.careerEvidenceIds || [],
      comparisonReason: evidenceState === UNKNOWN ? "CareerOS lacks a resolved evidence mapping; capability remains unknown." : evidenceState === NO_EVIDENCE ? "No supported evidence is mapped; this is not proof that the capability is absent." : "Existing CareerEvidence mapping supports this responsibility at the stated evidence level.",
    };
  });
  const counts = Object.fromEntries([DIRECT, TRANSFERABLE, PARTIAL, NO_EVIDENCE, UNKNOWN].map((state) => [state, comparisons.filter((item) => item.evidenceState === state).length]));
  return {
    state: comparisons.length && !comparisons.some((item) => item.evidenceState === UNKNOWN) ? "CALCULATED" : comparisons.length ? "PARTIAL" : "UNKNOWN",
    counts,
    comparisons,
    coverage: { total: comparisons.length, resolved: comparisons.filter((item) => item.evidenceState !== UNKNOWN).length, transferable: counts[TRANSFERABLE], direct: counts[DIRECT], missingEvidence: counts[NO_EVIDENCE] },
  };
}

export function projectSeniorityCompatibility({ title = "", requirements = [], responsibilitySimilarity } = {}) {
  const roleText = `${text(title)} ${list(requirements).map((item) => text(item.requirementText || item.text)).join(" ")}`.toLowerCase();
  const seniorTitle = /\b(director|vice president|vp|head|chief|lead)\b/.test(roleText);
  const supportedScope = responsibilitySimilarity?.counts?.[DIRECT] > 0 || responsibilitySimilarity?.counts?.[TRANSFERABLE] > 0;
  if (seniorTitle && supportedScope) return { state: "UPWARD_STRETCH_WITH_SUPPORTED_SCOPE", capabilityConclusion: "NO_PROOF_OF_LEVEL_CAPABILITY_GAP", reason: "The role is senior by title, but supported or transferable responsibility scope exists; title difference is not a blocker." };
  if (seniorTitle) return { state: "UNRESOLVED", capabilityConclusion: "UNRESOLVED_CAPABILITY", reason: "The role signals senior scope, but authoritative scope evidence is incomplete." };
  if (supportedScope) return { state: "ADJACENT_LEVEL", capabilityConclusion: "NO_PROOF_OF_LEVEL_CAPABILITY_GAP", reason: "Supported responsibility scope is present; no title-based mismatch is inferred." };
  return { state: "UNRESOLVED", capabilityConclusion: "UNRESOLVED_CAPABILITY", reason: "No approved seniority comparison authority is available." };
}

export function projectDomainCompatibility({ title = "", requirements = [], responsibilitySimilarity } = {}) {
  const roleText = `${text(title)} ${list(requirements).map((item) => text(item.requirementText || item.text)).join(" ")}`.toLowerCase();
  const adjacentSignal = /ai|automation|technical program|program management|operations|transformation|business systems|marketing technology|martech/.test(roleText);
  const transferable = (responsibilitySimilarity?.counts?.[DIRECT] || 0) + (responsibilitySimilarity?.counts?.[TRANSFERABLE] || 0) > 0;
  if (adjacentSignal && transferable) return { state: "TRANSFERABLE_DOMAIN", capabilityConclusion: "TRANSFERABLE_CAPABILITY", reason: "Adjacent domain signals are present alongside direct or transferable responsibility evidence; industry/title difference is not treated as a blocker." };
  if (adjacentSignal) return { state: "UNRESOLVED_DOMAIN", capabilityConclusion: "UNRESOLVED_CAPABILITY", reason: "Adjacent domain signals exist, but evidence coverage is insufficient to conclude transferability." };
  return { state: "UNRESOLVED_DOMAIN", capabilityConclusion: "UNRESOLVED_CAPABILITY", reason: "No approved domain comparison authority is available for this opportunity." };
}

export function projectMatchAuthorityDiagnostics(input = {}) {
  const responsibilitySimilarity = projectResponsibilitySimilarity(input);
  const seniorityCompatibility = projectSeniorityCompatibility({ ...input, responsibilitySimilarity });
  const domainCompatibility = projectDomainCompatibility({ ...input, responsibilitySimilarity });
  return {
    responsibilitySimilarity,
    seniorityCompatibility,
    domainCompatibility,
    evidenceCoverage: responsibilitySimilarity.coverage,
    capabilityConclusion: {
      responsibility: responsibilitySimilarity.comparisons.map((item) => item.capabilityConclusion),
      seniority: seniorityCompatibility.capabilityConclusion,
      domain: domainCompatibility.capabilityConclusion,
    },
    evidenceGapReason: responsibilitySimilarity.comparisons.filter((item) => [NO_EVIDENCE, UNKNOWN].includes(item.evidenceState)).map((item) => ({ requirementId: item.requirementId, state: item.evidenceState, reason: item.comparisonReason })),
  };
}

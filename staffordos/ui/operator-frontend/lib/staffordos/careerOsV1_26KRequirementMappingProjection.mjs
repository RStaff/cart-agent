const POSITIVE = new Set(["DIRECT", "TRANSFERABLE", "PARTIAL"]);
const MODES = Object.freeze({
  DIRECT_ONLY: new Set(["DIRECT"]),
  DIRECT_TRANSFERABLE: new Set(["DIRECT", "TRANSFERABLE"]),
  DIRECT_TRANSFERABLE_PARTIAL: new Set(["DIRECT", "TRANSFERABLE", "PARTIAL"]),
});
const SPECIALIST = /finance|accounting|tax|payroll|legal|av[_ -]?media|software[_ -]?engineering|software engineer|data[_ -]?science|data scientist|machine learning|specialist ai|security engineering/i;

function list(value) { return Array.isArray(value) ? value : []; }
function text(value) { return typeof value === "string" ? value.trim() : ""; }
function specialistRequirement(requirement) {
  return Boolean(requirement?.specialist === true) || SPECIALIST.test([
    requirement?.requirementCategory,
    requirement?.requirementLevel,
    requirement?.requirementText,
    requirement?.normalizedRequirement,
    requirement?.technologyOrSkill,
  ].filter(Boolean).join(" "));
}
function classification(state) {
  return state === "DIRECT" ? "PROVEN" : state === "TRANSFERABLE" ? "TRANSFERABLE" : state === "PARTIAL" ? "PARTIAL" : null;
}

/**
 * Projects owner-approved requirement relationships into an evaluation copy.
 * It never mutates source facts, evidence, requirements, decisions, or mappings.
 */
export function projectRequirementMappingAuthority({ mappings = [], requirements = [], decisions = [], factIds = new Set(), evidenceIds = new Set(), mode = "DIRECT_TRANSFERABLE_PARTIAL" } = {}) {
  const allowed = MODES[mode] || MODES.DIRECT_TRANSFERABLE_PARTIAL;
  const requirementsById = new Map(list(requirements).map((item) => [item.id || item.requirementId, item]));
  const active = new Map();
  for (const decision of list(decisions)) {
    const prior = active.get(decision.requirementId);
    if (!prior || String(decision.createdAt || "") > String(prior.createdAt || "")) active.set(decision.requirementId, decision);
  }
  const stats = {
    decisions: active.size, exactRequirementDecisions: 0, authorityValid: 0, evaluatorConsumable: 0,
    direct: 0, transferable: 0, partial: 0, directConsumed: 0, transferableConsumed: 0, partialConsumed: 0,
    noSupportedEquivalent: 0, neutralUnresolved: 0, blockedConflict: 0, blockedProvenance: 0, blockedSpecialist: 0,
    notMapped: 0, comparisonsConsidered: 0,
  };
  const audit = [];
  const decisionByRequirement = new Map();
  for (const [requirementId, decision] of active) {
    const requirement = requirementsById.get(requirementId);
    const exact = Boolean(requirement && (decision.opportunityId == null || decision.opportunityId === requirement.jobOpportunityId || decision.opportunityId === requirement.opportunityId));
    const validFactRefs = list(decision.candidateCareerFactIds).filter((id) => factIds.has(id));
    const validEvidenceRefs = list(decision.candidateCareerEvidenceIds).filter((id) => evidenceIds.has(id));
    const positive = POSITIVE.has(decision.state);
    let status = "NOT_MAPPED";
    let reason = "No exact locked requirement relationship.";
    if (!exact) { stats.notMapped += 1; reason = "Exact requirement or opportunity identity is absent."; }
    else { stats.exactRequirementDecisions += 1; }
    if (exact && positive && !validFactRefs.length && !validEvidenceRefs.length) { status = "BLOCKED_PROVENANCE"; stats.blockedProvenance += 1; reason = "Operator decision has no reference to loaded private authority."; }
    else if (exact && positive && specialistRequirement(requirement) && decision.specialistCompatible !== true) { status = "BLOCKED_SPECIALIST"; stats.blockedSpecialist += 1; reason = "Specialist compatibility was not explicitly confirmed."; }
    else if (exact && positive) {
      stats.authorityValid += 1; stats[decision.state.toLowerCase()] += 1;
      if (allowed.has(decision.state)) {
        status = `${decision.state}_CONSUMABLE`; stats.evaluatorConsumable += 1; stats[decision.state.toLowerCase() + "Consumed"] += 1;
        reason = "Exact operator-authorized requirement relationship with valid private authority references.";
      } else { status = "NOT_MAPPED"; reason = `State ${decision.state} is intentionally excluded by this experimental representation.`; }
    } else if (exact && decision.state === "NO_SUPPORTED_EQUIVALENT") { status = "NO_SUPPORTED_EQUIVALENT"; stats.noSupportedEquivalent += 1; reason = "Bounded negative applies to this exact requirement only."; }
    else if (exact && ["NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"].includes(decision.state)) { status = "NEUTRAL_UNRESOLVED"; stats.neutralUnresolved += 1; reason = "Unresolved authority remains neutral, not negative."; }
    const record = { requirementId, opportunityId: decision.opportunityId, state: decision.state, status, reason, validFactReferenceCount: validFactRefs.length, validEvidenceReferenceCount: validEvidenceRefs.length, specialist: specialistRequirement(requirement), specialistCompatible: decision.specialistCompatible === true, operatorAuthority: decision.operatorId || null };
    audit.push(record); decisionByRequirement.set(requirementId, record);
  }
  const projected = list(mappings).map((mapping) => {
    stats.comparisonsConsidered += 1;
    const record = decisionByRequirement.get(mapping.requirementId);
    if (!record || !record.status.endsWith("_CONSUMABLE")) return mapping;
    if (["PROVEN", "TRANSFERABLE", "PARTIAL"].includes(mapping.classification)) return mapping;
    const next = { ...mapping, classification: classification(record.state), requirementMappingAuthority: { requirementId: record.requirementId, state: record.state, offlineOnly: true, canonicalCareerFactMutated: false, canonicalCareerEvidenceCreated: false } };
    return next;
  });
  const consumedByClassification = projected.reduce((result, mapping, index) => {
    if (mapping !== mappings[index] && ["PROVEN", "TRANSFERABLE", "PARTIAL"].includes(mapping.classification)) result[mapping.classification] += 1;
    return result;
  }, { PROVEN: 0, TRANSFERABLE: 0, PARTIAL: 0 });
  stats.directConsumedComparisons = consumedByClassification.PROVEN;
  stats.transferableConsumedComparisons = consumedByClassification.TRANSFERABLE;
  stats.partialConsumedComparisons = consumedByClassification.PARTIAL;
  return { mappings: projected, audit, stats, activeDecisions: [...active.values()] };
}

export { specialistRequirement, MODES };

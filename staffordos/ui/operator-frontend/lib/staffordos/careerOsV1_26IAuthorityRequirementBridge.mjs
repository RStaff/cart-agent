const POSITIVE = new Set(["DIRECT", "TRANSFERABLE", "PARTIAL"]);
const SPECIALIST = /finance|accounting|tax|payroll|legal|av[_ ]?media|software[_ ]?engineering|software engineer|data[_ ]?science|data scientist|specialist[_ ]?ai|machine learning scientist/i;

function list(value) { return Array.isArray(value) ? value : []; }
function text(value) { return typeof value === "string" ? value.trim() : ""; }

function candidateById(candidates) { return new Map(list(candidates).map((item) => [item.candidateId, item])); }
function requirementById(requirements) { return new Map(list(requirements).map((item) => [item.id || item.requirementId, item])); }
function mappingByRequirement(mappings) { return new Map(list(mappings).map((item) => [item.requirementId, item])); }

function specialistRequirement(requirement) {
  return Boolean(requirement?.specialist === true) || SPECIALIST.test([
    requirement?.requirementCategory,
    requirement?.requirementLevel,
    requirement?.importanceClassification,
    requirement?.requirementText,
    requirement?.normalizedRequirement,
    requirement?.technologyOrSkill,
  ].filter(Boolean).join(" "));
}

function compatible(record, candidate, requirement) {
  if (!POSITIVE.has(record.relationship)) return "INVALID_RELATIONSHIP";
  if (!candidate || !requirement) return "MISSING_AUTHORITY_REFERENCE";
  if (!record.operatorDecisionId || !record.conflictDecisionId || !record.candidateId || !record.requirementId) return "INCOMPLETE_PROVENANCE";
  if (record.relationship === "DIRECT" && record.operatorOutcome !== "VERIFIED_DIRECT") return "DIRECT_OUTCOME_MISMATCH";
  if (record.relationship === "TRANSFERABLE" && record.operatorOutcome !== "VERIFIED_TRANSFERABLE") return "TRANSFERABLE_OUTCOME_MISMATCH";
  if (record.relationship === "PARTIAL" && !["PARTIALLY_SUPPORTED", "VERIFIED_TRANSFERABLE", "VERIFIED_DIRECT"].includes(record.operatorOutcome)) return "PARTIAL_OUTCOME_MISMATCH";
  if (specialistRequirement(requirement) && record.specialistCompatible !== true) return "SPECIALIST_FIREWALL";
  if (!record.semanticBoundary || !record.provenanceReason) return "MISSING_SEMANTIC_BOUNDARY";
  if (record.titleOnly || record.keywordOnly || record.domainOnly) return "UNSAFE_INFERENCE_SOURCE";
  if (candidate.conflictState === "CONFLICTING" || candidate.eligibilityState === "CONFLICT_BLOCKED") return "CONFLICT_NOT_CLEARED";
  return null;
}

export function buildAuthorityRequirementBridge({ candidates = [], requirements = [], mappings = [], records = [] } = {}) {
  const candidatesById = candidateById(candidates);
  const requirementsById = requirementById(requirements);
  const mappingsByRequirement = mappingByRequirement(mappings);
  const accepted = [];
  const rejected = [];
  for (const record of list(records)) {
    const candidate = candidatesById.get(record.candidateId);
    const requirement = requirementsById.get(record.requirementId);
    const reason = compatible(record, candidate, requirement);
    if (reason) { rejected.push({ candidateId: record.candidateId || null, requirementId: record.requirementId || null, reason }); continue; }
    const existing = mappingsByRequirement.get(record.requirementId);
    accepted.push({
      bridgeId: record.bridgeId,
      candidateId: record.candidateId,
      requirementId: record.requirementId,
      relationship: record.relationship,
      operatorDecisionId: record.operatorDecisionId,
      conflictDecisionId: record.conflictDecisionId,
      sourceFactIds: list(candidate.sourceFactId ? [candidate.sourceFactId] : record.sourceFactIds),
      sourceEvidenceIds: list(record.sourceEvidenceIds),
      semanticBoundary: record.semanticBoundary,
      unresolvedPortion: record.relationship === "PARTIAL" ? text(record.unresolvedPortion) || "Unresolved portion remains outside the bridge." : null,
      specialist: specialistRequirement(requirement),
      existingMappingId: existing?.id || null,
      offlineOnly: true,
    });
  }
  return { accepted, rejected, counts: { accepted: accepted.length, rejected: rejected.length, direct: accepted.filter((x) => x.relationship === "DIRECT").length, transferable: accepted.filter((x) => x.relationship === "TRANSFERABLE").length, partial: accepted.filter((x) => x.relationship === "PARTIAL").length } };
}

export function applyAuthorityRequirementBridge({ mappings = [], bridge = [] } = {}) {
  const byRequirement = new Map(list(bridge).map((record) => [record.requirementId, record]));
  const projected = list(mappings).map((mapping) => {
    const record = byRequirement.get(mapping.requirementId);
    if (!record) return mapping;
    const classification = record.relationship === "DIRECT" ? "PROVEN" : record.relationship;
    return { ...mapping, classification, authorityRequirementBridge: { ...record, canonicalCareerFactMutated: false, canonicalCareerEvidenceCreated: false, requirementMutated: false } };
  });
  return { mappings: projected, affected: projected.filter((mapping, index) => mapping !== mappings[index]).length };
}

export function bridgeFromExplicitRecords(input = {}) { return buildAuthorityRequirementBridge(input); }

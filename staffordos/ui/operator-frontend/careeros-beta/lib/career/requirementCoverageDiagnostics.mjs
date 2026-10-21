export function buildRequirementCoverageDiagnostics({ sourceType, description, parsedRequirementCount, evaluationRequirementCount, parserDiagnostics = null }) {
  const text = String(description || "").trim();
  return {
    sourceType: String(sourceType || "UNKNOWN"),
    descriptionPresent: Boolean(text),
    descriptionCharacterCount: text.length,
    parsedRequirementCount: Number(parsedRequirementCount) || 0,
    evaluationRequirementCount: Number(evaluationRequirementCount) || 0,
    ...(parserDiagnostics ? { parser: parserDiagnostics } : {}),
  };
}

const CAPABILITY_AUTHORITY_STATES = Object.freeze({
  direct: "VERIFIED_DIRECT",
  transferable: "VERIFIED_TRANSFERABLE",
  partial: "PARTIALLY_SUPPORTED",
  unsupported: "NOT_SUPPORTED",
});

const RELATIONSHIP_STATES = Object.freeze(["DIRECT", "TRANSFERABLE", "PARTIAL", "UNKNOWN", "SPECIALIST_BLOCKED", "SCOPE_BLOCKED"]);

function countBy(items, selector, value) {
  return items.filter((item) => selector(item) === value).length;
}

export function buildEvidenceRelationshipDiagnostics({ requirements = [], capabilities = [], relationships = [] }) {
  const requirementItems = Array.isArray(requirements) ? requirements : [];
  const capabilityItems = Array.isArray(capabilities) ? capabilities : [];
  const relationshipItems = Array.isArray(relationships) ? relationships : [];
  const requirementKeys = requirementItems.map((item) => item?.conceptKey).filter(Boolean);
  const capabilityKeys = capabilityItems.map((item) => item?.capabilityKey).filter(Boolean);
  const capabilityKeySet = new Set(capabilityKeys);
  const requirementsWithCapability = requirementKeys.filter((key) => capabilityKeySet.has(key)).length;
  const relationshipCounts = Object.fromEntries(RELATIONSHIP_STATES.map((state) => [state, countBy(relationshipItems, (item) => item?.state, state)]));
  const direct = relationshipCounts.DIRECT;
  const transferable = relationshipCounts.TRANSFERABLE;

  return {
    capabilityAuthorityCount: capabilityItems.length,
    directCapabilityAuthorityCount: countBy(capabilityItems, (item) => item?.authorityState, CAPABILITY_AUTHORITY_STATES.direct),
    transferableCapabilityAuthorityCount: countBy(capabilityItems, (item) => item?.authorityState, CAPABILITY_AUTHORITY_STATES.transferable),
    partialCapabilityAuthorityCount: countBy(capabilityItems, (item) => item?.authorityState, CAPABILITY_AUTHORITY_STATES.partial),
    unsupportedCapabilityAuthorityCount: countBy(capabilityItems, (item) => item?.authorityState, CAPABILITY_AUTHORITY_STATES.unsupported),
    unresolvedCapabilityAuthorityCount: capabilityItems.filter((item) => !Object.values(CAPABILITY_AUTHORITY_STATES).includes(item?.authorityState)).length,
    parsedRequirementCount: requirementItems.length,
    requirementsWithConceptKeyCount: requirementKeys.length,
    requirementsWithoutConceptKeyCount: requirementItems.length - requirementKeys.length,
    uniqueRequirementConceptKeyCount: new Set(requirementKeys).size,
    capabilityConceptKeyCount: capabilityKeys.length,
    uniqueCapabilityConceptKeyCount: new Set(capabilityKeys).size,
    requirementConceptKeysWithCapabilityCandidateCount: requirementsWithCapability,
    requirementConceptKeysWithoutCapabilityCandidateCount: requirementKeys.length - requirementsWithCapability,
    relationshipEvaluationCount: relationshipItems.length,
    directRelationshipCount: direct,
    transferableRelationshipCount: transferable,
    partialRelationshipCount: relationshipCounts.PARTIAL,
    unknownRelationshipCount: relationshipCounts.UNKNOWN,
    specialistBlockedRelationshipCount: relationshipCounts.SPECIALIST_BLOCKED,
    scopeBlockedRelationshipCount: relationshipCounts.SCOPE_BLOCKED,
    relationshipsWithoutCapabilityCount: relationshipItems.filter((item) => !item?.capabilityKey && item?.state === "UNKNOWN").length,
    relationshipsWithCapabilityCount: relationshipItems.filter((item) => Boolean(item?.capabilityKey)).length,
    fitNumeratorCount: direct + transferable,
    fitDenominatorCount: relationshipItems.length,
  };
}

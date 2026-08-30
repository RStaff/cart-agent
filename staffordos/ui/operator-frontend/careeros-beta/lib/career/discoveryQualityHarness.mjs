export const BROTHER_BETA_DISCOVERY_QUALITY_THRESHOLD = Object.freeze({
  topN: 10,
  minWouldApplyOrConsider: 3,
  maxJunkRate: 0.2,
  maxDuplicateRate: 0.2,
  minExplanationTrustRate: 0.7,
});

export function evaluateDiscoveryQualityLabels(labels = [], threshold = BROTHER_BETA_DISCOVERY_QUALITY_THRESHOLD) {
  const top = labels.slice(0, threshold.topN);
  const count = top.length || 1;
  const positive = top.filter((item) => ["WOULD_APPLY", "WOULD_CONSIDER"].includes(item.label)).length;
  const junkRate = top.filter((item) => item.junk).length / count;
  const duplicateRate = top.filter((item) => item.duplicate).length / count;
  const explanationTrustRate = top.filter((item) => item.explanationTrusted).length / count;
  return {
    threshold,
    positive,
    junkRate,
    duplicateRate,
    explanationTrustRate,
    passed: positive >= threshold.minWouldApplyOrConsider && junkRate < threshold.maxJunkRate && duplicateRate < threshold.maxDuplicateRate && explanationTrustRate >= threshold.minExplanationTrustRate,
  };
}

export function evaluateRoleIntentTopTen({ roleIntent, rankedResults = [] } = {}) {
  const top = rankedResults.slice(0, 10);
  const count = (classification) => top.filter((item) => (item.roleCompatibility?.classification || item.classification) === classification).length;
  const relevant = top.filter((item) => ["EXACT_OR_NEAR_TITLE", "COMPATIBLE_ADJACENT"].includes(item.roleCompatibility?.classification || item.classification));
  return {
    requestedRole: roleIntent?.requestedTitle || "",
    topTen: top.length,
    exactOrNearCount: count("EXACT_OR_NEAR_TITLE"),
    compatibleAdjacentCount: count("COMPATIBLE_ADJACENT"),
    roleFamilyOnlyCount: count("ROLE_FAMILY_ONLY"),
    incompatibleCount: count("INCOMPATIBLE"),
    wrongSeniorityCount: top.filter((item) => item.roleCompatibility && !item.roleCompatibility.seniorityMatch).length,
    wrongSpecializationCount: top.filter((item) => item.roleCompatibility && !item.roleCompatibility.specializationMatch).length,
    wrongLocationCount: top.filter((item) => item.quality?.gates?.locationFit === false).length,
    topTenRelevantCount: relevant.length,
  };
}

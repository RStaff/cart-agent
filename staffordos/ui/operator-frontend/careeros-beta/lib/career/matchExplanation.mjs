export const MATCH_EXPLANATION_GROUPS = Object.freeze([
  ["DIRECT", "What looks strong"],
  ["TRANSFERABLE", "Transferable experience"],
  ["PARTIAL", "Some supporting evidence"],
  ["UNKNOWN", "What needs more evidence"],
  ["SPECIALIST_BLOCKED", "Specialist requirements"],
]);

export function visibleMatchExplanationGroups(relationships = []) {
  return MATCH_EXPLANATION_GROUPS.filter(([state]) => relationships.some((item) => item.state === state));
}

export function hasAdditionalMatchEvidence(relationships = []) {
  return relationships.some((item) => ["TRANSFERABLE", "PARTIAL", "UNKNOWN", "SPECIALIST_BLOCKED", "SCOPE_BLOCKED"].includes(item.state));
}

import { proposalFamilies } from "./careerOsV1_27AOfflineCapabilityGraph.mjs";

const SCOPE_LATTICE_VERSION = "CAREEROS_V1_27A3_SCOPE_LATTICE_V1";
const POSITIVE_STATES = new Set(["VERIFIED_DIRECT", "VERIFIED_TRANSFERABLE", "PARTIALLY_SUPPORTED"]);

const QUESTION_SCOPE_TO_CANONICAL = {
  PRODUCT_OWNERSHIP: "OWNERSHIP",
  PROJECT_DELIVERY_OWNERSHIP: "OWNERSHIP",
  OPERATING_MODEL_OWNERSHIP: "OWNERSHIP",
  MARKETING_SYSTEMS_OPERATION: "OWNERSHIP",
  STAKEHOLDER_LEADERSHIP: "COORDINATED",
  INDIVIDUAL_DATA_ANALYSIS: "CONTRIBUTED",
  CUSTOMER_SOLUTIONS_OWNERSHIP: "OWNERSHIP",
  TECHNICAL_PROGRAM_OWNERSHIP: "OWNERSHIP",
  AI_AUTOMATION_OPERATION: "OWNERSHIP",
  GOVERNANCE_ACCOUNTABILITY: "OWNERSHIP",
};

const REQUIREMENT_SCOPE_TO_CANONICAL = {
  INDIVIDUAL_OR_CONTRIBUTOR: "CONTRIBUTED",
  OWNERSHIP: "OWNERSHIP",
  TEAM_LEADERSHIP: "TEAM_LEADERSHIP",
  PORTFOLIO_ENTERPRISE: "PORTFOLIO_ENTERPRISE",
  UNSPECIFIED: "UNSPECIFIED",
};

const SOURCE_SCOPE_TO_CANONICAL = {
  COORDINATED_OR_CONTRIBUTED: "COORDINATED",
  CONTRIBUTED: "CONTRIBUTED",
  COORDINATED: "COORDINATED",
  OWNED: "OWNERSHIP",
  LED_PROGRAM: "OWNERSHIP",
  LED_TEAM: "TEAM_LEADERSHIP",
  LED_PORTFOLIO: "PORTFOLIO_ENTERPRISE",
  ENTERPRISE_GLOBAL_SCOPE: "ENTERPRISE_GLOBAL",
  ENTERPRISE_GLOBAL: "ENTERPRISE_GLOBAL",
  UNRESOLVED_SCOPE: "UNRESOLVED",
};

function canonicalScope(value) {
  return QUESTION_SCOPE_TO_CANONICAL[value] || REQUIREMENT_SCOPE_TO_CANONICAL[value] || SOURCE_SCOPE_TO_CANONICAL[value] || value || "UNRESOLVED";
}

function scopeForCapability(capability, decisions, questionsById) {
  const decision = decisions.find((item) => !item.superseded && (item.capabilityIds || []).includes(capability.capabilityId));
  const question = decision ? questionsById.get(decision.questionId) : null;
  if (decision && question && decision.authorityState !== "KEEP_UNRESOLVED" && decision.authorityState !== "NEEDS_MORE_EVIDENCE" && decision.authorityState !== "NO_SUPPORTED_CAPABILITY") {
    return { scope: canonicalScope(question.scopeBeingResolved), source: "operator_question_scope", questionId: decision.questionId };
  }
  return { scope: canonicalScope(capability.scope), source: "capability_source_scope", questionId: null };
}

function compatibility(capabilityScopeValue, requirementScopeValue) {
  const capabilityScope = canonicalScope(capabilityScopeValue);
  const requirementScope = canonicalScope(requirementScopeValue);
  if (capabilityScope === "UNRESOLVED") return { state: "UNRESOLVED_SCOPE", capabilityScope, requirementScope, reason: "Capability scope is unresolved." };
  if (requirementScope === "UNSPECIFIED") return { state: "SUPPORTED_LOWER_OR_EQUAL_SCOPE", capabilityScope, requirementScope, reason: "Requirement does not impose a narrower explicit scope." };
  if (capabilityScope === requirementScope) return { state: "EXACT_SCOPE", capabilityScope, requirementScope, reason: "Capability and requirement scopes are the same governed dimension." };
  if (capabilityScope === "ENTERPRISE_GLOBAL" && ["CONTRIBUTED", "COORDINATED", "OWNERSHIP", "PORTFOLIO_ENTERPRISE"].includes(requirementScope)) return { state: "SUPPORTED_LOWER_OR_EQUAL_SCOPE", capabilityScope, requirementScope, reason: "Enterprise/global scope subsumes the lower delivery scope without asserting people management." };
  if (capabilityScope === "PORTFOLIO_ENTERPRISE" && ["CONTRIBUTED", "COORDINATED", "OWNERSHIP"].includes(requirementScope)) return { state: "SUPPORTED_LOWER_OR_EQUAL_SCOPE", capabilityScope, requirementScope, reason: "Portfolio scope subsumes lower delivery scope." };
  if (["OWNERSHIP", "COORDINATED"].includes(capabilityScope) && requirementScope === "CONTRIBUTED") return { state: "SUPPORTED_LOWER_OR_EQUAL_SCOPE", capabilityScope, requirementScope, reason: "Ownership or coordination safely covers contribution." };
  if (capabilityScope === "CONTRIBUTED" && requirementScope === "COORDINATED") return { state: "TRANSFERABLE_SCOPE", capabilityScope, requirementScope, reason: "Contribution is adjacent to coordination but does not prove coordination." };
  if (["OWNERSHIP", "COORDINATED"].includes(capabilityScope) && requirementScope === "PORTFOLIO_ENTERPRISE") return { state: "TRANSFERABLE_SCOPE", capabilityScope, requirementScope, reason: "Program/operating ownership is adjacent to portfolio/enterprise scope." };
  if (capabilityScope === "PORTFOLIO_ENTERPRISE" && requirementScope === "TEAM_LEADERSHIP") return { state: "INCOMPATIBLE_SCOPE", capabilityScope, requirementScope, reason: "Portfolio breadth does not establish people management." };
  if (capabilityScope === "OWNERSHIP" && requirementScope === "TEAM_LEADERSHIP") return { state: "INCOMPATIBLE_SCOPE", capabilityScope, requirementScope, reason: "Delivery ownership does not establish people management." };
  if (capabilityScope === "TEAM_LEADERSHIP" && requirementScope === "PORTFOLIO_ENTERPRISE") return { state: "TRANSFERABLE_SCOPE", capabilityScope, requirementScope, reason: "People leadership does not establish portfolio ownership, but may be adjacent." };
  return { state: "INCOMPATIBLE_SCOPE", capabilityScope, requirementScope, reason: "The scope dimensions are not safely subsuming." };
}

function relationshipFor(authorityState, scopeState) {
  if (scopeState === "UNRESOLVED_SCOPE") return "UNRESOLVED";
  if (scopeState === "INCOMPATIBLE_SCOPE") return "SCOPE_BLOCKED";
  if (authorityState === "VERIFIED_DIRECT") return scopeState === "EXACT_SCOPE" || scopeState === "SUPPORTED_LOWER_OR_EQUAL_SCOPE" ? "DIRECT" : scopeState === "TRANSFERABLE_SCOPE" ? "TRANSFERABLE" : "PARTIAL";
  if (authorityState === "VERIFIED_TRANSFERABLE") return scopeState === "SUPPORTED_LOWER_OR_EQUAL_SCOPE" || scopeState === "EXACT_SCOPE" || scopeState === "TRANSFERABLE_SCOPE" ? "TRANSFERABLE" : "PARTIAL";
  if (authorityState === "PARTIALLY_SUPPORTED") return "PARTIAL";
  return "UNRESOLVED";
}

function projectScopeCompatibleRelationships({ capabilities = [], concepts = [], adjudications = [], questions = [] } = {}) {
  const questionsById = new Map(questions.map((question) => [question.questionId, question]));
  const active = new Map();
  for (const decision of adjudications.filter((item) => !item.superseded)) for (const capabilityId of decision.capabilityIds || []) active.set(capabilityId, decision.authorityState);
  const scopeProfiles = new Map(capabilities.map((capability) => [capability.capabilityId, scopeForCapability(capability, adjudications, questionsById)]));
  const relationships = [];
  const counts = { DIRECT: 0, TRANSFERABLE: 0, PARTIAL: 0, UNRESOLVED: 0, SPECIALIST_BLOCKED: 0, SCOPE_BLOCKED: 0, NO_SUPPORTED_RELATIONSHIP: 0 };
  const scopePairs = {};
  let specialistLeakage = 0; let scopeViolations = 0;
  for (const concept of concepts) {
    const candidates = capabilities.filter((capability) => proposalFamilies(capability.canonicalName).includes(concept.capabilityFamily));
    const specialistCompatible = candidates.filter((capability) => capability.specialistClassification === concept.specialistClassification);
    let state = "UNRESOLVED"; const valid = [];
    if (!specialistCompatible.length && candidates.length && concept.specialistClassification === "SPECIALIST") state = "SPECIALIST_BLOCKED";
    else {
      for (const capability of specialistCompatible) {
        const authorityState = active.get(capability.capabilityId) || capability.authorityState;
        if (!POSITIVE_STATES.has(authorityState)) continue;
        const profile = scopeProfiles.get(capability.capabilityId);
        const scopeResult = compatibility(profile.scope, concept.scope);
        const pairKey = `${profile.scope}->${canonicalScope(concept.scope)}`;
        scopePairs[pairKey] = (scopePairs[pairKey] || 0) + concept.targetCount;
        valid.push({ capability, authorityState, profile, scopeResult });
      }
      const positive = valid.filter((item) => ["DIRECT", "TRANSFERABLE", "PARTIAL"].includes(relationshipFor(item.authorityState, item.scopeResult.state)));
      if (positive.length) {
        const priority = { DIRECT: 1, TRANSFERABLE: 2, PARTIAL: 3 };
        const selected = positive.sort((a, b) => priority[relationshipFor(a.authorityState, a.scopeResult.state)] - priority[relationshipFor(b.authorityState, b.scopeResult.state)] || a.capability.capabilityId.localeCompare(b.capability.capabilityId))[0];
        state = relationshipFor(selected.authorityState, selected.scopeResult.state);
      } else if (valid.some((item) => item.scopeResult.state === "UNRESOLVED_SCOPE")) state = "UNRESOLVED";
      else if (!valid.length && candidates.length) state = "UNRESOLVED";
      else if (valid.length) state = "SCOPE_BLOCKED";
      else state = "NO_SUPPORTED_RELATIONSHIP";
    }
    counts[state] += concept.targetCount;
    const selected = valid.find((item) => relationshipFor(item.authorityState, item.scopeResult.state) === state) || valid[0];
    relationships.push({ conceptId: concept.conceptId, capabilityIds: selected ? [selected.capability.capabilityId] : [], state, exactRequirementCount: concept.targetCount, specialistSafe: state !== "SPECIALIST_BLOCKED", scopeSafe: state !== "SCOPE_BLOCKED", scopeCompatibility: selected?.scopeResult || null, provenancePreserved: true });
    if (state === "SPECIALIST_BLOCKED" && concept.specialistClassification !== "SPECIALIST") specialistLeakage += concept.targetCount;
    if (state === "DIRECT" && selected?.scopeResult.state === "TRANSFERABLE_SCOPE") scopeViolations += concept.targetCount;
  }
  return { latticeVersion: SCOPE_LATTICE_VERSION, relationships, counts, scopePairs, specialistLeakage, scopeViolations, accepted: counts.DIRECT + counts.TRANSFERABLE + counts.PARTIAL, scopeProfiles: Object.fromEntries([...scopeProfiles].map(([id, profile]) => [id, profile])) };
}

export { SCOPE_LATTICE_VERSION, canonicalScope, compatibility, projectScopeCompatibleRelationships, relationshipFor, scopeForCapability };

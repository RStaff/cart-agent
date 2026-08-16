import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { candidateFromFact, capabilityIdentityKey, hash } from "./careerOsV1_27OfflineCapabilityGraph.mjs";

const REVIEW_FILE = "capability-adjudications.ndjson";
const VALID_ANSWERS = new Set(["DIRECT_OWNER", "SHARED_OWNER", "LED_WITHOUT_FULL_OWNERSHIP", "CONTRIBUTOR", "TRANSFERABLE_ANALOG", "PARTIAL", "NO", "NO_SUPPORTED_CAPABILITY", "NEEDS_EVIDENCE", "KEEP_UNRESOLVED", "HANDS_ON_IMPLEMENTATION", "ARCHITECTURE_DESIGN", "TECHNICAL_OVERSIGHT", "TECHNICAL_REQUIREMENTS", "ADJACENT_EXPOSURE", "NO_SUPPORTED_DEPTH", "PEOPLE_MANAGER", "PROGRAM_LEADER_WITHOUT_REPORTS", "SHARED_LEADERSHIP", "NO_SUPPORTED_LEADERSHIP"]);
const POSITIVE_ANSWERS = new Set(["DIRECT_OWNER", "HANDS_ON_IMPLEMENTATION", "ARCHITECTURE_DESIGN", "PEOPLE_MANAGER", "PROGRAM_LEADER_WITHOUT_REPORTS", "SHARED_OWNER", "LED_WITHOUT_FULL_OWNERSHIP", "TRANSFERABLE_ANALOG", "PARTIAL", "TECHNICAL_OVERSIGHT", "TECHNICAL_REQUIREMENTS"]);
const FAMILY_TO_REQUIREMENT = {
  TECHNICAL_PROGRAM_LEADERSHIP: ["PROGRAM_DELIVERY"],
  PROJECT_DELIVERY: ["PROGRAM_DELIVERY"],
  PRODUCT_GOVERNANCE: ["PRODUCT"],
  MARKETING_TECHNOLOGY: ["MARKETING_TECHNOLOGY", "AI_AUTOMATION"],
  BUSINESS_SYSTEMS: ["BUSINESS_SYSTEMS"],
  AI_AUTOMATION_WORKFLOWS: ["AI_AUTOMATION"],
  GOVERNANCE_RISK: ["GOVERNANCE"],
  DATA_ANALYSIS: ["DATA"],
  GENERAL_OPERATIONS: ["GENERAL_RESPONSIBILITY"],
  STAKEHOLDER_LEADERSHIP: ["GENERAL_RESPONSIBILITY"],
  CUSTOMER_SOLUTIONS: ["GENERAL_RESPONSIBILITY"],
  TRANSFORMATION_OPERATING_MODEL: ["GENERAL_RESPONSIBILITY", "GOVERNANCE"],
  TRAINING_FACILITATION: ["GENERAL_RESPONSIBILITY"],
  VENDOR_MANAGEMENT: ["GENERAL_RESPONSIBILITY"],
  REQUIREMENTS_TRANSLATION: ["GENERAL_RESPONSIBILITY", "BUSINESS_SYSTEMS"],
};

const answerState = (answer) => {
  if (["DIRECT_OWNER", "HANDS_ON_IMPLEMENTATION", "PEOPLE_MANAGER"].includes(answer)) return "VERIFIED_DIRECT";
  if (["TRANSFERABLE_ANALOG", "PROGRAM_LEADER_WITHOUT_REPORTS", "ARCHITECTURE_DESIGN", "TECHNICAL_OVERSIGHT", "TECHNICAL_REQUIREMENTS", "SHARED_OWNER", "LED_WITHOUT_FULL_OWNERSHIP"].includes(answer)) return "VERIFIED_TRANSFERABLE";
  if (["PARTIAL", "CONTRIBUTOR", "ADJACENT_EXPOSURE", "SHARED_LEADERSHIP"].includes(answer)) return "PARTIALLY_SUPPORTED";
  if (["NO", "NO_SUPPORTED_CAPABILITY", "NO_SUPPORTED_DEPTH", "NO_SUPPORTED_LEADERSHIP"].includes(answer)) return "NO_SUPPORTED_CAPABILITY";
  if (answer === "NEEDS_EVIDENCE") return "NEEDS_MORE_EVIDENCE";
  return "KEEP_UNRESOLVED";
};

function proposalFamilies(canonicalName) {
  return FAMILY_TO_REQUIREMENT[canonicalName] || [];
}

function buildCapabilityGraph({ facts = [], evidence = [], adjudications = [], graphVersion = "CAREEROS_V1_27A_GRAPH_V1" } = {}) {
  const groups = new Map();
  for (const fact of facts) {
    const candidate = candidateFromFact(fact);
    if (!candidate) continue;
    const key = capabilityIdentityKey(candidate);
    const group = groups.get(key) || { ...candidate, factIds: [], evidenceIds: new Set(), decisionIds: new Set(), authorityStates: new Set(), conflictTypes: new Set() };
    group.factIds.push(fact.id || null);
    for (const id of candidate.sourceEvidenceIds) group.evidenceIds.add(id);
    for (const id of candidate.sourceDecisionIds) group.decisionIds.add(id);
    group.authorityStates.add(candidate.authorityState);
    for (const type of fact.conflictTypes || []) group.conflictTypes.add(type);
    groups.set(key, group);
  }
  const capabilities = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, group]) => {
    const capabilityId = `capability_${hash(key)}`;
    const adjudicated = adjudications.filter((decision) => (decision.capabilityIds || []).includes(capabilityId) && !decision.superseded);
    const state = adjudicated.length ? answerState(adjudicated[adjudicated.length - 1].answer) : [...group.authorityStates].sort()[0] || "KEEP_UNRESOLVED";
    return {
      capabilityId,
      canonicalName: group.canonicalName,
      capabilityFamily: group.capabilityFamily,
      authorityState: state,
      sourceAuthorityStates: [...group.authorityStates].sort(),
      scope: group.scopeLevel,
      specialistClassification: group.specialist ? "SPECIALIST" : "GENERAL",
      domainContext: group.domainContext,
      sourceFactRefs: group.factIds,
      sourceEvidenceRefs: [...group.evidenceIds].sort(),
      adjudicationRefs: [...group.decisionIds].sort(),
      conflictRefs: [...group.conflictTypes].sort(),
      graphVersion,
      derivedOnly: true,
      privatePayloadsOmitted: false,
    };
  });
  const factEdges = capabilities.flatMap((capability) => capability.sourceFactRefs.map((factId) => ({ edgeType: "ESTABLISHES_CAPABILITY", factId, capabilityId: capability.capabilityId, relationshipState: capability.authorityState, provenance: "CareerFact-derived" })));
  const evidenceEdges = capabilities.flatMap((capability) => capability.sourceEvidenceRefs.map((evidenceId) => ({ edgeType: "SUPPORTS_CAPABILITY", evidenceId, capabilityId: capability.capabilityId, relationshipState: capability.authorityState, provenance: "CareerEvidence-derived" })));
  const adjudicationEdges = adjudications.filter((decision) => !decision.superseded).flatMap((decision) => (decision.capabilityIds || []).map((capabilityId) => ({ edgeType: "ADJUDICATES_CAPABILITY", decisionId: decision.decisionId, questionId: decision.questionId, capabilityId, answer: decision.answer, authorityState: answerState(decision.answer), provenance: "Operator capability adjudication" })));
  return { graphVersion, capabilities, edges: { factEdges, evidenceEdges, adjudicationEdges }, evaluated: { facts: facts.length, evidence: evidence.length, capabilities: capabilities.length }, sourceAuthorityMutated: false };
}

function buildRequirementConceptGraph(manifest, graphVersion = "CAREEROS_V1_27A_REQUIREMENT_CONCEPTS_V1") {
  const targets = manifest.questions.flatMap((question) => question.targets || []);
  const groups = new Map();
  for (const target of targets) {
    const key = [target.capabilityFamily, target.specialist ? "SPECIALIST" : "GENERAL", target.scopeClassification].join("|");
    const group = groups.get(key) || { key, capabilityFamily: target.capabilityFamily, specialistClassification: target.specialist ? "SPECIALIST" : "GENERAL", scope: target.scopeClassification, requirementIds: [], opportunityIds: [], targetCount: 0 };
    group.requirementIds.push(target.requirementId); group.opportunityIds.push(target.opportunityId); group.targetCount += 1; groups.set(key, group);
  }
  const concepts = [...groups.values()].sort((a, b) => a.key.localeCompare(b.key)).map((group) => ({ conceptId: `requirement_concept_${hash(group.key)}`, canonicalName: `${group.capabilityFamily}_${group.scope}_${group.specialistClassification}`, capabilityFamily: group.capabilityFamily, scope: group.scope, specialistClassification: group.specialistClassification, targetCount: group.targetCount, sourceRequirementIds: [...group.requirementIds].sort(), sourceOpportunityIds: [...group.opportunityIds].sort(), graphVersion, proposalOnly: true }));
  const rawMappings = concepts.flatMap((concept) => concept.sourceRequirementIds.map((requirementId, index) => ({ requirementId, opportunityId: concept.sourceOpportunityIds[index], conceptId: concept.conceptId, capabilityFamily: concept.capabilityFamily, scope: concept.scope, specialistClassification: concept.specialistClassification, provenance: "Exact L2 target to deterministic concept proposal", proposalOnly: true })));
  return { graphVersion, concepts, rawMappings, rawRequirements: targets.length, sourceAuthorityMutated: false };
}

function projectCapabilityRequirementRelationships({ capabilities = [], concepts = [], adjudications = [] } = {}) {
  const active = new Map();
  for (const decision of adjudications.filter((item) => !item.superseded)) for (const capabilityId of decision.capabilityIds || []) active.set(capabilityId, answerState(decision.answer));
  const relationships = [];
  const counts = { DIRECT: 0, TRANSFERABLE: 0, PARTIAL: 0, UNRESOLVED: 0, SPECIALIST_BLOCKED: 0, SCOPE_BLOCKED: 0 };
  for (const concept of concepts) {
    const candidates = capabilities.filter((capability) => proposalFamilies(capability.canonicalName).includes(concept.capabilityFamily));
    const specialistCompatible = candidates.filter((capability) => capability.specialistClassification === concept.specialistClassification);
    const resolved = specialistCompatible.filter((capability) => active.has(capability.capabilityId) || ["VERIFIED_DIRECT", "VERIFIED_TRANSFERABLE", "PARTIALLY_SUPPORTED"].includes(capability.authorityState));
    let state = "UNRESOLVED";
    if (!specialistCompatible.length && candidates.length && concept.specialistClassification === "SPECIALIST") state = "SPECIALIST_BLOCKED";
    else if (!resolved.length && specialistCompatible.length) state = "UNRESOLVED";
    else if (resolved.some((capability) => (active.get(capability.capabilityId) || capability.authorityState) === "VERIFIED_DIRECT" && capability.scope === concept.scope)) state = "DIRECT";
    else if (resolved.some((capability) => (active.get(capability.capabilityId) || capability.authorityState) === "VERIFIED_TRANSFERABLE" && capability.scope === concept.scope)) state = "TRANSFERABLE";
    else if (resolved.some((capability) => (active.get(capability.capabilityId) || capability.authorityState) === "PARTIALLY_SUPPORTED" && capability.scope === concept.scope)) state = "PARTIAL";
    else if (resolved.length) state = "SCOPE_BLOCKED";
    counts[state] += concept.targetCount;
    relationships.push({ conceptId: concept.conceptId, capabilityIds: resolved.map((item) => item.capabilityId), state, exactRequirementCount: concept.targetCount, specialistSafe: state !== "SPECIALIST_BLOCKED", scopeSafe: state !== "SCOPE_BLOCKED", proposalOnly: state === "UNRESOLVED" });
  }
  return { relationships, counts, specialistLeakage: 0, scopeViolations: 0, accepted: counts.DIRECT + counts.TRANSFERABLE + counts.PARTIAL };
}

function auditActiveLearningQuestions({ questions = [], capabilities = [], concepts = [] } = {}) {
  const byName = new Map(capabilities.map((capability) => [capability.canonicalName, capability]));
  return questions.map((question, order) => {
    const capability = byName.get(question.canonicalCapability);
    const families = proposalFamilies(question.canonicalCapability);
    const affectedConcepts = concepts.filter((concept) => families.includes(concept.capabilityFamily));
    return { questionId: question.questionId, order: order + 1, question: question.question, capabilityId: capability?.capabilityId || null, canonicalCapability: question.canonicalCapability, allowedAnswers: question.allowedAnswers, scopeBoundary: capability?.scope || "UNRESOLVED", scopeBeingResolved: question.scopeBeingResolved || "CAPABILITY_SCOPE", specialistBoundary: capability?.specialistClassification || "UNKNOWN", affectedConceptIds: affectedConcepts.map((concept) => concept.conceptId), affectedRequirementCount: affectedConcepts.reduce((sum, concept) => sum + concept.targetCount, 0), informationValue: question.informationValue, labelsExcluded: true, authorityEffect: question.authorityEffect || "Updates only the named capability; downstream relationships remain derived and fail closed." };
  });
}

function decisionPath(decisionRoot) { return path.join(decisionRoot, REVIEW_FILE); }
function loadCapabilityAdjudicationDecisions({ decisionRoot }) {
  const file = decisionPath(decisionRoot);
  if (!existsSync(file)) return [];
  const records = readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const decisions = records.filter((item) => item.recordType !== "SUPERSESSION").map((item) => ({ ...item }));
  for (const event of records.filter((item) => item.recordType === "SUPERSESSION")) {
    const prior = decisions.find((item) => item.decisionId === event.decisionId);
    if (prior) { prior.superseded = true; prior.supersededBy = event.supersededBy; }
  }
  return decisions;
}
function appendCapabilityAdjudicationDecision({ decisionRoot, questionId, capabilityIds, answer, operatorId = "ROSS", createdAt, note = null, graphVersion = "CAREEROS_V1_27A_GRAPH_V1" }) {
  if (!VALID_ANSWERS.has(answer)) throw new Error(`Unsupported capability answer: ${answer}`);
  if (!questionId || !Array.isArray(capabilityIds) || capabilityIds.length === 0) throw new Error("Capability decision requires questionId and capabilityIds");
  const prior = loadCapabilityAdjudicationDecisions({ decisionRoot });
  const activePrior = prior.filter((item) => item.questionId === questionId && !item.superseded).at(-1);
  const decisionId = `capability_decision_${hash([questionId, capabilityIds.join(","), answer, createdAt || "now", prior.length].join("|"))}`;
  const record = { decisionId, questionId, capabilityIds: [...new Set(capabilityIds)].sort(), answer, authorityState: answerState(answer), operatorId, createdAt: createdAt || new Date().toISOString(), note, graphVersion, supersedes: activePrior?.decisionId || null, superseded: false, sourceAuthorityMutated: false };
  if (activePrior) {
    mkdirSync(decisionRoot, { recursive: true });
    appendFileSync(decisionPath(decisionRoot), `${JSON.stringify({ recordType: "SUPERSESSION", decisionId: activePrior.decisionId, supersededBy: decisionId, createdAt: record.createdAt })}\n`);
  }
  mkdirSync(decisionRoot, { recursive: true });
  appendFileSync(decisionPath(decisionRoot), `${JSON.stringify(record)}\n`);
  return record;
}

function activeCapabilityAdjudications(decisions) { return decisions.filter((item) => !item.superseded); }

export { answerState, buildCapabilityGraph, buildRequirementConceptGraph, projectCapabilityRequirementRelationships, auditActiveLearningQuestions, loadCapabilityAdjudicationDecisions, appendCapabilityAdjudicationDecision, activeCapabilityAdjudications, proposalFamilies };

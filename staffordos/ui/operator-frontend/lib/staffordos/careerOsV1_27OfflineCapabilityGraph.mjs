import { createHash } from "node:crypto";

const SPECIALIST = /finance|accounting|tax|payroll|legal|av[_ -]?media|software[_ -]?engineering|software engineer|data[_ -]?science|data scientist|machine learning|specialist ai|security/i;
const CAPABILITY_RULES = [
  ["TECHNICAL_PROGRAM_LEADERSHIP", /technical program|program manager|program leadership|cross.?functional delivery|dependencies|delivery accountability/i],
  ["PROJECT_DELIVERY", /project manager|project delivery|implementation|milestone|delivery/i],
  ["STAKEHOLDER_LEADERSHIP", /stakeholder|executive communication|business and technical|facilitat|collaborat/i],
  ["REQUIREMENTS_TRANSLATION", /requirements?|business analysis|translate.*technical|technical.*business/i],
  ["PRODUCT_GOVERNANCE", /product|backlog|roadmap|priorit|product governance/i],
  ["MARKETING_TECHNOLOGY", /marketing technology|martech|marketing automation|crm|campaign/i],
  ["BUSINESS_SYSTEMS", /business systems|systems analyst|enterprise systems|workflow system/i],
  ["AI_AUTOMATION_WORKFLOWS", /artificial intelligence|\bai\b|automation|agent|orchestrat|workflow/i],
  ["TRANSFORMATION_OPERATING_MODEL", /transformation|operating model|process improvement|change management/i],
  ["GOVERNANCE_RISK", /governance|compliance|risk|audit|controls/i],
  ["DATA_ANALYSIS", /data analysis|analytics|reporting|measurement|insight/i],
  ["CUSTOMER_SOLUTIONS", /customer|solutions|consulting|client|partner/i],
  ["VENDOR_MANAGEMENT", /vendor|supplier|third.?party|procurement/i],
  ["TRAINING_FACILITATION", /training|teach|facilitat|enablement|workshop/i],
  ["GENERAL_OPERATIONS", /operations|operating|process|coordination|management/i],
];

const DOMAIN_RULES = [
  ["FINANCIAL_SERVICES", /financial services|banking|payments|fintech/i],
  ["MARKETING_TECHNOLOGY", /marketing technology|martech|marketing automation/i],
  ["HEALTHCARE", /healthcare|health care|medical|cardiovascular/i],
  ["AI_AUTOMATION", /artificial intelligence|\bai\b|automation|machine learning/i],
  ["SAAS", /saas|software as a service|cloud platform/i],
  ["EDUCATION", /education|university|teaching|training/i],
  ["ENTERPRISE_SYSTEMS", /enterprise systems|erp|crm|business systems/i],
];

const hash = (value) => createHash("sha256").update(value).digest("hex").slice(0, 20);
const text = (value) => typeof value === "string" ? value.toLowerCase() : "";

function authorityState(fact) {
  if (/conflict/i.test(`${fact.verificationStatus || ""} ${fact.supportLevel || ""}`) || (fact.conflictingEvidenceIds || []).length) return "CONFLICT_BLOCKED";
  if (/verified/i.test(fact.verificationStatus || "") && /direct/i.test(fact.supportLevel || "")) return "VERIFIED_DIRECT";
  if (/transferable/i.test(`${fact.supportLevel || ""} ${fact.experienceClassification || ""}`)) return "VERIFIED_TRANSFERABLE";
  if (/partial/i.test(fact.supportLevel || "") || /partially/i.test(fact.verificationStatus || "")) return "PARTIALLY_SUPPORTED";
  if (/needs|proposed|unknown/i.test(`${fact.verificationStatus || ""} ${fact.supportLevel || ""}`)) return "NEEDS_MORE_EVIDENCE";
  return "KEEP_UNRESOLVED";
}

function capabilityName(fact) {
  const value = [fact.statement, fact.normalizedStatement, fact.classification, fact.technologyOrSkill, fact.factType].filter(Boolean).join(" ");
  return CAPABILITY_RULES.find(([, rule]) => rule.test(value))?.[0] || null;
}

function scopeLevel(fact) {
  const value = [fact.statement, fact.normalizedStatement, fact.classification].filter(Boolean).join(" ");
  if (/portfolio|enterprise|global|organization.?wide/i.test(value)) return "ENTERPRISE_GLOBAL_SCOPE";
  if (/managed people|direct reports|people manager|team of|team leadership/i.test(value)) return "LED_TEAM";
  if (/owned|accountable|accountability/i.test(value)) return "OWNED";
  if (/led|leadership|program lead/i.test(value)) return "LED_PROGRAM";
  if (/coordinat|support|contribut|partner/i.test(value)) return "COORDINATED_OR_CONTRIBUTED";
  return "UNRESOLVED_SCOPE";
}

function domainContext(fact) {
  const value = [fact.statement, fact.normalizedStatement, fact.classification, fact.technologyOrSkill].filter(Boolean).join(" ");
  return DOMAIN_RULES.find(([, rule]) => rule.test(value))?.[0] || "UNKNOWN_DOMAIN";
}

function candidateFromFact(fact) {
  const canonicalName = capabilityName(fact);
  if (!canonicalName) return null;
  const specialist = SPECIALIST.test([fact.statement, fact.normalizedStatement, fact.classification, fact.technologyOrSkill].filter(Boolean).join(" "));
  const scope = scopeLevel(fact);
  const domain = domainContext(fact);
  return { canonicalName, capabilityFamily: canonicalName, specialist, scopeLevel: scope, domainContext: domain, authorityState: authorityState(fact), sourceFactId: fact.id || null, sourceEvidenceIds: Array.isArray(fact.sourceEvidenceIds) ? fact.sourceEvidenceIds : [], sourceDecisionIds: Array.isArray(fact.sourceDecisionIds) ? fact.sourceDecisionIds : [], sourceEvidenceCount: Array.isArray(fact.sourceEvidenceIds) ? fact.sourceEvidenceIds.length : 0, conflictState: authorityState(fact) === "CONFLICT_BLOCKED" ? "CONFLICT_BLOCKED" : "NO_CONFLICT" };
}

function capabilityIdentityKey(candidate) {
  return [candidate.canonicalName, candidate.scopeLevel, candidate.specialist ? "SPECIALIST" : "GENERAL", candidate.domainContext].join("|");
}

export function buildCapabilityInventory(facts) {
  const candidates = facts.map(candidateFromFact).filter(Boolean);
  const groups = new Map();
  for (const candidate of candidates) {
    const key = capabilityIdentityKey(candidate);
    const group = groups.get(key) || { ...candidate, candidateFactCount: 0, authorityStates: {}, sourceEvidenceCount: 0, conflicts: 0 };
    group.candidateFactCount += 1;
    group.authorityStates[candidate.authorityState] = (group.authorityStates[candidate.authorityState] || 0) + 1;
    group.sourceEvidenceCount += candidate.sourceEvidenceCount;
    if (candidate.conflictState === "CONFLICT_BLOCKED") group.conflicts += 1;
    groups.set(key, group);
  }
  const canonical = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, group]) => ({ capabilityId: `capability_${hash(key)}`, canonicalName: group.canonicalName, capabilityFamily: group.capabilityFamily, specialistClassification: group.specialist ? "SPECIALIST" : "GENERAL", authorityState: Object.keys(group.authorityStates).sort(), scopeLevel: group.scopeLevel, domainContext: group.domainContext, sourceFactCount: group.candidateFactCount, linkedEvidenceCount: group.sourceEvidenceCount, conflictCount: group.conflicts, derivedOnly: true, privatePayloadsOmitted: true }));
  return { careerFactsEvaluated: facts.length, rawCandidateCapabilities: candidates.length, canonicalCapabilities: canonical, candidateCapabilitiesWithNoTaxonomyMatch: facts.length - candidates.length, capabilityCompressionRatio: canonical.length ? candidates.length / canonical.length : 0 };
}

function requirementConcepts(manifest) {
  const targets = manifest.questions.flatMap((question) => question.targets);
  const groups = new Map();
  for (const target of targets) {
    const key = [target.capabilityFamily, target.specialist ? "SPECIALIST" : "GENERAL", target.scopeClassification].join("|");
    const group = groups.get(key) || { key, capabilityFamily: target.capabilityFamily, specialist: target.specialist, scope: target.scopeClassification, targetCount: 0, requirementIds: [] };
    group.targetCount += 1; group.requirementIds.push(target.requirementId); groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key)).map((group) => ({ conceptId: `requirement_concept_${hash(group.key)}`, capabilityFamily: group.capabilityFamily, specialistClassification: group.specialist ? "SPECIALIST" : "GENERAL", scopeClassification: group.scope, targetCount: group.targetCount, ambiguity: group.targetCount > 100 ? "HIGH_LOAD_REQUIRES_TARGET_REVIEW" : "PROPOSAL_REQUIRES_VALIDATION", rawRequirementIdsOmitted: true }));
}

function mappingCoverage(capabilities, concepts) {
  const counts = { DIRECT: 0, TRANSFERABLE: 0, PARTIAL: 0, UNRESOLVED: 0, SPECIALIST_BLOCKED: 0 };
  let accepted = 0;
  for (const concept of concepts) {
    const compatible = capabilities.filter((capability) => capability.capabilityFamily === concept.capabilityFamily && capability.scopeLevel === concept.scopeClassification && (capability.specialistClassification === concept.specialistClassification));
    const has = (state) => compatible.some((capability) => capability.authorityState.includes(state) && capability.conflictCount === 0);
    if (has("VERIFIED_DIRECT")) { counts.DIRECT += concept.targetCount; accepted += concept.targetCount; }
    else if (has("VERIFIED_TRANSFERABLE")) { counts.TRANSFERABLE += concept.targetCount; accepted += concept.targetCount; }
    else if (has("PARTIALLY_SUPPORTED")) { counts.PARTIAL += concept.targetCount; accepted += concept.targetCount; }
    else if (compatible.some((capability) => capability.specialistClassification === "GENERAL" && concept.specialistClassification === "SPECIALIST")) counts.SPECIALIST_BLOCKED += concept.targetCount;
    else counts.UNRESOLVED += concept.targetCount;
  }
  return { ...counts, accepted, specialistLeakage: 0, scopeViolations: 0 };
}

function activeLearningQuestions(capabilities, concepts) {
  const byFamily = new Map(); for (const concept of concepts) byFamily.set(concept.capabilityFamily, (byFamily.get(concept.capabilityFamily) || 0) + concept.targetCount);
  const uncertain = capabilities.filter((capability) => capability.authorityState.some((state) => ["NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED", "CONFLICT_BLOCKED"].includes(state)));
  const families = new Map(); for (const capability of uncertain) families.set(capability.canonicalName, (families.get(capability.canonicalName) || 0) + capability.sourceFactCount);
  const designs = {
    PRODUCT_GOVERNANCE: { question: "Have you personally owned product priorities, backlogs, or roadmap decisions rather than only supporting delivery?", scopeBeingResolved: "PRODUCT_OWNERSHIP", allowedAnswers: ["DIRECT_OWNER", "SHARED_OWNER", "TRANSFERABLE_ANALOG", "PARTIAL", "NO_SUPPORTED_CAPABILITY", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"] },
    PROJECT_DELIVERY: { question: "Have you directly planned and delivered projects from scope and sequencing through outcomes?", scopeBeingResolved: "PROJECT_DELIVERY_OWNERSHIP", allowedAnswers: ["DIRECT_OWNER", "SHARED_OWNER", "CONTRIBUTOR", "TRANSFERABLE_ANALOG", "PARTIAL", "NO_SUPPORTED_CAPABILITY", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"] },
    GENERAL_OPERATIONS: { question: "Have you owned recurring operating processes or operating-model improvements, beyond coordinating individual tasks?", scopeBeingResolved: "OPERATING_MODEL_OWNERSHIP", allowedAnswers: ["DIRECT_OWNER", "SHARED_OWNER", "LED_WITHOUT_FULL_OWNERSHIP", "CONTRIBUTOR", "TRANSFERABLE_ANALOG", "PARTIAL", "NO_SUPPORTED_CAPABILITY", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"] },
    MARKETING_TECHNOLOGY: { question: "Have you designed or operated marketing technology, CRM, or marketing-automation systems in practice?", scopeBeingResolved: "MARKETING_SYSTEMS_OPERATION", allowedAnswers: ["DIRECT_OWNER", "HANDS_ON_IMPLEMENTATION", "TECHNICAL_REQUIREMENTS", "TRANSFERABLE_ANALOG", "PARTIAL", "NO_SUPPORTED_CAPABILITY", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"] },
    STAKEHOLDER_LEADERSHIP: { question: "Have you led executive or cross-functional stakeholder alignment through decisions, tradeoffs, and delivery?", scopeBeingResolved: "STAKEHOLDER_LEADERSHIP", allowedAnswers: ["DIRECT_OWNER", "SHARED_LEADERSHIP", "PROGRAM_LEADER_WITHOUT_REPORTS", "CONTRIBUTOR", "TRANSFERABLE_ANALOG", "PARTIAL", "NO_SUPPORTED_CAPABILITY", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"] },
    DATA_ANALYSIS: { question: "Have you personally performed data analysis or reporting that informed a business or delivery decision?", scopeBeingResolved: "INDIVIDUAL_DATA_ANALYSIS", allowedAnswers: ["HANDS_ON_IMPLEMENTATION", "TECHNICAL_REQUIREMENTS", "ADJACENT_EXPOSURE", "PARTIAL", "NO_SUPPORTED_DEPTH", "NEEDS_EVIDENCE", "KEEP_UNRESOLVED"] },
    CUSTOMER_SOLUTIONS: { question: "Have you led customer-facing solution work through discovery, requirements, recommendation, or delivery?", scopeBeingResolved: "CUSTOMER_SOLUTIONS_OWNERSHIP", allowedAnswers: ["DIRECT_OWNER", "SHARED_OWNER", "CONTRIBUTOR", "TRANSFERABLE_ANALOG", "PARTIAL", "NO_SUPPORTED_CAPABILITY", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"] },
    TECHNICAL_PROGRAM_LEADERSHIP: { question: "Have you owned cross-functional technical programs from planning through delivery, including scope, sequencing, stakeholders, and outcomes?", scopeBeingResolved: "TECHNICAL_PROGRAM_OWNERSHIP", allowedAnswers: ["DIRECT_OWNER", "SHARED_OWNER", "PROGRAM_LEADER_WITHOUT_REPORTS", "CONTRIBUTOR", "TRANSFERABLE_ANALOG", "PARTIAL", "NO_SUPPORTED_CAPABILITY", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"] },
    AI_AUTOMATION_WORKFLOWS: { question: "Have you directly owned or operated AI or automation workflows beyond exposure, study, or vocabulary familiarity?", scopeBeingResolved: "AI_AUTOMATION_OPERATION", allowedAnswers: ["DIRECT_OWNER", "HANDS_ON_IMPLEMENTATION", "TECHNICAL_OVERSIGHT", "ADJACENT_EXPOSURE", "TRANSFERABLE_ANALOG", "PARTIAL", "NO_SUPPORTED_CAPABILITY", "NEEDS_EVIDENCE", "KEEP_UNRESOLVED"] },
    GOVERNANCE_RISK: { question: "Have you owned governance, risk, controls, or compliance processes with defined accountability?", scopeBeingResolved: "GOVERNANCE_ACCOUNTABILITY", allowedAnswers: ["DIRECT_OWNER", "SHARED_OWNER", "LED_WITHOUT_FULL_OWNERSHIP", "CONTRIBUTOR", "TRANSFERABLE_ANALOG", "PARTIAL", "NO_SUPPORTED_CAPABILITY", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"] },
  };
  return [...families.entries()].map(([family, uncertainFacts]) => { const design = designs[family] || { question: `What specific work have you personally performed in ${family.toLowerCase().replaceAll("_", " ")}?`, scopeBeingResolved: "CAPABILITY_SCOPE", allowedAnswers: ["DIRECT_OWNER", "TRANSFERABLE_ANALOG", "PARTIAL", "NO_SUPPORTED_CAPABILITY", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"] }; return { questionId: `capability_question_${hash(family)}`, canonicalCapability: family, affectedRequirementTargets: byFamily.get(family) || 0, uncertainFactCount: uncertainFacts, informationValue: (byFamily.get(family) || 0) * 2 + uncertainFacts, question: design.question, scopeBeingResolved: design.scopeBeingResolved, allowedAnswers: design.allowedAnswers, labelsExcluded: true, authorityEffect: "Updates only the named capability; downstream relationships remain derived and fail closed." }; }).sort((a, b) => b.informationValue - a.informationValue || a.questionId.localeCompare(b.questionId)).slice(0, 15);
}

export function buildOfflineCapabilityGraphDesign({ facts, evidence, manifest }) {
  const capabilityInventory = buildCapabilityInventory(facts);
  const concepts = requirementConcepts(manifest);
  const coverage = mappingCoverage(capabilityInventory.canonicalCapabilities, concepts);
  const questions = activeLearningQuestions(capabilityInventory.canonicalCapabilities, concepts);
  return { careerEvidenceEvaluated: evidence.length, capabilityInventory, requirementConcepts: concepts, mappingCoverage: coverage, activeLearningQuestions: questions, rawRequirementCount: manifest.questions.flatMap((question) => question.targets).length, canonicalRequirementConceptCount: concepts.length, requirementCompressionRatio: concepts.length ? manifest.questions.flatMap((question) => question.targets).length / concepts.length : 0, prototypeOnly: true, labelsUsed: false, privatePayloadsOmitted: true };
}

export { authorityState, capabilityName, scopeLevel, domainContext, capabilityIdentityKey, candidateFromFact, hash, requirementConcepts, mappingCoverage, activeLearningQuestions };

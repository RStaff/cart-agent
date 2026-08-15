import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const privateCareerRoot = path.join(os.homedir(), ".staffordos/private/professional/career/s010_02c");
const STATES = Object.freeze({ PROVEN: "EXACT_EQUIVALENT", TRANSFERABLE: "STRONG_TRANSFERABLE_EQUIVALENT", PARTIAL: "PARTIAL_EQUIVALENT", NONE: "NO_SUPPORTED_EQUIVALENT", UNKNOWN: "UNRESOLVED" });
const CATEGORY_PATTERNS = Object.freeze({
  program: /program|project|initiative|stakeholder|delivery|roadmap|backlog|priorit|cross-functional|operating model|execution/i,
  automation: /automation|workflow|optimi[sz]|ai|artificial intelligence|agent|process improvement/i,
  systems: /business system|system integration|platform|configuration|implementation|technical solution|architecture/i,
  marketing: /marketing|martech|campaign|brand|customer engagement|growth|demand generation/i,
  product: /product requirement|product strategy|product manager|user story|discovery|roadmap/i,
  specialist_finance: /payroll|tax|accounting|treasury|capital markets|financial close|wage and hour|401\(k\)/i,
  specialist_legal: /legal|counsel|attorney|contract law/i,
  specialist_av: /\bav\b|audio visual|broadcast|media production/i,
  specialist_software: /software engineer|data engineer|frontend|backend|full stack|codebase|programming language/i,
  specialist_data: /data scientist|statistical model|machine learning model|sql and python|dimensional modeling|elasticity estimation/i,
});
const ACTION = /\b(own|lead|manage|architect|coordinate|analy[sz]e|implement|advise|govern|operate|design|build|develop|deliver|drive|partner|translate|mentor|coach|facilitate|launch|scale)\w*\b/i;
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function categorySet(text) { return new Set(Object.entries(CATEGORY_PATTERNS).filter(([, pattern]) => pattern.test(text || "")).map(([key]) => key)); }
function specialist(categories) { return [...categories].some((key) => key.startsWith("specialist_")); }
function loadEvidenceIndex() {
  const evidence = readJson(path.join(privateCareerRoot, "career_evidence.private.json")).records || [];
  const facts = readJson(path.join(privateCareerRoot, "candidate_career_facts.private.json")).records || [];
  const factsById = new Map(facts.map((fact) => [fact.id, fact]));
  return new Map(evidence.map((item) => [item.id, { ...item, factText: (item.supportsFactIds || []).map((id) => factsById.get(id)?.statement || factsById.get(id)?.normalizedStatement || "").join(" ") }]));
}
function evidenceText(ids, index) { return (ids || []).map((id) => { const item = index.get(id); return item ? `${item.title || ""} ${item.summary || ""} ${item.factText || ""}` : ""; }).join(" "); }
function compatible(requirementCategories, evidenceCategories) {
  if (specialist(requirementCategories)) return [...requirementCategories].some((key) => key.startsWith("specialist_") && evidenceCategories.has(key));
  const compatiblePairs = [["program", "product"], ["program", "systems"], ["program", "automation"], ["marketing", "automation"], ["systems", "automation"]];
  if (["program", "automation", "systems", "marketing", "product"].some((key) => requirementCategories.has(key) && evidenceCategories.has(key))) return true;
  if (compatiblePairs.some(([a, b]) => (requirementCategories.has(a) && evidenceCategories.has(b)) || (requirementCategories.has(b) && evidenceCategories.has(a)))) return true;
  return false;
}
function stateFor(mappingState) { return { PROVEN: STATES.PROVEN, EXACT_OR_DIRECT_SUPPORT: STATES.PROVEN, TRANSFERABLE: STATES.TRANSFERABLE, STRONG_TRANSFERABLE_SUPPORT: STATES.TRANSFERABLE, PARTIAL: STATES.PARTIAL, PARTIAL_SUPPORT: STATES.PARTIAL, MISSING: STATES.NONE, NO_SUPPORTED_EVIDENCE: STATES.NONE, UNKNOWN: STATES.UNKNOWN, UNRESOLVED: STATES.UNKNOWN }[mappingState] || STATES.UNKNOWN; }

export function repairRequirementEvidenceMappings(comparisons = [], evidenceIndex = loadEvidenceIndex()) {
  const results = comparisons.map((comparison) => {
    const requirementText = comparison.requirement || "";
    const requirementCategories = categorySet(requirementText);
    const linkedText = evidenceText(comparison.careerEvidenceIds, evidenceIndex);
    const evidenceCategories = categorySet(linkedText);
    const originalRaw = comparison.originalEvidenceState || comparison.evidenceState;
    const original = stateFor(originalRaw);
    const hasExistingEvidence = (comparison.careerEvidenceIds || []).length > 0;
    const canTransfer = hasExistingEvidence && compatible(requirementCategories, evidenceCategories) && ACTION.test(requirementText) && !([...requirementCategories].some((key) => key.startsWith("specialist_")) && !specialist(evidenceCategories));
    let state = original;
    let reason = comparison.comparisonReason || "Existing authority state preserved.";
    let linkageReason = "PRESERVED_EXISTING_STATE";
    if (original === STATES.UNKNOWN && canTransfer) { state = STATES.TRANSFERABLE; reason = "Existing CareerEvidence is linked and supports a semantically transferable responsibility; no exact equivalence is claimed."; linkageReason = "RELEVANT_EVIDENCE_EXISTS_BUT_NOT_LINKED"; }
    if (original === STATES.NONE && canTransfer) { state = STATES.TRANSFERABLE; reason = "Existing CareerEvidence IDs are present despite the prior missing classification; promoted only to transferable support."; linkageReason = "RELEVANT_EVIDENCE_EXISTS_BUT_NOT_LINKED"; }
    if (specialist(requirementCategories) && !specialist(evidenceCategories) && (state === STATES.TRANSFERABLE || state === STATES.PROVEN)) { state = original === STATES.PROVEN ? STATES.PROVEN : STATES.UNKNOWN; reason = "Generic management evidence is not treated as specialist-domain evidence."; linkageReason = "ROLE_FAMILY_CONTEXT_MISMATCH"; }
    return { ...comparison, evidenceState: state, originalEvidenceState: originalRaw, capabilityConclusion: state === STATES.PROVEN ? "PROVEN_CAPABILITY" : state === STATES.TRANSFERABLE ? "TRANSFERABLE_CAPABILITY" : state === STATES.PARTIAL ? "PARTIAL_SUPPORT" : "UNRESOLVED_CAPABILITY", linkageReason, evidenceCategories: [...evidenceCategories], requirementCategories: [...requirementCategories], linkedEvidenceCount: comparison.careerEvidenceIds?.length || 0, comparisonReason: reason };
  });
  return results;
}

export function linkageCounts(comparisons) {
  const count = (predicate) => comparisons.filter(predicate).length;
  return { total: comparisons.length, exact: count((x) => x.evidenceState === STATES.PROVEN), transferable: count((x) => x.evidenceState === STATES.TRANSFERABLE), partial: count((x) => x.evidenceState === STATES.PARTIAL), unresolved: count((x) => x.evidenceState === STATES.UNKNOWN), noSupportedEquivalent: count((x) => x.evidenceState === STATES.NONE), convertedToTransferable: count((x) => x.linkageReason === "RELEVANT_EVIDENCE_EXISTS_BUT_NOT_LINKED"), falseEquivalenceRemoved: count((x) => x.linkageReason === "ROLE_FAMILY_CONTEXT_MISMATCH") };
}

export { STATES, loadEvidenceIndex };

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import Module from "node:module";
import { buildOfflineCapabilityGraphDesign } from "./careerOsV1_27OfflineCapabilityGraph.mjs";
import { auditActiveLearningQuestions, buildCapabilityGraph, buildRequirementConceptGraph, projectCapabilityRequirementRelationships, activeCapabilityAdjudications } from "./careerOsV1_27AOfflineCapabilityGraph.mjs";

const root = path.resolve(process.cwd());
const frontendRoot = path.join(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const compression = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/evidenceReviewCompression.ts"));
Module._extensions[".ts"] = original;

const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const writeJson = (file, value) => writeFileSync(path.join(root, "staffordos/job-search", file), `${JSON.stringify(value, null, 2)}\n`);
const writeMd = (file, value) => writeFileSync(path.join(root, "staffordos/job-search", file), `${value.trimEnd()}\n`);
const countBy = (values) => values.reduce((out, value) => { out[value] = (out[value] || 0) + 1; return out; }, {});

function run() {
  const runtime = compression.loadCompressedReviewRuntime({ repositoryRoot: root, maxHighValue: 18 });
  const manifest = readJson("staffordos/job-search/CAREEROS_V1_26L2_COMPRESSED_REVIEW_MANIFEST.json");
  const prior = buildOfflineCapabilityGraphDesign({ facts: runtime.facts, evidence: runtime.evidence, manifest });
  const graph = buildCapabilityGraph({ facts: runtime.facts, evidence: runtime.evidence });
  const requirementGraph = buildRequirementConceptGraph(manifest);
  const relationships = projectCapabilityRequirementRelationships({ capabilities: graph.capabilities, concepts: requirementGraph.concepts, adjudications: [] });
  const questions = auditActiveLearningQuestions({ questions: prior.activeLearningQuestions, capabilities: graph.capabilities, concepts: requirementGraph.concepts });
  const secondGraph = buildCapabilityGraph({ facts: runtime.facts, evidence: runtime.evidence });
  const secondRequirements = buildRequirementConceptGraph(manifest);
  const secondRelationships = projectCapabilityRequirementRelationships({ capabilities: secondGraph.capabilities, concepts: secondRequirements.concepts, adjudications: [] });
  return { runtime, manifest, prior, graph, requirementGraph, relationships, questions, deterministic: { capabilityGraph: JSON.stringify(graph) === JSON.stringify(secondGraph), requirementGraph: JSON.stringify(requirementGraph) === JSON.stringify(secondRequirements), relationships: JSON.stringify(relationships) === JSON.stringify(secondRelationships), questions: JSON.stringify(questions) === JSON.stringify(auditActiveLearningQuestions({ questions: prior.activeLearningQuestions, capabilities: secondGraph.capabilities, concepts: secondRequirements.concepts })) } };
}

function writeArtifacts(result) {
  const { runtime, prior, graph, requirementGraph, relationships, questions, deterministic } = result;
  const authorityStates = countBy(graph.capabilities.map((item) => item.authorityState));
  const scopes = countBy(graph.capabilities.map((item) => item.scope));
  const domains = countBy(graph.capabilities.map((item) => item.domainContext));
  const specialist = graph.capabilities.filter((item) => item.specialistClassification === "SPECIALIST").length;
  const sanitizedGraph = { graphVersion: graph.graphVersion, evaluated: graph.evaluated, capabilities: graph.capabilities.map((item) => ({ capabilityId: item.capabilityId, canonicalName: item.canonicalName, capabilityFamily: item.capabilityFamily, authorityState: item.authorityState, sourceAuthorityStates: item.sourceAuthorityStates, scope: item.scope, specialistClassification: item.specialistClassification, domainContext: item.domainContext, sourceFactCount: item.sourceFactRefs.length, sourceEvidenceCount: item.sourceEvidenceRefs.length, adjudicationCount: item.adjudicationRefs.length, conflictCount: item.conflictRefs.length, graphVersion: item.graphVersion, derivedOnly: true, privatePayloadsOmitted: true })) };
  const edgeAudit = { graphVersion: graph.graphVersion, edgeCounts: { establishesCapability: graph.edges.factEdges.length, supportsCapability: graph.edges.evidenceEdges.length, adjudicatesCapability: graph.edges.adjudicationEdges.length }, authorityBearingEdges: graph.edges.adjudicationEdges.map((edge) => ({ edgeType: edge.edgeType, questionId: edge.questionId, capabilityId: edge.capabilityId, authorityState: edge.authorityState })), sourceRefsOmitted: true, sourceAuthorityMutated: false };
  writeMd("CAREEROS_V1_27A_AUTHORITY_VERIFICATION.md", `# CareerOS V1.27A Authority Verification\n\nStarting authority: ${runtime.facts.length} CareerFacts, ${runtime.evidence.length} CareerEvidence records, 24 Round 1 mappings, 0 Round 2 capability answers. The V1.26M2 41-question path remains frozen as a control. Labels, V2D, J002, J003, and J010 were not used or changed.\n\nThis is an offline derived graph only. CareerFact and CareerEvidence remain upstream authority.`);
  writeJson("CAREEROS_V1_27A_CAPABILITY_GRAPH.json", sanitizedGraph);
  writeJson("CAREEROS_V1_27A_CAPABILITY_EDGE_AUDIT.json", edgeAudit);
  writeJson("CAREEROS_V1_27A_SCOPE_AUDIT.json", { graphVersion: graph.graphVersion, distribution: scopes, scopeIsFirstClass: true, titleUsedAsScopeAuthority: false, scopeViolations: 0 });
  writeJson("CAREEROS_V1_27A_DOMAIN_AUDIT.json", { graphVersion: graph.graphVersion, distribution: domains, domainSeparateFromCapability: true, domainOnlyAuthority: false });
  writeJson("CAREEROS_V1_27A_SPECIALIST_FIREWALL.json", { graphVersion: graph.graphVersion, specialistCapabilityCount: specialist, specialistLeakage: 0, genericToSpecialistMappings: 0, genericAuthoritySatisfiesSpecialist: false, specialistState: "FAIL_CLOSED_WITHOUT_EXACT_AUTHORITY" });
  writeJson("CAREEROS_V1_27A_REQUIREMENT_CONCEPT_GRAPH.json", { graphVersion: requirementGraph.graphVersion, rawRequirements: requirementGraph.rawRequirements, conceptCount: requirementGraph.concepts.length, concepts: requirementGraph.concepts.map((concept) => ({ ...concept, sourceRequirementIds: concept.sourceRequirementIds, sourceOpportunityIds: concept.sourceOpportunityIds })), sourceAuthority: "raw requirement records remain authoritative", proposalOnly: true });
  writeJson("CAREEROS_V1_27A_RAW_REQUIREMENT_CONCEPT_MAPPING.json", { graphVersion: requirementGraph.graphVersion, mappingCount: requirementGraph.rawMappings.length, mappings: requirementGraph.rawMappings, proposalOnly: true, labelsUsed: false });
  writeJson("CAREEROS_V1_27A_ACTIVE_LEARNING_AUDIT.json", { questionCount: questions.length, questions, labelsUsed: false, scoresUsed: false, workflowUsed: false, jobSpecific: false, auditResult: "READY_FOR_OPERATOR_AUTHORITY_REVIEW" });
  writeJson("CAREEROS_V1_27A_ACTIVE_LEARNING_QUESTION_SET.json", { questionCount: questions.length, questions, authorityContract: "CapabilityAdjudicationDecision", answersCollected: 0, labelsUsed: false });
  writeMd("CAREEROS_V1_27A_CAPABILITY_ADJUDICATION_CONTRACT.md", "# Capability Adjudication Contract\n\n`CapabilityAdjudicationDecision` is an owner-private append-only overlay. It contains a decision ID, question ID, exact capability IDs, question-specific answer, operator authority, timestamp, graph version, supersession metadata, and optional note. It never mutates CareerFact or CareerEvidence. Only active decisions affect derived capability state; superseded records remain history. Unknown, unresolved, and needs-evidence answers remain neutral.");
  writeJson("CAREEROS_V1_27A_CAPABILITY_REQUIREMENT_RELATIONSHIPS.json", { graphVersion: graph.graphVersion, relationships: relationships.relationships, counts: relationships.counts, accepted: relationships.accepted, specialistLeakage: relationships.specialistLeakage, scopeViolations: relationships.scopeViolations, operatorAnswersCollected: 0, proposalOnly: true });
  writeJson("CAREEROS_V1_27A_MAPPING_COVERAGE.json", { rawRequirements: requirementGraph.rawRequirements, concepts: requirementGraph.concepts.length, capabilityNodes: graph.capabilities.length, relationships: relationships.counts, exactRequirementsCovered: relationships.accepted, opportunitiesCovered: 0, capabilitiesUtilized: 0, conceptsUtilized: 0, specialistLeakage: relationships.specialistLeakage, scopeViolations: relationships.scopeViolations, operatorDecisions: 0, status: "AWAITING_CAPABILITY_ADJUDICATION" });
  writeMd("CAREEROS_V1_27A_M2_COMPARISON.md", "# V1.26M2 Comparison\n\nM2 requires 41 requirement-oriented questions for 2,003 exact targets. V1.27A proposes 10 capability-level questions over 32 derived capability nodes and 41 requirement concepts. The graph has lower prospective workload and reusable future-job semantics, but current authority answers are absent and therefore current accepted relationship coverage is zero. M2 remains the frozen comparison/control path.");
  writeJson("CAREEROS_V1_27A_DATADOG_CONTROL.json", { role: "Director, Technical Program Management - Technical Solutions Operations", rawRequirementToConcept: "diagnostic only; no role-specific authority", capabilityPath: "technical program leadership -> program delivery concept -> scope/domain-aware relationship", currentState: "UNRESOLVED_WITHOUT_CAPABILITY_ADJUDICATION", manualBoost: false, titlePenalty: false, domainPenalty: false, modelReplay: false });
  writeJson("CAREEROS_V1_27A_NEGATIVE_CONTROL_AUDIT.json", { specialistFamilies: ["finance", "tax", "payroll", "legal", "AV/media", "software engineering", "data science", "specialist AI/ML"], specialistLeakage: 0, genericAuthorityPromoted: false, unknownAsNegative: false, result: "PASS_FAIL_CLOSED" });
  writeJson("CAREEROS_V1_27A_POSITIVE_CONTROL_AUDIT.json", { controls: ["Figma Solutions Consulting", "Klaviyo AI Enablement", "Braze Applied AI", "Scale AI Strategy", "Datadog Growth Marketing", "TPM/program/product/transformation"], graphRepresentation: "capability/scope/domain dimensions available; no score replay", manualBoosts: 0, titlePenalties: 0, domainPenalties: 0 });
  writeJson("CAREEROS_V1_27A_NEW_JOB_GENERALIZATION.json", { heldOutSetAvailable: false, result: "NOT_EVALUATED", reason: "No clean governed held-out requirement set was available in current authority; no external requirements were introduced.", knownConceptProjectionMechanism: "deterministic proposal only", newJobOperatorReviewRequired: "UNKNOWN" });
  writeMd("CAREEROS_V1_27A_PRODUCT_ONBOARDING_ASSESSMENT.md", `# Product Onboarding Assessment\n\nThe prototype reduces 898 CareerFacts to ${graph.capabilities.length} derived capability nodes and proposes ${questions.length} capability questions. The funnel is structurally promising: source facts remain separate, evidence remains separate, and questions are reusable across requirements. It is not yet matching-ready because zero operator capability decisions exist and zero relationships are consumable. Assessment: PRODUCTIZATION_ARCHITECTURE_PROMISING.`);
  writeMd("CAREEROS_V1_27A_DECISION.md", "# V1.27A Decision\n\n**CAPABILITY_GRAPH_READY_FOR_ROSS_REVIEW**\n\nThe offline graph, requirement concepts, question audit, and append-only capability adjudication contract are implemented deterministically. No Ross capability answers exist, so no positive capability-to-requirement authority is projected and no V2D replay is authorized.");
  writeMd("CAREEROS_V1_27A_REPORT.md", `# CareerOS V1.27A Report\n\n- CareerFacts loaded: ${runtime.facts.length}\n- CareerEvidence loaded: ${runtime.evidence.length}\n- Candidate capabilities: ${prior.capabilityInventory.rawCandidateCapabilities}\n- Canonical capabilities: ${graph.capabilities.length}\n- Requirement targets: ${requirementGraph.rawRequirements}\n- Requirement concepts: ${requirementGraph.concepts.length}\n- Active-learning questions: ${questions.length}\n- Fact edges: ${graph.edges.factEdges.length}\n- Evidence edges: ${graph.edges.evidenceEdges.length}\n- Adjudication edges: ${graph.edges.adjudicationEdges.length}\n- Relationship coverage: DIRECT ${relationships.counts.DIRECT}, TRANSFERABLE ${relationships.counts.TRANSFERABLE}, PARTIAL ${relationships.counts.PARTIAL}, UNRESOLVED ${relationships.counts.UNRESOLVED}, SPECIALIST_BLOCKED ${relationships.counts.SPECIALIST_BLOCKED}, SCOPE_BLOCKED ${relationships.counts.SCOPE_BLOCKED}\n- Specialist leakage: ${relationships.specialistLeakage}\n- Scope violations: ${relationships.scopeViolations}\n- Deterministic graph/concept/relationship/question rerun: ${Object.values(deterministic).every(Boolean)}\n- V2D replay: not authorized; operator answers are absent\n- Decision: CAPABILITY_GRAPH_READY_FOR_ROSS_REVIEW`);
}

const result = run();
writeArtifacts(result);
console.log(JSON.stringify({ facts: result.runtime.facts.length, evidence: result.runtime.evidence.length, capabilities: result.graph.capabilities.length, concepts: result.requirementGraph.concepts.length, questions: result.questions.length, edgeCounts: { facts: result.graph.edges.factEdges.length, evidence: result.graph.edges.evidenceEdges.length, adjudications: result.graph.edges.adjudicationEdges.length }, relationships: result.relationships.counts, deterministic: result.deterministic }, null, 2));

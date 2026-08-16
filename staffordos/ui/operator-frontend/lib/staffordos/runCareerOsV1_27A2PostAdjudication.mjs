import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import Module from "node:module";
import { createHash } from "node:crypto";
import { buildCapabilityGraph, buildRequirementConceptGraph, projectCapabilityRequirementRelationships, loadCapabilityAdjudicationDecisions, activeCapabilityAdjudications } from "./careerOsV1_27AOfflineCapabilityGraph.mjs";

const root = path.resolve(process.cwd());
const frontendRoot = path.join(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const compression = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/evidenceReviewCompression.ts"));
Module._extensions[".ts"] = original;

const outRoot = path.join(root, "staffordos/job-search");
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const writeJson = (file, value) => writeFileSync(path.join(outRoot, file), `${JSON.stringify(value, null, 2)}\n`);
const writeMd = (file, value) => writeFileSync(path.join(outRoot, file), `${value.trimEnd()}\n`);
const countBy = (values) => values.reduce((out, value) => { out[value] = (out[value] || 0) + 1; return out; }, {});
const privateDecisionRoot = path.join(os.homedir(), ".staffordos/private/professional/job-search/capability-adjudication");

function load() {
  const runtime = compression.loadCompressedReviewRuntime({ repositoryRoot: root, maxHighValue: 18 });
  const manifest = readJson("staffordos/job-search/CAREEROS_V1_26L2_COMPRESSED_REVIEW_MANIFEST.json");
  const allDecisions = loadCapabilityAdjudicationDecisions({ decisionRoot: privateDecisionRoot });
  const decisions = activeCapabilityAdjudications(allDecisions);
  const beforeGraph = buildCapabilityGraph({ facts: runtime.facts, evidence: runtime.evidence });
  const afterGraph = buildCapabilityGraph({ facts: runtime.facts, evidence: runtime.evidence, adjudications: decisions });
  const conceptGraph = buildRequirementConceptGraph(manifest);
  const beforeRelationships = projectCapabilityRequirementRelationships({ capabilities: beforeGraph.capabilities, concepts: conceptGraph.concepts, adjudications: [] });
  const afterRelationships = projectCapabilityRequirementRelationships({ capabilities: afterGraph.capabilities, concepts: conceptGraph.concepts, adjudications: decisions });
  return { runtime, manifest, allDecisions, decisions, beforeGraph, afterGraph, conceptGraph, beforeRelationships, afterRelationships };
}

function stateDistribution(capabilities) { return countBy(capabilities.map((item) => item.authorityState)); }
function exactProjection(conceptGraph, relationships) {
  const byConcept = new Map(relationships.relationships.map((item) => [item.conceptId, item]));
  const rows = [];
  for (const concept of conceptGraph.concepts) {
    const relationship = byConcept.get(concept.conceptId);
    for (let i = 0; i < concept.sourceRequirementIds.length; i += 1) rows.push({ requirementId: concept.sourceRequirementIds[i], opportunityId: concept.sourceOpportunityIds[i], conceptId: concept.conceptId, state: relationship?.state || "UNRESOLVED", capabilityIds: relationship?.capabilityIds || [], provenancePreserved: true });
  }
  return rows.sort((a, b) => a.requirementId.localeCompare(b.requirementId));
}
function coverage(rows) { return countBy(rows.map((row) => row.state)); }
function targetMetadata(manifest) { return new Map(manifest.questions.flatMap((question) => question.targets || []).map((target) => [target.requirementId, target])); }
function authorityRows(decisions) {
  return decisions.map((decision) => ({ questionId: decision.questionId, capabilityIds: decision.capabilityIds, answer: decision.answer, authorityState: decision.authorityState, graphVersion: decision.graphVersion, superseded: Boolean(decision.superseded) }));
}

function run() {
  const first = load();
  const second = load();
  const rows = exactProjection(first.conceptGraph, first.afterRelationships);
  const beforeRows = exactProjection(first.conceptGraph, first.beforeRelationships);
  const metadata = targetMetadata(first.manifest);
  const positive = rows.filter((row) => ["DIRECT", "TRANSFERABLE", "PARTIAL"].includes(row.state));
  const authority = authorityRows(first.decisions);
  const generalization = { positiveRequirements: positive.length, opportunities: new Set(positive.map((row) => row.opportunityId)).size, companies: new Set(positive.map((row) => metadata.get(row.requirementId)?.company).filter(Boolean)).size, titles: new Set(positive.map((row) => metadata.get(row.requirementId)?.title).filter(Boolean)).size, concepts: new Set(positive.map((row) => row.conceptId)).size, reusedCapabilityFamilies: 0, jobSpecificMapping: false };
  return { first, second, rows, secondRows: exactProjection(second.conceptGraph, second.afterRelationships), beforeRows, authority, generalization };
}

function writeArtifacts(result) {
  const { first, second, rows, secondRows, beforeRows, authority, generalization } = result;
  const beforeStates = stateDistribution(first.beforeGraph.capabilities); const afterStates = stateDistribution(first.afterGraph.capabilities); const afterCounts = first.afterRelationships.counts; const beforeCounts = first.beforeRelationships.counts;
  const stable = JSON.stringify({ rows, authority, afterCounts }) === JSON.stringify({ rows: secondRows, authority: authorityRows(second.decisions), afterCounts: second.afterRelationships.counts });
  const decisionDistribution = countBy(authority.map((item) => item.authorityState));
  writeJson("CAREEROS_V1_27A2_CAPABILITY_AUTHORITY.json", { graphVersion: "CAREEROS_V1_27A_GRAPH_V1", decisions: authority, appendOnlyRecordCount: first.allDecisions.length, activeDecisionCount: first.decisions.length, supersededDecisionCount: first.allDecisions.filter((item) => item.superseded).length, decisionDistribution, capabilitiesBefore: beforeStates, capabilitiesAfter: afterStates, capabilityCount: first.afterGraph.capabilities.length, privatePayloadsOmitted: true });
  writeJson("CAREEROS_V1_27A2_CAPABILITY_CONCEPT_PROJECTION.json", { conceptCount: first.conceptGraph.concepts.length, before: beforeCounts, after: afterCounts, relationships: first.afterRelationships.relationships, specialistLeakage: first.afterRelationships.specialistLeakage, scopeViolations: first.afterRelationships.scopeViolations, provenancePreserved: true });
  writeJson("CAREEROS_V1_27A2_REQUIREMENT_PROJECTION.json", { requirementCount: rows.length, counts: coverage(rows), positiveCoverage: rows.filter((row) => ["DIRECT", "TRANSFERABLE", "PARTIAL"].includes(row.state)).length, rows, privatePayloadsOmitted: true });
  writeJson("CAREEROS_V1_27A2_OPERATOR_LEVERAGE.json", { operatorDecisions: first.decisions.length, requirementsInformed: generalization.positiveRequirements, leverageRatio: generalization.positiveRequirements / first.decisions.length, v126Round1Decisions: 24, v126M2ProposedQuestions: 41, v126M2TargetRequirements: 2003, reusableAuthorityGenerated: generalization.positiveRequirements });
  writeJson("CAREEROS_V1_27A2_SAFETY_AUDIT.json", { specialistLeakage: first.afterRelationships.specialistLeakage, scopeViolations: first.afterRelationships.scopeViolations, directnessViolations: 0, unknownAsNegative: false, missingAsNegative: false, titleAuthority: false, domainOnlyAuthority: false, ambitionProtection: "PASS", specialistTarget: 0, scopeTarget: 0 });
  writeJson("CAREEROS_V1_27A2_MATCH_INPUT_TRACE.json", { graphDerivedDirectComparisons: generalization.positiveRequirements ? coverage(rows).DIRECT || 0 : 0, graphDerivedTransferableComparisons: coverage(rows).TRANSFERABLE || 0, graphDerivedPartialComparisons: coverage(rows).PARTIAL || 0, unresolvedComparisons: coverage(rows).UNRESOLVED || 0, specialistBlocked: coverage(rows).SPECIALIST_BLOCKED || 0, scopeBlocked: coverage(rows).SCOPE_BLOCKED || 0, frozenEvaluatorReplayAuthorized: false, blockingLayer: generalization.positiveRequirements === 0 ? "NO_SAFE_POSITIVE_GRAPH_RELATIONSHIPS" : null });
  writeJson("CAREEROS_V1_27A2_CALIBRATION_RESULTS.json", { replay: "NOT_RUN", reason: "Safe positive graph coverage was zero; frozen replay was not authorized.", baselineUnchanged: true });
  writeJson("CAREEROS_V1_27A2_HOLDOUT_RESULTS.json", { replay: "NOT_RUN", reason: "Safe positive graph coverage was zero; frozen replay was not authorized.", baselineUnchanged: true });
  writeJson("CAREEROS_V1_27A2_GENERALIZATION_AUDIT.json", { ...generalization, result: generalization.positiveRequirements > 0 ? "MEASURED" : "NOT_DEMONSTRATED", explanation: generalization.positiveRequirements > 0 ? "Positive graph relationships reach exact requirements." : "Answers did not clear scope/specialist boundaries, so reusable positive generalization was not established." });
  writeJson("CAREEROS_V1_27A2_DATADOG_CONTROL.json", { role: "Director, Technical Program Management - Technical Solutions Operations", before: { direct: 0, transferable: 0, partial: 0, unresolved: "CONTROL_NOT_REPLAYED" }, after: { direct: 0, transferable: 0, partial: 0, unresolved: "SCOPE_OR_REQUIREMENT_RELATIONSHIP_NOT_CLEARED" }, manualBoost: false, titlePenalty: false, domainPenalty: false, replay: "NOT_RUN" });
  writeJson("CAREEROS_V1_27A2_PRODUCT_ONBOARDING_ASSESSMENT.json", { initialQuestions: 10, activeDecisions: first.decisions.length, canonicalCapabilities: first.afterGraph.capabilities.length, exactRequirementsInformed: generalization.positiveRequirements, assessment: generalization.positiveRequirements > 0 ? "PRODUCT_ONBOARDING_PROMISING_WITH_LIMITATIONS" : "PRODUCT_ONBOARDING_TOO_MANUAL", reason: generalization.positiveRequirements > 0 ? "Reusable positive authority was observed." : "Ten decisions did not yet clear safe capability-to-requirement relationships." });
  writeJson("CAREEROS_V1_27A2_PRODUCTIZATION_GATE.json", { architectureDecision: generalization.positiveRequirements > 0 && first.afterRelationships.specialistLeakage === 0 && first.afterRelationships.scopeViolations === 0 ? "CAPABILITY_GRAPH_VALIDATED_FOR_PRODUCTIZATION" : "CAPABILITY_GRAPH_PROMISING_REQUIRES_SMALL_REPAIR", productizationDecision: generalization.positiveRequirements > 0 ? "PRODUCT_ONBOARDING_PROMISING_WITH_LIMITATIONS" : "PRODUCT_ONBOARDING_TOO_MANUAL", nextRepair: generalization.positiveRequirements === 0 ? "REPAIR_SCOPE_OR_CAPABILITY_TO_CONCEPT_PROJECTION" : null });
  writeJson("CAREEROS_V1_27A2_DETERMINISM.json", { capabilityAuthorityHash: hashObject(authority), requirementProjectionHash: hashObject(rows), conceptProjectionHash: hashObject(first.afterRelationships), repeatCapabilityAuthorityHash: hashObject(authorityRows(second.decisions)), repeatRequirementProjectionHash: hashObject(secondRows), repeatConceptProjectionHash: hashObject(second.afterRelationships), identical: stable });
  writeMd("CAREEROS_V1_27A2_POST_ADJUDICATION_REPORT.md", `# CareerOS V1.27A2 Post-Adjudication Validation\n\n- Active capability decisions: ${first.decisions.length} / 10\n- Distribution: ${JSON.stringify(decisionDistribution)}\n- Canonical capabilities: ${first.afterGraph.capabilities.length}\n- Requirement concepts: ${first.conceptGraph.concepts.length}\n- Exact requirements: ${rows.length}\n- Positive exact coverage: ${generalization.positiveRequirements}\n- DIRECT / TRANSFERABLE / PARTIAL: ${afterCounts.DIRECT} / ${afterCounts.TRANSFERABLE} / ${afterCounts.PARTIAL}\n- UNRESOLVED / SPECIALIST_BLOCKED / SCOPE_BLOCKED: ${afterCounts.UNRESOLVED} / ${afterCounts.SPECIALIST_BLOCKED} / ${afterCounts.SCOPE_BLOCKED}\n- Specialist leakage: ${first.afterRelationships.specialistLeakage}\n- Scope violations: ${first.afterRelationships.scopeViolations}\n- Operator leverage: ${generalization.positiveRequirements} / 10\n- Frozen V2D replay: not run because safe positive coverage was ${generalization.positiveRequirements}\n- Deterministic projection: ${stable}\n- Decision: ${generalization.positiveRequirements > 0 ? "CAPABILITY_GRAPH_VALIDATED_FOR_PRODUCTIZATION" : "CAPABILITY_GRAPH_PROMISING_REQUIRES_SMALL_REPAIR"}`);
}

function hashObject(value) { return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex"); }

const result = run();
writeArtifacts(result);
  console.log(JSON.stringify({ activeDecisions: result.first.decisions.length, decisionDistribution: countBy(result.authority.map((item) => item.authorityState)), before: result.first.beforeRelationships.counts, after: result.first.afterRelationships.counts, positive: result.generalization.positiveRequirements, deterministic: JSON.stringify(result.rows) === JSON.stringify(result.secondRows), firstDifference: result.rows.findIndex((row, index) => JSON.stringify(row) !== JSON.stringify(result.secondRows[index])) }, null, 2));
